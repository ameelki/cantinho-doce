package lu.cantinho.shop.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lu.cantinho.shop.dto.Dto;
import lu.cantinho.shop.entity.*;
import lu.cantinho.shop.repository.ShopOrderRepository;
import lu.cantinho.shop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {
    private final ShopOrderRepository orders;
    private final ProductRepository products;
    private final SettingsService settings;
    private final ObjectMapper mapper;
    private final MailService mail;
    private final ScheduleService schedule;

    public OrderService(ShopOrderRepository orders, ProductRepository products, SettingsService settings,
                        ObjectMapper mapper, MailService mail, ScheduleService schedule) {
        this.schedule = schedule;
        this.orders = orders;
        this.products = products;
        this.settings = settings;
        this.mapper = mapper;
        this.mail = mail;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private record Resolved(BigDecimal extra, String text) {}

    public ShopOrder create(Dto.OrderRequest r, User user) {
        if (!settings.bool("orders.enabled")) throw Errors.bad("Les commandes sont fermées pour le moment.");
        ShopOrder o = new ShopOrder();
        o.mode = r.mode();
        if (r.mode() == Enums.OrderMode.DELIVERY) {
            if (!settings.bool("orders.delivery.enabled")) throw Errors.bad("La livraison est désactivée.");
            if (blank(r.address()) || blank(r.city()))
                throw Errors.bad("Indiquez l'adresse et la ville de livraison.");
            o.address = r.address().trim();
            o.postalCode = r.postalCode() == null ? null : r.postalCode().trim();
            o.city = r.city().trim();
        } else if (!settings.bool("orders.pickup.enabled")) {
            throw Errors.bad("Le retrait est désactivé.");
        }
        schedule.check(r.scheduledAt());
        o.scheduledAt = r.scheduledAt().withSecond(0).withNano(0);
        o.customerName = r.customerName().trim();
        o.phone = r.phone();
        o.email = r.email();
        o.note = r.note();
        o.user = user;

        BigDecimal total = BigDecimal.ZERO;
        for (Dto.OrderItemReq it : r.items()) {
            Product p = products.findById(it.productId())
                    .orElseThrow(() -> Errors.bad("Un produit de votre panier n'existe plus."));
            if (!p.active || !p.available) throw Errors.bad(p.name + " n'est plus disponible.");
            Resolved res = resolve(p, it.choices());
            BigDecimal unit = p.price.add(res.extra());
            OrderItem oi = new OrderItem();
            oi.order = o;
            oi.productId = p.id;
            oi.name = p.name;
            oi.unitPrice = unit;
            oi.quantity = it.quantity();
            oi.optionsText = res.text().isEmpty() ? null : res.text();
            oi.note = it.note();
            o.items.add(oi);
            total = total.add(unit.multiply(BigDecimal.valueOf(it.quantity())));
        }
        o.subtotal = total.setScale(2, RoundingMode.HALF_UP);
        o.deliveryFee = BigDecimal.ZERO;
        if (o.mode == Enums.OrderMode.DELIVERY) {
            Dto.DeliveryQuote q = schedule.quote(o.subtotal, o.city);
            if (!q.allowed()) throw Errors.bad(q.message());
            o.deliveryFee = q.fee();
        }
        o.total = o.subtotal.add(o.deliveryFee).setScale(2, RoundingMode.HALF_UP);
        String code;
        do {
            code = CodeGenerator.next("D-");
        } while (orders.existsByCode(code));
        o.code = code;
        ShopOrder saved = orders.save(o);
        mail.send(saved.email, "Commande " + saved.code + " reçue",
                "Bonjour " + saved.customerName + ",\n\nVotre commande " + saved.code + " (" + saved.total
                        + " EUR) est bien reçue pour le " + saved.scheduledAt.toLocalDate() + " à " + saved.scheduledAt.toLocalTime()
                        + (saved.mode == Enums.OrderMode.DELIVERY ? " (livraison)." : " (retrait).") + " Suivez-la avec ce code depuis le site.\n\n" + settings.str("cafe.name"));
        return saved;
    }

    @SuppressWarnings("unchecked")
    private Resolved resolve(Product p, List<String> choices) {
        List<Map<String, Object>> groups = new ArrayList<>();
        if (p.optionsJson != null && !p.optionsJson.isBlank()) {
            try {
                groups = mapper.readValue(p.optionsJson, new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception e) {
                groups = new ArrayList<>();
            }
        }
        List<String> sel = choices == null ? List.of() : choices;
        BigDecimal extra = BigDecimal.ZERO;
        List<String> texts = new ArrayList<>();
        for (Map<String, Object> g : groups) {
            String gname = String.valueOf(g.get("name"));
            boolean required = Boolean.TRUE.equals(g.get("required"));
            boolean multi = Boolean.TRUE.equals(g.get("multi"));
            Object rawChoices = g.get("choices");
            List<Map<String, Object>> cs = rawChoices instanceof List ? (List<Map<String, Object>>) rawChoices : List.of();
            int count = 0;
            for (Map<String, Object> c : cs) {
                String key = gname + "|" + c.get("name");
                if (sel.contains(key)) {
                    count++;
                    Object price = c.get("price");
                    extra = extra.add(price == null ? BigDecimal.ZERO : new BigDecimal(String.valueOf(price)));
                    texts.add(String.valueOf(c.get("name")));
                }
            }
            if (required && count == 0) throw Errors.bad("Choisissez « " + gname + " » pour " + p.name + ".");
            if (!multi && count > 1) throw Errors.bad("Un seul choix possible pour « " + gname + " ».");
        }
        return new Resolved(extra, String.join(", ", texts));
    }

    public ShopOrder setStatus(Long id, Enums.OrderStatus status) {
        ShopOrder o = orders.findById(id).orElseThrow(() -> Errors.notFound("Commande introuvable."));
        if (o.status == Enums.OrderStatus.SERVED || o.status == Enums.OrderStatus.CANCELLED)
            throw Errors.bad("Cette commande est déjà clôturée.");
        o.status = status;
        o.updatedAt = LocalDateTime.now();
        ShopOrder saved = orders.save(o);
        if (status == Enums.OrderStatus.READY || status == Enums.OrderStatus.DELIVERING) {
            mail.send(saved.email, "Commande " + saved.code + (saved.mode == Enums.OrderMode.DELIVERY ? " en route" : " prête"),
                    "Bonjour " + saved.customerName + ", votre commande " + saved.code + (status == Enums.OrderStatus.DELIVERING ? " est en cours de livraison." : " est prête.") + "\n\n" + settings.str("cafe.name"));
        }
        return saved;
    }

    public ShopOrder cancelByCode(String code) {
        ShopOrder o = orders.findByCode(code).orElseThrow(() -> Errors.notFound("Commande introuvable."));
        if (o.status != Enums.OrderStatus.NEW) throw Errors.bad("La préparation a déjà commencé, contactez le café.");
        o.status = Enums.OrderStatus.CANCELLED;
        o.updatedAt = LocalDateTime.now();
        return orders.save(o);
    }
}

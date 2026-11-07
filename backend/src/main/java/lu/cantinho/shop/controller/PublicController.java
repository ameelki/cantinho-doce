package lu.cantinho.shop.controller;

import jakarta.validation.Valid;
import lu.cantinho.shop.dto.Dto;
import lu.cantinho.shop.entity.*;
import lu.cantinho.shop.repository.*;
import lu.cantinho.shop.service.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Tout ce qu'un visiteur peut voir ou faire sans compte. */
@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final SettingsService settings;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final ShopOrderRepository orders;
    private final OrderService orderService;
    private final ScheduleService schedule;
    private final CurrentUser current;

    public PublicController(SettingsService settings, CategoryRepository categories, ProductRepository products,
                            ShopOrderRepository orders, OrderService orderService, ScheduleService schedule,
                            CurrentUser current) {
        this.settings = settings;
        this.categories = categories;
        this.products = products;
        this.orders = orders;
        this.orderService = orderService;
        this.schedule = schedule;
        this.current = current;
    }

    @GetMapping("/settings")
    public Map<String, String> settings() {
        return settings.all();
    }

    @GetMapping("/menu")
    public Dto.Menu menu() {
        List<Category> cats = categories.findAllByOrderByPositionAscIdAsc().stream().filter(c -> c.active).toList();
        List<Product> prods = products.findAllByOrderByPositionAscIdAsc().stream().filter(p -> p.active).toList();
        return new Dto.Menu(cats, prods);
    }

    /** Jours et heures disponibles pour le retrait ou la livraison. */
    @GetMapping("/schedule")
    public List<Dto.DaySlots> schedule() {
        return schedule.schedule();
    }

    /** Frais de livraison pour un sous-total et une ville. */
    @GetMapping("/delivery/quote")
    public Dto.DeliveryQuote quote(@RequestParam java.math.BigDecimal subtotal, @RequestParam(required = false) String city) {
        return schedule.quote(subtotal, city);
    }

    @PostMapping("/orders")
    public ShopOrder order(@Valid @RequestBody Dto.OrderRequest r, Authentication auth) {
        return orderService.create(r, current.get(auth));
    }

    @GetMapping("/orders/{code}")
    public ShopOrder trackOrder(@PathVariable String code) {
        return orders.findByCode(code.trim().toUpperCase()).orElseThrow(() -> Errors.notFound("Aucune commande avec ce code."));
    }

    @PostMapping("/orders/{code}/cancel")
    public ShopOrder cancelOrder(@PathVariable String code) {
        return orderService.cancelByCode(code.trim().toUpperCase());
    }
}

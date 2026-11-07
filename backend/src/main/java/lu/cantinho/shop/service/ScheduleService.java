package lu.cantinho.shop.service;

import lu.cantinho.shop.dto.Dto;
import lu.cantinho.shop.entity.Enums;
import lu.cantinho.shop.repository.ShopOrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Créneaux de retrait/livraison et frais de livraison, calculés à partir des réglages. */
@Service
public class ScheduleService {
    private final SettingsService settings;
    private final ShopOrderRepository orders;

    public ScheduleService(SettingsService settings, ShopOrderRepository orders) {
        this.settings = settings;
        this.orders = orders;
    }

    /** Réglages de créneaux lus une seule fois par requête (évite des centaines de lectures en base). */
    private record Cfg(LocalTime from, LocalTime to, int step, Set<Integer> closed, int maxPerSlot, int leadHours, int maxDays) {}

    private static int toInt(String v, int fallback) {
        try {
            return Integer.parseInt(v == null ? "" : v.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static LocalTime toTime(String v, String fallback) {
        try {
            return LocalTime.parse(v == null ? "" : v.trim());
        } catch (Exception e) {
            return LocalTime.parse(fallback);
        }
    }

    private Cfg cfg() {
        Map<String, String> m = settings.all();
        Set<Integer> closed = new HashSet<>();
        for (String p : m.getOrDefault("schedule.closedWeekdays", "").split("[,; ]+")) {
            try {
                closed.add(Integer.parseInt(p.trim()));
            } catch (NumberFormatException ignored) {
                // valeur vide ou invalide : ignorée
            }
        }
        return new Cfg(toTime(m.get("schedule.openFrom"), "10:00"), toTime(m.get("schedule.openTo"), "19:00"),
                Math.max(10, toInt(m.get("schedule.slotMinutes"), 60)), closed,
                toInt(m.get("schedule.maxPerSlot"), 0), toInt(m.get("schedule.leadHours"), 24),
                Math.max(1, toInt(m.get("schedule.maxDays"), 14)));
    }

    /** Tous les créneaux théoriques d'un jour, sans tenir compte du délai ni de la capacité. */
    private List<LocalDateTime> daySlots(LocalDate d, Cfg c) {
        List<LocalDateTime> out = new ArrayList<>();
        if (c.closed().contains(d.getDayOfWeek().getValue())) return out;
        for (LocalDateTime t = d.atTime(c.from()); !t.toLocalTime().isAfter(c.to()) && t.toLocalDate().equals(d); t = t.plusMinutes(c.step())) {
            out.add(t);
        }
        return out;
    }

    private boolean full(LocalDateTime slot, Cfg c) {
        if (c.maxPerSlot() <= 0) return false;
        return orders.countByScheduledAtAndStatusNot(slot, Enums.OrderStatus.CANCELLED) >= c.maxPerSlot();
    }

    /** Jours à venir avec leurs heures encore disponibles (les jours sans créneau sont omis). */
    public List<Dto.DaySlots> schedule() {
        Cfg c = cfg();
        List<Dto.DaySlots> out = new ArrayList<>();
        LocalDateTime min = LocalDateTime.now().plusHours(c.leadHours());
        LocalDate today = LocalDate.now();
        for (int i = 0; i <= c.maxDays(); i++) {
            LocalDate d = today.plusDays(i);
            List<String> times = new ArrayList<>();
            for (LocalDateTime t : daySlots(d, c)) {
                if (t.isBefore(min) || full(t, c)) continue;
                times.add(t.toLocalTime().toString());
            }
            if (!times.isEmpty()) out.add(new Dto.DaySlots(d, times));
        }
        return out;
    }

    /** Refuse un créneau hors horaires, trop proche, trop lointain ou complet. */
    public void check(LocalDateTime slot) {
        if (slot == null) throw Errors.bad("Choisissez le jour et l'heure.");
        Cfg c = cfg();
        if (slot.isBefore(LocalDateTime.now().plusHours(c.leadHours()).minusMinutes(1)))
            throw Errors.bad("Ce créneau est trop proche : prévoyez au moins " + c.leadHours() + " h.");
        if (slot.toLocalDate().isAfter(LocalDate.now().plusDays(c.maxDays())))
            throw Errors.bad("Ce jour est trop éloigné.");
        if (!daySlots(slot.toLocalDate(), c).contains(slot.withSecond(0).withNano(0)))
            throw Errors.bad("Ce créneau n'est pas proposé (jour fermé ou heure hors créneaux).");
        if (full(slot, c)) throw Errors.bad("Ce créneau est complet, choisissez-en un autre.");
    }

    /** Zones « Ville:frais » séparées par des virgules ou des retours à la ligne. */
    private Map<String, BigDecimal> zones() {
        Map<String, BigDecimal> m = new LinkedHashMap<>();
        for (String line : settings.str("delivery.zones").split("[\\n;,]+")) {
            String[] p = line.split(":");
            if (p.length != 2 || p[0].isBlank()) continue;
            try {
                m.put(p[0].trim().toLowerCase(), new BigDecimal(p[1].trim().replace(',', '.')));
            } catch (NumberFormatException ignored) {
                // ligne invalide : ignorée
            }
        }
        return m;
    }

    public Dto.DeliveryQuote quote(BigDecimal subtotal, String city) {
        BigDecimal min = settings.dec("delivery.minOrder");
        if (!settings.bool("orders.delivery.enabled"))
            return new Dto.DeliveryQuote(false, BigDecimal.ZERO, false, min, "La livraison est désactivée.");
        if (subtotal.compareTo(min) < 0)
            return new Dto.DeliveryQuote(false, BigDecimal.ZERO, false, min, "Commande minimum pour la livraison : " + min.setScale(2, RoundingMode.HALF_UP) + " EUR.");
        Map<String, BigDecimal> zones = zones();
        String key = city == null ? "" : city.trim().toLowerCase();
        BigDecimal fee = settings.dec("delivery.fee");
        if (zones.containsKey(key)) fee = zones.get(key);
        else if (settings.bool("delivery.onlyZones") && !zones.isEmpty())
            return new Dto.DeliveryQuote(false, BigDecimal.ZERO, false, min, "Nous ne livrons pas encore cette ville.");
        BigDecimal freeFrom = settings.dec("delivery.freeFrom");
        boolean free = freeFrom.signum() > 0 && subtotal.compareTo(freeFrom) >= 0;
        if (free) fee = BigDecimal.ZERO;
        return new Dto.DeliveryQuote(true, fee.setScale(2, RoundingMode.HALF_UP), free, min, "");
    }
}

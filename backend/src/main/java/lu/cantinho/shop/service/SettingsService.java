package lu.cantinho.shop.service;

import lu.cantinho.shop.entity.Setting;
import lu.cantinho.shop.repository.SettingRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** Réglages modifiables depuis l'espace admin (clé/valeur). Les valeurs par défaut sont ici. */
@Service
public class SettingsService {
    public static final Map<String, String> DEFAULTS = new LinkedHashMap<>();

    static {
        // Identité de la boutique
        DEFAULTS.put("cafe.name", "Cantinho Doce");
        DEFAULTS.put("cafe.tagline", "Pâtisseries portugaises faites maison, livrées chez vous");
        DEFAULTS.put("cafe.address", "Luxembourg");
        DEFAULTS.put("cafe.phone", "+352 000 000 000");
        DEFAULTS.put("cafe.email", "bonjour@cantinho.lu");
        DEFAULTS.put("cafe.hours", "Commandes du mardi au dimanche");
        DEFAULTS.put("cafe.about", "Cantinho Doce prépare à la maison des desserts et douceurs : pastéis de nata, bolo de bolacha, gâteaux sur mesure. Commandez en ligne, choisissez le jour et l'heure, retirez chez nous ou faites-vous livrer.");
        DEFAULTS.put("currency", "EUR");
        // Thème (modifiable depuis l'admin)
        DEFAULTS.put("theme.preset", "azulejo");
        DEFAULTS.put("theme.primary", "#1f4fa3");
        DEFAULTS.put("theme.accent", "#f2b632");
        DEFAULTS.put("theme.background", "#fff8e7");
        DEFAULTS.put("theme.surface", "#ffffff");
        DEFAULTS.put("theme.text", "#2b1d14");
        DEFAULTS.put("theme.dark", "#0f2556");
        DEFAULTS.put("theme.headingFont", "Fraunces");
        DEFAULTS.put("theme.bodyFont", "Nunito Sans");
        DEFAULTS.put("theme.radius", "16");
        DEFAULTS.put("theme.heroTitle", "Des douceurs faites maison");
        DEFAULTS.put("theme.heroSubtitle", "Commandez, choisissez votre créneau, on s'occupe du reste.");
        DEFAULTS.put("brand.primary", "#1f4fa3");
        DEFAULTS.put("brand.dark", "#0f2556");
        // Commandes
        DEFAULTS.put("orders.enabled", "true");
        DEFAULTS.put("orders.message", "");
        DEFAULTS.put("orders.pickup.enabled", "true");
        DEFAULTS.put("orders.pickup.address", "Retrait à l'adresse communiquée après confirmation");
        DEFAULTS.put("orders.delivery.enabled", "true");
        // Créneaux de retrait / livraison
        DEFAULTS.put("schedule.openFrom", "10:00");
        DEFAULTS.put("schedule.openTo", "19:00");
        DEFAULTS.put("schedule.slotMinutes", "60");
        DEFAULTS.put("schedule.leadHours", "24");
        DEFAULTS.put("schedule.maxDays", "14");
        DEFAULTS.put("schedule.closedWeekdays", "1");
        DEFAULTS.put("schedule.maxPerSlot", "0");
        // Livraison
        DEFAULTS.put("delivery.fee", "4.90");
        DEFAULTS.put("delivery.freeFrom", "60");
        DEFAULTS.put("delivery.minOrder", "15");
        DEFAULTS.put("delivery.zones", "");
        DEFAULTS.put("delivery.onlyZones", "false");
        DEFAULTS.put("delivery.info", "Livraison à domicile sur le créneau choisi. Frais selon la zone.");
    }

    /** Textes affichés aux clients, traduisibles : clé de base + ".pt", ".lb", ".de" (vide = français). */
    public static final String[] TRANSLATABLE = {"cafe.tagline", "cafe.about", "cafe.hours", "orders.message",
            "orders.pickup.address", "delivery.info", "theme.heroTitle", "theme.heroSubtitle"};
    public static final String[] LANGS = {"pt", "lb", "de"};

    static {
        for (String k : TRANSLATABLE) for (String l : LANGS) DEFAULTS.put(k + "." + l, "");
    }

    private final SettingRepository repo;

    public SettingsService(SettingRepository repo) {
        this.repo = repo;
    }

    public Map<String, String> all() {
        Map<String, String> map = new LinkedHashMap<>(DEFAULTS);
        for (Setting s : repo.findAll()) {
            if (DEFAULTS.containsKey(s.key) && s.value != null) map.put(s.key, s.value);
        }
        return map;
    }

    public Map<String, String> update(Map<String, String> in) {
        for (Map.Entry<String, String> e : in.entrySet()) {
            if (!DEFAULTS.containsKey(e.getKey())) continue;
            Setting s = new Setting();
            s.key = e.getKey();
            s.value = e.getValue() == null ? "" : e.getValue();
            repo.save(s);
        }
        return all();
    }

    public String str(String key) {
        return all().getOrDefault(key, "");
    }

    public boolean bool(String key) {
        return "true".equalsIgnoreCase(str(key).trim());
    }

    public int integer(String key) {
        try {
            return Integer.parseInt(str(key).trim());
        } catch (NumberFormatException e) {
            return Integer.parseInt(DEFAULTS.getOrDefault(key, "0"));
        }
    }

    public BigDecimal dec(String key) {
        try {
            return new BigDecimal(str(key).trim().replace(',', '.'));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}

package lu.cantinho.shop.config;

import lu.cantinho.shop.entity.*;
import lu.cantinho.shop.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Crée les comptes admin / cuisine et, au tout premier démarrage, une carte d'exemple. */
@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String PARTS = "[{\"name\":\"Taille\",\"required\":true,\"multi\":false,\"choices\":"
            + "[{\"name\":\"6 parts\",\"price\":0},{\"name\":\"10 parts\",\"price\":16},{\"name\":\"15 parts\",\"price\":34}]},"
            + "{\"name\":\"Parfum\",\"required\":true,\"multi\":false,\"choices\":"
            + "[{\"name\":\"Chocolat\",\"price\":0},{\"name\":\"Citron\",\"price\":0},{\"name\":\"Fruits rouges\",\"price\":2}]},"
            + "{\"name\":\"Décoration\",\"required\":false,\"multi\":true,\"choices\":"
            + "[{\"name\":\"Message écrit\",\"price\":3},{\"name\":\"Bougies\",\"price\":1.5},{\"name\":\"Fleurs comestibles\",\"price\":4}]}]";
    private static final String BOLO = "[{\"name\":\"Format\",\"required\":true,\"multi\":false,\"choices\":"
            + "[{\"name\":\"Part individuelle\",\"price\":0},{\"name\":\"Gâteau entier (8 parts)\",\"price\":21.5}]}]";

    private final UserRepository users;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final PasswordEncoder encoder;
    private final String adminEmail, adminPassword, kitchenEmail, kitchenPassword;
    private final boolean seedDemo;

    public DataSeeder(UserRepository users, CategoryRepository categories, ProductRepository products,
                      PasswordEncoder encoder,
                      @Value("${app.admin.email}") String adminEmail, @Value("${app.admin.password}") String adminPassword,
                      @Value("${app.kitchen.email}") String kitchenEmail, @Value("${app.kitchen.password}") String kitchenPassword,
                      @Value("${app.seed-demo}") boolean seedDemo) {
        this.users = users;
        this.categories = categories;
        this.products = products;
        this.encoder = encoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.kitchenEmail = kitchenEmail;
        this.kitchenPassword = kitchenPassword;
        this.seedDemo = seedDemo;
    }

    /** Traductions (portugais | luxembourgeois | allemand) des noms de la carte d'exemple. */
    private static final java.util.Map<String, String> NAMES = new java.util.HashMap<>();

    static {
        String[][] t = {
            {"Pastéis et viennoiseries", "Pastéis e pastelaria", "Pastéis a Gebäck", "Pastéis und Gebäck"},
            {"Gâteaux et verrines", "Bolos e taças", "Kuchen a Gläser", "Kuchen und Gläschen"},
            {"Coffrets cadeaux", "Caixas de oferta", "Kaddoboxen", "Geschenkboxen"},
            {"Salé", "Salgados", "Salzeg", "Herzhaft"},
            {"Pastel de nata", "Pastel de nata", "Pastel de nata", "Pastel de nata"},
            {"Boîte de 6 pastéis de nata", "Caixa de 6 pastéis de nata", "Këscht mat 6 Pastéis de nata", "Box mit 6 Pastéis de nata"},
            {"Boîte de 12 pastéis de nata", "Caixa de 12 pastéis de nata", "Këscht mat 12 Pastéis de nata", "Box mit 12 Pastéis de nata"},
            {"Queijada de Sintra", "Queijada de Sintra", "Queijada de Sintra", "Queijada de Sintra"},
            {"Travesseiro", "Travesseiro", "Travesseiro", "Travesseiro"},
            {"Bola de Berlim", "Bola de Berlim", "Berliner", "Berliner"},
            {"Bolo de bolacha", "Bolo de bolacha", "Biscuitskuch", "Keks-Kuchen"},
            {"Mousse au chocolat maison", "Mousse de chocolate caseira", "Hausgemaach Schockelasmousse", "Hausgemachte Schokoladenmousse"},
            {"Arroz doce", "Arroz doce", "Reispudding", "Süßer Milchreis"},
            {"Pudim flan", "Pudim flan", "Pudding Flan", "Pudding Flan"},
            {"Torta de laranja", "Torta de laranja", "Orangentaart", "Orangenrolle"},
            {"Gâteau d'anniversaire sur mesure", "Bolo de aniversário à medida", "Gebuertsdagskuch no Mooss", "Geburtstagskuchen nach Maß"},
            {"Coffret découverte", "Caixa descoberta", "Entdeckungsbox", "Entdeckerbox"},
            {"Coffret fête (12 douceurs)", "Caixa festa (12 doces)", "Fest-Box (12 Séissegkeeten)", "Festbox (12 Süßigkeiten)"},
            {"Pastel de bacalhau", "Pastel de bacalhau", "Pastel de bacalhau", "Pastel de bacalhau"},
            {"Rissol de camarão", "Rissol de camarão", "Rissol mat Crevetten", "Rissol mit Garnelen"},
            {"Empada de frango", "Empada de frango", "Hähnchenpastéit", "Hähnchenpastete"},
            {"Pão com chouriço", "Pão com chouriço", "Brout mat Chouriço", "Brot mit Chouriço"},
        };
        for (String[] r : t) NAMES.put(r[0], r[1] + "|" + r[2] + "|" + r[3]);
    }

    private static String esc(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    /** JSON de traductions pour un nom français connu, ou null. */
    private static String i18nFor(String frenchName) {
        String v = NAMES.get(frenchName);
        if (v == null) return null;
        String[] p = v.split("\\|");
        return "{\"pt\":{\"name\":\"" + esc(p[0]) + "\"},\"lb\":{\"name\":\"" + esc(p[1]) + "\"},\"de\":{\"name\":\"" + esc(p[2]) + "\"}}";
    }

    /** Complète les traductions manquantes de la carte d'exemple (aussi sur une base existante). */
    private void backfillTranslations() {
        for (Category c : categories.findAll()) {
            if (c.i18nJson == null && i18nFor(c.name) != null) {
                c.i18nJson = i18nFor(c.name);
                categories.save(c);
            }
        }
        for (Product p : products.findAll()) {
            if (p.i18nJson == null && i18nFor(p.name) != null) {
                p.i18nJson = i18nFor(p.name);
                products.save(p);
            }
        }
    }

    @Override
    public void run(String... args) {
        ensureUser("Administrateur", adminEmail, adminPassword, Enums.Role.ADMIN);
        ensureUser("Cuisine", kitchenEmail, kitchenPassword, Enums.Role.KITCHEN);
        if (seedDemo && categories.count() == 0) seedMenu();
        if (seedDemo) backfillTranslations();
    }

    private void ensureUser(String name, String email, String password, Enums.Role role) {
        if (users.existsByEmailIgnoreCase(email)) return;
        User u = new User();
        u.name = name;
        u.email = email.toLowerCase();
        u.passwordHash = encoder.encode(password);
        u.role = role;
        users.save(u);
        log.warn("Compte {} créé : {} (pensez à changer le mot de passe)", role, email);
    }

    private Category cat(String name, String icon, String description, int pos) {
        Category c = new Category();
        c.name = name;
        c.icon = icon;
        c.description = description;
        c.position = pos;
        return categories.save(c);
    }

    private void prod(Category c, String name, String description, String price, String options, String tags, int prep, int pos) {
        Product p = new Product();
        p.category = c;
        p.name = name;
        p.description = description;
        p.price = new BigDecimal(price);
        p.optionsJson = options;
        p.tags = tags;
        p.prepMinutes = prep;
        p.position = pos;
        products.save(p);
    }

    private void seedMenu() {
        Category pasteis = cat("Pastéis et viennoiseries", "🥧", "Cuits le jour même", 1);
        prod(pasteis, "Pastel de nata", "Pâte feuilletée croustillante, crème onctueuse à la cannelle.", "1.90", null, "végétarien", 0, 1);
        prod(pasteis, "Boîte de 6 pastéis de nata", "Six pastéis dans une boîte à emporter.", "10.50", null, "végétarien", 0, 2);
        prod(pasteis, "Boîte de 12 pastéis de nata", "Douze pastéis, idéal pour partager.", "20.00", null, "végétarien", 0, 3);
        prod(pasteis, "Queijada de Sintra", "Petite tartelette au fromage frais et à la cannelle.", "2.30", null, "végétarien", 0, 4);
        prod(pasteis, "Travesseiro", "Feuilleté aux amandes et crème d'œuf.", "2.90", null, "végétarien", 0, 5);
        prod(pasteis, "Bola de Berlim", "Beignet garni de crème pâtissière.", "2.60", null, "végétarien", 0, 6);
        Category cakes = cat("Gâteaux et verrines", "🎂", "Faits maison, sur commande", 2);
        prod(cakes, "Bolo de bolacha", "Biscuits, café et crème au beurre : le classique de la fête.", "4.50", BOLO, "végétarien", 0, 1);
        prod(cakes, "Mousse au chocolat maison", "Verrine de mousse au chocolat noir.", "4.20", null, "végétarien", 0, 2);
        prod(cakes, "Arroz doce", "Riz au lait parfumé au citron et à la cannelle.", "3.80", null, "végétarien", 0, 3);
        prod(cakes, "Pudim flan", "Flan au caramel, texture soyeuse.", "4.20", null, "végétarien", 0, 4);
        prod(cakes, "Torta de laranja", "Roulé moelleux à l'orange.", "4.80", null, "végétarien", 0, 5);
        prod(cakes, "Gâteau d'anniversaire sur mesure", "Choisissez la taille, le parfum et la décoration.", "38.00", PARTS, "végétarien", 0, 6);
        Category boxes = cat("Coffrets cadeaux", "🎁", "À offrir ou à partager", 3);
        prod(boxes, "Coffret découverte", "Une sélection de six douceurs portugaises.", "24.00", null, "végétarien", 0, 1);
        prod(boxes, "Coffret fête (12 douceurs)", "Assortiment pour une table de fête.", "42.00", null, "végétarien", 0, 2);
        Category savory = cat("Salé", "🥟", "Pour l'apéritif ou le déjeuner", 4);
        prod(savory, "Pastel de bacalhau", "Croquette de morue et pomme de terre.", "2.50", null, null, 0, 1);
        prod(savory, "Rissol de camarão", "Chausson frit à la crevette.", "2.60", null, null, 0, 2);
        prod(savory, "Empada de frango", "Petite tourte au poulet.", "2.70", null, null, 0, 3);
        prod(savory, "Pão com chouriço", "Pain farci au chouriço.", "3.40", null, null, 0, 4);
    }
}

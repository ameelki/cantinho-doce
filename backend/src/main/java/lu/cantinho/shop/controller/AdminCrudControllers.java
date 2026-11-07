package lu.cantinho.shop.controller;

import lu.cantinho.shop.entity.*;
import lu.cantinho.shop.repository.*;
import lu.cantinho.shop.service.Errors;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Un contrôleur CRUD par ressource configurable. */
public class AdminCrudControllers {

    @RestController
    @RequestMapping("/api/admin/categories")
    public static class Categories extends CrudController<Category> {
        private final CategoryRepository r;
        public Categories(CategoryRepository r) { super(r); this.r = r; }
        @Override protected List<Category> all() { return r.findAllByOrderByPositionAscIdAsc(); }
    }

    @RestController
    @RequestMapping("/api/admin/products")
    public static class Products extends CrudController<Product> {
        private final ProductRepository r;
        private final ProductImageRepository images;
        public Products(ProductRepository r, ProductImageRepository images) { super(r); this.r = r; this.images = images; }
        @Override protected List<Product> all() { return r.findAllByOrderByPositionAscIdAsc(); }

        /** La photo ne se modifie que par l'envoi dédié : on garde l'état existant. */
        @Override
        public Product update(@PathVariable Long id, @RequestBody Product body) {
            Product old = r.findById(id).orElseThrow(() -> Errors.notFound("Élément introuvable."));
            body.hasImage = old.hasImage;
            body.imageVersion = old.imageVersion;
            return super.update(id, body);
        }

        @Override
        public void delete(@PathVariable Long id) {
            super.delete(id);
            images.deleteById(id);
        }
    }
}

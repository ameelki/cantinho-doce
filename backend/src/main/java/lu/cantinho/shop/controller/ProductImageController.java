package lu.cantinho.shop.controller;

import lu.cantinho.shop.entity.Product;
import lu.cantinho.shop.entity.ProductImage;
import lu.cantinho.shop.repository.ProductImageRepository;
import lu.cantinho.shop.repository.ProductRepository;
import lu.cantinho.shop.service.Errors;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/** Photos des produits : lecture publique, envoi et suppression réservés à l'admin. */
@RestController
@RequestMapping("/api")
public class ProductImageController {
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_BYTES = 4L * 1024 * 1024;

    private final ProductImageRepository images;
    private final ProductRepository products;

    public ProductImageController(ProductImageRepository images, ProductRepository products) {
        this.images = images;
        this.products = products;
    }

    @GetMapping("/public/products/{id}/image")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        ProductImage img = images.findById(id).orElse(null);
        if (img == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.contentType))
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .body(img.data);
    }

    @PostMapping(value = "/admin/products/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Product upload(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Product p = products.findById(id).orElseThrow(() -> Errors.notFound("Produit introuvable."));
        String type = file.getContentType();
        if (type == null || !TYPES.contains(type)) throw Errors.bad("Format d'image non accepté (JPG, PNG, WebP ou GIF).");
        if (file.isEmpty() || file.getSize() > MAX_BYTES) throw Errors.bad("L'image doit faire moins de 4 Mo.");
        ProductImage img = new ProductImage();
        img.productId = id;
        img.contentType = type;
        img.data = file.getBytes();
        images.save(img);
        p.hasImage = true;
        p.imageVersion = System.currentTimeMillis();
        return products.save(p);
    }

    @DeleteMapping("/admin/products/{id}/image")
    public Product remove(@PathVariable Long id) {
        Product p = products.findById(id).orElseThrow(() -> Errors.notFound("Produit introuvable."));
        images.deleteById(id);
        p.hasImage = false;
        p.imageVersion = System.currentTimeMillis();
        return products.save(p);
    }
}

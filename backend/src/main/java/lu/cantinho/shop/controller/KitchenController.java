package lu.cantinho.shop.controller;

import lu.cantinho.shop.dto.Dto;
import lu.cantinho.shop.entity.ShopOrder;
import lu.cantinho.shop.entity.Enums;
import lu.cantinho.shop.entity.Product;
import lu.cantinho.shop.repository.ShopOrderRepository;
import lu.cantinho.shop.repository.ProductRepository;
import lu.cantinho.shop.service.Errors;
import lu.cantinho.shop.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Écran cuisine : commandes à préparer et disponibilité des produits. */
@RestController
@RequestMapping("/api/kitchen")
public class KitchenController {
    private final ShopOrderRepository orders;
    private final ProductRepository products;
    private final OrderService orderService;

    public KitchenController(ShopOrderRepository orders, ProductRepository products, OrderService orderService) {
        this.orders = orders;
        this.products = products;
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    public List<ShopOrder> active() {
        return orders.findByStatusInOrderByScheduledAtAsc(
                List.of(Enums.OrderStatus.NEW, Enums.OrderStatus.PREPARING, Enums.OrderStatus.READY, Enums.OrderStatus.DELIVERING));
    }

    @PutMapping("/orders/{id}/status")
    public ShopOrder status(@PathVariable Long id, @RequestBody Dto.StatusRequest r) {
        try {
            return orderService.setStatus(id, Enums.OrderStatus.valueOf(r.status()));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw Errors.bad("Statut invalide.");
        }
    }

    @GetMapping("/products")
    public List<Product> products() {
        return products.findAllByOrderByPositionAscIdAsc();
    }

    @PutMapping("/products/{id}/availability")
    public Product availability(@PathVariable Long id, @RequestBody Dto.AvailableRequest r) {
        Product p = products.findById(id).orElseThrow(() -> Errors.notFound("Produit introuvable."));
        p.available = r.available();
        return products.save(p);
    }
}

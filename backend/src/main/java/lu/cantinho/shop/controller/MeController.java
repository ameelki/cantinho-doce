package lu.cantinho.shop.controller;

import jakarta.validation.Valid;
import lu.cantinho.shop.dto.Dto;
import lu.cantinho.shop.entity.ShopOrder;
import lu.cantinho.shop.entity.User;
import lu.cantinho.shop.repository.ShopOrderRepository;
import lu.cantinho.shop.repository.UserRepository;
import lu.cantinho.shop.service.Errors;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Espace client : profil, historique de commandes. */
@RestController
@RequestMapping("/api/me")
public class MeController {
    private final CurrentUser current;
    private final UserRepository users;
    private final ShopOrderRepository orders;

    public MeController(CurrentUser current, UserRepository users, ShopOrderRepository orders) {
        this.current = current;
        this.users = users;
        this.orders = orders;
    }

    private User me(Authentication auth) {
        User u = current.get(auth);
        if (u == null) throw Errors.notFound("Utilisateur introuvable.");
        return u;
    }

    @GetMapping
    public User profile(Authentication auth) {
        return me(auth);
    }

    @PutMapping
    public User update(@Valid @RequestBody Dto.ProfileRequest r, Authentication auth) {
        User u = me(auth);
        u.name = r.name().trim();
        u.phone = r.phone();
        return users.save(u);
    }

    @GetMapping("/orders")
    public List<ShopOrder> orders(Authentication auth) {
        return orders.findByUserIdOrderByCreatedAtDesc(me(auth).id);
    }
}

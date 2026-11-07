package lu.cantinho.shop.controller;

import lu.cantinho.shop.entity.User;
import lu.cantinho.shop.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final UserRepository users;

    public CurrentUser(UserRepository users) {
        this.users = users;
    }

    /** Utilisateur connecté, ou null pour un visiteur. */
    public User get(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) return null;
        return users.findByEmailIgnoreCase(auth.getName()).orElse(null);
    }
}

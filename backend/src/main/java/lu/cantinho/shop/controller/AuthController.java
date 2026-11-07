package lu.cantinho.shop.controller;

import jakarta.validation.Valid;
import lu.cantinho.shop.dto.Dto;
import lu.cantinho.shop.entity.Enums;
import lu.cantinho.shop.entity.User;
import lu.cantinho.shop.repository.UserRepository;
import lu.cantinho.shop.security.JwtService;
import lu.cantinho.shop.service.Errors;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public Dto.AuthResponse register(@Valid @RequestBody Dto.RegisterRequest r) {
        if (users.existsByEmailIgnoreCase(r.email())) throw Errors.conflict("Un compte existe déjà avec cet email.");
        User u = new User();
        u.name = r.name().trim();
        u.email = r.email().trim().toLowerCase();
        u.phone = r.phone();
        u.passwordHash = encoder.encode(r.password());
        u.role = Enums.Role.CUSTOMER;
        users.save(u);
        return new Dto.AuthResponse(jwt.generate(u.email), u);
    }

    @PostMapping("/login")
    public Dto.AuthResponse login(@Valid @RequestBody Dto.LoginRequest r) {
        User u = users.findByEmailIgnoreCase(r.email().trim()).orElse(null);
        if (u == null || !u.active || !encoder.matches(r.password(), u.passwordHash))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect.");
        return new Dto.AuthResponse(jwt.generate(u.email), u);
    }
}

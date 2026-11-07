package lu.cantinho.shop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lu.cantinho.shop.entity.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class Dto {
    private Dto() {}

    public record ErrorResponse(String message, Map<String, String> fields) {}

    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email,
                                  @Size(min = 8, message = "8 caractères minimum") String password, String phone) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String token, User user) {}

    public record ProfileRequest(@NotBlank String name, String phone) {}

    public record OrderItemReq(@NotNull Long productId, @Min(1) @Max(50) int quantity,
                               List<String> choices, String note) {}

    public record OrderRequest(@NotNull Enums.OrderMode mode, @NotBlank String customerName,
                               @NotBlank String phone, String email, @NotNull LocalDateTime scheduledAt,
                               String address, String postalCode, String city, String note,
                               @NotEmpty @Valid List<OrderItemReq> items) {}

    public record StatusRequest(String status, String adminNote) {}

    public record AvailableRequest(boolean available) {}

    public record PaidRequest(boolean paid) {}

    public record Menu(List<Category> categories, List<Product> products) {}

    /** Créneaux libres d'une journée (heures au format HH:mm). */
    public record DaySlots(java.time.LocalDate date, List<String> times) {}

    /** Frais de livraison calculés côté serveur pour un sous-total et une ville. */
    public record DeliveryQuote(boolean allowed, java.math.BigDecimal fee, boolean free, java.math.BigDecimal minOrder,
                                String message) {}

    public record StaffRequest(String name, String email, String password, String phone,
                               Enums.Role role, Boolean active) {}
}

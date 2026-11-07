package lu.cantinho.shop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class ShopOrder extends BaseEntity {
    @Column(unique = true, nullable = false)
    public String code;
    @Enumerated(EnumType.STRING)
    public Enums.OrderMode mode;
    @Enumerated(EnumType.STRING)
    public Enums.OrderStatus status = Enums.OrderStatus.NEW;
    public String customerName;
    public String phone;
    public String email;
    /** Jour et heure choisis par le client pour le retrait ou la livraison. */
    public LocalDateTime scheduledAt;
    public String address;
    public String postalCode;
    public String city;
    @Column(length = 1000)
    public String note;
    @Column(precision = 10, scale = 2)
    public BigDecimal subtotal = BigDecimal.ZERO;
    @Column(precision = 10, scale = 2)
    public BigDecimal deliveryFee = BigDecimal.ZERO;
    @Column(precision = 10, scale = 2)
    public BigDecimal total = BigDecimal.ZERO;
    public boolean paid;
    @ManyToOne
    @JsonIgnore
    public User user;
    public LocalDateTime createdAt = LocalDateTime.now();
    public LocalDateTime updatedAt = LocalDateTime.now();
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    public List<OrderItem> items = new ArrayList<>();
}

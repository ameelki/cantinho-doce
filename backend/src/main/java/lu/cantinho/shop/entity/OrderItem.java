package lu.cantinho.shop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class OrderItem extends BaseEntity {
    @ManyToOne
    @JsonIgnore
    public ShopOrder order;
    public Long productId;
    public String name;
    @Column(precision = 10, scale = 2)
    public BigDecimal unitPrice;
    public int quantity;
    @Column(length = 500)
    public String optionsText;
    @Column(length = 500)
    public String note;
}

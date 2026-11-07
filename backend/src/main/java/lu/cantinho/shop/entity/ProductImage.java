package lu.cantinho.shop.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Photo d'un produit, stockée en base (bytea). Séparée de Product pour ne pas charger l'image avec chaque produit. */
@Entity
public class ProductImage {
    @Id
    public Long productId;
    public String contentType;
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(columnDefinition = "bytea")
    public byte[] data;
}

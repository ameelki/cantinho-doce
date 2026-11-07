package lu.cantinho.shop.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class Product extends BaseEntity {
    public String name;
    @Column(length = 1000)
    public String description;
    @Column(precision = 10, scale = 2)
    public BigDecimal price = BigDecimal.ZERO;
    @Column(length = 1000)
    public String imageUrl;
    @ManyToOne
    public Category category;
    /** Traductions : {"pt":{"name":"","description":""},"lb":{...},"de":{...}}. Le français est la langue de base. */
    @Column(length = 4000)
    public String i18nJson;
    /** true si une photo est stockée en base (voir ProductImage). */
    public Boolean hasImage = false;
    public Long imageVersion = 0L;
    public boolean available = true;
    public boolean active = true;
    public int position;
    public Integer prepMinutes;
    /** ex : vegan,sans gluten */
    public String tags;
    /** [{"name":"Taille","required":true,"multi":false,"choices":[{"name":"Petit","price":0}]}] */
    @Column(length = 4000)
    public String optionsJson;
}

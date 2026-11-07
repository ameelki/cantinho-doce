package lu.cantinho.shop.entity;

import jakarta.persistence.*;

@Entity
public class Setting {
    @Id
    @Column(name = "skey")
    public String key;
    @Column(name = "svalue", length = 4000)
    public String value;
}

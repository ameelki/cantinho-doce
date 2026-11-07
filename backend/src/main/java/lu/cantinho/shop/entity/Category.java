package lu.cantinho.shop.entity;

import jakarta.persistence.*;

@Entity
public class Category extends BaseEntity {
    public String name;
    @Column(length = 500)
    public String description;
    public String icon;
    /** Traductions : {"pt":{"name":"","description":""},"lb":{...},"de":{...}}. Le français est la langue de base. */
    @Column(length = 4000)
    public String i18nJson;
    public int position;
    public boolean active = true;
}

package lu.cantinho.shop.entity;

public final class Enums {
    private Enums() {}
    public enum Role { CUSTOMER, KITCHEN, ADMIN }
    /** PICKUP = retrait sur place, DELIVERY = livraison à l'adresse du client. */
    public enum OrderMode { PICKUP, DELIVERY }
    /** DELIVERING = en cours de livraison ; SERVED = terminée (retirée ou livrée). */
    public enum OrderStatus { NEW, PREPARING, READY, DELIVERING, SERVED, CANCELLED }
}

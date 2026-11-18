package shop;

/**
 * A single position of an order. Prices are stored in cents to avoid rounding errors.
 */
public record OrderItem(String name, int unitPriceCents, int quantity) {
}

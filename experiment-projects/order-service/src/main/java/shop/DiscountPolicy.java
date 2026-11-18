package shop;

public class DiscountPolicy {

    static final int THRESHOLD_CENTS = 10_000;
    static final int DISCOUNT_PERCENT = 10;

    public int discountFor(int subtotalCents) {
        if (subtotalCents >= THRESHOLD_CENTS) {
            return subtotalCents * DISCOUNT_PERCENT / 100;
        }
        return 0;
    }
}

package shop;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class DiscountPolicyTest {

    private final DiscountPolicy policy = new DiscountPolicy();

    @Test
    void noDiscountBelowThreshold() {
        assertEquals(0, policy.discountFor(9_999));
    }

    @Test
    void tenPercentDiscountAtThreshold() {
        assertEquals(1_000, policy.discountFor(10_000));
    }
}

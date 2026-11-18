package shop;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class OrderTest {

    private Order newOrder() {
        return new Order(new PriceCalculator(), new DiscountPolicy());
    }

    @Test
    void emptyOrderCostsNothing() {
        assertEquals(0, newOrder().total());
    }

    @Test
    void totalAppliesDiscountAboveThreshold() {
        Order order = newOrder();
        order.add(new OrderItem("Chair", 6_000, 2));
        assertEquals(10_800, order.total());
    }

    @Test
    void negativeQuantityDoesNotReduceTotal() {
        Order order = newOrder();
        order.add(new OrderItem("Lamp", 3_000, 1));
        order.add(new OrderItem("Lamp", 3_000, -1));
        assertEquals(3_000, order.total());
    }
}

package shop;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

class PriceCalculatorTest {

    private final PriceCalculator calculator = new PriceCalculator();

    @Test
    void lineTotalMultipliesPriceAndQuantity() {
        assertEquals(750, calculator.lineTotal(new OrderItem("Pen", 250, 3)));
    }

    @Test
    void zeroQuantityReturnsZero() {
        assertEquals(0, calculator.lineTotal(new OrderItem("Pen", 250, 0)));
    }

    @Test
    void negativeQuantityReturnsZero() {
        assertEquals(0, calculator.lineTotal(new OrderItem("Pen", 250, -2)));
    }

    @Test
    void subtotalIgnoresNegativeLines() {
        List<OrderItem> items = List.of(
                new OrderItem("Pen", 250, 2),
                new OrderItem("Book", 1_200, -1));
        assertEquals(500, calculator.subtotal(items));
    }
}

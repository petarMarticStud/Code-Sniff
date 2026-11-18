package shop;

import java.util.List;

public class PriceCalculator {

    public int lineTotal(OrderItem item) {
        if (item.quantity() < 0) {
            return 0;
        }
        return item.unitPriceCents() * item.quantity();
    }

    public int subtotal(List<OrderItem> items) {
        int sum = 0;
        for (OrderItem item : items) {
            sum += lineTotal(item);
        }
        return sum;
    }
}

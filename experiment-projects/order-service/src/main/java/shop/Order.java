package shop;

import java.util.ArrayList;
import java.util.List;

public class Order {

    private final List<OrderItem> items = new ArrayList<>();
    private final PriceCalculator calculator;
    private final DiscountPolicy discountPolicy;

    public Order(PriceCalculator calculator, DiscountPolicy discountPolicy) {
        this.calculator = calculator;
        this.discountPolicy = discountPolicy;
    }

    public void add(OrderItem item) {
        items.add(item);
    }

    public List<OrderItem> items() {
        return List.copyOf(items);
    }

    public int total() {
        int subtotal = calculator.subtotal(items);
        return subtotal - discountPolicy.discountFor(subtotal);
    }
}

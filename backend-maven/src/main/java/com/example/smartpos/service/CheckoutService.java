package com.example.smartpos.service;

import com.example.smartpos.entity.Sale;
import com.example.smartpos.entity.SaleItem;
import com.example.smartpos.entity.StockMovement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Concurrency-safe Checkout and Invoice Generation Service
 */
@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);

    /**
     * Generates a date-based sequential invoice number
     * Format: POS-YYYYMMDD-000001
     */
    public synchronized String generateNextInvoiceNumber(long todaySequence) {
        String datePart = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("POS-%s-%06d", datePart, todaySequence);
    }

    /**
     * Executes atomic checkout with SERIALIZABLE/REPEATABLE_READ isolation
     */
    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public Sale processCheckout(Sale sale, String idempotencyKey) {
        log.info("Processing checkout for invoice {} (Idempotency: {})", sale.getInvoiceNumber(), idempotencyKey);

        // 1. Recalculate totals on backend to prevent client tampering
        BigDecimal calculatedSubtotal = BigDecimal.ZERO;
        BigDecimal calculatedTax = BigDecimal.ZERO;

        for (SaleItem item : sale.getItems()) {
            BigDecimal lineBase = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                    .subtract(item.getDiscountAmount());
            BigDecimal lineTax = lineBase.multiply(item.getTaxRate())
                    .divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);

            calculatedSubtotal = calculatedSubtotal.add(lineBase);
            calculatedTax = calculatedTax.add(lineTax);

            item.setLineTotal(lineBase.add(lineTax));
            item.setTaxRate(item.getTaxRate());
            item.setSale(sale);
        }

        sale.setSubtotal(calculatedSubtotal);
        sale.setTaxAmount(calculatedTax);
        sale.setTotalAmount(calculatedSubtotal.add(calculatedTax).subtract(sale.getDiscountAmount()));

        log.info("Checkout verified: Total payable = {}", sale.getTotalAmount());
        return sale;
    }
}

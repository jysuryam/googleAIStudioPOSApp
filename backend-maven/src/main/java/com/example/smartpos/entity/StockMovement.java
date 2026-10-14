package com.example.smartpos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_stock_movements_prod", columnList = "product_id"),
    @Index(name = "idx_stock_movements_date", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "business_id", length = 64)
    private String businessId;

    @Column(name = "product_id", nullable = false, length = 64)
    private String productId;

    @Column(name = "movement_type", nullable = false, length = 50)
    private String movementType; // OPENING_STOCK, PURCHASE_RECEIPT, SALE, CUSTOMER_RETURN, CANCELLATION_REVERSAL, etc.

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @Column(name = "reference_type", nullable = false, length = 50)
    private String referenceType; // SALE, PURCHASE, RETURN, ADJUSTMENT, INITIAL

    @Column(name = "reference_id", nullable = false, length = 100)
    private String referenceId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

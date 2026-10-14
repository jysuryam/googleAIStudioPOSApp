package com.example.smartpos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * SmartPOS — Responsive Point of Sale & Inventory Management System
 * Production-ready Spring Boot 3.x Entry Point
 */
@SpringBootApplication
@EnableTransactionManagement
public class SmartPosApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartPosApplication.java, args);
    }
}

import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  Server,
  Layers,
} from 'lucide-react';

export const MavenProjectView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('pom.xml');
  const [copied, setCopied] = useState<boolean>(false);

  const filesContent: Record<string, { lang: string; description: string; content: string }> = {
    'pom.xml': {
      lang: 'xml',
      description: 'Maven Project Object Model with Java 21, Spring Boot 3.3.4, JasperReports & Flyway',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>

    <groupId>com.example.smartpos</groupId>
    <artifactId>smartpos</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>smartpos</name>
    <description>SmartPOS — Responsive POS Billing & Inventory Management</description>

    <properties>
        <java.version>21</java.version>
        <jasperreports.version>6.21.3</jasperreports.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>net.sf.jasperreports</groupId>
            <artifactId>jasperreports</artifactId>
            <version>\${jasperreports.version}</version>
        </dependency>
    </dependencies>
</project>`,
    },
    'application.properties': {
      lang: 'properties',
      description: 'Spring Boot 3 configuration on port 9090 with PostgreSQL, Flyway, and Indian GST defaults',
      content: `server.port=9090
server.servlet.context-path=/

# PostgreSQL Connection Pool
spring.datasource.url=jdbc:postgresql://\${DB_HOST:localhost}:\${DB_PORT:5432}/\${DB_NAME:smartpos}?currentSchema=public
spring.datasource.username=\${DB_USERNAME:postgres}
spring.datasource.password=\${DB_PASSWORD:postgres}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Schema Validation against Flyway
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Flyway Automatic Migration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration

# File Upload Limits
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=25MB

# SmartPOS Hardware & Thermal Printer Settings
smartpos.reports.template-path=classpath:reports/
smartpos.reports.default-receipt-width=80mm

# Indian Localization & GST Defaults
smartpos.business.timezone=Asia/Kolkata
smartpos.business.currency=INR
smartpos.business.currency-symbol=₹
smartpos.business.home-state=Maharashtra
smartpos.business.home-state-code=27
smartpos.business.gstin=27AABCN8942Q1Z8
smartpos.business.upi-id=naturaretail@okhdfcbank
smartpos.business.allow-negative-inventory=false`,
    },
    'V1__init_schema.sql': {
      lang: 'sql',
      description: 'Flyway schema with Indian GST (CGST, SGST, IGST), HSN codes, and INR monetary fields',
      content: `-- 1. Businesses
CREATE TABLE businesses (
    id VARCHAR(64) PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(10) DEFAULT '27',
    gstin VARCHAR(50),
    pan_number VARCHAR(50),
    fssai_number VARCHAR(50),
    upi_id VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',
    receipt_footer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Products (with Indian HSN codes and GST slab rates)
CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    hsn_code VARCHAR(20) NOT NULL DEFAULT '0000',
    product_name VARCHAR(200) NOT NULL,
    cost_price NUMERIC(14, 2) NOT NULL,
    selling_price NUMERIC(14, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL, -- 0%, 5%, 12%, 18%, 28%
    reorder_level INT NOT NULL DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    primary_image_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Sales (with CGST, SGST, IGST, Round Off, Place of Supply)
CREATE TABLE sales (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id VARCHAR(64) REFERENCES customers(id),
    sale_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    round_off_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL,
    place_of_supply VARCHAR(100) DEFAULT '27 - Maharashtra',
    is_inter_state BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(50) NOT NULL,
    sale_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Sale Items (with HSN Snapshot and GST Tax Component Splits)
CREATE TABLE sale_items (
    id VARCHAR(64) PRIMARY KEY,
    sale_id VARCHAR(64) REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    sku_snapshot VARCHAR(100) NOT NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    hsn_code_snapshot VARCHAR(20) NOT NULL DEFAULT '0000',
    quantity INT NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(14, 2) NOT NULL
);`,
    },
    'CheckoutService.java': {
      lang: 'java',
      description: 'Transactional service calculating CGST+SGST (Intra-state) vs IGST (Inter-state) and round-off',
      content: `package com.example.smartpos.service;

import com.example.smartpos.entity.Sale;
import com.example.smartpos.entity.SaleItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CheckoutService {

    private static final String STORE_STATE_CODE = "27"; // Maharashtra

    public synchronized String generateNextInvoiceNumber(long sequence) {
        String datePart = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("INV-%s-%06d", datePart, sequence);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public Sale processCheckout(Sale sale, String customerStateCode) {
        boolean isInterState = !STORE_STATE_CODE.equals(customerStateCode);
        sale.setInterState(isInterState);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal cgstTotal = BigDecimal.ZERO;
        BigDecimal sgstTotal = BigDecimal.ZERO;
        BigDecimal igstTotal = BigDecimal.ZERO;

        for (SaleItem item : sale.getItems()) {
            BigDecimal lineBase = item.getUnitPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()))
                .subtract(item.getDiscountAmount());

            BigDecimal taxRate = item.getTaxRate();
            if (isInterState) {
                // Inter-state supply: IGST applied
                BigDecimal lineIgst = lineBase.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                item.setIgstAmount(lineIgst);
                item.setCgstAmount(BigDecimal.ZERO);
                item.setSgstAmount(BigDecimal.ZERO);
                igstTotal = igstTotal.add(lineIgst);
                item.setLineTotal(lineBase.add(lineIgst));
            } else {
                // Intra-state supply: CGST (50%) + SGST (50%)
                BigDecimal halfRate = taxRate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                BigDecimal lineCgst = lineBase.multiply(halfRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal lineSgst = lineBase.multiply(halfRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                item.setCgstAmount(lineCgst);
                item.setSgstAmount(lineSgst);
                item.setIgstAmount(BigDecimal.ZERO);
                cgstTotal = cgstTotal.add(lineCgst);
                sgstTotal = sgstTotal.add(lineSgst);
                item.setLineTotal(lineBase.add(lineCgst).add(lineSgst));
            }
            subtotal = subtotal.add(lineBase);
        }

        BigDecimal totalTax = isInterState ? igstTotal : cgstTotal.add(sgstTotal);
        BigDecimal rawTotal = subtotal.add(totalTax).subtract(sale.getDiscountAmount());
        BigDecimal roundedTotal = rawTotal.setScale(0, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedTotal.subtract(rawTotal);

        sale.setSubtotal(subtotal);
        sale.setCgstAmount(cgstTotal);
        sale.setSgstAmount(sgstTotal);
        sale.setIgstAmount(igstTotal);
        sale.setTaxAmount(totalTax);
        sale.setRoundOffAmount(roundOff);
        sale.setTotalAmount(roundedTotal);
        return sale;
    }
}`,
    },
    'gst_tax_invoice_80mm.jrxml': {
      lang: 'xml',
      description: 'JasperReports 80mm GST Tax Invoice template with HSN codes, CGST, SGST, IGST, and UPI VPA',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!-- SmartPOS Indian GST Tax Invoice Template (JasperReports) -->
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
              name="gst_tax_invoice_80mm"
              pageWidth="226" pageHeight="842" columnWidth="206"
              leftMargin="10" rightMargin="10" topMargin="10" bottomMargin="10"
              isIgnorePagination="true">

  <parameter name="STORE_NAME" class="java.lang.String"/>
  <parameter name="STORE_GSTIN" class="java.lang.String"/>
  <parameter name="PLACE_OF_SUPPLY" class="java.lang.String"/>
  <parameter name="INVOICE_NUMBER" class="java.lang.String"/>
  <parameter name="SUBTOTAL" class="java.math.BigDecimal"/>
  <parameter name="CGST_TOTAL" class="java.math.BigDecimal"/>
  <parameter name="SGST_TOTAL" class="java.math.BigDecimal"/>
  <parameter name="IGST_TOTAL" class="java.math.BigDecimal"/>
  <parameter name="TOTAL_AMOUNT" class="java.math.BigDecimal"/>
  <parameter name="AMOUNT_IN_WORDS" class="java.lang.String"/>
  <parameter name="UPI_ID" class="java.lang.String"/>

  <field name="productName" class="java.lang.String"/>
  <field name="hsnCode" class="java.lang.String"/>
  <field name="quantity" class="java.lang.Integer"/>
  <field name="unitPrice" class="java.math.BigDecimal"/>
  <field name="lineTotal" class="java.math.BigDecimal"/>

  <title>
    <band height="65" splitType="Stretch">
      <textField>
        <reportElement x="0" y="0" width="206" height="14"/>
        <textElement textAlignment="Center"><font size="8" isBold="true"/></textElement>
        <textFieldExpression><![CDATA["TAX INVOICE - " + $P{STORE_NAME}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="16" width="206" height="12"/>
        <textElement textAlignment="Center"><font size="7"/></textElement>
        <textFieldExpression><![CDATA["GSTIN: " + $P{STORE_GSTIN}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="30" width="206" height="12"/>
        <textElement textAlignment="Center"><font size="7"/></textElement>
        <textFieldExpression><![CDATA["Inv: " + $P{INVOICE_NUMBER} + " | POS: " + $P{PLACE_OF_SUPPLY}]]></textFieldExpression>
      </textField>
    </band>
  </title>
</jasperReport>`,
    },
    'README.md': {
      lang: 'markdown',
      description: 'Indian GST deployment guide for Windows, Linux, PostgreSQL, and thermal printers',
      content: `# SmartPOS — Indian GST POS & Inventory System

## 1. Fast Start with PostgreSQL & Flyway
docker run -d --name smartpos-postgres \\
  -e POSTGRES_DB=smartpos \\
  -e POSTGRES_USER=postgres \\
  -e POSTGRES_PASSWORD=postgres \\
  -p 5432:5432 postgres:16-alpine

## 2. Start Spring Boot on Port 9090
./mvnw clean spring-boot:run

## 3. Indian GST Features Out of the Box:
- Automatic CGST (50%) + SGST (50%) for Intra-State billing
- Automatic IGST (100%) for Inter-State billing
- HSN / SAC itemized catalog
- Statutory Tax Invoice format with Amount in Words
- Dynamic UPI QR codes for BHIM, PhonePe, Google Pay & Paytm
- GSTR-1 and GSTR-3B tax summary exports`,
    },
  };

  const currentFile = filesContent[selectedFile] || filesContent['pom.xml'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Maven Spring Boot 3 & PostgreSQL Project Files
          </h1>
          <p className="text-xs text-slate-500">
            Runnable Java 21 codebase with Flyway migrations, JPA entities, and JasperReports JRXML templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedFile}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* File Navigator Sidebar */}
        <div className="w-full md:w-72 bg-white border-r border-slate-200 p-3 overflow-y-auto shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 mb-1">
            Project Structure (/backend-maven)
          </div>
          <div className="space-y-1 text-xs">
            {Object.keys(filesContent).map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  selectedFile === filename
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0" />
                <span className="truncate">{filename}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2 px-2">
            <div className="font-semibold text-slate-700">Quick Commands</div>
            <div className="font-mono text-[10px] bg-slate-100 p-2 rounded text-slate-800">
              # Linux/Mac<br />
              ./mvnw spring-boot:run<br /><br />
              # Windows<br />
              mvnw.cmd spring-boot:run
            </div>
          </div>
        </div>

        {/* Code Content View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-slate-100">
          <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-emerald-400 font-semibold">{selectedFile}</span>
            <span>{currentFile.description}</span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
            <pre className="whitespace-pre overflow-x-auto selection:bg-emerald-500 selection:text-white">
              {currentFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

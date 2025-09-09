package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "msa_doc_name")
    private String msaDocName;

    @Lob
    @Column(name = "msa_doc_blob", columnDefinition = "LONGBLOB")
    private byte[] msaDocBlob;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // Getters and Setters
    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getMsaDocName() {
        return msaDocName;
    }

    public void setMsaDocName(String msaDocName) {
        this.msaDocName = msaDocName;
    }

    public byte[] getMsaDocBlob() {
        return msaDocBlob;
    }

    public void setMsaDocBlob(byte[] msaDocBlob) {
        this.msaDocBlob = msaDocBlob;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}

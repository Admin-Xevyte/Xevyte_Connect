package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Sow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sowId;

    private LocalDate sowStartDate;
    private LocalDate sowEndDate;
    private int totalEffort;   // in PD
    private double totalCost;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // getters and setters
    public Long getSowId() { return sowId; }
    public void setSowId(Long sowId) { this.sowId = sowId; }

    public LocalDate getSowStartDate() { return sowStartDate; }
    public void setSowStartDate(LocalDate sowStartDate) { this.sowStartDate = sowStartDate; }

    public LocalDate getSowEndDate() { return sowEndDate; }
    public void setSowEndDate(LocalDate sowEndDate) { this.sowEndDate = sowEndDate; }

    public int getTotalEffort() { return totalEffort; }
    public void setTotalEffort(int totalEffort) { this.totalEffort = totalEffort; }

    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
}

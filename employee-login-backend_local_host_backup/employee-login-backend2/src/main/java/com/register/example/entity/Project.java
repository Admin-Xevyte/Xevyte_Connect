package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    private LocalDate projectStartDate;

    private LocalDate projectEndDate;

    private Double totalEffort;

    private Double totalCost;

    private String manager;

    private String reviewer;

    private String hr;
    
    private String finance; // new field
    
    private String admin;   // new field

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sow_id", nullable = false)
    @JsonBackReference
    private Sow sow;

    // Getters and Setters

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public LocalDate getProjectStartDate() {
        return projectStartDate;
    }

    public void setProjectStartDate(LocalDate projectStartDate) {
        this.projectStartDate = projectStartDate;
    }

    public LocalDate getProjectEndDate() {
        return projectEndDate;
    }

    public void setProjectEndDate(LocalDate projectEndDate) {
        this.projectEndDate = projectEndDate;
    }

    public Double getTotalEffort() {
        return totalEffort;
    }

    public void setTotalEffort(Double totalEffort) {
        this.totalEffort = totalEffort;
    }

    public Double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(Double totalCost) {
        this.totalCost = totalCost;
    }

    public String getManager() {
        return manager;
    }

    public void setManager(String manager) {
        this.manager = manager;
    }

    public String getReviewer() {
        return reviewer;
    }

    public void setReviewer(String reviewer) {
        this.reviewer = reviewer;
    }

    public String getHr() {
        return hr;
    }

    public void setHr(String hr) {
        this.hr = hr;
    }
    
    // new getters and setters
    public String getFinance() {
        return finance;
    }

    public void setFinance(String finance) {
        this.finance = finance;
    }

    public String getAdmin() {
        return admin;
    }

    public void setAdmin(String admin) {
        this.admin = admin;
    }

    public Sow getSow() {
        return sow;
    }

    public void setSow(Sow sow) {
        this.sow = sow;
    }
}
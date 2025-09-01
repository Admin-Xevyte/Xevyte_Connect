package com.register.example.entity;
 
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
 
@Entity
@Table(name = "travel_requests")
public class TravelRequest {
    @Column(name = "rejected_reason")
    private String rejectedReason;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "employee_id", nullable = false)
    private String employeeId;
 
    @Column(name = "assigned_admin_id")
    private String assignedAdminId;
 
    @Column(name = "from_location")
    private String fromLocation;
 
    @Column(name = "to_location")
    private String toLocation;
 
    @Column(name = "mode_of_travel")
    private String modeOfTravel; // Bus, Train, Flight
 
    private String category; // Domestic, International
 
    @Column(name = "departure_date")
    private LocalDate departureDate;
 
    @Column(name = "return_date")
    private LocalDate returnDate;
 
    @Column(name = "accommodation_required")
    private String accommodationRequired;
 
    @Column(name = "advance_required")
    private String advanceRequired;
 
    private String status; // Pending, Approved, Rejected, Active, Cancelled
 
    @Column(name = "assigned_manager_id")
    private String assignedManagerId;
 
    private String remarks;
 
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
 
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
 
    // === Removed Redundant PDF Fields ===
    // @Column(name = "pdf_file_name")
    // private String pdfFileName;
    // @Column(name = "pdf_content_type")
    // private String pdfContentType;
    // @Lob
    // @Column(name = "pdf_data", columnDefinition = "LONGBLOB")
    // private byte[] pdfData;
    // =====================================
 
    public TravelRequest() {
        this.status = "Pending";
    }
 
    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
 
    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "employee_id", insertable = false, updatable = false)
    private Employee employee;
 
    @Transient
    private String employeeName;
 
    @OneToMany(mappedBy = "travelRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TravelDocument> documents = new ArrayList<>();
 
    // === Getters & Setters ===
 
    public String getEmployeeName() {
        return employeeName;
    }
 
    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }
 
    public Long getId() {
        return id;
    }
 
    public void setId(Long id) {
        this.id = id;
    }
 
    public String getAssignedAdminId() {
        return assignedAdminId;
    }
 
    public void setAssignedAdminId(String assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }
 
    public String getEmployeeId() {
        return employeeId;
    }
 
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
 
    public String getFromLocation() {
        return fromLocation;
    }
 
    public void setFromLocation(String fromLocation) {
        this.fromLocation = fromLocation;
    }
 
    public String getToLocation() {
        return toLocation;
    }
 
    public void setToLocation(String toLocation) {
        this.toLocation = toLocation;
    }
 
    public String getModeOfTravel() {
        return modeOfTravel;
    }
 
    public void setModeOfTravel(String modeOfTravel) {
        this.modeOfTravel = modeOfTravel;
    }
 
    public String getCategory() {
        return category;
    }
 
    public void setCategory(String category) {
        this.category = category;
    }
 
    public LocalDate getDepartureDate() {
        return departureDate;
    }
 
    public void setDepartureDate(LocalDate departureDate) {
        this.departureDate = departureDate;
    }
 
    public LocalDate getReturnDate() {
        return returnDate;
    }
 
    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }
 
    public Employee getEmployee() {
        return employee;
    }
 
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
 
    public String getAccommodationRequired() {
        return accommodationRequired;
    }
 
    public void setAccommodationRequired(String accommodationRequired) {
        this.accommodationRequired = accommodationRequired;
    }
 
    public String getAdvanceRequired() {
        return advanceRequired;
    }
 
    public void setAdvanceRequired(String advanceRequired) {
        this.advanceRequired = advanceRequired;
    }
 
    public String getStatus() {
        return status;
    }
 
    public void setStatus(String status) {
        this.status = status;
    }
 
    public String getAssignedManagerId() {
        return assignedManagerId;
    }
 
    public void setAssignedManagerId(String assignedManagerId) {
        this.assignedManagerId = assignedManagerId;
    }
 
    public String getRemarks() {
        return remarks;
    }
 
    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
 
    public Date getCreatedAt() {
        return createdAt;
    }
 
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
 
    public Date getUpdatedAt() {
        return updatedAt;
    }
 
    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
 
    public String getRejectedReason() {
        return rejectedReason;
    }
 
    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }
 
    public List<TravelDocument> getDocuments() {
        return documents;
    }
 
    public void setDocuments(List<TravelDocument> documents) {
        this.documents = documents;
    }
}
 
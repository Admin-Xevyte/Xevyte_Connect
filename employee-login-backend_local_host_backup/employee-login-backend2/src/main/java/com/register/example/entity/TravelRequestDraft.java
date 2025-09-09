package com.register.example.entity;
 
import jakarta.persistence.*;
import java.util.Date;
 
@Entity
@Table(name = "travel_request_drafts")
public class TravelRequestDraft {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    private String employeeId;
 
    private String name;
 
    private String fromLocation;
 
    private String toLocation;
 
    private String modeOfTravel;
 
    private String category;
 
    @Temporal(TemporalType.DATE)
    private Date departureDate;
 
    @Temporal(TemporalType.DATE)
    private Date returnDate;
 
    private String accommodationRequired;
 
    private String advanceRequired;
 
    @Column(length = 2000)
    private String remarks;
 
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();
 
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt = new Date();
 
    public TravelRequestDraft() {
    }
 
    public TravelRequestDraft(Long id, String employeeId, String name, String fromLocation, String toLocation,
                              String modeOfTravel, String category, Date departureDate, Date returnDate,
                              String accommodationRequired, String advanceRequired, String remarks,
                              Date createdAt, Date updatedAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.name = name;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.modeOfTravel = modeOfTravel;
        this.category = category;
        this.departureDate = departureDate;
        this.returnDate = returnDate;
        this.accommodationRequired = accommodationRequired;
        this.advanceRequired = advanceRequired;
        this.remarks = remarks;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
 
    public Long getId() {
        return id;
    }
 
    public void setId(Long id) {
        this.id = id;
    }
 
    public String getEmployeeId() {
        return employeeId;
    }
 
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
 
    public String getName() {
        return name;
    }
 
    public void setName(String name) {
        this.name = name;
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
 
    public Date getDepartureDate() {
        return departureDate;
    }
 
    public void setDepartureDate(Date departureDate) {
        this.departureDate = departureDate;
    }
 
    public Date getReturnDate() {
        return returnDate;
    }
 
    public void setReturnDate(Date returnDate) {
        this.returnDate = returnDate;
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
}
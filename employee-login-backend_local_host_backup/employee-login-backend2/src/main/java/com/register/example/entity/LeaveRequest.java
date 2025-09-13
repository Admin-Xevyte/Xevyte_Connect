package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeId;
    private String assignedManagerId;
    private String assignedHrId;
    
    private String type;

    // ✅ Changed to LocalDate
    private LocalDate startDate;

    // ✅ Changed to LocalDate
    private LocalDate endDate;

    private int totalDays; 
    
    
    private String reason;
    private String status;
    private String rejectionReason;

    // ✅ Changed to LocalDateTime
    private LocalDateTime createdDate = LocalDateTime.now();

    private boolean counted = false;

    // New fields for file upload
    @Lob
    @Column(name = "attachment", columnDefinition = "LONGBLOB")
    private byte[] attachment;

    private String fileName;
    private String fileType;

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getAssignedManagerId() { return assignedManagerId; }
    public void setAssignedManagerId(String assignedManagerId) { this.assignedManagerId = assignedManagerId; }

    public String getAssignedHrId() { return assignedHrId; }
    public void setAssignedHrId(String assignedHrId) { this.assignedHrId = assignedHrId; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    // ✅ Updated getter and setter to use LocalDate
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    // ✅ Updated getter and setter to use LocalDate
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    
    public int getTotalDays() { return totalDays; }
    public void setTotalDays(int totalDays) { this.totalDays = totalDays; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    // ✅ Updated getter and setter to use LocalDateTime
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public boolean isCounted() { return counted; }
    public void setCounted(boolean counted) { this.counted = counted; }

    public byte[] getAttachment() { return attachment; }
    public void setAttachment(byte[] attachment) { this.attachment = attachment; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
}

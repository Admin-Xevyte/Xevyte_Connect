package com.register.example.payload;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;


public class LeaveRequestDTO {

    private String employeeId;
   
    private String type;
    
    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate startDate;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate endDate;
    
    private int totalDays;
    
    private String reason;
    private String status;
    private Long leaveRequestId;
    private String existingFileName;


    // Getters and Setters
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }


    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
    public Long getLeaveRequestId() {
        return leaveRequestId;
    }
    
    public void setLeaveRequestId(Long leaveRequestId) {
        this.leaveRequestId = leaveRequestId;
    }
    
    public String getExistingFileName() {
        return existingFileName;
    }
    public void setExistingFileName(String existingFileName) {
        this.existingFileName = existingFileName;
    }
}

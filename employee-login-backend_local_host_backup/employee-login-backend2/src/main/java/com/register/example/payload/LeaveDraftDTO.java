package com.register.example.payload;

import com.register.example.entity.LeaveDraft;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class LeaveDraftDTO {
    private Long id;
    private String employeeId;
    private String reason;
    private String fileName;
    private boolean hasFile;
    private String type;
    private String startDate;
    private String endDate;

    public LeaveDraftDTO(LeaveDraft draft) {
        this.id = draft.getId();
        this.employeeId = draft.getEmployeeId();
        this.reason = draft.getReason();
        this.fileName = draft.getFileName();
        this.hasFile = draft.getDocument() != null;
        this.type = draft.getType();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        if (draft.getStartDate() != null) {
            this.startDate = draft.getStartDate().format(formatter);
        } else {
            this.startDate = null;
        }
        if (draft.getEndDate() != null) {
            this.endDate = draft.getEndDate().format(formatter);
        } else {
            this.endDate = null;
        }
    }

    // Add a default constructor for deserialization
    public LeaveDraftDTO() {}

    // Add getters and setters for all fields
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public boolean isHasFile() { return hasFile; }
    public void setHasFile(boolean hasFile) { this.hasFile = hasFile; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    
    // ✅ NEW: Method to convert DTO to Entity
    public LeaveDraft toEntity() {
        LeaveDraft draft = new LeaveDraft();
        draft.setId(this.id);
        draft.setEmployeeId(this.employeeId);
        draft.setReason(this.reason);
        draft.setFileName(this.fileName);
        draft.setType(this.type);
        if (this.startDate != null) {
            draft.setStartDate(LocalDate.parse(this.startDate));
        }
        if (this.endDate != null) {
            draft.setEndDate(LocalDate.parse(this.endDate));
        }
        return draft;
    }
}

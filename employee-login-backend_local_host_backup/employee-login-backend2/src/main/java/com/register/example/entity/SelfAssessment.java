
package com.register.example.entity;
 
import jakarta.persistence.*;
 
@Entity
@Table(name = "self_assessment", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employeeId", "goalId"}) // ✅ Prevent duplicates
})
public class SelfAssessment {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    private String employeeId;
    private Long goalId; // ✅ Add this field
 
    private String title;
    private String description;
    private String weightage;
    private String target;
    private String selfRating;
    private String selfAssessment;
 
    // === Getters and Setters ===
 
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
 
    public Long getGoalId() {
        return goalId;
    }
 
    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }
 
    public String getTitle() {
        return title;
    }
 
    public void setTitle(String title) {
        this.title = title;
    }
 
    public String getDescription() {
        return description;
    }
 
    public void setDescription(String description) {
        this.description = description;
    }
 
    public String getWeightage() {
        return weightage;
    }
 
    public void setWeightage(String weightage) {
        this.weightage = weightage;
    }
 
    public String getTarget() {
        return target;
    }
 
    public void setTarget(String target) {
        this.target = target;
    }
 
    public String getSelfRating() {
        return selfRating;
    }
 
    public void setSelfRating(String selfRating) {
        this.selfRating = selfRating;
    }
 
    public String getSelfAssessment() {
        return selfAssessment;
    }
 
    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }
}
 

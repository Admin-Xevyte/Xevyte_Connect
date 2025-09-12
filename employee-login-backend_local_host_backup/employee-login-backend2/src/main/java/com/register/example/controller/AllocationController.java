package com.register.example.controller;

import com.register.example.entity.Allocation;
import com.register.example.entity.Employee;
import com.register.example.entity.Project;
import com.register.example.payload.AllocationCreateRequest;
import com.register.example.payload.AllocationBulkRequest;
import com.register.example.repository.AllocationRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ProjectRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/allocations")
public class AllocationController {

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProjectRepository projectRepository;

    // ✅ Get all allocations for a given project
    @GetMapping("/project/{projectId}")
    public List<Allocation> getAllocationsByProject(@PathVariable Long projectId) {
        return allocationRepository.findByProjectProjectId(projectId);
    }

    // ✅ Single allocation
    @PostMapping
    public Allocation createAllocation(@RequestBody AllocationCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + request.getProjectId()));

        if (request.getEmployeeId() == null || request.getEmployeeId().isEmpty()) {
            throw new RuntimeException("Employee ID must not be null or empty");
        }

        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));

        // Update employee's assigned fields from project
        employee.setAssignedManagerId(project.getManager());
        employee.setAssignedHrId(project.getHr());
        employee.setAssignedFinanceId(project.getFinance());
        employee.setReviewerId(project.getReviewer());
        employee.setAssignedAdminId(project.getAdmin());

        employeeRepository.save(employee);

        Allocation allocation = new Allocation();
        allocation.setProject(project);
        allocation.setEmployeeId(request.getEmployeeId());
        allocation.setStartDate(request.getStartDate());
        allocation.setEndDate(request.getEndDate());

        return allocationRepository.save(allocation);
    }

    // ✅ Bulk allocation
    @PostMapping("/bulk")
    public ResponseEntity<?> createBulkAllocations(@RequestBody AllocationBulkRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + request.getProjectId()));

        if (request.getEmployeeIds() == null || request.getEmployeeIds().isEmpty()) {
            return ResponseEntity.badRequest().body("Employee ID list must not be empty");
        }

        List<Allocation> savedAllocations = new ArrayList<>();
        List<String> failedAllocations = new ArrayList<>();

        for (String empId : request.getEmployeeIds()) {
            try {
                Employee employee = employeeRepository.findByEmployeeId(empId)
                        .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + empId));

                // Update employee assignments from project
                employee.setAssignedManagerId(project.getManager());
                employee.setAssignedHrId(project.getHr());
                employee.setAssignedFinanceId(project.getFinance());
                employee.setReviewerId(project.getReviewer());
                employee.setAssignedAdminId(project.getAdmin());
                employeeRepository.save(employee);

                Allocation allocation = new Allocation();
                allocation.setProject(project);
                allocation.setEmployeeId(empId);
                allocation.setStartDate(request.getStartDate());
                allocation.setEndDate(request.getEndDate());

                savedAllocations.add(allocationRepository.save(allocation));
            } catch (Exception e) {
                failedAllocations.add(empId);
                System.err.println("Failed to allocate employee " + empId + ": " + e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("successfulAllocations", savedAllocations);
        response.put("failedEmployeeIds", failedAllocations);
        response.put("message", failedAllocations.isEmpty()
                ? "All employees allocated successfully"
                : "Some allocations failed");

        return ResponseEntity.ok(response);
    }
}

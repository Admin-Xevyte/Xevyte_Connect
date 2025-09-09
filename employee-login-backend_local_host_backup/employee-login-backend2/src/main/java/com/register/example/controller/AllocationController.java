package com.register.example.controller;

import com.register.example.entity.Allocation;
import com.register.example.entity.Project;
import com.register.example.payload.AllocationCreateRequest;
import com.register.example.repository.AllocationRepository;
import com.register.example.repository.ProjectRepository;
import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/allocations")

public class AllocationController {

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProjectRepository projectRepository;

    // Get all allocations for a given project
    @GetMapping("/project/{projectId}")
    public List<Allocation> getAllocationsByProject(@PathVariable Long projectId) {
        return allocationRepository.findByProjectProjectId(projectId);
    }

    @PostMapping
    public Allocation createAllocation(@RequestBody AllocationCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + request.getProjectId()));

        if (request.getEmployeeId() == null || request.getEmployeeId().isEmpty()) {
            throw new RuntimeException("Employee ID must not be null or empty");
        }

        // Fetch Employee by employeeId (not the DB primary key 'id')
        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));

        // Update employee's assigned fields from project
        employee.setAssignedManagerId(project.getManager());
        employee.setAssignedHrId(project.getHr());
        employee.setAssignedFinanceId(project.getFinance());
        employee.setReviewerId(project.getReviewer());
        employee.setAssignedAdminId(project.getAdmin());

        employeeRepository.save(employee); // Save updated employee

        Allocation allocation = new Allocation();
        allocation.setProject(project);
        allocation.setEmployeeId(request.getEmployeeId());
        allocation.setStartDate(request.getStartDate());
        allocation.setEndDate(request.getEndDate());

        return allocationRepository.save(allocation);
    }


}

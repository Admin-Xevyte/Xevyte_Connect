package com.register.example.controller;

import com.register.example.entity.Project;
import com.register.example.entity.Sow;
import com.register.example.payload.ProjectCreateRequest;
import com.register.example.repository.ProjectRepository;
import com.register.example.repository.SowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private SowRepository sowRepository;

    // Get all projects by SOW ID
    @GetMapping("/sow/{sowId}")
    public List<Project> getProjectsBySowId(@PathVariable Long sowId) {
        return projectRepository.findBySowSowId(sowId);
    }

    // Create a new project
    @PostMapping
    public Project createProject(@RequestBody ProjectCreateRequest request) {
        Sow sow = sowRepository.findById(request.getSowId())
                .orElseThrow(() -> new ResourceNotFoundException("SOW not found with ID: " + request.getSowId()));

        Project project = new Project();
        project.setSow(sow);
        project.setProjectStartDate(request.getProjectStartDate());
        project.setProjectEndDate(request.getProjectEndDate());
        project.setTotalEffort(request.getTotalEffort());
        project.setTotalCost(request.getTotalCost());
        project.setManager(request.getManager());
        project.setReviewer(request.getReviewer());
        project.setHr(request.getHr());
        project.setFinance(request.getFinance()); // new field
        project.setAdmin(request.getAdmin());   // new field

        return projectRepository.save(project);
    }

    // Get all projects by Customer ID (optimized)
    @GetMapping("/customer/{customerId}/all-projects")
    public List<Project> getAllProjectsByCustomer(@PathVariable Long customerId) {
        List<Sow> sows = sowRepository.findByCustomerCustomerId(customerId);

        if (sows == null || sows.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> sowIds = sows.stream().map(Sow::getSowId).collect(Collectors.toList());

        return projectRepository.findBySowSowIdIn(sowIds);
    }

    // Exception class for resource not found
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}

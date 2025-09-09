package com.register.example.repository;

import com.register.example.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AllocationRepository extends JpaRepository<Allocation, Long> {

    // Find all allocations by project id
    List<Allocation> findByProjectProjectId(Long projectId);
    

    // Optional: find by projectId and employeeId, if needed
    // List<Allocation> findByProjectProjectIdAndEmployeeId(Long projectId, Long employeeId);
}

package com.register.example.repository;

import com.register.example.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Find projects by a single SOW ID
    List<Project> findBySowSowId(Long sowId);

    // Find projects by multiple SOW IDs
    List<Project> findBySowSowIdIn(List<Long> sowIds);
}

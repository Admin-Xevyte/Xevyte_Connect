package com.register.example.repository;

import com.register.example.entity.Sow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SowRepository extends JpaRepository<Sow, Long> {
    List<Sow> findByCustomerCustomerId(Long customerId);
}

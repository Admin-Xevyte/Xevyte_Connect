package com.register.example.controller;

import com.register.example.entity.Customer;
import com.register.example.entity.Sow;
import com.register.example.payload.SowCreateRequest;
import com.register.example.repository.CustomerRepository;
import com.register.example.repository.SowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sows")
public class SowController {

    @Autowired
    private SowRepository sowRepository;

    @Autowired
    private CustomerRepository customerRepository;

    // ✅ Get all SOWs by Customer ID
    @GetMapping("/customer/{customerId}")
    public List<Sow> getSowsByCustomer(@PathVariable Long customerId) {
        return sowRepository.findByCustomerCustomerId(customerId);
    }

    // ✅ Add new SOW using DTO
    @PostMapping
    public Sow createSow(@RequestBody SowCreateRequest sowRequest) {
        if (sowRequest.getCustomerId() == null) {
            throw new IllegalArgumentException("Customer ID must be provided");
        }

        Customer customer = customerRepository.findById(sowRequest.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + sowRequest.getCustomerId()));

        Sow sow = new Sow();
        sow.setSowName(sowRequest.getSowName()); // ✅ Set SOW name
        sow.setSowStartDate(sowRequest.getSowStartDate());
        sow.setSowEndDate(sowRequest.getSowEndDate());
        sow.setTotalEffort(sowRequest.getTotalEffort());
        sow.setTotalCost(sowRequest.getTotalCost());
        sow.setCustomer(customer);

        return sowRepository.save(sow);
    }
    @GetMapping
    public List<Sow> getAllSows() {
        return sowRepository.findAll();
    }

}

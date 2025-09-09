package com.register.example.controller;

import com.register.example.entity.Customer;
import com.register.example.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    // Get all customers
    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    // Create a new customer with file upload (stored in DB)
    @PostMapping
    public ResponseEntity<?> createCustomer(
            @RequestParam("customerName") String customerName,
            @RequestParam("msaDoc") MultipartFile msaDoc,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {

        try {
            String originalFilename = msaDoc.getOriginalFilename();

            Customer customer = new Customer();
            customer.setCustomerName(customerName);
            customer.setMsaDocName(originalFilename);
            customer.setMsaDocBlob(msaDoc.getBytes()); // BLOB here
            customer.setStartDate(LocalDate.parse(startDate));
            customer.setEndDate(LocalDate.parse(endDate));

            Customer savedCustomer = customerRepository.save(customer);

            return ResponseEntity.ok(savedCustomer);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Download MSA document from DB
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadMSA(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (customer.getMsaDocBlob() == null || customer.getMsaDocBlob().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Resource resource = new ByteArrayResource(customer.getMsaDocBlob());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + customer.getMsaDocName() + "\"")
                .body(resource);
    }

    // Get customer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id)
                .map(customer -> ResponseEntity.ok(customer))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}

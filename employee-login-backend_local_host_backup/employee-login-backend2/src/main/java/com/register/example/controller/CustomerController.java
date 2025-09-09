package com.register.example.controller;

import com.register.example.entity.Customer;
import com.register.example.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
// React frontend
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    private final String uploadDir = "uploads/msa_docs/"; // Folder to store uploaded files

    // Get all customers
    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    // Create a new customer with file upload
    @PostMapping
    public ResponseEntity<?> createCustomer(
            @RequestParam("customerName") String customerName,
            @RequestParam("msaDoc") MultipartFile msaDoc,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {

        try {
            // Validate and clean filename
            String originalFilename = StringUtils.cleanPath(msaDoc.getOriginalFilename());

            // Create directory if not exists
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save file locally
            Path filePath = uploadPath.resolve(originalFilename);
            Files.copy(msaDoc.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create and save customer entity
            Customer customer = new Customer();
            customer.setCustomerName(customerName);
            customer.setMsaDoc(originalFilename);
            customer.setStartDate(LocalDate.parse(startDate));
            customer.setEndDate(LocalDate.parse(endDate));

            Customer savedCustomer = customerRepository.save(customer);

            return ResponseEntity.ok(savedCustomer);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Could not upload the file: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }

    // Download MSA document
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadMSA(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        Path filePath = Paths.get(uploadDir).resolve(customer.getMsaDoc()).normalize();
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new RuntimeException("File not found " + customer.getMsaDoc());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error reading file " + customer.getMsaDoc(), e);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id)
            .map(customer -> ResponseEntity.ok(customer))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

}

package com.register.example.controller;

import com.register.example.entity.Customer;
import com.register.example.entity.Sow;
import com.register.example.repository.CustomerRepository;
import com.register.example.repository.SowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sows")
public class SowController {

    @Autowired
    private SowRepository sowRepository;

    @Autowired
    private CustomerRepository customerRepository;

    // ✅ Get all SOWs
    @GetMapping
    public List<Sow> getAllSows() {
        return sowRepository.findAll();
    }

    // ✅ Get all SOWs by Customer ID
    @GetMapping("/customer/{customerId}")
    public List<Sow> getSowsByCustomer(@PathVariable Long customerId) {
        return sowRepository.findByCustomerCustomerId(customerId);
    }

    // ✅ Add new SOW with file upload
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createSowWithDocument(
            @RequestParam("sowName") String sowName,
            @RequestParam("sowStartDate") String sowStartDate,
            @RequestParam("sowEndDate") String sowEndDate,
            @RequestParam("totalEffort") int totalEffort,
            @RequestParam("totalCost") double totalCost,
            @RequestParam("customerId") Long customerId,
            @RequestParam("sowDoc") MultipartFile sowDoc
    ) {
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

            Sow sow = new Sow();
            sow.setSowName(sowName);
            sow.setSowStartDate(LocalDate.parse(sowStartDate));
            sow.setSowEndDate(LocalDate.parse(sowEndDate));
            sow.setTotalEffort(totalEffort);
            sow.setTotalCost(totalCost);
            sow.setCustomer(customer);

            if (!sowDoc.isEmpty()) {
                sow.setSowDocName(sowDoc.getOriginalFilename());
                sow.setSowDocBlob(sowDoc.getBytes());
            }

            Sow savedSow = sowRepository.save(sow);
            return ResponseEntity.ok(savedSow);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating SOW: " + e.getMessage());
        }
    }

    // ✅ Download SOW Document
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadSowDocument(@PathVariable Long id) {
        Sow sow = sowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SOW not found with id: " + id));

        if (sow.getSowDocBlob() == null || sow.getSowDocBlob().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Resource resource = new ByteArrayResource(sow.getSowDocBlob());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + sow.getSowDocName() + "\"")
                .body(resource);
    }
}

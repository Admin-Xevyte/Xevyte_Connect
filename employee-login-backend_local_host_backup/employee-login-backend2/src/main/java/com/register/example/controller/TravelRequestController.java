package com.register.example.controller;
 
import com.register.example.entity.TravelDocument;
import com.register.example.entity.TravelRequest;
import com.register.example.exception.ResourceNotFoundException;
import com.register.example.service.TravelRequestService;
 
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
 
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
import java.util.List;
import java.util.Optional;
 
@RestController
@RequestMapping("/api/travel")

public class TravelRequestController {
 
    private final TravelRequestService travelRequestService;
 
    public TravelRequestController(TravelRequestService travelRequestService) {
        this.travelRequestService = travelRequestService;
    }
 
    // ===== ADMIN: Upload multiple files =====
    @PostMapping("/admin/upload-pdfs/{requestId}")
    public ResponseEntity<String> uploadMultipleFiles(
            @PathVariable Long requestId,
            @RequestParam("files") MultipartFile[] files) {
        try {
            // Check if the total size exceeds the limit
            long totalSize = 0;
            for (MultipartFile file : files) {
                totalSize += file.getSize();
            }
            final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
            if (totalSize > MAX_FILE_SIZE) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body("Total file size exceeds the 5MB limit. Please select smaller files.");
            }
 
            travelRequestService.uploadAdminPdfs(requestId, files);
            return ResponseEntity.ok("Files uploaded successfully.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) { // <-- Catch the specific exception
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage()); // <-- Return the clear message
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred: " + e.getMessage()); // <-- General catch-all
        }
    }
    @GetMapping("/documents/{requestId}")
    public ResponseEntity<List<TravelDocument>> getDocumentsByRequestId(@PathVariable Long requestId) {
        List<TravelDocument> documents = travelRequestService.getDocumentsByRequestId(requestId);
        return ResponseEntity.ok(documents); // ✅ Always returns JSON (empty list if none)
    }
 
    @GetMapping("/download-document/{documentId}")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long documentId) {
        Optional<TravelDocument> documentOpt = travelRequestService.getDocumentById(documentId);
 
        if (documentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
 
        TravelDocument document = documentOpt.get();
 
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                // Force browser to treat as generic binary instead of PDF
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(document.getData());
    }
 
    // ===== CREATE travel request =====
    @PostMapping("/create")
    public ResponseEntity<TravelRequest> createRequest(@RequestBody TravelRequest request) {
        TravelRequest created = travelRequestService.createTravelRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
 
    // ===== MANAGER Endpoints =====
    @GetMapping("/manager/all/{managerId}")
    public ResponseEntity<List<TravelRequest>> getAllRequestsForManager(@PathVariable String managerId) {
        return ResponseEntity.ok(travelRequestService.getAllRequestsForManager(managerId));
    }
 
    @GetMapping("/manager/pending/{managerId}")
    public ResponseEntity<List<TravelRequest>> getPendingForManager(@PathVariable String managerId) {
        return ResponseEntity.ok(travelRequestService.getPendingRequestsForManager(managerId));
    }
 
    @PutMapping("/approve/{id}")
    public ResponseEntity<TravelRequest> approveRequest(
            @PathVariable Long id,
            @RequestParam String managerId,
            @RequestParam(required = false, defaultValue = "") String remarks) {
        TravelRequest updated = travelRequestService.approveRequest(id, managerId, remarks);
        return ResponseEntity.ok(updated);
    }
 
    @PutMapping("/reject/{id}")
    public ResponseEntity<String> rejectRequest(
            @PathVariable Long id,
            @RequestParam String managerId,
            @RequestParam(required = false, defaultValue = "") String rejectedReason) {
 
        if (rejectedReason == null || rejectedReason.trim().length() < 10) {
            return ResponseEntity.badRequest().body("Rejection reason must be at least 10 characters long.");
        }
 
        try {
            travelRequestService.rejectRequest(id, managerId, rejectedReason.trim());
            return ResponseEntity.ok("Travel request rejected successfully.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error rejecting request: " + e.getMessage());
        }
    }
 
    // ===== ADMIN: Assigned requests =====
    @GetMapping("/admin/assigned-requests/{adminId}")
    public ResponseEntity<List<TravelRequest>> getRequestsAssignedToAdmin(@PathVariable String adminId) {
        return ResponseEntity.ok(travelRequestService.getRequestsAssignedToAdmin(adminId));
    }
 
    // ===== EMPLOYEE: Travel requests =====
    @GetMapping("/employee/all/{employeeId}")
    public ResponseEntity<List<TravelRequest>> getAllRequestsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(travelRequestService.getRequestsByEmployee(employeeId));
    }
 
    @GetMapping("/employee/active/{employeeId}")
    public ResponseEntity<List<TravelRequest>> getActiveRequestsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(travelRequestService.getActiveRequestsForEmployee(employeeId));
    }
// ===== MARK AS DOWNLOADED =====
    @PutMapping("/mark-downloaded/{requestId}")
    public ResponseEntity<String> markAsDownloaded(@PathVariable Long requestId) {
        try {
            travelRequestService.markAsDownloaded(requestId);
            return ResponseEntity.ok("Travel request marked as downloaded.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error marking as downloaded: " + e.getMessage());
        }
    }
 
}
 
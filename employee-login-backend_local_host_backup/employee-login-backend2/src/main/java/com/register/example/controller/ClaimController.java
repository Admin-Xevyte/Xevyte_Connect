package com.register.example.controller;
 
import com.register.example.entity.Claim;
import com.register.example.entity.ClaimDraft;
import com.register.example.service.ClaimService;
import com.register.example.service.ClaimDraftService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.register.example.service.EmployeeService;
import com.register.example.entity.Employee;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
 
 
@RestController
@RequestMapping("/claims")
public class ClaimController {
 
    @Autowired
    private ClaimService claimService;
 
    @Autowired
    private ClaimDraftService claimDraftService;
 
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private EmployeeService employeeService;
 
    // --- Existing Endpoints ---
 
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitClaim(
            @RequestPart("claim") String claimJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            Claim claim = objectMapper.readValue(claimJson, Claim.class);
            Claim savedClaim = claimService.submitClaimWithReceipt(claim, receiptFile);
            return ResponseEntity.ok(savedClaim);
        } catch (IllegalArgumentException | IOException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error submitting claim: " + e.getMessage());
        }
    }
 
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Claim>> getClaimsForManager(@PathVariable String managerId) {
        List<Claim> claims = claimService.getClaimsForManager(managerId);
        return ResponseEntity.ok(claims);
    }
    
    @GetMapping("/finance/{financeId}")
    public ResponseEntity<List<Claim>> getClaimsForFinance(@PathVariable String financeId) {
        List<Claim> claims = claimService.getClaimsForFinance(financeId);
        return ResponseEntity.ok(claims);
    }
    
 
    @GetMapping("/hr/{hrId}")
    public ResponseEntity<List<Claim>> getClaimsByHrId(@PathVariable String hrId) {
        // The service layer must call the repository method with the correct path variable
        List<Claim> claims = claimService.getClaimsByHrId(hrId);
        return ResponseEntity.ok(claims);
    }
    
    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approveClaim(@PathVariable Long id, @RequestParam String role) {
        String result = claimService.approveClaim(id, role);
        return ResponseEntity.ok(result);
    }
 
    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectClaim(
            @PathVariable Long id,   
            @RequestParam String role,
            @RequestParam String reason) {
        String result = claimService.rejectClaim(id, role, reason);
        return ResponseEntity.ok(result);
    }
 
    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<Claim>> getHistory(@PathVariable String employeeId) {
        List<Claim> claims = claimService.getClaimHistoryByEmployee(employeeId);
        return ResponseEntity.ok(claims);
    }
 
    @PutMapping("/hr/update-status/{id}")
    public ResponseEntity<String> updateHRStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        String result = claimService.updateHRStatus(id, status);
        return ResponseEntity.ok(result);
    }
   
    @GetMapping("/summary/{employeeId}")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable String employeeId) {
        Map<String, Object> summary = claimService.getClaimSummaryByEmployeeId(employeeId);
        return ResponseEntity.ok(summary);
    }
    
    // Updated /receipt endpoint to use the reusable method with a disposition parameter
    @GetMapping("/receipt/{id}")
    public ResponseEntity<byte[]> getClaimReceipt(@PathVariable Long id,
                                                  @RequestParam(value = "disposition", defaultValue = "inline") String disposition) {
        Claim claim = claimService.findById(id);
        if (claim != null) {
            return createReceiptResponse(claim.getReceipt(), claim.getReceiptName(), disposition);
        }
        return ResponseEntity.notFound().build();
    }
    
    // Updated /draft/receipt endpoint to use the reusable method with a disposition parameter
    @GetMapping("/draft/receipt/{draftId}")
    public ResponseEntity<byte[]> getDraftReceipt(@PathVariable Long draftId,
                                                  @RequestParam(value = "disposition", defaultValue = "inline") String disposition) {
        Optional<ClaimDraft> draftClaimOptional = claimDraftService.getDraftById(draftId);
    
        if (draftClaimOptional.isPresent()) {
            ClaimDraft draft = draftClaimOptional.get();
            return createReceiptResponse(draft.getReceipt(), draft.getReceiptName(), disposition);
        }
        return ResponseEntity.notFound().build();
    }
 
    // --- Drafts Endpoints ---
 
    @PostMapping(value = "/draft", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> saveDraft(
            @RequestPart("claimDraft") String claimDraftJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            ClaimDraft draftDto = objectMapper.readValue(claimDraftJson, ClaimDraft.class);
            ClaimDraft savedDraft = claimDraftService.saveClaimDraft(draftDto, receiptFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDraft);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving draft: " + e.getMessage());
        }
    }
    
    @PutMapping(value = "/draft/{draftId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDraft(
            @PathVariable Long draftId,
            @RequestPart("claimDraft") String claimDraftJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            ClaimDraft draftDto = objectMapper.readValue(claimDraftJson, ClaimDraft.class);
 
            if (!draftId.equals(draftDto.getExpenseId())) {
                return ResponseEntity.badRequest().body("ID in path does not match ID in payload.");
            }
 
            ClaimDraft updatedDraft = claimDraftService.updateClaimDraft(draftDto, receiptFile);
            return ResponseEntity.ok(updatedDraft);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating draft: " + e.getMessage());
        }
    }
 
    @GetMapping("/draft/{draftId}")
    public ResponseEntity<ClaimDraft> getDraftForEdit(@PathVariable Long draftId) {
        Optional<ClaimDraft> draftClaimOptional = claimDraftService.getDraftById(draftId);
        return draftClaimOptional.map(claimDraft -> new ResponseEntity<>(claimDraft, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
 
    @GetMapping("/drafts/{employeeId}")
    public ResponseEntity<List<ClaimDraft>> getEmployeeDrafts(@PathVariable String employeeId) {
        List<ClaimDraft> drafts = claimDraftService.getDrafts(employeeId);
        return ResponseEntity.ok(drafts);
    }
    
    @PostMapping("/submit-draft/{draftId}")
    public ResponseEntity<Claim> submitDraftFromDraft(@PathVariable Long draftId) {
        try {
            Claim submittedClaim = claimService.submitDraft(draftId);
            return new ResponseEntity<>(submittedClaim, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }
 
    @DeleteMapping("/draft/delete/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        claimDraftService.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping(value = "/submit-draft/{draftId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitUpdatedDraft(
            @PathVariable Long draftId,
            @RequestPart("claim") String claimJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            // Deserialize the claim JSON string into a Claim object
            Claim claim = objectMapper.readValue(claimJson, Claim.class);
            
            // This service method will now handle both updating the draft and submitting it.
            // It will update the data first, then change its status from 'draft' to 'pending'.
            Claim submittedClaim = claimService.submitUpdatedDraft(draftId, claim, receiptFile);
            
            // Return the newly created claim and a status of CREATED
            return new ResponseEntity<>(submittedClaim, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error submitting updated draft: " + e.getMessage());
        }
    }
 
    // Reusable method to create a ResponseEntity for a receipt, now with disposition control
    private ResponseEntity<byte[]> createReceiptResponse(byte[] receiptData, String receiptName, String disposition) {
        if (receiptData == null || receiptName == null) {
            return ResponseEntity.notFound().build();
        }
 
        String fileExtension = "";
        int dotIndex = receiptName.lastIndexOf('.');
        if (dotIndex > 0) {
            fileExtension = receiptName.substring(dotIndex + 1).toLowerCase();
        }
 
        MediaType contentType;
        switch (fileExtension) {
            case "jpg":
            case "jpeg":
                contentType = MediaType.IMAGE_JPEG;
                break;
            case "png":
                contentType = MediaType.IMAGE_PNG;
                break;
            case "pdf":
                contentType = MediaType.APPLICATION_PDF;
                break;
            default:
                contentType = MediaType.APPLICATION_OCTET_STREAM;
                break;
        }
 
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(contentType);
        headers.add(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + receiptName + "\"");
 
        return new ResponseEntity<>(receiptData, headers, HttpStatus.OK);
    }
    @GetMapping("/assigned-ids/{employeeId}")
    public ResponseEntity<Map<String, Boolean>> getAssignedIds(@PathVariable String employeeId) {
        List<Employee> allEmployees = employeeService.getAllEmployees();

        boolean isManager = allEmployees.stream().anyMatch(emp -> employeeId.equals(emp.getAssignedManagerId()));
        boolean isFinance = allEmployees.stream().anyMatch(emp -> employeeId.equals(emp.getAssignedFinanceId()));
        boolean isHr = allEmployees.stream().anyMatch(emp -> employeeId.equals(emp.getAssignedHrId()));

        Employee self = allEmployees.stream()
                .filter(emp -> employeeId.equals(emp.getEmployeeId()))
                .findFirst()
                .orElse(null);

        if (self != null) {
            if (employeeId.equals(self.getAssignedManagerId())) isManager = true;
            if (employeeId.equals(self.getAssignedFinanceId())) isFinance = true;
            if (employeeId.equals(self.getAssignedHrId())) isHr = true;
        }

        boolean canViewTasks = isManager || isFinance || isHr;

        return ResponseEntity.ok(Map.of(
            "manager", isManager,
            "finance", isFinance,
            "hr", isHr,
            "canViewTasks", canViewTasks
        ));
    }


}

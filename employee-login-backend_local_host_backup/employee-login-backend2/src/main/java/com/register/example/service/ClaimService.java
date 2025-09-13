package com.register.example.service;
 
import com.register.example.entity.Claim;
import com.register.example.entity.Employee;
import com.register.example.entity.Notification;
import com.register.example.entity.ClaimHistory;
import com.register.example.entity.ClaimDraft;
import com.register.example.repository.ClaimRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ClaimHistoryRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.repository.ClaimDraftRepository; // ADD THIS
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
import java.io.IOException;
import java.util.*;
 
@Service
public class ClaimService {
 
    @Autowired
    private ClaimRepository claimRepository;
 
    @Autowired
    private NotificationRepository notificationRepository;
 
    @Autowired
    private ClaimHistoryRepository claimHistoryRepository;
 
    @Autowired
    private EmployeeRepository employeeRepository;
 
    @Autowired
    private ClaimDraftService claimDraftService;
 
    @Autowired
    private ClaimDraftRepository claimDraftRepository; // ADD THIS
 
    // Existing method to submit a new claim
    public Claim submitClaimWithReceipt(Claim claim, MultipartFile receiptFile) throws IOException {
        if (receiptFile != null && !receiptFile.isEmpty()) {
            if (receiptFile.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Receipt file size exceeds 5MB limit");
            }
            claim.setReceipt(receiptFile.getBytes());
            claim.setReceiptName(receiptFile.getOriginalFilename());
        }
 
        claim.setStatus("Pending");
        claim.setNextApprover("Manager");
        claim.setSubmittedDate(new Date());
 
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(claim.getEmployeeId());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            claim.setAssignedManagerId(emp.getAssignedManagerId());
            claim.setAssignedFinanceId(emp.getAssignedFinanceId());
            claim.setAssignedHrId(emp.getAssignedHrId());
            claim.setName(emp.getName());
        }
 
        return claimRepository.save(claim);
    }
    
    // Original submitDraft method: remains for a draft submission without updates
    @Transactional
    public Claim submitDraft(Long draftId) {
        Optional<ClaimDraft> draftOptional = claimDraftService.getDraftById(draftId);
 
        if (draftOptional.isPresent()) {
            ClaimDraft draft = draftOptional.get();
            Claim finalClaim = new Claim();
            finalClaim.setEmployeeId(draft.getEmployeeId());
            finalClaim.setName(draft.getName());
            finalClaim.setExpenseDescription(draft.getExpenseDescription());
            finalClaim.setCategory(draft.getCategory());
            finalClaim.setAmount(draft.getAmount());
            finalClaim.setExpenseDate(draft.getExpenseDate());
            finalClaim.setBusinessPurpose(draft.getBusinessPurpose());
            finalClaim.setAdditionalNotes(draft.getAdditionalNotes());
            finalClaim.setReceipt(draft.getReceipt());
            finalClaim.setReceiptName(draft.getReceiptName());
            finalClaim.setStatus("Pending");
            finalClaim.setNextApprover("Manager");
            finalClaim.setSubmittedDate(new Date());
 
            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(finalClaim.getEmployeeId());
            if (empOpt.isPresent()) {
                Employee emp = empOpt.get();
                finalClaim.setAssignedManagerId(emp.getAssignedManagerId());
                finalClaim.setAssignedFinanceId(emp.getAssignedFinanceId());
                finalClaim.setAssignedHrId(emp.getAssignedHrId());
                finalClaim.setName(emp.getName());
            }
 
            Claim savedClaim = claimRepository.save(finalClaim);
            claimDraftService.deleteDraft(draftId);
            
            sendNotification(savedClaim.getAssignedManagerId(), "A new claim has been submitted for your approval.");
 
            return savedClaim;
        } else {
            throw new RuntimeException("Claim draft not found with ID: " + draftId);
        }
    }
    
    // NEW METHOD TO HANDLE UPDATING A DRAFT AND THEN SUBMITTING IT
    @Transactional
public Claim submitUpdatedDraft(Long draftId, Claim updatedClaimData, MultipartFile receiptFile) throws IOException {
    // 1. Find the existing draft by ID
    ClaimDraft draft = claimDraftRepository.findById(draftId)
            .orElseThrow(() -> new RuntimeException("Draft not found with id: " + draftId));
 
    // 2. Handle the receipt file: If a new file is uploaded, update it
    // We do this first so we can attach it to the new Claim object below
    byte[] receiptBytes = draft.getReceipt();
    String receiptName = draft.getReceiptName();
    
    if (receiptFile != null && !receiptFile.isEmpty()) {
        if (receiptFile.getSize() > 5 * 1024 * 1024) {
             throw new IllegalArgumentException("Receipt file size exceeds 5MB limit");
        }
        receiptBytes = receiptFile.getBytes();
        receiptName = receiptFile.getOriginalFilename();
    }
    
    // 3. Create a new Claim object directly from the updated data provided by the user
    Claim submittedClaim = new Claim();
    
    // Use data from the updatedClaimData object
    submittedClaim.setEmployeeId(draft.getEmployeeId()); // Get from draft as it's not in updatedClaimData
    submittedClaim.setName(draft.getName()); // Get from draft as it's not in updatedClaimData
    submittedClaim.setAmount(updatedClaimData.getAmount());
    submittedClaim.setCategory(updatedClaimData.getCategory());
    submittedClaim.setExpenseDescription(updatedClaimData.getExpenseDescription());
    submittedClaim.setExpenseDate(updatedClaimData.getExpenseDate());
    submittedClaim.setBusinessPurpose(updatedClaimData.getBusinessPurpose());
    submittedClaim.setAdditionalNotes(updatedClaimData.getAdditionalNotes());
    submittedClaim.setReceipt(receiptBytes);
    submittedClaim.setReceiptName(receiptName);
    
    // 4. Set the new claim's status and other submission details
    submittedClaim.setStatus("Pending");
    submittedClaim.setNextApprover("Manager");
    submittedClaim.setSubmittedDate(new Date());
 
    // 5. Set assigned approvers from the employee data
    Optional<Employee> empOpt = employeeRepository.findByEmployeeId(submittedClaim.getEmployeeId());
    if (empOpt.isPresent()) {
        Employee emp = empOpt.get();
        submittedClaim.setAssignedManagerId(emp.getAssignedManagerId());
        submittedClaim.setAssignedFinanceId(emp.getAssignedFinanceId());
        submittedClaim.setAssignedHrId(emp.getAssignedHrId());
        submittedClaim.setName(emp.getName());
    }
 
    // 6. Save the new claim
    Claim savedClaim = claimRepository.save(submittedClaim);
    
    // 7. Delete the original draft from the drafts table
    claimDraftRepository.delete(draft);
    
    sendNotification(savedClaim.getAssignedManagerId(), "A new claim has been submitted for your approval.");
 
    return savedClaim;
}
 
    // The rest of your existing ClaimService methods remain unchanged
    public List<Claim> getClaimsForManager(String managerId) {
        return claimRepository.findByAssignedManagerIdAndStatusAndNextApprover(managerId, "Pending", "Manager");
    }
    public List<Claim> getClaimsForFinance(String financeId) {
        return claimRepository.findByNextApproverAndAssignedFinanceId("Finance", financeId);
    }
    public List<Claim> getClaimsByHrId(String hrId) {
        return claimRepository.findByAssignedHrIdAndNextApproverAndStatusNot(hrId, "HR", "Paid");
    }
    public String approveClaim(Long id, String role) {
        Optional<Claim> optionalClaim = claimRepository.findById(id);
        if (!optionalClaim.isPresent()) return "Claim not found";
        Claim claim = optionalClaim.get();
        switch (role) {
            case "Manager":
                claim.setStatus("Pending");
                claim.setNextApprover("Finance");
                sendNotification(claim.getAssignedFinanceId(), "New claim needs approval.");
                break;
            case "Finance":
                claim.setStatus("Approved by Finance");
                claim.setNextApprover("HR");
                sendNotification(claim.getAssignedHrId(), "Claim ready for HR processing.");
                break;
            case "HR":
                claim.setStatus("Approved");
                claim.setNextApprover(null);
                break;
            default:
                return "Invalid role";
        }
        claimRepository.save(claim);
        return "Claim approved by " + role;
    }
    public String rejectClaim(Long id, String role, String reason) {
        Optional<Claim> optionalClaim = claimRepository.findById(id);
        if (!optionalClaim.isPresent()) return "Claim not found";
        Claim claim = optionalClaim.get();
        claim.setStatus("Rejected");
        claim.setNextApprover(null);
        claim.setRejectionReason(reason);
        claimRepository.save(claim);
        sendNotification(claim.getEmployeeId(), "Your claim has been rejected. Reason: " + reason);
        return "Claim rejected by " + role;
    }
    public List<Claim> getClaimHistoryByEmployee(String employeeId) {
        return claimRepository.findByEmployeeId(employeeId);
    }
    public String updateHRStatus(Long claimId, String status) {
        Claim claim = claimRepository.findById(claimId).orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus(status);
        if ("Paid".equalsIgnoreCase(status)) {
            claim.setNextApprover(null);
            ClaimHistory history = new ClaimHistory();
            history.setEmployeeId(claim.getEmployeeId());
            history.setAmount(claim.getAmount());
            history.setCategory(claim.getCategory());
            history.setDate(new Date());
            history.setStatus("Paid");
            claimHistoryRepository.save(history);
        }
        claimRepository.save(claim);
        return "Claim status updated to " + status;
    }
    public Map<String, Object> getClaimSummaryByEmployeeId(String employeeId) {
        List<Claim> claims = claimRepository.findByEmployeeId(employeeId);
        long totalClaims = claims.size();
        long approved = claims.stream()
                .filter(c -> "Paid".equalsIgnoreCase(c.getStatus()))
                .count();
        long rejected = claims.stream().filter(c -> c.getStatus().toLowerCase().contains("rejected")).count();
        double paidAmount = claims.stream().filter(c -> "Paid".equalsIgnoreCase(c.getStatus())).mapToDouble(Claim::getAmount).sum();
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClaims", totalClaims);
        summary.put("approved", approved);
        summary.put("rejected", rejected);
        summary.put("paidAmount", paidAmount);
        return summary;
    }
    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }
    public String markNotificationAsRead(Long id) {
        Optional<Notification> optionalNotification = notificationRepository.findById(id);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            notification.setRead(true);
            notificationRepository.save(notification);
            return "Notification marked as read.";
        }
        return "Notification not found.";
    }
    public void sendNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.isEmpty()) return;
        Notification notification = new Notification();
        notification.setEmployeeId(employeeId);
        notification.setMessage(message);
        notification.setTimestamp(new Date());
        notification.setRead(false);
        notificationRepository.save(notification);
    }
    public Claim findById(Long id) {
        return claimRepository.findById(id).orElse(null);
    }
}

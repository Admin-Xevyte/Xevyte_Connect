package com.register.example.service;
 
import com.register.example.entity.Employee;
import com.register.example.entity.TravelDocument;
import com.register.example.entity.TravelHistory;
import com.register.example.entity.TravelRequest;
import com.register.example.exception.ResourceNotFoundException;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TravelDocumentRepository;
import com.register.example.repository.TravelHistoryRepository;
import com.register.example.repository.TravelRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;
 
@Service
public class TravelRequestService {
 
    private final TravelRequestRepository requestRepository;
    private final TravelHistoryRepository historyRepository;
    private final EmployeeRepository employeeRepository;
    private final TravelDocumentRepository travelDocumentRepository;
 
    public TravelRequestService(TravelRequestRepository requestRepository,
                                TravelHistoryRepository historyRepository,
                                EmployeeRepository employeeRepository,
                                TravelDocumentRepository travelDocumentRepository) {
        this.requestRepository = requestRepository;
        this.historyRepository = historyRepository;
        this.employeeRepository = employeeRepository;
        this.travelDocumentRepository = travelDocumentRepository;
    }
 
    // ================== CREATE REQUEST ==================
    @Transactional
    public TravelRequest createTravelRequest(TravelRequest request) {
        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));
 
        String managerId = employee.getAssignedManagerId();
        String adminId = employee.getAssignedAdminId();
 
        if (managerId == null || managerId.isBlank()) {
            throw new IllegalArgumentException("Employee has no assigned manager. Travel request cannot be created.");
        }
        if (adminId == null || adminId.isBlank()) {
            throw new IllegalArgumentException("Employee has no assigned admin. Travel request cannot be created.");
        }
 
        request.setAssignedManagerId(managerId);
        request.setAssignedAdminId(adminId);
        request.setStatus("Pending For Approval");
 
        TravelRequest saved = requestRepository.save(request);
 
        TravelHistory h = new TravelHistory();
        h.setTravelRequestId(saved.getId());
        h.setEmployeeId(saved.getEmployeeId());
        h.setActionBy(saved.getEmployeeId());
        h.setAction("Created");
        h.setRemarks(request.getRemarks() != null && !request.getRemarks().isBlank() ? request.getRemarks() : "N/A");
 
        historyRepository.save(h);
 
        return saved;
    }
 
    // ================== APPROVE REQUEST ==================
    @Transactional
    public TravelRequest approveRequest(Long requestId, String managerId, String remarks) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
 
        req.setStatus("Booking In Progress");
        req.setUpdatedAt(new Date());
 
        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + req.getEmployeeId()));
 
        req.setAssignedAdminId(employee.getAssignedAdminId());
        requestRepository.save(req);
 
        TravelHistory h = new TravelHistory();
        h.setTravelRequestId(req.getId());
        h.setEmployeeId(req.getEmployeeId());
        h.setActionBy(managerId);
        h.setAction("Approved");
        h.setRemarks(remarks != null && !remarks.isBlank() ? remarks : "N/A");
        historyRepository.save(h);
 
        req.setEmployeeName(employee.getName());
        return req;
    }
 
    // ================== REJECT REQUEST ==================
    @Transactional
    public TravelRequest rejectRequest(Long requestId, String managerId, String rejectedReason) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
 
        req.setStatus("Rejected");
        req.setRejectedReason(rejectedReason);
        req.setUpdatedAt(new Date());
        requestRepository.save(req);
 
        TravelHistory h = new TravelHistory();
        h.setTravelRequestId(req.getId());
        h.setEmployeeId(req.getEmployeeId());
        h.setActionBy(managerId);
        h.setAction("Rejected");
        h.setRemarks(rejectedReason);
        h.setRejectedReason(rejectedReason);
        historyRepository.save(h);
 
        employeeRepository.findByEmployeeId(req.getEmployeeId())
                .ifPresent(emp -> req.setEmployeeName(emp.getName()));
 
        return req;
    }
 
    // ================== GET HISTORY ==================
    public List<TravelHistory> getHistoryForRequest(Long requestId) {
        requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
        return historyRepository.findByTravelRequestIdOrderByActionDateAsc(requestId);
    }
 
    // ================== POPULATE EMPLOYEE NAMES ==================
    private void populateEmployeeNames(List<TravelRequest> requests) {
        for (TravelRequest req : requests) {
            employeeRepository.findByEmployeeId(req.getEmployeeId())
                    .ifPresent(emp -> req.setEmployeeName(emp.getName()));
        }
    }
 
    // ================== GET REQUESTS ==================
    public List<TravelRequest> getRequestsByEmployee(String employeeId) {
        List<TravelRequest> requests = requestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        populateEmployeeNames(requests);
        return requests;
    }
 
    public List<TravelRequest> getActiveRequestsForEmployee(String employeeId) {
        List<String> activeStatuses = Arrays.asList("Pending For Approval", "Approved", "Booked", "Booking In Progress");
        List<TravelRequest> requests = requestRepository.findByEmployeeIdAndStatusInOrderByCreatedAtDesc(employeeId, activeStatuses);
        populateEmployeeNames(requests);
        return requests;
    }
 
    public List<TravelRequest> getPendingRequestsForManager(String managerId) {
        List<TravelRequest> requests = requestRepository.findByAssignedManagerIdAndStatus(managerId, "Pending For Approval");
        populateEmployeeNames(requests);
        return requests;
    }
 
    public List<TravelRequest> getAllRequestsForManager(String managerId) {
        List<TravelRequest> requests = requestRepository.findByAssignedManagerIdOrderByCreatedAtDesc(managerId);
        populateEmployeeNames(requests);
        return requests;
    }
 
    public List<TravelRequest> getRequestsAssignedToAdmin(String adminId) {
        List<TravelRequest> requests = requestRepository.findByStatusAndAssignedAdminId("Booking In Progress", adminId);
        populateEmployeeNames(requests);
        return requests;
    }
 
    // ================== EMPLOYEE UPLOAD RECEIPT ==================
    @Transactional
    public void uploadReceipt(Long requestId, MultipartFile file) throws Exception {
        TravelRequest travelRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
 
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }
 
        TravelDocument document = new TravelDocument();
        document.setTravelRequest(travelRequest);
        document.setFileName(file.getOriginalFilename());
        document.setContentType(file.getContentType());
        document.setData(file.getBytes());
 
        travelDocumentRepository.save(document);
 
        TravelHistory history = new TravelHistory();
        history.setTravelRequestId(travelRequest.getId());
        history.setEmployeeId(travelRequest.getEmployeeId());
        history.setActionBy(travelRequest.getEmployeeId());
        history.setAction("Receipt Uploaded");
        history.setRemarks("Uploaded: " + file.getOriginalFilename());
        historyRepository.save(history);
    }
    @Transactional
    public void uploadAdminPdfs(Long requestId, MultipartFile[] files) throws Exception {
        TravelRequest travelRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
        
        final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
 
        List<String> allowedTypes = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/png"
        );
 
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Cannot upload an empty file.");
            }
 
            if (!allowedTypes.contains(file.getContentType())) {
                throw new IllegalArgumentException(
                    "Invalid file type: " + file.getOriginalFilename() + ". Only PDF, JPG, JPEG, and PNG are allowed."
                );
            }
 
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("File " + file.getOriginalFilename() + " exceeds the 5MB limit.");
            }
 
            TravelDocument document = new TravelDocument();
            document.setTravelRequest(travelRequest);
            document.setFileName(file.getOriginalFilename());
            document.setContentType(file.getContentType());
            document.setData(file.getBytes());
 
            travelDocumentRepository.save(document);
        }
 
        if ("Booking In Progress".equalsIgnoreCase(travelRequest.getStatus())) {
            travelRequest.setStatus("Booked");
            travelRequest.setUpdatedAt(new Date());
            requestRepository.save(travelRequest);
        }
 
        TravelHistory history = new TravelHistory();
        history.setTravelRequestId(travelRequest.getId());
        history.setEmployeeId(travelRequest.getEmployeeId());
        history.setActionBy(travelRequest.getAssignedAdminId());
        history.setAction("Admin Files Uploaded");
        history.setRemarks("Uploaded " + files.length + " files");
        historyRepository.save(history);
    }
 
    // ================== DOCUMENT RETRIEVAL ==================
    public List<TravelDocument> getDocumentsByRequestId(Long requestId) {
        return travelDocumentRepository.findByTravelRequestId(requestId);
    }
 
    public Optional<TravelDocument> getDocumentById(Long documentId) {
        return travelDocumentRepository.findById(documentId);
    }
 
    // ================== GET REQUEST ==================
    public TravelRequest getTravelRequestById(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
    }
 
    // ================== STATUS UPDATE ==================
    @Transactional
    public void markAsDownloaded(Long requestId) {
        TravelRequest req = getTravelRequestById(requestId);
        req.setStatus("Downloaded");
        req.setUpdatedAt(new Date());
        requestRepository.save(req);
    }
    
}
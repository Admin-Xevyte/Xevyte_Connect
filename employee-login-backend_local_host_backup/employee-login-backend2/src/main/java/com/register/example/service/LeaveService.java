package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.Holiday;
import com.register.example.entity.LeaveBalance;
import com.register.example.entity.LeaveHistory;
import com.register.example.entity.LeaveRequest;
import com.register.example.entity.LeaveDraft;
import com.register.example.payload.LeaveActionDTO;
import com.register.example.payload.LeaveRequestDTO;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.HolidayRepository;
import com.register.example.repository.LeaveBalanceRepository;
import com.register.example.repository.LeaveHistoryRepository;
import com.register.example.repository.LeaveRequestRepository;
import com.register.example.repository.LeaveDraftRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDate;
import java.time.ZoneId;

import java.io.IOException;
import java.time.DayOfWeek;

import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveHistoryRepository leaveHistoryRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final HolidayRepository holidayRepository;
    private final LeaveDraftRepository leaveDraftRepository;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        LeaveHistoryRepository leaveHistoryRepository,
                        EmployeeRepository employeeRepository,
                        LeaveBalanceRepository leaveBalanceRepository,
                        HolidayRepository holidayRepository,
                        LeaveDraftRepository leaveDraftRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveHistoryRepository = leaveHistoryRepository;
        this.employeeRepository = employeeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.holidayRepository = holidayRepository;
        this.leaveDraftRepository = leaveDraftRepository;
    }

    // ===== Apply Leave (Handles both with and without attachment, calculates total working days) =====
    public LeaveRequest applyLeave(LeaveRequestDTO dto, MultipartFile file) throws Exception {
        Employee employee = employeeRepository.findByEmployeeId(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate start = dto.getStartDate();
        LocalDate end    = dto.getEndDate();

        if (start == null || end == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before Start date.");
        }

        // Calculate total working days by excluding weekends and holidays
        List<Holiday> holidays = holidayRepository.findByHolidayDateBetween(start, end);
        Set<LocalDate> holidayDates = holidays.stream()
                .map(Holiday::getHolidayDate)
                .collect(Collectors.toCollection(HashSet::new));

        int workingDays = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            DayOfWeek dow = d.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;
            if (holidayDates.contains(d)) continue;
            workingDays++;
        }

        if (workingDays <= 0) {
            throw new RuntimeException("Selected date range contains no working days (only weekends/holidays).");
        }

        LeaveRequest leave = new LeaveRequest();
        leave.setEmployeeId(dto.getEmployeeId());
        leave.setStartDate(start);
        leave.setEndDate(end);

        // Normalize leave type names
        String leaveType = dto.getType();
        if ("Casual".equalsIgnoreCase(leaveType)) {
            leave.setType("Casual Leave");
        } else if ("Sick".equalsIgnoreCase(leaveType)) {
            leave.setType("Sick Leave");
        } else if ("Maternity".equalsIgnoreCase(leaveType)) {
            leave.setType("Maternity Leave");
        } else if ("Paternity".equalsIgnoreCase(leaveType)) {
            leave.setType("Paternity Leave");
        } else {
            leave.setType(leaveType); // keep unchanged for other types (e.g. LOP)
        }

        leave.setTotalDays(workingDays);
        leave.setReason(dto.getReason());
        leave.setStatus("Pending");
        leave.setAssignedManagerId(employee.getAssignedManagerId());
        leave.setAssignedHrId(employee.getAssignedHrId());

        // Make createdDate also LocalDateTime
        leave.setCreatedDate(LocalDateTime.now());

        if (file != null && !file.isEmpty()) {
            validateFile(file);
            leave.setAttachment(file.getBytes());
            leave.setFileName(file.getOriginalFilename());
            leave.setFileType(file.getContentType());
        }

        LeaveRequest savedLeave = leaveRequestRepository.save(leave);

        String historyMessage = (file != null && !file.isEmpty())
                ? "Applied for leave with attachment"
                : "Applied for leave";

        saveHistory(savedLeave, "Pending", dto.getEmployeeId(), "Employee", historyMessage);

        return savedLeave;
    }


    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        long maxSize = 5 * 1024 * 1024; // 5MB

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds 5MB limit.");
        }

        if (contentType == null) {
            throw new RuntimeException("File type could not be detected.");
        }

        // Normalize to lowercase to avoid case sensitivity issues
        contentType = contentType.toLowerCase();

        Set<String> allowedTypes = Set.of(
                "application/pdf",
                "image/png",
                "image/x-png", // Add this MIME type for broader PNG compatibility
                "image/jpg",
                "image/jpeg",
                "image/pjpeg" // Add this for broader JPEG compatibility
        );

        if (!allowedTypes.contains(contentType)) {
            throw new RuntimeException("Invalid file type. Only PDF, PNG, JPG, JPEG allowed.");
        }
    }


    
   // ===== Manager or HR action on leave =====
@Transactional
public LeaveRequest takeAction(LeaveActionDTO dto) {
    LeaveRequest leave = leaveRequestRepository.findById(dto.getLeaveRequestId())
            .orElseThrow(() -> new RuntimeException("Leave not found"));

    String status;

    // Determine if the approver is the assigned manager or HR
    boolean isManager = dto.getApproverId().equals(leave.getAssignedManagerId());
    boolean isHr = dto.getApproverId().equals(leave.getAssignedHrId());

    if (!isManager && !isHr) {
        throw new RuntimeException("Not authorized to approve or reject this leave.");
    }
    
    // Handle actions
    switch (dto.getAction().toUpperCase()) {
        case "APPROVE":
            if (isManager) {
                // If manager approves, change status for HR review
                status = "Approved";
            } else if (isHr) {
                // If HR approves, finalize the leave
                status = "Approved";
                deductLeaves(leave);
            } else {
                throw new RuntimeException("Invalid approver role.");
            }
            leave.setStatus(status);
            leave.setRejectionReason(null);
            break;
        case "REJECT":
            // Both manager and HR can reject
            status = "Rejected";
            leave.setStatus(status);
            leave.setRejectionReason(dto.getRemarks());
            break;
        default:
            throw new RuntimeException("Invalid action");
    }

    // Save the updated leave request
    LeaveRequest updatedLeave = leaveRequestRepository.save(leave);
    
    // Determine the role for history based on who approved
    String actionRole = isManager ? "Manager" : "HR";
    saveHistory(updatedLeave, status, dto.getApproverId(), actionRole, dto.getRemarks());

    return updatedLeave;
}

    // ===== Handles leave deductions and LOP logic (UPDATED) =====
    @Transactional
    public void deductLeaves(LeaveRequest leaveRequest) {
        String employeeId = leaveRequest.getEmployeeId();
        String leaveType = leaveRequest.getType();
        int daysRequested = leaveRequest.getTotalDays();

        // No deduction for Maternity, Paternity, or LOP types
        if ("Maternity Leave".equalsIgnoreCase(leaveType) ||
                "Paternity Leave".equalsIgnoreCase(leaveType) ||
                "LOP".equalsIgnoreCase(leaveType)) {
            return;
        }

        String balanceType = null;
        if ("Casual Leave".equalsIgnoreCase(leaveType)) {
            balanceType = "CL";
        } else if ("Sick Leave".equalsIgnoreCase(leaveType)) {
            balanceType = "SL";
        } else {
            // Unrecognized types treated as LOP
            handleLOP(employeeId, daysRequested);
            return;
        }

        Optional<LeaveBalance> leaveBalanceOpt = leaveBalanceRepository.findByEmployeeIdAndType(employeeId, balanceType);

        if (!leaveBalanceOpt.isPresent()) {
            handleLOP(employeeId, daysRequested);
            return;
        }

        LeaveBalance leaveBalance = leaveBalanceOpt.get();
        int availableDays = leaveBalance.getGranted() - leaveBalance.getConsumed();

        if (daysRequested <= availableDays) {
            leaveBalance.setConsumed(leaveBalance.getConsumed() + daysRequested);
        } else {
            int lopDays = daysRequested - availableDays;
            leaveBalance.setConsumed(leaveBalance.getGranted());
            handleLOP(employeeId, lopDays);
        }

        leaveBalanceRepository.save(leaveBalance);
    }

    private void handleLOP(String employeeId, int lopDays) {
        Optional<LeaveBalance> lopBalanceOpt = leaveBalanceRepository.findByEmployeeIdAndType(employeeId, "LOP");
        LeaveBalance lopBalance = lopBalanceOpt.orElseGet(() -> {
            LeaveBalance newLop = new LeaveBalance();
            newLop.setEmployeeId(employeeId);
            newLop.setType("LOP");
            newLop.setGranted(0);
            newLop.setConsumed(0);
            return newLop;
        });
        lopBalance.setConsumed(lopBalance.getConsumed() + lopDays);
        leaveBalanceRepository.save(lopBalance);
    }

    // ===== Assigns leaves to employee based on current month until December =====
    public void assignLeavesByMonth(String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        List<LeaveBalance> existingBalances = leaveBalanceRepository.findByEmployeeId(employeeId);
        if (!existingBalances.isEmpty()) {
            throw new IllegalStateException("Leave balance already assigned for employee: " + employeeId);
        }

        int currentMonth = LocalDate.now().getMonthValue();
        int monthsRemaining = 12 - currentMonth + 1;

        LeaveBalance clBalance = new LeaveBalance();
        clBalance.setEmployeeId(employeeId);
        clBalance.setType("CL");
        clBalance.setGranted(monthsRemaining);
        clBalance.setConsumed(0);

        LeaveBalance slBalance = new LeaveBalance();
        slBalance.setEmployeeId(employeeId);
        slBalance.setType("SL");
        slBalance.setGranted(monthsRemaining);
        slBalance.setConsumed(0);

        LeaveBalance lopBalance = new LeaveBalance();
        lopBalance.setEmployeeId(employeeId);
        lopBalance.setType("LOP");
        lopBalance.setGranted(0);
        lopBalance.setConsumed(0);

        leaveBalanceRepository.save(clBalance);
        leaveBalanceRepository.save(slBalance);
        leaveBalanceRepository.save(lopBalance);
    }

    // ===== Scheduled method to assign leaves at the start of the year =====
    @Transactional
    public void assignAnnualLeavesToAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee employee : employees) {
            List<LeaveBalance> existingBalances = leaveBalanceRepository.findByEmployeeId(employee.getEmployeeId());
            if (existingBalances.isEmpty()) {
                LeaveBalance clBalance = new LeaveBalance();
                clBalance.setEmployeeId(employee.getEmployeeId());
                clBalance.setType("CL");
                clBalance.setGranted(12);
                clBalance.setConsumed(0);
                leaveBalanceRepository.save(clBalance);

                LeaveBalance slBalance = new LeaveBalance();
                slBalance.setEmployeeId(employee.getEmployeeId());
                slBalance.setType("SL");
                slBalance.setGranted(12);
                slBalance.setConsumed(0);
                leaveBalanceRepository.save(slBalance);

                LeaveBalance lopBalance = new LeaveBalance();
                lopBalance.setEmployeeId(employee.getEmployeeId());
                lopBalance.setType("LOP");
                lopBalance.setGranted(0);
                lopBalance.setConsumed(0);
                leaveBalanceRepository.save(lopBalance);
            }
        }
    }

    // ===== Retrieves the current leave balance for a single employee =====
    public Map<String, Integer> getLeaveBalance(String employeeId) {
        List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeId(employeeId);

        int casualTotal = 0;
        int casualUsed = 0;
        int sickTotal = 0;
        int sickUsed = 0;
        int lopUsed = 0;

        for (LeaveBalance balance : balances) {
            switch (balance.getType().toUpperCase()) {
                case "CL":
                    casualTotal = balance.getGranted();
                    casualUsed = balance.getConsumed();
                    break;
                case "SL":
                    sickTotal = balance.getGranted();
                    sickUsed = balance.getConsumed();
                    break;
                case "LOP":
                    lopUsed = balance.getConsumed();
                    break;
            }
        }

        Map<String, Integer> leaveSummary = new HashMap<>();
        leaveSummary.put("casualTotal", casualTotal);
        leaveSummary.put("casualUsed", casualUsed);
        leaveSummary.put("sickTotal", sickTotal);
        leaveSummary.put("sickUsed", sickUsed);
        leaveSummary.put("lopUsed", lopUsed);

        return leaveSummary;
    }

    // ===== Fetch leaves by employee =====
    public List<LeaveRequest> getEmployeeLeaves(String employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    // ===== Fetch leave history by employee =====
    public List<LeaveHistory> getHistory(String employeeId) {
        return leaveHistoryRepository.findByEmployeeId(employeeId);
    }

    // ===== Fetch pending leaves for manager =====
    public List<LeaveRequest> getManagerLeaves(String managerId) {
        List<String> statuses = List.of("Pending", "Cancelled");
        return leaveRequestRepository.findByAssignedManagerIdAndStatusIn(managerId, statuses);
    }

    // ===== Fetch leaves for HR after manager approval =====
  
               public List<LeaveRequest> getHrLeaves(String hrId) {
                   // Correctly fetch leaves that have been approved by the manager and are now pending HR action
                   return leaveRequestRepository.findByAssignedHrIdAndStatus(hrId, "Approved");
               }

    // ===== Download leave attachment =====
    public Resource getLeaveDocument(Long leaveRequestId) throws IOException {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        byte[] fileData = leave.getAttachment();
        if (fileData == null || fileData.length == 0) {
            return null;
        }

        String fileName = leave.getFileName();
        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "leave_document_" + leaveRequestId;
        }

        String finalFileName = fileName;
        return new ByteArrayResource(fileData) {
            @Override
            public String getFilename() {
                return finalFileName;
            }
        };
    }

    // ===== Save leave history =====
    private void saveHistory(LeaveRequest leave, String status, String actionBy, String actionRole, String remarks) {
        LeaveHistory history = new LeaveHistory();
        history.setLeaveRequestId(leave.getId());
        history.setEmployeeId(leave.getEmployeeId());
        history.setActionBy(actionBy);
        history.setActionRole(actionRole);
        history.setActionDate(new Date());
        history.setStatus(status);
        history.setRemarks(remarks);
        leaveHistoryRepository.save(history);
    }

    // ===== Get all approved leave dates for an employee =====
    public List<LocalDate> getApprovedLeaveDates(String employeeId) {
        List<LeaveRequest> approvedLeaves =
                leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, "Approved");

        List<LocalDate> approvedDates = new ArrayList<>();

        for (LeaveRequest leave : approvedLeaves) {
            LocalDate start = leave.getStartDate();
            LocalDate end    = leave.getEndDate();

            if (start == null || end == null) {
                continue;
            }

            long days = ChronoUnit.DAYS.between(start, end) + 1;
            for (int i = 0; i < days; i++) {
                approvedDates.add(start.plusDays(i));
            }
        }

        return approvedDates;
    }

    // ===== Delete a leave request by ID and its history =====
    @Transactional
    public void cancelLeave(Long id) {
        // Find leave request
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found with ID: " + id));

        // Update status in leave request
        leaveRequest.setStatus("Cancelled");
        leaveRequestRepository.save(leaveRequest);

        // Find and update all related leave history records
        List<LeaveHistory> leaveHistories = leaveHistoryRepository.findByLeaveRequestId(id);

        if (leaveHistories.isEmpty()) {
            throw new RuntimeException("Leave history not found for leave request ID: " + id);
        }

        for (LeaveHistory history : leaveHistories) {
            history.setStatus("Cancelled");
            leaveHistoryRepository.save(history);
        }
    }

    // ===== Apply leave with an already existing file =====
    public LeaveRequest applyLeaveWithExistingFile(LeaveRequestDTO dto, String existingFileName) throws Exception {
        Employee employee = employeeRepository.findByEmployeeId(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("End date cannot be before Start date.");
        }
        LocalDate start = dto.getStartDate();
        LocalDate end = dto.getEndDate();


        List<Holiday> holidays = holidayRepository.findByHolidayDateBetween(start, end);
        Set<LocalDate> holidayDates = holidays.stream()
                .map(Holiday::getHolidayDate)
                .collect(Collectors.toCollection(HashSet::new));

        int workingDays = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            DayOfWeek dow = d.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;
            if (holidayDates.contains(d)) continue;
            workingDays++;
        }

        if (workingDays <= 0) {
            throw new RuntimeException("Selected date range contains no working days (only weekends/holidays).");
        }

        LeaveRequest leave = new LeaveRequest();
        leave.setEmployeeId(dto.getEmployeeId());
        leave.setStartDate(dto.getStartDate());
        leave.setEndDate(dto.getEndDate());

        // Normalize leave type names
        String leaveType = dto.getType();
        if ("Casual".equalsIgnoreCase(leaveType)) {
            leave.setType("Casual Leave");
        } else if ("Sick".equalsIgnoreCase(leaveType)) {
            leave.setType("Sick Leave");
        } else if ("Maternity".equalsIgnoreCase(leaveType)) {
            leave.setType("Maternity Leave");
        } else if ("Paternity".equalsIgnoreCase(leaveType)) {
            leave.setType("Paternity Leave");
        } else {
            leave.setType(leaveType);
        }

        leave.setTotalDays(workingDays);
        leave.setReason(dto.getReason());
        leave.setStatus("Pending");
        leave.setAssignedManagerId(employee.getAssignedManagerId());
        leave.setAssignedHrId(employee.getAssignedHrId());
        leave.setCreatedDate(LocalDateTime.now());

        // Reuse existing file from old leave request
        LeaveRequest oldLeave = leaveRequestRepository
                .findFirstByEmployeeIdAndFileNameOrderByCreatedDateDesc(dto.getEmployeeId(), existingFileName)
                .orElseThrow(() -> new RuntimeException("No existing file found with name: " + existingFileName));

        leave.setAttachment(oldLeave.getAttachment());
        leave.setFileName(oldLeave.getFileName());
        leave.setFileType(oldLeave.getFileType());

        LeaveRequest savedLeave = leaveRequestRepository.save(leave);

        saveHistory(savedLeave, "Pending", dto.getEmployeeId(), "Employee", "Applied for leave (reused existing file)");

        return savedLeave;
    }
    
    // ===== Submit a draft with an updated DTO
    @Transactional
    public LeaveRequest submitDraft(Long draftId, LeaveRequestDTO dto) {
        // 1. Find the draft and employee
        LeaveDraft draft = leaveDraftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft with ID " + draftId + " not found."));
        Employee employee = employeeRepository.findByEmployeeId(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // 2. Create and populate the new LeaveRequest entity
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployeeId(dto.getEmployeeId());
        leaveRequest.setStartDate(dto.getStartDate());
        leaveRequest.setEndDate(dto.getEndDate());
        leaveRequest.setType(dto.getType());
        leaveRequest.setReason(dto.getReason());
        leaveRequest.setAssignedManagerId(employee.getAssignedManagerId());
        leaveRequest.setAssignedHrId(employee.getAssignedHrId());
        leaveRequest.setCreatedDate(LocalDateTime.now());
        leaveRequest.setStatus("Pending");

        // 3. Transfer the attachment from the draft to the new leave request
        if (draft.getDocument() != null) {
            leaveRequest.setAttachment(draft.getDocument());
            leaveRequest.setFileName(draft.getFileName());
            leaveRequest.setFileType(draft.getFileType());
        }

        // 4. Calculate total working days based on the updated dates
        LocalDate start = dto.getStartDate();
        LocalDate end = dto.getEndDate();
        if (start == null || end == null) {
            throw new IllegalArgumentException("Start date and End date are required.");
        }

        List<Holiday> holidays = holidayRepository.findByHolidayDateBetween(start, end);
        Set<LocalDate> holidayDates = holidays.stream()
                .map(Holiday::getHolidayDate)
                .collect(Collectors.toCollection(HashSet::new));
        int workingDays = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            DayOfWeek dow = d.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;
            if (holidayDates.contains(d)) continue;
            workingDays++;
        }
        leaveRequest.setTotalDays(workingDays);

        // 5. Save the new leave request
        LeaveRequest submittedLeave = leaveRequestRepository.save(leaveRequest);

        // 6. Delete the draft after successful submission
        leaveDraftRepository.delete(draft);

        // 7. Save history
        saveHistory(submittedLeave, "Pending", dto.getEmployeeId(), "Employee", "Draft submitted as a new leave request");

        return submittedLeave;
    }
}


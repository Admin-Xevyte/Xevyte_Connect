package com.register.example.controller;

import com.register.example.entity.Holiday;
import com.register.example.entity.LeaveHistory;
import com.register.example.entity.LeaveRequest;
import com.register.example.payload.LeaveActionDTO;
import com.register.example.payload.LeaveRequestDTO;
import com.register.example.service.HolidayService;
import com.register.example.service.LeaveAssignmentService;
import com.register.example.service.LeaveService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/leaves")
// Allow React app calls
public class LeaveController {

    private final LeaveService leaveService;
    private final LeaveAssignmentService leaveAssignmentService;
    private final HolidayService holidayService;


    public LeaveController(LeaveService leaveService,
                           LeaveAssignmentService leaveAssignmentService,
                           HolidayService holidayService) {
        this.leaveService = leaveService;
        this.leaveAssignmentService = leaveAssignmentService;
        this.holidayService = holidayService;
    }

    // ✅ Apply leave with new file
    @PostMapping(value = "/apply", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<LeaveRequest> applyLeave(
            @RequestPart("dto") LeaveRequestDTO dto,
            @RequestPart(value = "document", required = false) MultipartFile document
    ) throws Exception {
        return ResponseEntity.ok(leaveService.applyLeave(dto, document));
    }

    // ✅ Apply leave with existing file (fileName must be in DTO)
    @PostMapping("/apply-with-existing-file")
    public ResponseEntity<LeaveRequest> applyLeaveWithExistingFile(@RequestBody LeaveRequestDTO dto) throws Exception {
        return ResponseEntity.ok(
                leaveService.applyLeaveWithExistingFile(dto, dto.getExistingFileName())
        );
    }

    // Endpoint to submit an existing draft
    @PostMapping("/submit-draft/{draftId}")
    public ResponseEntity<LeaveRequest> submitDraft(@PathVariable Long draftId, @RequestBody LeaveRequestDTO dto) {
        try {
            LeaveRequest submittedLeave = leaveService.submitDraft(draftId, dto);
            return ResponseEntity.ok(submittedLeave);
        } catch (IllegalArgumentException e) {
            // If the draft is not found, return a 404 Not Found error
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Draft with ID " + draftId + " not found.");
        }
    }

    // ===== Approve/Reject leave request by Manager/HR =====
    @PostMapping("/action")
    public ResponseEntity<LeaveRequest> takeAction(@RequestBody LeaveActionDTO dto) {
        return ResponseEntity.ok(leaveService.takeAction(dto));
    }

    // ===== Get all leave requests of an employee =====
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getEmployeeLeaves(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveService.getEmployeeLeaves(employeeId));
    }

    // ===== Get leave approval history for employee =====
    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<List<LeaveHistory>> getLeaveHistory(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveService.getHistory(employeeId));
    }

    // ===== Get all pending leave requests for a manager =====
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<LeaveRequest>> getManagerLeaves(@PathVariable String managerId) {
        return ResponseEntity.ok(leaveService.getManagerLeaves(managerId));
    }

    // ===== Get all pending leave requests for HR (after manager approval) =====
    @GetMapping("/hr/{hrId}")
    public ResponseEntity<List<LeaveRequest>> getHrLeaves(@PathVariable String hrId) {
        return ResponseEntity.ok(leaveService.getHrLeaves(hrId));
    }

    // ===== Download uploaded leave document by leave ID =====
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadLeaveDocument(@PathVariable Long id) throws IOException {
        Resource file = leaveService.getLeaveDocument(id);

        if (file == null || !file.exists()) {
            return ResponseEntity.notFound().build();
        }

        String filename = (file.getFilename() != null && !file.getFilename().trim().isEmpty())
                ? file.getFilename()
                : "leave_document_" + id;

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(file);
    }

    // ===== Assign leaves to an employee based on joining date =====
    @PostMapping("/assign/{employeeId}")
    public ResponseEntity<String> assignLeaves(@PathVariable String employeeId) {
        try {
            int assignedLeaves = leaveAssignmentService.assignLeavesByMonth(employeeId);
            return ResponseEntity.ok(
                    "Assigned " + assignedLeaves + " CL and "
                            + assignedLeaves + " SL leaves for employee " + employeeId
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body("Leaves already assigned for this employee.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error assigning leaves: " + e.getMessage());
        }
    }

    // ===== Get a specific employee's leave balance =====
    @GetMapping("/balance/{employeeId}")
    public ResponseEntity<Map<String, Integer>> getLeaveBalance(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveAssignmentService.getLeaveBalance(employeeId));
    }

    // ===== Cancel a leave request =====
    @PutMapping("/cancel/{id}")
    @Transactional
    public ResponseEntity<?> cancelLeave(@PathVariable Long id) {
        try {
            leaveService.cancelLeave(id);
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error cancelling leave: " + e.getMessage());
        }
    }

    // ===== Get all approved leave dates for an employee =====
    @GetMapping("/approved-dates/{employeeId}")
    public ResponseEntity<List<LocalDate>> getApprovedLeaveDates(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveService.getApprovedLeaveDates(employeeId));
    }

    // ===================== HOLIDAY APIs =====================

    @GetMapping("/holidays")
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAll());
    }

    @PostMapping("/holidays")
    public ResponseEntity<Holiday> addHoliday(@RequestBody Holiday holiday) {
        return ResponseEntity.ok(holidayService.create(holiday));
    }

    @PutMapping("/holidays/{id}")
    public ResponseEntity<Holiday> updateHoliday(@PathVariable Long id, @RequestBody Holiday holiday) {
        return ResponseEntity.ok(holidayService.update(id, holiday));
    }

    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Long id) {
        holidayService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/holidays/{id}")
    public ResponseEntity<Holiday> getHolidayById(@PathVariable Long id) {
        return holidayService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/holidays/date/{date}")
    public ResponseEntity<Holiday> getHolidayByDate(@PathVariable String date) {
        return holidayService.getByDate(LocalDate.parse(date))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/holidays/{year}/{month}")
    public ResponseEntity<List<Holiday>> getHolidaysByMonth(@PathVariable int year, @PathVariable int month) {
        return ResponseEntity.ok(holidayService.getByMonth(year, month));
    }

    @GetMapping("/holidays/year/{year}")
    public ResponseEntity<List<Holiday>> getHolidaysByYear(@PathVariable int year) {
        return ResponseEntity.ok(holidayService.getByYear(year));
    }

    // 🗓️ Get a list of all non-working days for a given date range
    @GetMapping("/non-working-days")
    public ResponseEntity<?> getNonWorkingDays(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            List<Holiday> holidays = holidayService.getHolidaysInDateRange(start, end);
            Set<LocalDate> holidayDates = holidays.stream()
                    .map(Holiday::getHolidayDate)
                    .collect(Collectors.toSet());

            Set<LocalDate> nonWorkingDays = IntStream.range(0, (int) (end.toEpochDay() - start.toEpochDay()) + 1)
                    .mapToObj(i -> start.plusDays(i))
                    .filter(date -> date.getDayOfWeek() == DayOfWeek.SATURDAY ||
                                    date.getDayOfWeek() == DayOfWeek.SUNDAY ||
                                    holidayDates.contains(date))
                    .collect(Collectors.toSet());

            return ResponseEntity.ok(nonWorkingDays);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid date format or error processing request.");
        }
    }
    
    
}

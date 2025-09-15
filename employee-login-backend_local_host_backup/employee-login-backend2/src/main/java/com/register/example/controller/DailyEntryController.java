package com.register.example.controller;

import com.register.example.entity.DailyEntry;
import com.register.example.payload.DailyEntryDTO;
import com.register.example.payload.FreezeRequest;
import com.register.example.payload.SubmittedDateDTO;
import com.register.example.service.DailyEntryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/daily-entry")

public class DailyEntryController {

    private final DailyEntryService dailyEntryService;

    public DailyEntryController(DailyEntryService dailyEntryService) {
        this.dailyEntryService = dailyEntryService;
    }

    @PostMapping("/submit/{employeeId}")
    @PreAuthorize("hasAuthority('EMPLOYEE') and #employeeId == authentication.principal.username")
    public ResponseEntity<?> submitEntry(@PathVariable String employeeId,
                                         @RequestBody DailyEntryDTO dto) {
        try {
            DailyEntry entry = dailyEntryService.submitDailyEntry(employeeId, dto);
            return ResponseEntity.ok(entry);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR') and (#employeeId == authentication.principal.username or hasAuthority('MANAGER') or hasAuthority('HR'))")
    public ResponseEntity<?> getEmployeeEntries(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByEmployee(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAuthority('MANAGER') and #managerId == authentication.principal.username")
    public ResponseEntity<?> getManagerEntries(@PathVariable String managerId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByManager(managerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}")
    @PreAuthorize("hasAuthority('HR') and #hrId == authentication.principal.username")
    public ResponseEntity<?> getHrEntries(@PathVariable String hrId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByHr(hrId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}/employee/{employeeId}")
    @PreAuthorize("hasAuthority('MANAGER') and #managerId == authentication.principal.username")
    public ResponseEntity<?> getEmployeeEntriesForManager(@PathVariable String managerId,
                                                          @PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByManagerAndEmployee(managerId, employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}/employee/{employeeId}")
    @PreAuthorize("hasAuthority('HR') and #hrId == authentication.principal.username")
    public ResponseEntity<?> getEmployeeEntriesForHr(@PathVariable String hrId,
                                                     @PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByHrAndEmployee(hrId, employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/submitted-dates/{employeeId}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR') and (#employeeId == authentication.principal.username or hasAuthority('MANAGER') or hasAuthority('HR'))")
    public ResponseEntity<?> getSubmittedDatesByEmployee(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getSubmittedDatesByEmployee(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/total-hours/{employeeId}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR') and (#employeeId == authentication.principal.username or hasAuthority('MANAGER') or hasAuthority('HR'))")
    public ResponseEntity<?> getTotalHoursByEmployee(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getTotalHoursByEmployee(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/frozen-dates/{employeeId}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR') and (#employeeId == authentication.principal.username or hasAuthority('MANAGER') or hasAuthority('HR'))")
    public ResponseEntity<?> getFrozenDates(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getFrozenDates(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/freeze")
    @PreAuthorize("hasAuthority('MANAGER') and #request.managerId == authentication.principal.username")
    public ResponseEntity<?> freezeTimesheets(@RequestBody FreezeRequest request) {
        try {
            dailyEntryService.freezeTimesheets(
                    request.getManagerId(),
                    request.getEmployeeId(),
                    request.getStartDate(),
                    request.getEndDate()
            );
            return ResponseEntity.ok("Timesheets frozen successfully for employee: " + request.getEmployeeId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PutMapping("/update/{entryId}")
    @PreAuthorize("hasAuthority('EMPLOYEE')")
    public ResponseEntity<?> updateEntry(@PathVariable Long entryId,
                                         @RequestBody DailyEntryDTO dto) {
        try {
            DailyEntry entry = dailyEntryService.updateDailyEntry(entryId, dto);
            return ResponseEntity.ok(entry);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

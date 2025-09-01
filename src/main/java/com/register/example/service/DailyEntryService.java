package com.register.example.service;

import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;
import com.register.example.payload.DailyEntryDTO;
import com.register.example.payload.SubmittedDateDTO;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyEntryService {

    private final DailyEntryRepository dailyEntryRepository;
    private final EmployeeRepository employeeRepository;

    public DailyEntryService(DailyEntryRepository dailyEntryRepository,
                             EmployeeRepository employeeRepository) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.employeeRepository = employeeRepository;
    }

    public DailyEntry submitDailyEntry(String employeeId, DailyEntryDTO dto) {
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        // Block submission if frozen
        if (isDateFrozen(employeeId, dto.getDate())) {
            throw new IllegalStateException("Timesheet is frozen for date: " + dto.getDate());
        }

        if (dailyEntryRepository.findByEmployeeIdAndDate(employeeId, dto.getDate()).isPresent()) {
            throw new IllegalStateException("Timesheet already submitted for date: " + dto.getDate());
        }

        DailyEntry entry = new DailyEntry();
        entry.setEmployeeId(emp.getEmployeeId());
        entry.setManagerId(emp.getAssignedManagerId());
        entry.setHrId(emp.getAssignedHrId());
        entry.setDate(dto.getDate());
        entry.setClient(dto.getClient());
        entry.setProject(dto.getProject());
        entry.setLoginTime(dto.getLoginTime());
        entry.setLogoutTime(dto.getLogoutTime());
        entry.setTotalHours(dto.getTotalHours());
        entry.setRemarks(dto.getRemarks());
        entry.setFrozen(false);

        return dailyEntryRepository.save(entry);
    }

    public List<DailyEntry> getEntriesByEmployee(String employeeId) {
        return dailyEntryRepository.findByEmployeeId(employeeId);
    }

    public List<DailyEntry> getEntriesByManager(String managerId) {
        return dailyEntryRepository.findByManagerId(managerId);
    }

    public List<DailyEntry> getEntriesByHr(String hrId) {
        return dailyEntryRepository.findByHrId(hrId);
    }

    public List<DailyEntry> getEntriesByManagerAndEmployee(String managerId, String employeeId) {
        return dailyEntryRepository.findByManagerIdAndEmployeeId(managerId, employeeId);
    }

    public List<DailyEntry> getEntriesByHrAndEmployee(String hrId, String employeeId) {
        return dailyEntryRepository.findByHrIdAndEmployeeId(hrId, employeeId);
    }

    public List<SubmittedDateDTO> getSubmittedDatesByEmployee(String employeeId) {
        return dailyEntryRepository.findByEmployeeId(employeeId).stream()
                .map(entry -> new SubmittedDateDTO(entry.getDate(), entry.getTotalHours()))
                .collect(Collectors.toList());
    }

    public double getTotalHoursByEmployee(String employeeId) {
        Double totalHours = dailyEntryRepository.findTotalHoursByEmployeeId(employeeId);
        return totalHours != null ? totalHours : 0.0;
    }

    public List<LocalDate> getFrozenDates(String employeeId) {
        return dailyEntryRepository.findByEmployeeIdAndFrozenTrue(employeeId)
                .stream()
                .map(DailyEntry::getDate)
                .toList();
    }

    @Transactional
    public void freezeTimesheets(String managerId, String employeeId, LocalDate startDate, LocalDate endDate) {
        // Check if employee exists and the manager is authorized to act on this employee
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        if (!emp.getAssignedManagerId().equals(managerId)) {
            throw new IllegalStateException("Manager is not authorized to freeze timesheets for employee: " + employeeId);
        }

        // Fetch all existing entries for the employee within the date range
        List<DailyEntry> existingEntries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);
        
        // Use a Map for efficient lookup by date
        Map<LocalDate, DailyEntry> existingEntryMap = existingEntries.stream()
                .collect(Collectors.toMap(DailyEntry::getDate, entry -> entry));

        List<DailyEntry> toSave = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            if (existingEntryMap.containsKey(currentDate)) {
                // If entry exists, update it to be frozen
                DailyEntry entryToFreeze = existingEntryMap.get(currentDate);
                entryToFreeze.setFrozen(true);
                toSave.add(entryToFreeze);
            } else {
                // If entry does not exist, create a new frozen one
                DailyEntry newFrozenEntry = new DailyEntry();
                newFrozenEntry.setEmployeeId(employeeId);
                newFrozenEntry.setManagerId(managerId);
                newFrozenEntry.setHrId(emp.getAssignedHrId());
                newFrozenEntry.setDate(currentDate);
                newFrozenEntry.setFrozen(true);
                newFrozenEntry.setTotalHours(0.0);
                newFrozenEntry.setClient(null);
                newFrozenEntry.setProject(null);
                newFrozenEntry.setRemarks("");
                toSave.add(newFrozenEntry);
            }
            currentDate = currentDate.plusDays(1);
        }
        
        dailyEntryRepository.saveAll(toSave);
    }

    public boolean isDateFrozen(String employeeId, LocalDate date) {
        return dailyEntryRepository.findByEmployeeIdAndDate(employeeId, date)
                .map(DailyEntry::isFrozen)
                .orElse(false);
    }
    
    @Transactional
    public DailyEntry updateDailyEntry(Long entryId, DailyEntryDTO dto) {
        DailyEntry existingEntry = dailyEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalStateException("Timesheet entry not found with id: " + entryId));

        // You can add additional checks here, e.g., to ensure the user is authorized to update this entry.
        // For example, get the authenticated user and compare their ID to existingEntry.getEmployeeId().
        // For now, let's assume the controller's @PreAuthorize is sufficient.
        
        // Update fields from the DTO
        existingEntry.setClient(dto.getClient());
        existingEntry.setProject(dto.getProject());
        existingEntry.setLoginTime(dto.getLoginTime());
        existingEntry.setLogoutTime(dto.getLogoutTime());
        existingEntry.setTotalHours(dto.getTotalHours());
        existingEntry.setRemarks(dto.getRemarks());

        return dailyEntryRepository.save(existingEntry);
    }


    
    
    
    
}
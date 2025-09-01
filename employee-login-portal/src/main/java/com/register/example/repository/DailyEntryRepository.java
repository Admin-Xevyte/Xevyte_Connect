package com.register.example.repository;

import com.register.example.entity.DailyEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyEntryRepository extends JpaRepository<DailyEntry, Long> {

    List<DailyEntry> findByEmployeeId(String employeeId);

    List<DailyEntry> findByManagerId(String managerId);

    List<DailyEntry> findByHrId(String hrId);

    List<DailyEntry> findByManagerIdAndEmployeeId(String managerId, String employeeId);

    List<DailyEntry> findByHrIdAndEmployeeId(String hrId, String employeeId);

    Optional<DailyEntry> findByEmployeeIdAndDate(String employeeId, LocalDate date);
    
    // Retrieves all frozen entries for a specific employee
    List<DailyEntry> findByEmployeeIdAndFrozenTrue(String employeeId);

    // Retrieves manager entries within a specified date range
    List<DailyEntry> findByManagerIdAndDateBetween(String managerId, LocalDate startDate, LocalDate endDate);


    // ⭐ New methods for freeze functionality and more granular queries
    
    // Retrieves all entries for a specific employee within a date range
    List<DailyEntry> findByEmployeeIdAndDateBetween(String employeeId, LocalDate startDate, LocalDate endDate);

    // Retrieves all frozen entries for an employee within a date range
    List<DailyEntry> findByEmployeeIdAndFrozenTrueAndDateBetween(String employeeId, LocalDate startDate, LocalDate endDate);

    // Calculates total hours for an employee
    @Query("SELECT SUM(d.totalHours) FROM DailyEntry d WHERE d.employeeId = :employeeId")
    Double findTotalHoursByEmployeeId(@Param("employeeId") String employeeId);
}
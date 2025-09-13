package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/access")
public class RoleController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping("/assigned-ids/{employeeId}")
    public ResponseEntity<Map<String, Boolean>> getAssignedRoles(@PathVariable String employeeId) {
        List<Employee> allEmployees = employeeService.getAllEmployees();

        boolean isManager = allEmployees.stream()
                .anyMatch(emp -> employeeId.equals(emp.getAssignedManagerId()));
        boolean isFinance = allEmployees.stream()
                .anyMatch(emp -> employeeId.equals(emp.getAssignedFinanceId()));
        boolean isHr = allEmployees.stream()
                .anyMatch(emp -> employeeId.equals(emp.getAssignedHrId()));
        boolean isReviewer = allEmployees.stream()
                .anyMatch(emp -> employeeId.equals(emp.getReviewerId()));
        boolean isAdmin = allEmployees.stream()
                .anyMatch(emp -> employeeId.equals(emp.getAssignedAdminId()));

        Employee self = allEmployees.stream()
                .filter(emp -> employeeId.equals(emp.getEmployeeId()))
                .findFirst()
                .orElse(null);

        if (self != null) {
            if (employeeId.equals(self.getAssignedManagerId())) isManager = true;
            if (employeeId.equals(self.getAssignedFinanceId())) isFinance = true;
            if (employeeId.equals(self.getAssignedHrId())) isHr = true;
            if (employeeId.equals(self.getReviewerId())) isReviewer = true;
            if (employeeId.equals(self.getAssignedAdminId())) isAdmin = true;
        }

        boolean canViewTasks = isManager || isFinance || isHr || isReviewer || isAdmin;

        return ResponseEntity.ok(Map.of(
                "manager", isManager,
                "finance", isFinance,
                "hr", isHr,
                "reviewer", isReviewer,
                "admin", isAdmin,
                "canViewTasks", canViewTasks
        ));
    }
}

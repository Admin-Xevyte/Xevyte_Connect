import React, { useState, useEffect } from "react";
// Remove `useNavigate` because we are no longer changing pages.
// import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import "./Dashboard.css";
import Sidebar from "./Sidebar.js";
// Import the dashboard components to be rendered in the highlighted area.
import ManagerDashBoard from "./ManagerDashBoard";
import FinanceDashboard from "./FinanceDashboard";
import HRDashboard from "./HRDashboard";
function MyTasks() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName] = useState(localStorage.getItem("employeeName"));
  const [assignedRoles, setAssignedRoles] = useState({
    manager: false,
    finance: false,
    hr: false,
  });

  // Add state to track which dashboard is active
  const [activeDashboard, setActiveDashboard] = useState(null);

  // Fetch assigned roles from backend
  useEffect(() => {
    if (employeeId) {
      fetch(`http://localhost:8082/claims/assigned-ids/${employeeId}`)
        .then((res) => res.json())
        .then((data) => {
          setAssignedRoles({
            manager: data.manager || false,
            finance: data.finance || false,
            hr: data.hr || false,
          });
          // Automatically select the first available dashboard
          if (data.manager) {
            setActiveDashboard("manager");
          } else if (data.finance) {
            setActiveDashboard("finance");
          } else if (data.hr) {
            setActiveDashboard("hr");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch assigned roles:", err);
        });
    }
  }, [employeeId]);

  // Update this function to change state instead of navigating
  const handleCheckboxChange = (role) => {
    setActiveDashboard(activeDashboard === role ? null : role);
  };

  // Create a function to conditionally render the correct dashboard
  const renderDashboard = () => {
    switch (activeDashboard) {
      case "manager":
        return <ManagerDashBoard />;
      case "finance":
        return <FinanceDashboard />;
      case "hr":
        return <HRDashboard />;
      default:
        return null; // Or a message like: <p>Select a role to view tasks.</p>
    }
  };

  return (
    
<div
      className="main-content"
      style={{
        padding: "5px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
          <div
            style={{
              display: "flex",
              gap: "15px",
             
            }}
          >
            {assignedRoles.manager && (
              <label
                style={{
                  display: "flex",
                  gap: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={activeDashboard === "manager"}
                  onChange={() => handleCheckboxChange("manager")}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                Manager
              </label>
            )}

            {assignedRoles.finance && (
              <label
                style={{
                  display: "flex",
                  gap: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={activeDashboard === "finance"}
                  onChange={() => handleCheckboxChange("finance")}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                Finance
              </label>
            )}

            {assignedRoles.hr && (
              <label
                style={{
                  display: "flex",
                  gap: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={activeDashboard === "hr"}
                  onChange={() => handleCheckboxChange("hr")}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                HR
              </label>
            )}
          </div>

          <div className="dashboard-content-container">
          {renderDashboard()}
        </div>

      
      </div>
 
  );
}

export default MyTasks;

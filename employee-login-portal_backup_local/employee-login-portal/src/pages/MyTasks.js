import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ManagerDashBoard from "./ManagerDashBoard";
import FinanceDashboard from "./FinanceDashboard";
import HRDashboard from "./HRDashboard";
import "./ManagerDashboard.css";
import "./Dashboard.css";
import Sidebar from './Sidebar.js';
function MyTasks() {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  padding: '25px',
  textAlign: 'left',
  width: '350px',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  marginBottom: '20px'
};
useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/claims/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        // This backend only returns { canViewTasks: true/false }, so you might need to modify backend
        // But let's assume you update backend to return:
        // {
        //   manager: true,
        //   finance: false,
        //   hr: true
        // }

        setAssignedRoles({
          manager: data.manager || false,
          finance: data.finance || false,
          hr: data.hr || false
        });
      })
      .catch(err => {
        console.error("Failed to fetch assigned roles:", err);
      });
  }
}, [employeeId]);

  const [assignedRoles, setAssignedRoles] = useState({
  manager: false,
  finance: false,
  hr: false
});

  const handleCardClick = (dashboard) => {
    if (dashboard === "Manager") {
      navigate("/manager-dashboard", { state: { employeeId } });
    } else if (dashboard === "Finance") {
      navigate("/finance-dashboard", { state: { employeeId } });
    } else if (dashboard === "HR") {
      navigate("/finance", { state: { employeeId } });
    }
  };

  return (
   <Sidebar>
      <div className="main-content" style={{ padding: '20px' }}>
        {/* Header */}
   <button
    onClick={() => navigate(-1)}
    style={{
        padding: "8px 16px", // Slightly reduced padding
         backgroundColor: "#f0f0f0",
       color: "#333",
       fontSize: "16px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      cursor: "pointer",
      margin: "20px 0 20px 0", // Top and bottom margins only
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        transition: "background-color 0.3s ease",
        width: "fit-content", // Make width only as big as content
        display: "block", // Ensure it respects margin auto if needed
    }}
>
    ⬅ Back
</button>

  <h2 style={{ marginTop: '20px',}}>Choose Your Dashboard</h2>
<div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
  {assignedRoles.manager && (
    <div
      onClick={() => handleCardClick("Manager")}
      style={cardStyle}
    >
      <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Manager Dashboard</h3>
      <p style={{ margin: 0, color: '#6c757d' }}>Go to Manager Panel</p>
    </div>
  )}
  {assignedRoles.finance && (
    <div
      onClick={() => handleCardClick("Finance")}
      style={cardStyle}
    >
      <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Finance Dashboard</h3>
      <p style={{ margin: 0, color: '#6c757d' }}>Go to Finance Panel</p>
    </div>
  )}
  {assignedRoles.hr && (
    <div
      onClick={() => handleCardClick("HR")}
      style={cardStyle}
    >
      <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>HR Dashboard</h3>
      <p style={{ margin: 0, color: '#6c757d' }}>Go to HR Panel</p>
    </div>
  )}
</div>

</div>
</Sidebar>
  );
}

export default MyTasks;

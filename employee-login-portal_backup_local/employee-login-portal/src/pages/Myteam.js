import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
// Dashboard Cards
const MyGoalsCard = () => {
  const navigate = useNavigate();
  return (
    <div className="card goals-card mygoals" onClick={() => navigate('/managergoals')}>
      <h4>Manager</h4>
      <small>Set Goals to your employees</small>
    </div>
  );
};

const ReviewerCard = () => {
  const navigate = useNavigate();
  return (
    <div className="card goals-card" onClick={() => navigate('/reviewer')}>
      <h4>Reviewer</h4>
      <small>Review your employee goals</small>
    </div>
  );
};

const HRCard = () => {
  const navigate = useNavigate();
  return (
    <div className="card goals-card" onClick={() => navigate('/hrgoals')}>
      <h4>HR</h4>
      <small>HR Panel & Monitoring</small>
    </div>
  );
};

const Myteam = ({ roles = { manager: false, hr: false, reviewer: false } }) => {
  return (
    <div className="metrics">
      {roles.manager && <MyGoalsCard />}
      {roles.reviewer && <ReviewerCard />}
      {roles.hr && <HRCard />}
    </div>
  );
};


function Performance() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
 
  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();


 const [canViewTasks, setCanViewTasks] = useState(false);

const [roles, setRoles] = useState({
  manager: false,
  hr: false,
  reviewer: false,
});

useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setRoles({
          manager: data.manager,
          hr: data.hr,
          reviewer: data.reviewer,
        });
        setCanViewTasks(data.canViewTasks);
      })
      .catch(err => console.error("Failed to fetch roles:", err));
  }
}, [employeeId]);
  return (
   <Sidebar>
      <div className="main-content">
 <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "20px 0 20px 0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
            width: "fit-content",
            display: "block",
          }}
        >
          ⬅ Back
        </button>
            <h2>Choose Your Dashboard</h2>
<Myteam roles={roles} />

      </div>
   </Sidebar>
  );
}

export default Performance;

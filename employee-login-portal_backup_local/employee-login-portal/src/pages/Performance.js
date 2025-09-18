import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Performance.css';
 import Sidebar from './Sidebar.js';

// Performance component is the main container for the page
function Performance() {
  const employeeId = localStorage.getItem("employeeId");
  const role = localStorage.getItem("role");  // <-- Fetch role here
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

 const [canViewTasks, setCanViewTasks] = useState(false);

  // Get current quarter and year
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentQuarter = currentMonth <= 2 ? 'Q1' : currentMonth <= 5 ? 'Q2' : currentMonth <= 8 ? 'Q3' : 'Q4';
 

     useEffect(() => {
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          const { manager, hr } = data;  // only manager and hr
  
          // Show tasks only if manager or hr
          const canView = manager || hr;
  
          setCanViewTasks(canView);
        })
        .catch(err => {
          console.error("Error fetching task visibility:", err);
          setCanViewTasks(false);
        });
    }
  }, [employeeId]);

 
  
  const dropdownBtnStyle = {
    display: 'block',
    width: '100%',
    padding: '10px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    borderBottom: '1px solid #eee'
  };
 
 
  return (
     <Sidebar>
    <div className="dashboard-container">
   
 
      <div className="main-content">
        <div className="mainn">
          <h2 className="title2">Performance Dashboard</h2>
          <p>Track your goals and performance metrics</p>
      <PerformanceMetrics employeeId={employeeId} role={role} canViewTasks={canViewTasks} />
{/* Pass employeeId and role */}
          <QuickActions />
        </div>
      </div>
    </div>
    </Sidebar>
  );
}
 
// Corrected and separate metric card components
const MyGoalsCard = () => {
  const navigate = useNavigate();
  return (
    <div className="card goals-card mygoals" onClick={() => navigate('/goals')}>
      <h4>My Goals</h4>
      <small>Your Quarterly Goals</small>
    </div>
  );
};
 
const Goalhistory = () => {
  const navigate = useNavigate();
  return (
    <div className="metric-box card-text" onClick={() => navigate('/goalhistory')}>
      <h4>Goal History</h4>
      <div>
        <p>View your goal history</p>
      </div>
    </div>
  );
};
 
const Myteam = ({ employeeId }) => {
  const navigate = useNavigate();
 
  const handleClick = () => {
    // This button is always enabled for navigation
    // You may still want a check to ensure employeeId is available
    if (employeeId) {
      navigate('/myteam');
    }
  };
 
  return (
    <div
      className="metric-box card-text"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <h4>My Team</h4>
      <div>
        <p>View your team</p>
      </div>
    </div>
  );
};
// New component to group all the metric cards together
const PerformanceMetrics = ({ employeeId, role, canViewTasks }) => {
  return (
    <div className="metrics">
      <MyGoalsCard />
      <Goalhistory />
      {canViewTasks && <Myteam employeeId={employeeId} role={role} />}
    </div>
  );
};

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="quick-actions-card">
      <h3>📊 Quick Actions</h3>
      <p className="subtitle">Frequently used actions for your role</p>
      <div className="quick-actions-buttons">
        <button className="self-submit" onClick={() => navigate('/selfassessment')}>
          📄 Submit Self-Assessment
        </button>
      </div>
    </div>
  );
};
 
const dropdownBtnStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  borderBottom: '1px solid #eee'
};
 
export default Performance;
 
 

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
const MyTeamPage = () => {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  
  const [searchTerm, setSearchTerm] = useState('');
 
  const navigate = useNavigate();
 
   const [canViewTasks, setCanViewTasks] = useState(false);

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
    const [roles, setRoles] = useState({
    manager: false,
    finance: false,
    hr: false,
    reviewer: false,
    admin: false,
    canViewTasks: false,
  });
  
  useEffect(() => {
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          setRoles(data);
        })
        .catch(err => console.error("Failed to fetch roles:", err));
    }
  }, [employeeId]);







  const handleManagerClick = () => {
    navigate('/mngtime');
  };

  const handleHRClick = () => {
    navigate('/hrgreq');
  };

  return (
<Sidebar>
      <div className="main-content">
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
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
  {roles.manager && (
    <div
      onClick={handleManagerClick}
      style={cardStyle}
    >
      <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '6px' }}>
        Manager View
      </div>
      <div style={{ color: '#888', fontWeight: '400', fontSize: '14px' }}>
        Go to Manager Panel
      </div>
    </div>
  )}

  {roles.hr && (
    <div
      onClick={handleHRClick}
         style={cardStyle}
    >
      <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '6px' }}>
        HR
      </div>
      <div style={{ color: '#888', fontWeight: '400', fontSize: '14px' }}>
        HR Panel & Monitoring
      </div>
    </div>
  )}

  {/* Add other roles/cards similarly */}
</div>

      </div>
  </Sidebar>
  );
};

export default MyTeamPage;

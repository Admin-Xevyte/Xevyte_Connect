import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function ManagerTasks() {
  const managerId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");
  const [managerName, setManagerName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);



   const employeeId = localStorage.getItem("employeeId");

  // Fetch updated profile info and pending leaves on mount
  useEffect(() => {
    if (!managerId || !token) {
      console.error("Manager ID or token not found. Redirecting to login.");
      navigate("/login");
      return;
    }

    const fetchLeaves = async () => {
      setLoading(true);
      setApiError("");
      try {
        const res = await fetch(`http://3.7.139.212:8080/leaves/manager/${managerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const managerData = await res.json();
        const sortedData = managerData.sort((a, b) => b.id - a.id);
        setPendingLeaves(sortedData);
      } catch (err) {
        console.error("Failed to fetch leaves:", err);
        setApiError("Failed to load leaves. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://3.7.139.212:8080/profile/${managerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch profile info");
        const data = await res.json();
        if (data.profilePic) {
          setProfilePic(data.profilePic);
          localStorage.setItem("employeeProfilePic", data.profilePic);
        }
        if (data.name) {
          setManagerName(data.name);
          localStorage.setItem("employeeName", data.name);
        }
      } catch (err) {
        console.error("Failed to fetch profile info:", err);
      }
    };

    fetchLeaves();
    fetchProfile();
  }, [managerId, token, navigate]);


 
  const handleLeaveAction = async (leaveId, action) => {
    let remarks = "Approved by manager.";
    if (action === 'Reject') {
      remarks = prompt("Please enter a reason for rejection:");
      if (!remarks || remarks.trim().length < 10) {
        alert("Rejection reason must be at least 10 characters long.");
        return;
      }
    }

    const actionDTO = {
      leaveRequestId: leaveId,
      approverId: managerId,
      action: action,
      remarks: remarks,
    };

    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("http://3.7.139.212:8080/leaves/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(actionDTO),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const updatedLeave = await res.json();

      if (updatedLeave.status !== 'Pending') {
        setPendingLeaves(prev => prev.filter(l => l.id !== updatedLeave.id));
      } else {
        setPendingLeaves(prev => prev.map(l => l.id === updatedLeave.id ? updatedLeave : l));
      }

      setSuccessMessage(`Leave request ${action.toLowerCase()}ed successfully! ✅`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error taking action on leave:", error);
      setApiError(`Failed to ${action.toLowerCase()} leave: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
      case 'Approved by Manager': return '#4BB543';
      case 'Pending': return '#FFC107';
      case 'Rejected': return '#FF4136';
      case 'Cancelled': return '#6c757d'; // added cancelled color
      default: return '#000';
    }
  };

  const filteredLeaves = useMemo(() => {
    if (!searchTerm) {
      return pendingLeaves;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    return pendingLeaves.filter(leave => {
      return (
        String(leave.employeeId).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.id).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.type).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.startDate).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.endDate).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.totalDays).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.reason).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.fileName || '').toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.status).toLowerCase().includes(lowercasedSearchTerm)
      );
    });
  }, [pendingLeaves, searchTerm]);

const renderTable = (leaves, showActions = false) => (
  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
    <div style={{ overflowY: 'auto', height: 'calc(100vh - 300px)', width: '100%', border: '1px solid #ddd' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff',backgroundColor: '#4c82d3' }}>Employee ID</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Leave ID</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Leave Type</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>Start Date</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>End Date</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Total Days</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Reason</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>Uploaded File</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Status</th>
            {showActions && (
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.employeeId}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd',textAlign:'center' }}>{leave.id}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.type}</td>
            <td style={{ padding: '15px', border: '1px solid #ddd' }}>
  {new Date(leave.startDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>
<td style={{ padding: '12px', border: '1px solid #ddd' }}>
  {new Date(leave.endDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>

              <td style={{ padding: '12px', border: '1px solid #ddd' ,textAlign:'center'}}>{leave.totalDays}</td>
  <td style={{
  padding: '12px',
  border: '1px solid #ddd',
  maxWidth: '200px',
  height: '40px',            // fixed height for all cells
  overflowY: 'auto',         // vertical scroll if content overflows
  overflowX: 'hidden',       // hide horizontal scroll
  whiteSpace: 'normal',      // allow wrapping text
  wordWrap: 'break-word',    // break long words if needed
}}>
  {leave.reason}
</td>


             <td style={{ padding: '12px', border: '1px solid #ddd' }}>
  {leave.fileName ? (
    <a
      href={`http://3.7.139.212:8080/leaves/download/${leave.id}`}
      target="_blank"
      rel="noopener noreferrer"
      download
      style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
      title={leave.fileName} // Tooltip for full filename
    >
      {leave.fileName.length > 10 ? leave.fileName.substring(0, 10) + '...' : leave.fileName}
    </a>
  ) : (
    <span>No File</span>
  )}
</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                <span style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    color: '#fff',
                    backgroundColor: getStatusColor(leave.status),
                    fontWeight: 'bold',
                    fontSize: '12px',
                }}>{leave.status}</span>
              </td>
              {showActions && (
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {leave.status === 'Pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button onClick={() => handleLeaveAction(leave.id, 'Approve')} style={{
                            padding: '8px 12px', fontSize: '14px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer'
                        }}>Approve</button>
                        <button onClick={() => handleLeaveAction(leave.id, 'Reject')} style={{
                            padding: '8px 12px', fontSize: '14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer'
                        }}>Reject</button>
                      </div>
                    ) : leave.status === 'Cancelled' ? (
                      <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Cancelled</span>
                    ) : null}
                  </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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
        {/* Manager Tasks Content */}
        <div style={{ padding: '20px' }}>
          <h2>Manager Leave Requests</h2>
          {loading && <div>Loading...</div>}
          {apiError && <div className="error-message" style={{ color: 'red' }}>{apiError}</div>}
          {successMessage && <div className="success-message" style={{ color: 'green' }}>{successMessage}</div>}

          {filteredLeaves.length > 0 ? (
            renderTable(filteredLeaves, true)
          ) : (
            <p>No leave requests found.</p>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default ManagerTasks;

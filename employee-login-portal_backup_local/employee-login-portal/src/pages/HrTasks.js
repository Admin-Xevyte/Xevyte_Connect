import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
 import Sidebar from './Sidebar.js';
function HRDashboard() {
  const hrId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");
  const [hrName, setHrName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [profileOpen, setProfileOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  const navigate = useNavigate();
  const [hrAssignedLeaves, setHrAssignedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

 const [canViewTasks, setCanViewTasks] = useState(false);

  // Fetch leaves and profile information on initial load
  useEffect(() => {
    if (!hrId || !token) {
      console.error("HR ID or token not found. Redirecting to login.");
      navigate("/login");
      return;
    }

    const fetchLeaves = async () => {
  setLoading(true);
  setApiError("");
  try {
    const res = await fetch(`http://3.7.139.212:8080/leaves/hr/${hrId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    // Sort by leave ID descending
    const sortedData = data.sort((a, b) => b.id - a.id);

    // ✅ Filter only those with 'Approved by HR' status
    const approvedLeaves = sortedData.filter(leave => leave.status === 'Approved');

    if (Array.isArray(approvedLeaves)) {
      setHrAssignedLeaves(approvedLeaves);
    } else {
      setApiError("Invalid data format from server.");
    }
  } catch (err) {
    console.error("Failed to fetch leaves:", err);
    setApiError("Failed to load HR-assigned leaves. Please try again later.");
  } finally {
    setLoading(false);
  }
};

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://3.7.139.212:8080/profile/${hrId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch profile info");
        const data = await res.json();
        if (data.profilePic) { setProfilePic(data.profilePic); localStorage.setItem("employeeProfilePic", data.profilePic); }
        if (data.name) { setHrName(data.name); localStorage.setItem("employeeName", data.name); }
      } catch (err) { console.error("Failed to fetch profile info:", err); }
    };

    fetchLeaves();
    fetchProfile();
  }, [hrId, token, navigate]);



  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved by Manager': return '#FFC107';
      case 'Approved by HR': return '#4BB543';
      case 'Rejected': return '#FF4136';
      default: return '#000';
    }
  };
const filteredLeaves = useMemo(() => {
    if (!searchTerm) return hrAssignedLeaves;
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return hrAssignedLeaves.filter(leave =>
      // Check if the search term exists in any of the leave's string values.
      // This includes employeeId, leave type, reason, etc.
      String(leave.employeeId).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.id).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.type).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.startDate).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.endDate).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.totalDays).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.reason).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.fileName).toLowerCase().includes(lowercasedSearchTerm) ||
      String(leave.status).toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [hrAssignedLeaves, searchTerm]);

  
  const renderTable = (leaves, showActions = false) => (
    <div style={{ overflowX: 'auto', backgroundColor: '#fff', padding: '0px',height: 'calc(100vh - 300px)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Employee ID</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Leave_ID</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Leave Type</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Start Date</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>End Date</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Total Days</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Reason</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Uploaded File</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.employeeId}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd',textAlign:'center' }}>{leave.id}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.type}</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
  {new Date(leave.startDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>
<td style={{ padding: '12px', border: '1px solid #ddd' }}>
  {new Date(leave.endDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>

              <td style={{ padding: '12px', border: '1px solid #ddd' ,textAlign:'center'}}>{leave.totalDays}</td>
  <td style={{
  padding: '12px',
  border: '1px solid #ddd',
  maxWidth: '300px',
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
      href={`/leaves/download/${leave.id}`}
      download={leave.fileName}
      style={{ color: '#007bff', textDecoration: 'underline' }}
      title={leave.fileName} // Full name on hover
    >
      {leave.fileName.length > 10
        ? leave.fileName.substring(0, 10) + '...'
        : leave.fileName}
    </a>
  ) : (
    <span>No File</span>
  )}
</td>

              <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                <span style={{
                  fontWeight: 'normal',
                  fontSize: '14px',
                  color: getStatusColor(leave.status),
                }}>
                  {leave.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
     <Sidebar>
      <div className="main-content">
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
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
          <h2 style={{ marginBottom: '20px' }}>Team Leave Data</h2>
          {loading ? (
            <div>Loading...</div>
          ) : filteredLeaves.length === 0 ? (
            <div>No leave requests pending for your approval.</div>
          ) : (
            renderTable(filteredLeaves, true)
          )}
        </div>
      </div>
 </Sidebar>
  );
}

export default HRDashboard;

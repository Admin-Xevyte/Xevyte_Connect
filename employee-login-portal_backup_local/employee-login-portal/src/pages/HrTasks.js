import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function HRDashboard() {
  const hrId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");
  const [hrName, setHrName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [profileOpen, setProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [hrAssignedLeaves, setHrAssignedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);
 const [canViewTasks, setCanViewTasks] = useState(false);
   const employeeId = localStorage.getItem("employeeId");
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  // Fetch leaves and profile information on initial load
  useEffect(() => {
    if (!hrId || !token) {
      console.error("HR ID or token not found. Redirecting to login.");
      navigate("/login");
      return;
    }

    // const fetchLeaves = async () => {

    //   setLoading(true);
    //   setApiError("");
    //   try {
    //     const res = await fetch(`http://3.7.139.212:8080/leaves/hr/${hrId}`, {
    //       headers: { 'Authorization': `Bearer ${token}` }
    //     });
    //     if (!res.ok) {
    //       throw new Error(`HTTP error! status: ${res.status}`);
    //     }
    //     const data = await res.json();
    //     // Sort the data by leave ID in descending order
    //     const sortedData = data.sort((a, b) => b.id - a.id);
    //     if (Array.isArray(sortedData)) {
    //       setHrAssignedLeaves(sortedData);
    //     } else {
    //       setApiError("Invalid data format from server.");
    //     }
    //   } catch (err) {
    //     console.error("Failed to fetch leaves:", err);
    //     setApiError("Failed to load HR-assigned leaves. Please try again later.");
    //   } finally {
    //     setLoading(false);
    //   }
    // };


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

  // Handle clicks outside the profile dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("name", hrName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`http://3.7.139.212:8080/profile/update/${hrId}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP error! status: ${res.status}`);
      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => { setSuccessMessage(""); setProfileOpen(false); }, 2000);
      }
    } catch (err) {
      console.error("Error updating profile picture:", err);
      setApiError("Error uploading profile picture. See console for details.");
    }
  };

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
    <div className="dashboard-container">
      {/* Sidebar - EXACTLY like Performance component */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img
              src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
              alt="office"
              className="office-vng"
            />
            <img
              src={require("../assets/gg_move-left.png")}
              alt="collapse"
              className="toggle-btn"
              onClick={toggleSidebar}
              style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }}
            />
         <h3>
            <Link
              to="/dashboard"
              className="side"
              style={{
                textDecoration: 'none',
                color:'#00b4c6',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Home
              </span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home0" className="side" style={{ textDecoration: 'none', color: 'white' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Claims</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home1" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Time Sheet</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home2" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Employee Handbook</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home3" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Employee Directory</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home4" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Exit Management</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home5" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Holiday Calendar</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home6" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Helpdesk</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home7" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Leaves</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home9" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Pay slips</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home10" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Performance</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home11" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Training</span>
            </Link>
          </h3>
          
          <h3>
            <Link to="/home12" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Travel</span>
            </Link>
          </h3>
          {allowedUsers.includes(employeeId) && (
                                                <>
                                                  <h3 onClick={toggleContractMenu} style={{ cursor: 'pointer' }}>
                                                    <span className="side" style={{  color:'#00b4c6' }}>
                                                      Contract Management {isContractOpen ? '▾' : '▸'}
                                                    </span>
                                                  </h3>
                                              
                                                  {isContractOpen && (
                                                    <ul style={{ listStyle: 'disc', paddingLeft: '16px', marginTop: '4px' ,}}>
                                                      <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                                                        <Link
                                                          to="/customers"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          Customers
                                                        </Link>
                                                      </li>
                                                      <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                                                        <Link
                                                          to="/sows"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          SOWs
                                                        </Link>
                                                      </li>
                                                      <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                                                        <Link
                                                          to="/projects"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          Projects
                                                        </Link>
                                                      </li>
                                                      <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                                                        <Link
                                                          to="/allocation"
                                                          style={{
                                                            textDecoration: 'none',
                                                           color:'#00b4c6',
                                                            fontSize: '14px',
                                                            display: 'block',
                                                            padding: '4px 0',
                                                          }}
                                                          onMouseOver={(e) => (e.target.style.color = '#fff')}
                                                          onMouseOut={(e) => (e.target.style.color = '#00b4c6')}
                                                        >
                                                          Allocation
                                                        </Link>
                                                      </li>
                                                    </ul>
                                                  )}
                                                </>
                                              )}
                  
                  </>
        ) : (
          <div className="collapsed-wrapper">
            <img
              src={require("../assets/Group.png")}
              alt="expand"
              className="collapsed-toggle"
              onClick={toggleSidebar}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {hrName} ({hrId})</h2>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img
              src={require('../assets/Vector.png')}
              alt="Notifications"
              className="icon"
              style={{ cursor: 'pointer' }}
            />
            <div className="profile-wrapper" ref={profileDropdownRef} style={{ position: 'relative' }}>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-pic"
                onClick={toggleProfileMenu}
                style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              {profileOpen && (
                <div
                  className="profile-dropdown"
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                    zIndex: 1000,
                    width: '150px',
                  }}
                >
                  <button
                    onClick={handleEditProfile}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
              {successMessage && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '5px',
                  backgroundColor: '#4BB543',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  zIndex: 1100,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {successMessage}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

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
    </div>
  );
}

export default HRDashboard;

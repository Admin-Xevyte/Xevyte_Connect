import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';

function ReviewerGoals() {
  // Performance component state
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);
 const [canViewTasks, setCanViewTasks] = useState(false);
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  // ReviewerGoals original state
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const role = localStorage.getItem('role');

  // Fetch updated profile info (Performance logic)
  useEffect(() => {
    if (employeeId) {
      fetch(`/profile/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem("employeeProfilePic", data.profilePic);
          }
          if (data.name) {
            setEmployeeName(data.name);
            localStorage.setItem("employeeName", data.name);
          }
        })
        .catch(err => console.error("Failed to fetch profile info:", err));
    }
  }, [employeeId]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
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
    if (!file) return;

    const formData = new FormData();
    formData.append("name", employeeName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`/profile/update/${employeeId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => {
          setSuccessMessage("");
          setProfileOpen(false);
        }, 2000);
      } else {
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };

 useEffect(() => {
  if (!employeeId) {
    setErrorMessage('User ID not found. Please log in.');
    setIsAuthorized(false);
    return;
  }

  const url = `/api/goals/reviewer/${employeeId}/employees`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
        setErrorMessage('');
        setIsAuthorized(true); // ✅ show content
      } else {
        setEmployees([]);
        setErrorMessage('You are not assigned as a reviewer for any employees.');
        setIsAuthorized(false); // ❌ show access denied
      }
    })
    .catch((error) => {
      console.error('Error fetching employees:', error);
      setErrorMessage('Failed to fetch employees.');
      setEmployees([]);
      setIsAuthorized(false);
    });
}, [employeeId]);


  const handleEmployeeClick = (empId) => {
    localStorage.setItem('selectedEmployeeId', empId);
    navigate('/reviewergoals', { state: { employeeId: empId } });
  };
  
  // New filtering logic
  const filteredEmployees = employees.filter(emp => {
    if (searchTerm === '') {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      emp.employeeId?.toLowerCase().includes(lowerCaseSearchTerm) ||
      emp.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      emp.email?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });


  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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
                  <Link to="/home0" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
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
                  <Link to="/home10" className="side" style={{ textDecoration: 'none', color: 'white'}}>
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

      <div className="main-content">
        {/* Topbar */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeId})</h2>
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
            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-pic"
                onClick={toggleProfileMenu}
                style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              {profileOpen && (
                <div
                  ref={profileDropdownRef}
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
                  <button onClick={handleEditProfile} style={{ display: 'block', width: '100%', padding: '10px', borderBottom: '1px solid #eee', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Logout</button>
                </div>
              )}
              {successMessage && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
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

        {/* Divider */}
        <hr className="divider-line" />
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
        {/* ReviewerGoals content */}
        <div className="emp-container">
          <h2 className="emp-title">My Team</h2>
          {errorMessage && <p className="emp-error">{errorMessage}</p>}
          
          {employees.length > 0 && (
            <div className="table-wrapper"
            style={{
      maxHeight: 'calc(100vh - 300px)', // 👈 limit height
      overflowY: 'auto',                // 👈 vertical scroll
      overflowX: 'auto',                // 👈 optional: scroll horizontally if needed
      border: '1px solid #ccc',
    }}
  >
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id || emp.employeeId}>
                        <td>
                          <button
                            type="button"
                            style={{ color: 'blue', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                            onClick={() => handleEmployeeClick(emp.employeeId)}
                          >
                            {emp.employeeId}
                          </button>
                        </td>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
              No employee details found for your search criteria.
            </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewerGoals;

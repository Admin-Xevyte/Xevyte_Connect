import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ManagerDashBoard from "./ManagerDashBoard";
import FinanceDashboard from "./FinanceDashboard";
import HRDashboard from "./HRDashboard";
import "./ManagerDashboard.css";
import "./Dashboard.css";

function MyTasks() {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);
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


const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  // Load profile info
  useEffect(() => {
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/profile/${employeeId}`)
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

  // Handle clicking outside profile dropdown
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
      const res = await fetch(`http://3.7.139.212:8080/profile/update/${employeeId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => {
          setSuccessMessage("");
          setProfileOpen(false);
        }, 2000);
      } else {
        alert("Failed to update profile picture.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error uploading profile picture.");
    }
  };

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

      <div className="main-content" style={{ padding: '20px' }}>
        {/* Header */}
        <div className="dashboard-header">
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
                  style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }}
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
                    <button
                      onClick={handleEditProfile}
                      style={{
                        width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer'
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
                    zIndex: 1100,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {successMessage}
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
          <hr className="divider-line" />
        </div>

  
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

      </div>

  );
}

export default MyTasks;

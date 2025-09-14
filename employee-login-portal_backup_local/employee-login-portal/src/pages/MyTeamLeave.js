import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const MyTeamLeave = () => {
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

  const handleManagerClick = () => {
    navigate('/manager/tasks');
  };

  const handleHRClick = () => {
    navigate('/hr/tasks');
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
                                  <Link to="/dashboard" className="side" style={{ textDecoration: 'none',color:'#00b4c6'}}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px',color:'#00b4c6'}}>
                                      Home
                                     
                                    </span>
                                  </Link>
                                </h3>
                                <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Claims</Link></h3>
                                <h3><Link to="/home1" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Time Sheet</Link></h3>
                                <h3><Link to="/home2" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Employee Handbook</Link></h3>
                                <h3><Link to="/home3" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Employee Directory</Link></h3>
                                <h3><Link to="/home4" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Exit Management</Link></h3>
                                <h3><Link to="/home5" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Holiday Calendar</Link></h3>
                                <h3><Link to="/home6" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Helpdesk</Link></h3>
                                <h3><Link to="/home7" className="side" style={{ textDecoration: 'none', color: 'white' }}>Leaves</Link></h3>
                              
                                <h3><Link to="/home9" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Pay slips</Link></h3>
                                <h3><Link to="/home10" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Performance</Link></h3>
                                <h3><Link to="/home11" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Training</Link></h3>
                                <h3><Link to="/home12" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Travel</Link></h3>
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
    </div>
  );
};

export default MyTeamLeave;

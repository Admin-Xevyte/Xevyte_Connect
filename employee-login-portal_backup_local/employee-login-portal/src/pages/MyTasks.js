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

  // Load profile info
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
      const res = await fetch(`/profile/update/${employeeId}`, {
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
                            <Link to="/dashboard" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)'}}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)'}}>
                                Home
                               
                              </span>
                            </Link>
                          </h3>
                          <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none', color: 'white' }}>Claims</Link></h3>
                          <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Time Sheet</Link></h3>
                          <h3><Link to="/home2" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Handbook</Link></h3>
                          <h3><Link to="/home3" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Directory</Link></h3>
                          <h3><Link to="/home4" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Exit Management</Link></h3>
                          <h3><Link to="/home5" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Holiday Calendar</Link></h3>
                          <h3><Link to="/home6" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Helpdesk</Link></h3>
                          <h3><Link to="/home7" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Leaves</Link></h3>
                        
                          <h3><Link to="/home9" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Pay slips</Link></h3>
                          <h3><Link to="/home10" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Performance</Link></h3>
                          <h3><Link to="/home11" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Training</Link></h3>
                          <h3><Link to="/home12" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Travel</Link></h3>
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
      backgroundColor: 'transparent',
      border: 'none',
      color: '#007bff',
      fontSize: '16px',
      cursor: 'pointer',
      marginBottom: '10px',
      padding: '5px 0',
      textAlign: 'left'
    }}
  >
    ← Back
  </button>
  <h2 style={{ marginBottom: '20px' }}>Choose Your Dashboard</h2>
  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
    {["Manager", "Finance", "HR"].map((role) => (
      <div
        key={role}
        onClick={() => handleCardClick(role)}
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          padding: '25px',
          textAlign: 'left',
          width: '350px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>{role} Dashboard</h3>
        <p style={{ margin: 0, color: '#6c757d' }}>Go to {role} Panel</p>
      </div>
    ))}
  </div>
</div>

      </div>

  );
}

export default MyTasks;
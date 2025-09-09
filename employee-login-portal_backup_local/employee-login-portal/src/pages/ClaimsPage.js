import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClaimsPage.css';

function ClaimsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalClaims: 0,
    approved: 0,
    rejected: 0,
    paidAmount: 0
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const [searchTerm, setSearchTerm] = useState('');

  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    if (employeeId) {
      fetch(`/claims/summary/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          setSummary({
            totalClaims: data.totalClaims || 0,
            approved: data.approved || 0,
            rejected: data.rejected || 0,
            paidAmount: data.paidAmount || 0
          });
        })
        .catch(err => console.error("Error fetching summary:", err));
    }
  }, [employeeId]);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

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
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      if (data.profilePic) {
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
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
    <h3>
                  <Link to="/dashboard" className="side" style={{ textDecoration: 'none',color: 'rgba(255, 255, 255, 0.7)'}}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px',color: 'rgba(255, 255, 255, 0.7)'}}>
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
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="top-header">
          <h2>Welcome, {employeeName} ({employeeId})</h2>
          <div className="header-right" style={{ position: 'relative' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" />

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
                    width: '150px'
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
                      borderBottom: '1px solid #eee'
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
                      cursor: 'pointer'
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

<div style={{ marginTop: "40px" }}>
          <h2 className="title">Your Claim Updates</h2>
         <div
  className="quick-actions-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",  // 4 columns in one row
    gap: "16px",
    marginTop: "10px",
    padding: "0 20px",
    boxSizing: "border-box",
    width: "100%",
     marginBottom: "40px",
  }}
>
  <div
    className="twi"
    style={{
      display: "contents", // so inner action-boxes become grid items directly
    }}
  >
    <div
      className="action-box light-purple"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#f3ecff", // light-purple background
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon">📝</div>
      <div>
        <h3>Total Claims Raised</h3>
        <p>{summary.totalClaims}</p>
      </div>
    </div>

    <div
      className="action-box light-green"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#e4f8e9", // light-green background
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon">✅</div>
      <div>
        <h3>Approved</h3>
        <p>{summary.approved}</p>
      </div>
    </div>

    <div
      className="action-box light-Gray cardcolor3"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#f5f5f5", // light gray
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon">❌</div>
      <div>
        <h3>Rejected</h3>
        <p>{summary.rejected}</p>
      </div>
    </div>

    <div
      className="action-box light-purple cardcolor4"
      style={{
        cursor: "default",
        transition: "none",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
        borderRadius: "12px",
        background: "#f3ecff",
        minHeight: "120px",
        justifyContent: "space-between",
      }}
    >
      <div className="icon">₹</div>
      <div>
        <h3>Paid Amount</h3>
        <p>₹{Math.floor(summary.paidAmount)}</p>
      </div>
    </div>
  </div>
</div>




          <br />

          <h2 className="title" style={{ marginBottom: "40px" }}>Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="action-box light-blue" onClick={() => navigate("/claims/new")}>
              <div className="icon">₹</div>
              <div>
                <h3>New Claims</h3>
                <p>Create a new claim for reimbursement</p>
              </div>
              <div className="arrow">→</div>
            </div>

            <div className="action-box light-green" onClick={() => navigate("/claims/status")}>
              <div className="icon">📜</div>
              <div>
                <h3>Claim Status</h3>
                <p>Track your current claims</p>
              </div>
              <div className="arrow">→</div>
            </div>

            <div className="action-box light-yellow" onClick={() => navigate("/claims/history")}>
              <div className="icon">📊</div>
              <div>
                <h3>Claims History</h3>
                <p>View your past claims</p>
              </div>
              <div className="arrow">→</div>
            </div>

        <div className="action-box saved-drafts" onClick={() => navigate("/drafts")}>
          <div className="icon">💾</div>
          <div>
            <h3>Saved Drafts</h3>
            <p>Save your claims as drafts</p>
          </div>
          <div className="arrow">→</div>
        </div>

            <div className="action-box light-orange" onClick={() => navigate("/task")}>
              <div className="icon">🧾</div>
              <div>
                <h3>My Tasks</h3>
                <p>View all claim tasks</p>
              </div>
              <div className="arrow">→</div>
            </div>

            <div className="action-box light-purple">
              <div className="icon">📘</div>
              <div>
                <h3>Policy Guidelines</h3>
                <p>Understand your benefits</p>
              </div>
              <div className="arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimsPage;

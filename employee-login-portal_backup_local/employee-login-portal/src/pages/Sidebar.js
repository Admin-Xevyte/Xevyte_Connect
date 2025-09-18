import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

const Sidebar = ({ children }) => {
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
  const location = useLocation();
  const allowedUsers = ["H100646", "H100186", "H100118", "EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);

  const toggleContractMenu = () => {
    setIsContractOpen(!isContractOpen);
  };

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

  const getLinkStyle = (path) => {
  const currentPath = location.pathname;
  let isActive = false;

  const modulePaths = {
    '/home0': ['/new', '/claims/status', '/claims/history', '/drafts', '/task', '/manager-dashboard', '/finance-dashboard', '/finance'],
    '/home1': ['/mngtime', '/mngreq', '/hrgreq', '/timesheets', '/mytimesheets', '/myteam1'],
    '/home7': ['/manager/tasks', '/hr/tasks', '/saved-drafts', '/leave-history', '/myteam2'],
    '/home10': ['/goals', '/selfassessment', '/myteam', '/myteam/newgoal', '/managergoals', '/reviewer', '/employeegoal', '/inprogressgoals', '/submittedgoals', '/rejectedgoals', '/pendinggoals', '/reviewergoals', '/hrgoals', '/finalhrgoals', '/submitfeedback', '/goalhistory'],
    '/home12': ['/myteam3'],
  };

  const associatedPaths = modulePaths[path] || [];

  if (associatedPaths.includes(currentPath) || currentPath === path) {
    isActive = true;
  }

  return {
    textDecoration: 'none',
    color: isActive ? 'white' : '#00b4c6',
  };
};
  const getSubLinkStyle = (path) => {
    const currentPath = location.pathname;
    let isActive = currentPath.startsWith(path);
    
    return {
      textDecoration: 'none',
      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      display: 'block',
      padding: '4px 0',
    };
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
              style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px", fill: '#00b4c6' }}
            />
            <h3>
              <Link
                to="/dashboard"
                className="side"
                style={getLinkStyle('/dashboard')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Home
                </span>
              </Link>
            </h3>

            <h3>
              <Link to="/home0" className="side" style={getLinkStyle('/home0')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Claims</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home1" className="side" style={getLinkStyle('/home1')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Time Sheet</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home2" className="side" style={getLinkStyle('/home2')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Employee Handbook</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home3" className="side" style={getLinkStyle('/home3')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Employee Directory</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home4" className="side" style={getLinkStyle('/home4')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Exit Management</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home5" className="side" style={getLinkStyle('/home5')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Holiday Calendar</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home6" className="side" style={getLinkStyle('/home6')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Helpdesk</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home7" className="side" style={getLinkStyle('/home7')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Leaves</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home9" className="side" style={getLinkStyle('/home9')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Pay slips</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home10" className="side" style={getLinkStyle('/home10')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Performance</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home11" className="side" style={getLinkStyle('/home11')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Training</span>
              </Link>
            </h3>

            <h3>
              <Link to="/home12" className="side" style={getLinkStyle('/home12')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Travel</span>
              </Link>
            </h3>
            {allowedUsers.includes(employeeId) && (
              <>
                <h3 onClick={toggleContractMenu} style={{ cursor: 'pointer' }}>
                  <span
                    className="side"
                    style={{
                      color: isContractOpen ? 'white' : '#00b4c6'
                    }}
                  >
                    Contract Management {isContractOpen ? '▾' : '▸'}
                  </span>
                </h3>

                {isContractOpen && (
                  <ul style={{ listStyle: 'disc', paddingLeft: '16px', marginTop: '4px' }}>
                    <li style={{ marginBottom: '4px', marginLeft: '60px' }}>
                      <Link
                        to="/customers"
                        style={getSubLinkStyle('/customers')}
                        onMouseOver={(e) => (e.target.style.color = '#fff')}
                        onMouseOut={(e) => {
                          if (!location.pathname.startsWith('/customers')) {
                            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                          }
                        }}
                      >
                        Customers
                      </Link>
                    </li>
                    <li style={{ marginBottom: '4px', marginLeft: '60px' }}>
                      <Link
                        to="/sows"
                        style={getSubLinkStyle('/sows')}
                        onMouseOver={(e) => (e.target.style.color = '#fff')}
                        onMouseOut={(e) => {
                          if (!location.pathname.startsWith('/sows')) {
                            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                          }
                        }}
                      >
                        SOWs
                      </Link>
                    </li>
                    <li style={{ marginBottom: '4px', marginLeft: '60px' }}>
                      <Link
                        to="/projects"
                        style={getSubLinkStyle('/projects')}
                        onMouseOver={(e) => (e.target.style.color = '#fff')}
                        onMouseOut={(e) => {
                          if (!location.pathname.startsWith('/projects')) {
                            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                          }
                        }}
                      >
                        Projects
                      </Link>
                    </li>
                    <li style={{ marginBottom: '4px', marginLeft: '60px' }}>
                      <Link
                        to="/allocation"
                        style={getSubLinkStyle('/allocation')}
                        onMouseOver={(e) => (e.target.style.color = '#fff')}
                        onMouseOut={(e) => {
                          if (!location.pathname.startsWith('/allocation')) {
                            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                          }
                        }}
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

            {/* Profile picture with dropdown */}
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

              {/* Success message */}
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

              {/* Hidden file input */}
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

        {children}
      </div>
    </div>
  );
};

export default Sidebar;

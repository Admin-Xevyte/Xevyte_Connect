import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
 
// Move the ClickableCard component outside the main component
const ClickableCard = () => {
  const navigate = useNavigate();
 
  return (
    // Your ClickableCard JSX here
    // It's not clear from your original code what this component should render
    // but its definition needs to be at the top level.
    <div>
      {/* ... */}
    </div>
  );
};
 
const SummaryCard = ({ title, count, color, text, onClick }) => (
  <div
    onClick={onClick}
    style={{
      flex: '1 1 150px',
      backgroundColor: color,
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <h4>{title}</h4>
    <p
      style={{
        fontSize: '2rem',
        margin: '0.5rem 0',
        color: text,
        fontWeight: 'bold',
      }}
    >
      {count}
    </p>
    <p>{title.includes('Goals') ? 'Goals' : 'Items'}</p>
  </div>
);
 
const EmployeeGoals = () => {
  const navigate = useNavigate();
  const location = useLocation();
   const employeeId = localStorage.getItem("employeeId");
  // ✅ Logged-in employee (from localStorage)
  const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
 
  // ✅ Selected employee (from navigation or localStorage)
  const initialSelectedEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId') || '';
  const initialSelectedEmployeeName = location.state?.employeeName || localStorage.getItem('selectedEmployeeName') || '';
 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);
 
  const reviewerId = location.state?.reviewerId;
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);
 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
 const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
   const [isContractOpen, setIsContractOpen] = useState(false);
 
 const toggleContractMenu = () => {
   setIsContractOpen(!isContractOpen);
 };
  const getCurrentQuarter = () => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  };
  const currentQuarter = getCurrentQuarter();
 
  const fetchGoals = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`http://3.7.139.212:8080/api/goals/employee/${selectedEmployeeId}`)
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Fetch failed: ${res.status} ${res.statusText} – ${msg}`);
        }
        if (!ct.includes('application/json')) {
          throw new Error('Non‑JSON response from server');
        }
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((g) => g.quarter === currentQuarter);
        setGoals(filtered);
        if (filtered.every((g) => g.status.toLowerCase() === 'reviewed')) {
          setReviewed(true);
        } else {
          setReviewed(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  }, [selectedEmployeeId, currentQuarter]);
 
 
useEffect(() => {
  if (selectedEmployeeId) {
    // Corrected fetch URL
    fetch(`http://3.7.139.212:8080/api/goals/${selectedEmployeeId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Employee fetch response:", data);
       
        // Correctly access the name property from the returned object
        const name = data?.name;
       
        if (name) {
          setSelectedEmployeeName(name);
          localStorage.setItem('selectedEmployeeName', name);
        } else {
          console.error('Employee name not found in API response:', data);
          setSelectedEmployeeName('Unknown Employee');
        }
      })
      .catch(err => {
        console.error('Failed to fetch employee name:', err);
        setError('Failed to load employee details.');
        setSelectedEmployeeName('Unknown Employee');
      });
  } else {
    console.warn('No selectedEmployeeId found');
  }
}, [selectedEmployeeId]);
 
 
 
  // Fetch goals on mount
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchGoals();
    } else {
      setError('Employee ID missing in navigation state.');
      setLoading(false);
    }
  }, [selectedEmployeeId, fetchGoals]);
 
  // Fetch updated profile info on mount
  useEffect(() => {
    if (loggedInEmployeeId) {
      fetch(`http://3.7.139.212:8080/profile/${loggedInEmployeeId}`)
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
  }, [loggedInEmployeeId]);
 
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
      const res = await fetch(`http://3.7.139.212:8080/profile/update/${loggedInEmployeeId}`, {
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
 
  const toggleComments = async (goalId) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
 
    if (!comments[goalId]) {
      try {
        const res = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`);
        if (!res.ok) throw new Error("Failed to fetch comments");
        const data = await res.json();
        setComments((prev) => ({ ...prev, [goalId]: data }));
      } catch (err) {
        console.error(err);
        setComments((prev) => ({ ...prev, [goalId]: [] }));
      }
    }
  };
 
  const handleReview = async () => {
    try {
      const goalIds = goals.map(goal => goal.goalId);
      const response = await fetch('http://3.7.139.212:8080/api/goals/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds, status: 'reviewed' }),
      });
 
      if (!response.ok) {
        throw new Error('Failed to review goals');
      }
 
      const data = await response.json();
      console.log('Goals reviewed:', data);
      // Re-fetch goals to update the UI
      fetchGoals();
    } catch (error) {
      console.error(error);
    }
  };
 
  const handleSubmitFeedback = () => {
    navigate('/submitfeedback', {
      state: {
        selectedEmployeeId,
        reviewerId,
        goals,
      },
    });
  };
 
 
const validStatuses = ['submitted', 'rejected'];
  const submitFeedbackCount = goals.filter((g) => g.status?.toLowerCase() === 'submitted').length;
  const inProgressCount = goals.filter((g) =>
    ['inprogress', 'in progress'].includes(g.status?.toLowerCase())
  ).length;
  const rejectedCount = goals.filter((g) => g.status?.toLowerCase() === 'rejected').length;
  const pendingCount = goals.filter((g) => g.status?.toLowerCase() === 'pending').length;
  const filteredGoals = goals.filter((g) => validStatuses.includes(g.status?.toLowerCase()));
 
  const thStyle = {
    textAlign: 'left',
    padding: '3px',
    borderBottom: '2px solid darkblue',
    color: 'white',
    backgroundColor: 'darkblue',
    fontSize:"15px"
  };
 
  const tdStyle = {
    padding: '8px',
  };
 
  const buttonStyle = {
    padding: '0.4rem 1rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
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
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({loggedInEmployeeId})</h2>
 
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
 
       <h2 style={{textAlign:"Center"}}>Goals for {selectedEmployeeName} ({selectedEmployeeId})</h2>
 
 
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <main
            style={{
              padding: '1rem',
              overflowY: 'auto',
              flexGrow: 1,
              backgroundColor: '#f4f4f4',
            }}
          >
           <div
  style={{
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  }}
>
  {/* 1. The "New Goal" Card */}
  <div
    onClick={() => navigate('/myteam/newgoal')}
    style={{
      flex: '1 1 200px',
      backgroundColor: '#b4e7f5ff',
      border: '1px dashed #007bff',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center',
      minHeight: '150px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s ease-in-out',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <h3>🎯 Set a New Team Goal</h3>
    <p style={{ marginTop: '0.5rem', color: '#007bff', fontWeight: 'bold' }}>
      + Add Goal
    </p>
  </div>
 
  {/* 2. "In Progress Goals" Card */}
  <div
    style={{
      flex: '1 1 200px',
      minHeight: '150px',
      display: 'flex',
    }}
  >
    <SummaryCard
      title="In Progress Goals"
      count={inProgressCount}
      color="#fff3e0"
      text="#e2a55aff"
      onClick={() => navigate('/inprogressgoals')}
    />
  </div>
 
  {/* 3. "Pending Goals" Card */}
  <div
    style={{
      flex: '1 1 200px',
      minHeight: '150px',
      display: 'flex',
    }}
  >
    <SummaryCard
      title="Pending Goals"
      count={pendingCount}
      color="#fffde7"
      text="#fbc02d"
    />
  </div>
 
  {/* 4. "Rejected Goals" Card */}
  <div
    style={{
      flex: '1 1 200px',
      minHeight: '150px',
      display: 'flex',
    }}
  >
    <SummaryCard
      title="Rejected Goals"
      count={rejectedCount}
      color="#ffebee"
      text="#e53935"
      onClick={() => navigate('/rejectedgoals')}
    />
  </div>
</div>
 
 
            {loading ? (
              <p style={{ textAlign: 'center' }}>Loading goals...</p>
            ) : (
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                <h3  style={{ marginBottom: "16px" }}>Goals</h3>
                 <div
                      style={{
                        maxHeight: '300px', // Set a specific max height for vertical scrolling
                        overflowY: 'auto', // Enables vertical scroll
                        overflowX: 'auto', // Enables horizontal scroll
                        border: '1px solid #ddd',
                      }}
                    >
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                   
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: "10%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Title</th>
                        {/* <th style={thStyle}>Goal ID</th> */}
                        <th style={{...thStyle, textAlign:"Center"}}>Description</th>
                        {/* <th style={thStyle}>Quarter</th> */}
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Weightage</th>
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Target</th>
                        <th style={{ ...thStyle, width: "5%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Self Rating</th>
                        <th style={{ ...thStyle, width: "15%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Self Assessment</th>
                        {/* <th style={thStyle}>Additional Notes</th>
                        <th style={thStyle}>Comments By Employee</th> */}
                        <th style={{ ...thStyle, width: "2%",backgroundColor: "darkblue", color: "white", textAlign:"Center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGoals.map((g) => (
                        <tr key={g.goalId} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{
                            maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            textAlign:"center"
                          }}>{g.goalTitle}</td>
                         
                          {/* <td style={tdStyle}>{g.goalId}</td> */}
                          <td style={{
                          maxWidth: '500px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {g.goalDescription}
                        </td>
                          {/* <td style={tdStyle}>{g.quarter}</td> */}
                           <td style={{tdStyle, textAlign:"center"}}>{g.metric}</td>
                          <td style={{tdStyle, textAlign:"center"}}>{g.target}</td>
                         
                          <td style={{tdStyle, textAlign:"center"}}>{g.rating ?? '-'}</td>
                         <td style={{ ...tdStyle, width: '200px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {g.selfAssessment ?? '-'}
      </td>
                          {/* <td style={tdStyle}>{g.additionalNotes ?? '-'}</td> */}
                          {/* <td style={tdStyle}>
                            <button
                              onClick={() => toggleComments(g.goalId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'black' }}
                              title="Toggle Comments"
                            >
                              {expandedGoals[g.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                            </button>
 
                            {expandedGoals[g.goalId] && (
                              <div
                                style={{
                                  marginTop: '0.5rem',
                                  padding: '0.5rem',
                                  backgroundColor: '#f9f9f9',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  maxHeight: '150px',
                                  overflowY: 'auto',
                                }}
                              >
                                {comments[g.goalId]?.length ? (
                                  comments[g.goalId].map((c, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        padding: '0.3rem 0',
                                        borderBottom: '1px solid #eee',
                                        fontSize: '0.9rem',
                                        color: '#333',
                                      }}
                                    >
                                      <strong>{index + 1}.</strong> {c.commentText}
                                      <br />
                                      <small style={{ color: '#777' }}>{new Date(c.commentedAt).toLocaleString()}</small>
                                    </div>
                                  ))
                                ) : (
                                  <p style={{ fontStyle: 'italic', color: '#666' }}>No comments.</p>
                                )}
                              </div>
                            )}
                          </td> */}
                        <td style={tdStyle}>
                          <em>{g.status}</em>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!reviewed && (
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button onClick={handleSubmitFeedback} style={buttonStyle}>
                      Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
 
export default EmployeeGoals;
 

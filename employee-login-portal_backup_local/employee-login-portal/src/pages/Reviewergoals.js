import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

function ReviewerApprovedGoalsWithLayout() {
  // ===== PERFORMANCE (Sidebar + Topbar) STATE =====
  const employeeIdStored = localStorage.getItem("employeeId");
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
  const [canViewTasks, setCanViewTasks] = useState(false);
  const toggleContractMenu = () => {
    setIsContractOpen(!isContractOpen);
  };
  
  // ===== REVIEWER APPROVED GOALS STATE =====
  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [allGoals, setAllGoals] = useState([]);
  const [approvedGoals, setApprovedGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [reviewerCommentsMap, setReviewerCommentsMap] = useState({});
  const [savingComments, setSavingComments] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});
  const thStyle = { padding: '8px' };
  const tdStyle = { padding: '8px' };

  // ===== PERFORMANCE: Fetch profile info =====
  useEffect(() => {
    if (employeeIdStored) {
      fetch(`/profile/${employeeIdStored}`)
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
  }, [employeeIdStored]);

  // ===== PERFORMANCE: Close profile dropdown on outside click =====
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
      const res = await fetch(`/profile/update/${employeeIdStored}`, {
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
      alert("Error uploading profile picture.");
    }
  };

  // ===== REVIEWER APPROVED GOALS: Fetch Goals =====
  useEffect(() => {
    if (!employeeId) {
      setError('No employee ID provided.');
      setLoading(false);
      return;
    }
    fetchGoals();
  }, [employeeId]);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      const response = await fetch(`/api/goals/employee/${employeeId}`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch goals: ${await response.text()}`);
      const data = await response.json();
      setAllGoals(data);
      const approved = data.filter(goal => goal.status?.toLowerCase() === 'reviewed');
      setApprovedGoals(approved);
      const initialCommentsMap = {};
      approved.forEach(goal => { initialCommentsMap[goal.goalId] = goal.reviewerComments || ''; });
      setReviewerCommentsMap(initialCommentsMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = async (goalId) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
    if (comments[goalId]) return;
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      const response = await fetch(`/api/goals/${goalId}/comments`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`Failed to fetch comments: ${await response.text()}`);
      const data = await response.json();
      setComments(prev => ({ ...prev, [goalId]: data }));
    } catch {
      setComments(prev => ({ ...prev, [goalId]: [] }));
    }
  };

  const saveReviewerComments = async () => {
    setSavingComments(true);
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      for (const [goalId, reviewerComments] of Object.entries(reviewerCommentsMap)) {
        const response = await fetch(`/api/goals/${goalId}/reviewer-comments`, {
          method: 'PUT',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewerComments }),
        });
        if (!response.ok) throw new Error(`Failed to update goal ${goalId}`);
      }
    } finally {
      setSavingComments(false);
    }
  };

  const updateAllGoalsStatus = async (newStatus) => {
    if (batchUpdating) return;
    if (approvedGoals.length === 0) return alert('No goals available for update.');
    setBatchUpdating(true);
    try {
      await saveReviewerComments();
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;
      const goalIds = approvedGoals.map(goal => goal.goalId);
      const response = await fetch(`/api/goals/review`, {
        method: 'PATCH',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds, status: newStatus }),
      });
      if (!response.ok) throw new Error(`Failed to update goals status`);
      alert(`Updated ${goalIds.length} goals to "${newStatus}".`);
      setApprovedGoals([]);
    } catch (err) {
      alert(`Error during update: ${err.message}`);
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleCommentChange = (goalId, value) => {
    setReviewerCommentsMap(prev => ({ ...prev, [goalId]: value }));
  };

  // Filter goals based on the search term
  const filteredGoals = approvedGoals.filter(goal => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      goal.goalTitle?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.goalDescription?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.quarter?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.metric)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.target)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.rating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.selfAssessment?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.additionalNotes?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.achievedTarget)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.managerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.managerRating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.reviewerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.goalId)?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const cellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
    verticalAlign: 'top',
  };

  return (
    <div className="dashboard-container">
      {/* ===== SIDEBAR ===== */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
            <h3>
              <Link to="/dashboard" className="side" style={{ textDecoration: 'none', color: '#00b4c6' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Home</span>
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
                  <span className="side" style={{ color:'#00b4c6' }}>
                    Contract Management {isContractOpen ? '▾' : '▸'}
                  </span>
                </h3>
                {isContractOpen && (
                  <ul style={{ listStyle: 'disc', paddingLeft: '16px', marginTop: '4px' ,}}>
                    <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                      <Link to="/customers" style={{ textDecoration: 'none', color:'#00b4c6', fontSize: '14px', display: 'block', padding: '4px 0' }} onMouseOver={(e) => (e.target.style.color = '#fff')} onMouseOut={(e) => (e.target.style.color = '#00b4c6')}>
                        Customers
                      </Link>
                    </li>
                    <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                      <Link to="/sows" style={{ textDecoration: 'none', color:'#00b4c6', fontSize: '14px', display: 'block', padding: '4px 0' }} onMouseOver={(e) => (e.target.style.color = '#fff')} onMouseOut={(e) => (e.target.style.color = '#00b4c6')}>
                        SOWs
                      </Link>
                    </li>
                    <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                      <Link to="/projects" style={{ textDecoration: 'none', color:'#00b4c6', fontSize: '14px', display: 'block', padding: '4px 0' }} onMouseOver={(e) => (e.target.style.color = '#fff')} onMouseOut={(e) => (e.target.style.color = '#00b4c6')}>
                        Projects
                      </Link>
                    </li>
                    <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                      <Link to="/allocation" style={{ textDecoration: 'none', color:'#00b4c6', fontSize: '14px', display: 'block', padding: '4px 0' }} onMouseOver={(e) => (e.target.style.color = '#fff')} onMouseOut={(e) => (e.target.style.color = '#00b4c6')}>
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
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-content">
        {/* ===== TOPBAR ===== */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeIdStored})</h2>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" style={{ cursor: 'pointer' }} />
            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img src={profilePic} alt="Profile" className="profile-pic" onClick={toggleProfileMenu} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%' }} />
              {profileOpen && (
                <div ref={profileDropdownRef} className="profile-dropdown" style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', zIndex: 1000, width: '150px' }}>
                  <button onClick={handleEditProfile} style={{ display: 'block', width: '100%', padding: '10px', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px' }}>Logout</button>
                </div>
              )}
              {successMessage && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px' }}>{successMessage}</div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

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

        {/* ===== REVIEWER APPROVED GOALS CONTENT BELOW DIVIDER ===== */}
        <div style={{ padding: '20px' }}>
          <h2>Goals for Employee ID: <span style={{ padding: '2px 6px' }}>{employeeId}</span></h2>
          {loading && <p>Loading goals...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <div
              style={{
                maxHeight: 'calc(100vh - 350px)',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'block',
                width: '100%',
              }}
            >
              <table
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  tableLayout: 'fixed',
                  wordWrap: 'break-word',
                  marginTop: 0,
                  border: '1px solid #ddd',
                }}
              >
                <thead
                  style={{
                    backgroundColor: 'darkblue',
                    color: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Title</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Description</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '110px' }}>Weightage</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>Target</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>Self Rating</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Self Assessment</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>MNG Comments</th>
                    <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>MNG Rating</th>
                    <th style={{ backgroundColor: 'darkblue' }}>Reviewer Comments <span style={{ color: "red" }}>*</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.length > 0 ? (
                    filteredGoals.map((goal) => (
                      <tr key={goal.goalId}>
                        <td style={cellStyle}>{goal.goalTitle}</td>
                        <td style={cellStyle}>{goal.goalDescription}</td>
                        <td style={cellStyle}>{goal.metric}</td>
                        <td style={cellStyle}>{goal.target}</td>
                        <td style={cellStyle}>{goal.rating}</td>
                        <td style={cellStyle}>{goal.selfAssessment}</td>
                        <td style={cellStyle}>{goal.managerComments}</td>
                        <td style={cellStyle}>{goal.managerRating}</td>
                        <td style={cellStyle}>
                          <textarea
                            value={reviewerCommentsMap[goal.goalId] || ''}
                            onChange={(e) => handleCommentChange(goal.goalId, e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              resize: 'none',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              lineHeight: '1.4',
                              fontFamily: 'inherit',
                            }}
                            maxLength={200}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', border: '1px solid #ddd', padding: '10px' }}>
                        No goals found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && approvedGoals.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => updateAllGoalsStatus('approved')}
                disabled={batchUpdating}
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  cursor: batchUpdating ? 'not-allowed' : 'pointer',
                  opacity: batchUpdating ? 0.6 : 1,
                  borderRadius: '4px',
                }}
              >
                Approve All Goals
              </button>
              <button
                onClick={() => updateAllGoalsStatus('rejected')}
                disabled={batchUpdating}
                style={{
                  backgroundColor: "#dc3545",
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  cursor: batchUpdating ? 'not-allowed' : 'pointer',
                  opacity: batchUpdating ? 0.6 : 1,
                  borderRadius: '4px',
                }}
              >
                Reject All Goals
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewerApprovedGoalsWithLayout;

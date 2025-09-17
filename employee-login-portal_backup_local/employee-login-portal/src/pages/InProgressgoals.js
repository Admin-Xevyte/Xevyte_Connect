import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

function EmployeeGoalDetails() {
  // ===== Sidebar / Topbar state & logic (from Performance) =====
  const employeeIdFromStorage = localStorage.getItem("employeeId");
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
 
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};

  const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

  useEffect(() => {
    if (employeeIdFromStorage) {
      fetch(`http://3.7.139.212:8080/profile/${employeeIdFromStorage}`)
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
  }, [employeeIdFromStorage]);

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
      const res = await fetch(`http://3.7.139.212:8080/profile/update/${employeeIdFromStorage}`, {
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

  // ===== Original EmployeeGoalDetails state & logic =====
  const location = useLocation();
  const thStyle = { padding: '8px',backgroundColor:"darkblue" , textAlign:"center"};
  const tdStyle = { padding: '8px', textAlign:"center" };

  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});

  const toggleComments = async (goalId) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));

    if (comments[goalId]) return;

    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found');

      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }

      const token = `Bearer ${rawToken}`;
      const response = await fetch(`http://3.7.139.212:8080/api/goals/${goalId}/comments`, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch comments: ${response.status} - ${text}`);
      }

      const data = await response.json();
      setComments(prev => ({ ...prev, [goalId]: data }));
    } catch (error) {
      console.error(error.message);
      setComments(prev => ({ ...prev, [goalId]: [] }));
    }
  };

  useEffect(() => {
    if (location.state?.employeeId && location.state.employeeId !== employeeId) {
      setEmployeeId(location.state.employeeId);
    }
  }, [location.state?.employeeId, employeeId]);

  useEffect(() => {
    if (employeeId) {
      localStorage.setItem('selectedEmployeeId', employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) {
      setError('Selected employee ID not found.');
      setLoading(false);
      return;
    }

    const fetchEmployeeGoals = async () => {
      try {
        let rawToken = localStorage.getItem('token');

        if (!rawToken) {
          throw new Error('No token found in localStorage. Please login.');
        }

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;
        const response = await fetch(`http://3.7.139.212:8080/api/goals/employee/${employeeId}`, {
          method: 'GET',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching goals: ${response.status} - ${text}`);
        }

        const data = await response.json();
        setGoals(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeGoals();
  }, [employeeId]);

  const pendingGoals = goals.filter(goal => goal.status?.toLowerCase() === 'in progress');

  // New: Filter goals based on the search term
  const filteredGoals = pendingGoals.filter(goal => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (goal.goalId && String(goal.goalId).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.status && goal.status.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.startDate && goal.startDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.endDate && goal.endDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.targetDate && goal.targetDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.quarter && goal.quarter.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.metric && String(goal.metric).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.target && String(goal.target).toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Check for comments if they exist
      (comments[goal.goalId]?.some(comment => comment.commentText.toLowerCase().includes(lowerCaseSearchTerm)))
    );
  });

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
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
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeIdFromStorage})</h2>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" style={{ cursor: 'pointer' }} />

            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img src={profilePic} alt="Profile" className="profile-pic" onClick={toggleProfileMenu} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              {profileOpen && (
                <div ref={profileDropdownRef} className="profile-dropdown" style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', zIndex: 1000, width: '150px' }}>
                  <button onClick={handleEditProfile} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Logout</button>
                </div>
              )}
              {successMessage && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  {successMessage}
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
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

        {/* Original EmployeeGoalDetails workflow */}
        <div style={{ padding: '20px' }}>
          <div
            className="header"
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p  style={{ marginBottom: "-26px" , marginLeft:"-20px", marginTop:"-30px"}}>
              Goals for Employee ID:{' '}
              <span >{employeeId}</span>
            </p>
           
          </div>

          {loading && <p>Loading goals...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!loading && !error && filteredGoals.length === 0 && (
            <p>No pending goals found for this employee matching your search criteria.</p>
          )}

          {!loading && !error && filteredGoals.length > 0 && (
            <div
              style={{
                // maxHeight: 'calc(100vh-50vh)', 
                maxHeight: '50vh',// fixed table height
                overflowY: 'auto',
                border: '1px solid #ddd',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                }}
              >
                <thead
                  style={{
                    backgroundColor: '#007BFF',
                    color: 'black',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    {/* <th style={thStyle}>Quarter</th>
                    <th style={thStyle}>Goal ID</th> */}
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Weightage</th>
                    <th style={thStyle}>Target</th>
                    {/* <th style={thStyle}>Status</th> */}
                   <th style={{ ...thStyle, width: "15%" }}>Start Date</th>
<th style={{ ...thStyle, width: "15%" }}>End Date</th>
                    {/* <th style={thStyle}>Comments By Employee</th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal) => (
                    <tr
                      key={goal.goalId}
                      style={{
                        borderBottom: '1px solid #ddd',
                        textAlign: 'center',
                      }}
                    >
                      {/* <td style={tdStyle}>{goal.quarter}</td>
                      <td style={tdStyle}>{goal.goalId}</td> */}
                      <td style={{tdStyle, maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'}}>{goal.goalTitle}</td>
                      <td style={{tdStyle, maxWidth: '500px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'}}>{goal.goalDescription}</td>
                      <td style={tdStyle}>{goal.metric}</td>
                      <td style={tdStyle}>{goal.target}</td>
                      {/* <td
                        style={{
                          ...tdStyle,
                          color: '#FF8C00',
                          fontWeight: 'bold',
                        }}
                      >
                        {goal.status}
                      </td> */}
                     <td style={{ ...tdStyle, width: "15%" }}>{formatDate(goal.startDate)}</td>
<td style={{ ...tdStyle, width: "15%" }}>{formatDate(goal.endDate)}</td>
                      {/* <td style={tdStyle}>
                        <button
                          onClick={() => toggleComments(goal.goalId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color:"black",
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                        >
                          {expandedGoals[goal.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                        </button>
                        {expandedGoals[goal.goalId] && (
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
                            {comments[goal.goalId]?.length ? (
                              comments[goal.goalId].map((c, index) => (
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
                                  <small style={{ color: '#777' }}>
                                    {new Date(c.commentedAt).toLocaleString()}
                                  </small>
                                </div>
                              ))
                            ) : (
                              <p
                                style={{
                                  fontStyle: 'italic',
                                  color: '#666',
                                }}
                              >
                                No comments.
                              </p>
                            )}
                          </div>
                        )}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeGoalDetails;

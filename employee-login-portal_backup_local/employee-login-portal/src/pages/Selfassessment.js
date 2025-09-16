import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Dashboard.css';
 
// Style constants
const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f2f2f2",
  color: "black"
};
const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px"
};
 
const MyGoals = () => {
  // Profile/Sidebar states
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
const [selfAssessments, setSelfAssessments] = useState([]);
  const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
    const [isContractOpen, setIsContractOpen] = useState(false);
  
  const toggleContractMenu = () => {
    setIsContractOpen(!isContractOpen);
  };
  // MyGoals logic
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [goalInputs, setGoalInputs] = useState({});
  const [assessmentIds, setAssessmentIds] = useState({});
 
  const [filteredGoals, setFilteredGoals] = useState([]); // State for filtered goals
 
  const fetchGoals = () => {
    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/goals/employee/${employeeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch goals");
        return res.json();
      })
      .then((data) => {
        setGoals(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };
 
 
 
  const inProgressGoals = React.useMemo(() => {
  return goals.filter(goal => goal.status?.toLowerCase() === "in progress");
}, [goals]);
  // The 'activeGoals' state is not used in the render or logic, so it's commented out for clarity.
  // const activeGoals = goals.filter(goal =>
  //   goal.status?.toLowerCase() === "pending" || goal.status?.toLowerCase() === "new"
  // );
 
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const tempFilteredGoals = inProgressGoals.filter(goal => {
      return (
        (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.quarter && goal.quarter.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.metric && String(goal.metric).toLowerCase().includes(lowercasedSearchTerm)) || // Ensure metric is a string for search
        (goal.target && String(goal.target).toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.goalId && String(goal.goalId).toLowerCase().includes(lowercasedSearchTerm))
      );
    });
    setFilteredGoals(tempFilteredGoals);
  }, [searchTerm, inProgressGoals]);
 
  useEffect(() => {
    if (inProgressGoals.length > 0) {
      setGoalInputs(prevInputs => {
        const newInputs = { ...prevInputs };
        inProgressGoals.forEach(g => {
          if (!newInputs[g.goalId]) {
            newInputs[g.goalId] = {
              rating: g.rating || "",
              selfAssessment: g.selfAssessment || "",
              additionalInfo: g.additionalInfo || "",
            };
          }
        });
        return newInputs;
      });
    }
  }, [inProgressGoals]);
 
  const handleRatingChange = (e, goalId) => {
    const val = e.target.value;
    if (val === "" || (/^[1-5]$/).test(val)) {
      setGoalInputs((prev) => ({
        ...prev,
        [goalId]: { ...prev[goalId], rating: val }
      }));
    }
  };
 
  const handleSaveAll = async () => {
  setIsSaving(true);
  let rawToken = localStorage.getItem("token");
  if (rawToken?.startsWith('"')) rawToken = rawToken.slice(1, -1);
  const token = `Bearer ${rawToken}`;
 
  try {
    for (const goal of inProgressGoals) {
      const data = goalInputs[goal.goalId];
      const existingId = assessmentIds[goal.goalId]; // Get existing ID
 
      const dto = {
  id: existingId || null,
  employeeId: employeeId,
   goalId: goal.goalId,// 👈 Add this
  title: goal.goalTitle,
  description: goal.goalDescription,
  weightage: goal.metric,
  target: goal.target,
  selfRating: data?.rating || "",
  selfAssessment: data?.selfAssessment || "",
};
 
      const response = await fetch("/api/self-assessments/save", {
        method: "POST", // POST is fine if backend handles upsert
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(dto),
      });
 
      if (!response.ok) {
        throw new Error(`Failed to save self-assessment for goal ID ${goal.goalId}`);
      }
 
      // If a new assessment was created, get its ID and store it
      const savedData = await response.json();
      if (!existingId && savedData.id) {
        setAssessmentIds(prevIds => ({
          ...prevIds,
          [goal.goalId]: savedData.id
        }));
      }
    }
    setSaveMessage("Self-assessment saved successfully!");
   
  } catch (err) {
    setSaveMessage("Error saving goals: " + err.message);
  } finally {
    setIsSaving(false);
  }
};
 
  const handleSubmitAll = async () => {
    setUpdating(true);
    let rawToken = localStorage.getItem("token");
    if (rawToken?.startsWith('"')) rawToken = rawToken.slice(1, -1);
    const token = `Bearer ${rawToken}`;
    try {
      for (const goal of inProgressGoals) {
        const data = goalInputs[goal.goalId];
 
        const ratingAsNumber = Number(data?.rating); // Add optional chaining for safety
        if (!data || !data.rating || isNaN(ratingAsNumber) || ratingAsNumber < 1 || ratingAsNumber > 5 || !data.selfAssessment?.trim()) { // Add optional chaining
          alert(`Please enter a valid rating (1-5) and a self-assessment for goal ID ${goal.goalId}`);
          setUpdating(false);
          return;
        }
 
        const response = await fetch(`/api/goals/${goal.goalId}/employee-feedback`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            status: "submitted",
            rating: data.rating,
            selfAssessment: data.selfAssessment,
            additionalNotes: data.additionalInfo,
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to update goal ID ${goal.goalId}`);
        }
      }
      alert("Self-assessment submitted for all goals!");
      fetchGoals();
      setGoalInputs({});
    } catch (err) {
      alert("Error submitting goals: " + err.message);
    } finally {
      setUpdating(false);
    }
  };
 
  const handleBack = () => {
    // There is no 'navigationType' defined. A simple navigate(-1) is a safer bet.
    navigate(-1);
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
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };
useEffect(() => {
  if (!employeeId) return;
 
  const fetchGoalsAndAssessments = async () => {
    try {
      setLoading(true);
 
      // 1. Fetch Goals
      const goalsRes = await fetch(`/api/goals/employee/${employeeId}`);
      if (!goalsRes.ok) throw new Error("Failed to fetch goals");
      const fetchedGoals = await goalsRes.json();
 
      // 2. Fetch Self-Assessments
      const assessmentRes = await fetch(`/api/self-assessments/employee/${employeeId}`);
      if (!assessmentRes.ok) throw new Error("Failed to fetch self-assessments");
      const fetchedAssessments = await assessmentRes.json();
 
      // 3. Set state
      setGoals(fetchedGoals);
 
      // 4. Map assessment data into goalInputs
      const inputs = {};
      const ids = {};
 
      fetchedAssessments.forEach((a) => {
        inputs[a.goalId] = {
          rating: a.selfRating || "",
          selfAssessment: a.selfAssessment || "",
          additionalInfo: a.additionalNotes || "",
        };
        ids[a.goalId] = a.id; // for future updates
      });
 
      setGoalInputs(inputs);
      setAssessmentIds(ids);
 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  fetchGoalsAndAssessments();
}, [employeeId]);
 
 
  return (
    <div className="dashboard-container" style={{ display: "flex" }}>
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
 
      {/* Main Content */}
      <div className="main-content" style={{ flexGrow: 1, padding: "20px" }}>
        {/* Header */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeId})</h2>
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
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{successMessage}</div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>
 
        <hr className="divider-line" />
 
        <button
          onClick={handleBack}
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
 
        {/* MyGoals Table (Below Divider) */}
        <div
          className="assessment-container"
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "6px",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginBottom: "16px" }}>Submit Self Assessment for In Progress Goals</h3>
          {loading ? (
            <p>Loading goals...</p>
          ) : error ? (
            <p style={{ color: "red" }}>Error: {error}</p>
          ) : filteredGoals.length === 0 ? (
            <p>No in progress goals found.</p>
          ) : (
            <>
              <div style={{ maxHeight: "450px", overflowY: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "12px"
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f2f2f2" }}>
                      <th style={{ ...thStyle, width: "10%", backgroundColor: "darkblue", color: "white", textAlign: "center" }}>Title</th>
                      <th style={{ ...thStyle, backgroundColor: "darkblue", color: "white", textAlign: "center" }}>Description</th>
                      <th style={{ ...thStyle, width: "5%", backgroundColor: "darkblue", color: "white", textAlign: "center" }}>Weightage</th>
                      <th style={{ ...thStyle, width: "2%", backgroundColor: "darkblue", color: "white", textAlign: "center" }}>Target</th>
                      <th style={{ ...thStyle, width: "2%", backgroundColor: "darkblue", color: "white", textAlign: "center" }}>
                        Self <span style={{ color: "red" }}>*</span> Rating
                      </th>
                      <th style={{ ...thStyle, width: "13%", backgroundColor: "darkblue", color: "white", textAlign: "center" }}>
                        Self <span style={{ color: "red" }}>*</span> Assessment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((g) => {
                      const inputs =
                        goalInputs[g.goalId] || {
                          rating: "",
                          selfAssessment: "",
                          additionalInfo: ""
                        };
                      return (
                        <tr key={g.goalId}>
                          <td style={{
                            ...tdStyle,
                            maxWidth: '400px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            textAlign: "center"
                          }}>{g.goalTitle}</td>
                          <td style={{
                            ...tdStyle,
                            maxWidth: '500px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>{g.goalDescription || "-"}</td>
                          <td style={tdStyle}>{g.metric}</td>
                          <td style={tdStyle}>{g.target}</td>
                          <td style={tdStyle}>
                            <input
                              type="text"
                              pattern="[1-5]"
                              maxLength="1"
                              value={inputs.rating}
                              onChange={(e) => handleRatingChange(e, g.goalId)}
                              style={{ width: "100%", fontSize: "8px" }}
                              placeholder="Rating (1-5)"
                            />
                          </td>
                          <td style={tdStyle}>
                            <textarea
                              value={inputs.selfAssessment}
                              onChange={(e) => {
                                setGoalInputs((prev) => ({
                                  ...prev,
                                  [g.goalId]: {
                                    ...prev[g.goalId],
                                    selfAssessment: e.target.value
                                  }
                                }));
                              }}
                              style={{ width: "100%", fontSize: "10px" }}
                              rows={3}
                              placeholder="Self Assessment"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  style={{
                    backgroundColor: "#28a745", // A different color for 'Save'
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {isSaving ? "Saving..." : "Save All"}
                </button>
                <button
                  onClick={handleSubmitAll}
                  disabled={updating}
                  style={{
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {updating ? "Submitting..." : "Submit Self Assessment for All"}
                </button>
              </div>
 
              {saveMessage && (
                <div style={{ color: "green", textAlign: "center", marginTop: "10px" }}>
                  {saveMessage}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default MyGoals;
 

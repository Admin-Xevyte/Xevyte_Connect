import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Newgoal.css';
 
const NewGoals = () => {
  const location = useLocation();
  const navigate = useNavigate();
const tbodyRef = useRef(null);
 
  // ✅ Logged-in employee (from localStorage)
  const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
 
  // ✅ Selected employee (from navigation or localStorage)
  const initialSelectedEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId') || '';
  const initialSelectedEmployeeName = location.state?.employeeName || localStorage.getItem('selectedEmployeeName') || '';
 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);
  const employeeId = localStorage.getItem("employeeId");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [goals, setGoals] = useState([]);
const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);
 const [canViewTasks, setCanViewTasks] = useState(false);
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  // ✅ Fetch logged-in employee profile
  useEffect(() => {
    if (loggedInEmployeeId) {
      fetch(`/profile/${loggedInEmployeeId}`)
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
      const res = await fetch(`/profile/update/${loggedInEmployeeId}`, {
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
 
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };
 
  // ✅ Goals setup for selected employee
  useEffect(() => {
    if (selectedEmployeeId) {
      localStorage.setItem('selectedEmployeeId', selectedEmployeeId);
      localStorage.setItem('selectedEmployeeName', selectedEmployeeName);
 
      const quarter = location.state?.quarter || getCurrentQuarter();
 
      setGoals([
        {
          goalId: '',
          employeeId: selectedEmployeeId,
          employeeName: selectedEmployeeName,
          quarter,
          goalTitle: location.state?.goalTitle || '',
          goalDescription: location.state?.goalDescription || '',
          target: location.state?.target || '',
          metric: location.state?.metric || '',
          acknowledgedBy: '',
          acknowledgedAt: '',
          startDate: location.state?.startDate || '',
          endDate: location.state?.endDate || '',
          targetDate: location.state?.targetDate || '',
          previousGoalId: location.state?.previousGoalId || null,
        },
      ]);
    }
  }, [selectedEmployeeId, selectedEmployeeName, location.state]);
 
const handleChange = (index, field, value) => {
  const trimmedValue = value.slice(0, 255); // limit to 255 chars
  const updatedGoals = [...goals];
  updatedGoals[index][field] = trimmedValue;
  setGoals(updatedGoals);
};
 
const addGoal = () => {
  setGoals(prevGoals => [
    ...prevGoals,
    {
      goalId: '',
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployeeName,
      quarter: getCurrentQuarter(),
      goalTitle: '',
      goalDescription: '',
      target: '',
      metric: '',
      acknowledgedBy: '',
      acknowledgedAt: '',
    },
  ]);
 
  setTimeout(() => {
    if (tbodyRef.current) {
      tbodyRef.current.scrollTop = tbodyRef.current.scrollHeight;
    }
  }, 100);  // slight delay to let React update the DOM
};
 
 
  const removeGoal = (index) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    setGoals(updatedGoals);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!selectedEmployeeId) {
      alert('Selected Employee ID is missing. Cannot submit goals.');
      return;
    }
 
    try {
      const previousGoalId = goals[0]?.previousGoalId;
 
      // Submit all new goals
      for (const goal of goals) {
        goal.employeeId = selectedEmployeeId;
        const response = await fetch('/api/goals/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goal),
        });
 
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save goal: ${errorText}`);
        }
      }
 
      // Delete previous goal if reassign
      if (previousGoalId) {
        await fetch(`/api/goals/delete/${previousGoalId}`, { method: 'DELETE' });
      }
 
      alert('Goals submitted successfully!');
      navigate(-1);
 
    } catch (error) {
      alert('Error submitting goals: ' + error.message);
      console.error('Detailed error:', error);
    }
  };
 
  return (
    <div className="dashboard-container">
      {/* Sidebar (unchanged) */}
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
        {/* ✅ Topbar - Logged-in employee info */}
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
                <div ref={profileDropdownRef} className="profile-dropdown">
                  <button onClick={handleEditProfile}>Edit Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
              {successMessage && <div className="success-msg">{successMessage}</div>}
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
        {/* ✅ Below divider - Selected employee workflow */}
        <div className="goal-container3">
          <h2>Set Quarterly Goals for {selectedEmployeeName || 'Employee'} ({selectedEmployeeId || 'N/A'})</h2>
          {/* <h2>Set Quarterly Goals</h2> */}
 
          <form onSubmit={handleSubmit}>
          <div
  ref={tbodyRef}  // Add ref here
  style={{
    maxHeight: "calc(100vh - 350px)", // Fixed height for scroll container
    overflowY: "auto",
    display: "block",      // Important to keep table header fixed width
  }}
  className="table-wrapper"
>
  <table className="goals-table1 goals-style" style={{ width: "100%", tableLayout: "fixed" }}>
              <thead>
  <tr>
    <th style={{ width: '300px', textAlign: 'center' }}>Title</th>
    <th style={{ textAlign: 'center' }}>Description</th>
    <th style={{ width: '100px', textAlign: 'center' }}>Weightage</th>
    <th style={{ width: '80px', textAlign: 'center' }}>Target</th>
  </tr>
</thead>
 
             <tbody>
 
                  {goals.map((goal, index) => (
                    <tr key={index}>
                     
<td>
  <textarea
    value={goal.goalTitle}
    onChange={(e) => handleChange(index, 'goalTitle', e.target.value)}
    maxLength={255}
    rows={4}
    wrap="soft"
    style={{
      width: "100%",
      height: "auto",
      resize: "none",
      padding: "8px 10px",
      fontSize: "14px",
      lineHeight: "1.5",
      boxSizing: "border-box",
      overflowY: "scroll",
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }}
    required
  />
</td>
 
 
<td>
  <textarea
    rows={4}
    value={goal.goalDescription}
    onChange={(e) => handleChange(index, 'goalDescription', e.target.value)}
    maxLength={255}
    wrap="soft" // or "hard" if you want actual line breaks inserted
    required
    style={{
      width: "100%",
      fontSize: "14px",
      lineHeight: "1.5",
      padding: "8px 10px",
      resize: "none",
      boxSizing: "border-box",
      fontFamily: "inherit"
    }}
  />
</td>
 
 
<td style={{ position: "relative" }}>
  <input
    type="text"
    value={goal.metric}
    onChange={(e) => {
      const val = e.target.value;
      if (val === '' || (/^\d{1,3}$/.test(val) && parseInt(val) <= 100)) {
        handleChange(index, 'metric', val);
      }
    }}
    required
    style={{
      width: "100%",
      height: "100px",       // match textarea height (approx 4 rows)
      boxSizing: "border-box",
      padding: "8px 10px",   // same padding as textarea
      fontSize: "14px",
      fontFamily: "inherit",
      resize: "none"         // to visually match textarea style
    }}
  />
  <span style={{
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#555"
  }}></span>
</td>
 
<td>
  <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
    <input
      type="text"
      maxLength={1}
      value={goal.target || ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === '' || /^[0-9]$/.test(val)) {
          handleChange(index, "target", val);
        }
      }}
      required
      style={{
        width: "100%",
        height: "100px",
        boxSizing: "border-box",
        padding: "8px 10px",
        fontSize: "14px",
        fontFamily: "inherit",
        marginBottom: "3px"
      }}
    />
 
    {goals.length > 1 && (
      <button
        type="button"
        onClick={() => removeGoal(index)}
        style={{
          background: "transparent",
          border: "none",
          color: "black",
          fontSize: "18px",
          cursor: "pointer",
          padding: 0,
          margin: 0,
          lineHeight: 1
        }}
      >
        &minus;
      </button>
    )}
  </div>
</td>
 
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            <div className="goal-actions">
              <button type="button" onClick={addGoal} className="add-btn">+ Add Another Goal</button>
              <button type="submit" className="save-btn">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
 
export default NewGoals;
 
 
 

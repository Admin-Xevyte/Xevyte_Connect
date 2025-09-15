import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function LeavesDrafts() {
  // Common states for sidebar and top bar
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [holidays, setHolidays] = useState([]);
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
  const [isContractOpen, setIsContractOpen] = useState(false);
 const [canViewTasks, setCanViewTasks] = useState(false);
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  // States for LeavesDrafts functionality
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState("");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // UPDATED: calculateTotalDays function to exclude holidays
  const calculateTotalDays = (startDate, endDate, holidays) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const currentDate = new Date(start.getTime());

    // Convert holidays array to a Set for faster lookup
    const holidayDates = new Set(holidays.map(h => h.toISOString().slice(0, 10)));

    // Loop through each day from start to end
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dateString = currentDate.toISOString().slice(0, 10);

      // Check if the current day is a weekday (Monday to Friday) AND not a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateString)) {
        count++;
      }
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  };

  // UPDATED: draftsWithDays useMemo to pass the holidays state
  const draftsWithDays = useMemo(() => {
    return drafts.map(draft => ({
      ...draft,
      totalDays: calculateTotalDays(draft.startDate, draft.endDate, holidays),
    }));
  }, [drafts, holidays]);

  // Fetch updated profile info on component mount
  useEffect(() => {
    if (employeeId) {
      fetch(`/profile/${employeeId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
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

  // UPDATED: useEffect to load holidays and then drafts
  useEffect(() => {
    async function loadData() {
      if (!employeeId) return;
      setLoadingDrafts(true);
      setDraftsError("");

      try {
        // First, fetch holidays
        await fetchHolidays();

        // Then, fetch drafts
        const res = await fetch(`/leaves/drafts/${employeeId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        // Ensure data is an array before sorting
        const draftsData = Array.isArray(data) ? data : [];

        // Sort drafts by ID desc
        const sortedDrafts = draftsData.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        setDrafts(sortedDrafts);
      } catch (err) {
        console.error("Failed to fetch data from backend", err);
        setDrafts([]);
        setDraftsError("Failed to load drafts. Please try again.");
      } finally {
        setLoadingDrafts(false);
      }
    }
    loadData();
  }, [employeeId]);

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

  // Handlers for sidebar and top bar
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
        setSuccessMessage("Profile picture updated successfully! ✨");
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

  // Handlers for LeavesDrafts
  const handleEditDraft = (draftToEdit) => {
    navigate('/home7', { state: { draftToEdit: draftToEdit } });
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/leaves/holidays`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const holidayDates = data.map(h => new Date(h.holidayDate + 'T00:00:00'));
      setHolidays(holidayDates);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    }
  };

  // ✅ Delete draft from backend and update list with message
  const handleDeleteDraft = async (draftId) => {
    try {
      const res = await fetch(`/leaves/drafts/${draftId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
        setDrafts(updatedDrafts);
        setSuccessMessage("Draft deleted successfully 🗑️");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Failed to delete draft");
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert("Error deleting draft. See console for details.");
    }
  };

  // ✅ Improved download (forces browser to download)
  const handleDownloadDraft = async (draft) => {
    try {
      const res = await fetch(`/leaves/drafts/download/${draft.id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = draft.fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download draft file:", err);
      alert("Failed to download file.");
    }
  };

  const filteredDrafts = useMemo(() => {
    if (!searchTerm) {
      return draftsWithDays; // Use the calculated drafts
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return draftsWithDays.filter(draft => {
      const draftValues = [
        String(draft.type ?? ''),
        String(draft.startDate ?? ''),
        String(draft.endDate ?? ''),
        String(draft.totalDays ?? ''),
        String(draft.fileName || ''),
        String(draft.reason ?? ''),
      ].map(value => value.toLowerCase());

      return draftValues.some(value => value.includes(lowercasedSearchTerm));
    });
  }, [draftsWithDays, searchTerm]);

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
               <Link to="/home7" className="side" style={{ textDecoration: 'none', color: 'white' }}>
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

      <div className="main-content">
        {/* Top Header */}
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
                <div ref={profileDropdownRef} className="profile-dropdown">
                  <button onClick={handleEditProfile}>Edit Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
              {successMessage && <div className="success-message">{successMessage}</div>}
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

        {/* Leaves Drafts Content */}
        <div className="dashboard-content" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: '1', padding: '0 20px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '15px' }}>My Saved Leave Drafts</h3>

            {loadingDrafts && (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                Loading drafts…
              </div>
            )}

            {!!draftsError && (
              <div style={{ textAlign: 'center', color: '#d9534f', marginTop: '20px' }}>
                {draftsError}
              </div>
            )}

            {!loadingDrafts && !draftsError && filteredDrafts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                No saved drafts found.
              </div>
            ) : (
              !loadingDrafts && !draftsError && (
                <div
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    maxHeight: 'calc(100vh - 300px)',
                    overflowY: 'auto',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'center', border: '1px solid #ddd', zIndex: 2, width: '8%' }}>Draft ID</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '10%' }}>Leave Type</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '12%' }}>Start Date</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '12%' }}>End Date</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'center', border: '1px solid #ddd', zIndex: 2, width: '8%' }}>Total Days</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '15%' }}>Uploaded File</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '25%' }}>Reason</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'center', border: '1px solid #ddd', zIndex: 2, width: '10%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrafts.map((draft) => (
                        <tr key={draft.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top' }}>
                            {draft.id || "--"}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>{draft.type || "--"}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            {draft.startDate ? formatDate(draft.startDate) : "--"}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            {draft.endDate ? formatDate(draft.endDate) : "--"}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top' }}>
                            {draft.totalDays || "--"}
                          </td>
                         <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            {draft.hasFile ? (
                              <button
                                onClick={() => handleDownloadDraft(draft)}
                                style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                title={draft.fileName} // Tooltip for full filename
                              >
                                {draft.fileName.length > 10 ? `${draft.fileName.substring(0, 10)}...` : draft.fileName}
                              </button>
                            ) : (
                              'No File Uploaded'
                            )}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', wordWrap: 'break-word', whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {draft.reason || "--"}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              border: '1px solid #ddd',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <button
                              onClick={() => handleEditDraft(draft)}
                              style={{
                                padding: '8px 18px',
                                fontSize: '14px',
                                fontWeight: '500',
                                backgroundColor: '#1E90FF',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                width: '100px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'background-color 0.2s, transform 0.1s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4169E1')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1E90FF')}
                              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft.id)}
                              style={{
                                padding: '8px 18px',
                                fontSize: '14px',
                                fontWeight: '500',
                                backgroundColor: '#DC143C',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                width: '100px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'background-color 0.2s, transform 0.1s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B22222')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#DC143C')}
                              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeavesDrafts;









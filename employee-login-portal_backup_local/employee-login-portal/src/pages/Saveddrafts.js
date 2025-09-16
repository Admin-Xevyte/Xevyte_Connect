import React, { useState, useEffect, useRef } from 'react';
import './Saveddrafts.css';
import { Link, useNavigate } from 'react-router-dom';
import "./Dashboard.css";
import axios from 'axios';
 
function Saveddrafts() {
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [role, setRole] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
 const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
   const [isContractOpen, setIsContractOpen] = useState(false);
 
 const toggleContractMenu = () => {
   setIsContractOpen(!isContractOpen);
 };
  const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};
 
 
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
 
  const fetchDrafts = () => {
    const empId = localStorage.getItem("employeeId");
    if (empId) {
      axios.get(`/claims/drafts/${empId}`)
        .then(res => {
          const sortedDrafts = res.data.sort((a, b) => b.expenseId - a.expenseId);
          setDrafts(sortedDrafts);
          // setMessage('Drafts loaded successfully.');
        })
        .catch(err => {
          console.error('Failed to fetch drafts:', err);
          setMessage('Error fetching drafts.');
        });
    }
  };
 
  const truncateFileName = (fileName, length = 10) => {
    if (!fileName) {
        return "No Receipt";
    }
    if (fileName.length > length) {
        return `${fileName.substring(0, length)}...`;
    }
    return fileName;
};
 
  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    setEmployeeId(empId);
    setEmployeeName(localStorage.getItem("employeeName"));
    setRole(localStorage.getItem("role"));
 
    fetchDrafts();
 
    fetch(`/profile/${empId}`)
      .then(res => res.json())
      .then(data => {
        setProfilePic(data.profilePic);
        setEmployeeName(data.name);
      })
      .catch(err => console.error("Profile fetch failed:", err));
  }, []);
 
  const handleDelete = (draftId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this draft?");
    if (confirmDelete) {
        axios.delete(`/claims/draft/delete/${draftId}`)
            .then(res => {
                // Remove the draft from the frontend state
                const updatedDrafts = drafts.filter((draft) => draft.expenseId !== draftId);
                setDrafts(updatedDrafts);
                // setMessage('Draft deleted from backend and view.');
            })
            .catch(err => {
                console.error("Error deleting draft:", err);
                setMessage('Error deleting draft from backend.');
            });
    }
};
 
 
  const handleEdit = (draftId) => {
    navigate('/new', { state: { draftId: draftId } });
  };
 
  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };
 
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };
 
  const handleEditProfile = () => {
    setShowProfileMenu(false);
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
        alert("Profile picture updated!");
        localStorage.setItem("employeeProfilePic", data.profilePic);
      } else {
        alert("Failed to update profile picture.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture.");
    }
  };
 
  const filteredDrafts = drafts.filter(draft => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return (
      String(draft.expenseId).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.description?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.category?.toLowerCase().includes(lowercasedSearchTerm) ||
      String(draft.amount).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.date?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.businessPurpose?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.additionalNotes?.toLowerCase().includes(lowercasedSearchTerm)
    );
  });
 
  return (
    <div className="dashboard-container">
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
              <Link to="/home0" className="side" style={{ textDecoration: 'none', color: 'white' }}>
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
 
      <div className="manager-dashboard">
        <div className="dashboard-header">
          <div className="top-header">
            <h2>Welcome, {employeeName} ({employeeId})</h2>
            <div className="header-right">
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
              />
              <div className="profile-wrapper">
                <img
                  src={profilePic ? profilePic : require('../assets/SKKKK.JPG.jpg')}
                  alt="Profile"
                  className="profile-pic"
                  onClick={handleProfileClick}
                />
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <button onClick={handleEditProfile}>Edit</button>
                    <button onClick={handleLogout}>Logout</button>
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
 
      <div className="form-container">
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
 
  <h1>Saved Drafts</h1>
  {message && <div style={{ color: 'green' }}>{message}</div>}
 
  <div className="table-scroll">
    <table className="drafts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Draft ID</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Expense Date</th>
          <th>Receipts</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredDrafts.length === 0 ? (
          <tr>
            {/* <td colSpan="9" style={{ textAlign: 'center' }}>
              {drafts.length === 0 ? "No drafts saved." : "No matching drafts found."}
            </td> */}
          </tr>
        ) : (
          filteredDrafts.map((draft) => (
            <tr key={draft.expenseId}>
              <td>{draft.expenseId}</td>
              <td>{draft.description}</td>
              <td>{draft.category}</td>
              <td>₹{draft.amount}</td>
              <td>{formatDate(draft.date)}</td>
             <td className="receipt-cell">
  {draft.receiptName ? (
    <a
  href={`/claims/draft/receipt/${draft.expenseId}`}
  download={draft.receiptName}
  target="_blank"
  rel="noopener noreferrer"
>
      <span title={draft.receiptName}>
        {draft.receiptName.length > 10
          ? `${draft.receiptName.substring(0, 10)}...`
          : draft.receiptName}
      </span>
    </a>
  ) : (
    '—'
  )}
</td>
              <td>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEdit(draft.expenseId)}
                    style={{
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(draft.expenseId)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
 
  <Link
    to="/claims/new"
    style={{
      display: 'inline-block',
      marginTop: '15px',
      textDecoration: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px'
    }}
  >
    + Add New Claim
  </Link>
</div>
 
      </div>
    </div>
  );
}
 
export default Saveddrafts;
 

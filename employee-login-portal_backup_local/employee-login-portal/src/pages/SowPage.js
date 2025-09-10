import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Styles moved outside the component to prevent re-creation on every render
const cellHeader = {
  padding: '10px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
  fontWeight: 'bold'
};

const cellBody = {
  padding: '10px',
  border: '1px solid #dee2e6'
};

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px',
  margin: '5px 0 15px',
  borderRadius: '4px',
  border: '1px solid #ccc'
};

function CustomerSowManager() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  
  const [sows, setSows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    sowStartDate: '',
    sowEndDate: '',
    totalEffort: '',
    totalCost: ''
  });

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
  const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
 const [isContractOpen, setIsContractOpen] = useState(false);

const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};

  // Fetch customers
  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error('Failed to fetch customers:', err));
  }, []);

  // Fetch SOWs when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetch(`/api/sows/customer/${selectedCustomerId}`)
        .then(res => res.json())
        .then(data => setSows(data))
        .catch(err => console.error('Failed to fetch SOWs:', err));
    }
  }, [selectedCustomerId]);

  // Fetch updated profile info on mount (optional but recommended)
  useEffect(() => {
    if (employeeId) {
      fetch(`http://localhost:8082/profile/${employeeId}`)
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

  const handleCustomerChange = (e) => {
    const id = e.target.value;
    const name = customers.find(c => c.customerId === parseInt(id))?.customerName || '';
    setSelectedCustomerId(id);
    setSelectedCustomerName(name);
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      sowName:'',
      sowStartDate: '',
      sowEndDate: '',
      totalEffort: '',
      totalCost: ''
    });
  };

  const handleSubmitSow = () => {
    const newSow = {
      sowName: formData.sowName,
      sowStartDate: formData.sowStartDate,
      sowEndDate: formData.sowEndDate,
      totalEffort: parseInt(formData.totalEffort),
      totalCost: parseFloat(formData.totalCost),
      customerId: parseInt(selectedCustomerId)
    };

    fetch('/api/sows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSow)
    })
      .then(res => res.json())
      .then(data => {
        setSows(prev => [...prev, data]);
        handleCloseModal();
      })
      .catch(err => console.error('Failed to create SOW:', err));
  };

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
      const res = await fetch(`http://localhost:8082/profile/update/${employeeId}`, {
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
                      <Link to="/dashboard" className="side" style={{ textDecoration: 'none',  color:'#00b4c6'}}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px',  color:'#00b4c6'}}>
                          Home
                         
                        </span>
                      </Link>
                    </h3>
                    <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Claims</Link></h3>
                    <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Time Sheet</Link></h3>
                    <h3><Link to="/home2" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Employee Handbook</Link></h3>
                    <h3><Link to="/home3" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Employee Directory</Link></h3>
                    <h3><Link to="/home4" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Exit Management</Link></h3>
                    <h3><Link to="/home5" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Holiday Calendar</Link></h3>
                    <h3><Link to="/home6" className="side" style={{ textDecoration: 'none',color:'#00b4c6' }}>Helpdesk</Link></h3>
                    <h3><Link to="/home7" className="side" style={{ textDecoration: 'none',color:'#00b4c6' }}>Leaves</Link></h3>
                  
                    <h3><Link to="/home9" className="side" style={{ textDecoration: 'none',  color:'#00b4c6'}}>Pay slips</Link></h3>
                    <h3><Link to="/home10" className="side" style={{ textDecoration: 'none', color:'#00b4c6'}}>Performance</Link></h3>
                    <h3><Link to="/home11" className="side" style={{ textDecoration: 'none',  color:'#00b4c6' }}>Training</Link></h3>
                    <h3><Link to="/home12" className="side" style={{ textDecoration: 'none', color:'#00b4c6' }}>Travel</Link></h3>
              {allowedUsers.includes(employeeId) && (
                     <>
                       <h3 onClick={toggleContractMenu} style={{ cursor: 'pointer' }}>
                         <span className="side" style={{ color:'white' }}>
                           Contract Management {isContractOpen ? '▾' : '▸'}
                         </span>
                       </h3>
                   
                       {isContractOpen && (
                         <ul style={{ listStyle: 'disc', paddingLeft: '16px', marginTop: '4px' ,}}>
                           <li style={{ marginBottom: '4px' ,marginLeft:'100px'}}>
                             <Link
                               to="/customers"
                               style={{
                                 textDecoration: 'none',
                            color:'rgba(255, 255, 255, 0.7)',
                                 fontSize: '18px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color ='rgba(255, 255, 255, 0.7)')}
                             >
                               Customers
                             </Link>
                           </li>
                           <li style={{ marginBottom: '4px',marginLeft:'100px' }}>
                             <Link
                               to="/sows"
                               style={{
                                 textDecoration: 'none',
                                color:'white',
                                 fontSize: '18px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color = 'white')}
                             >
                               SOWs
                             </Link>
                           </li>
                           <li style={{ marginBottom: '4px' ,marginLeft:'100px'}}>
                             <Link
                               to="/projects"
                               style={{
                                 textDecoration: 'none',
                               color:'rgba(255, 255, 255, 0.7)',
                                 fontSize: '18px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
                             >
                               Projects
                             </Link>
                           </li>
                           <li style={{ marginBottom: '4px',marginLeft:'100px' }}>
                             <Link
                               to="/allocation"
                               style={{
                                 textDecoration: 'none',
                            color:'rgba(255, 255, 255, 0.7)',
                                 fontSize: '18px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
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

        {/* Content from CustomerSowManager */}
        <div style={{ padding: '30px', backgroundColor: '#f6f8fb', minHeight: 'calc(100vh - 80px)', fontFamily: 'Arial, sans-serif' }}>
          <h2 style={{ fontWeight: 'bold' }}>Customer: {selectedCustomerName} (ID: {selectedCustomerId})</h2>

         <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Select Customer:</label>
    <select
      value={selectedCustomerId || ''}
      onChange={handleCustomerChange}
      style={{
        padding: '10px 14px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        minWidth: '200px',
        fontSize: '14px',
        backgroundColor: '#fff',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '18px',
        cursor: 'pointer'
      }}
    >
      <option value="" disabled>Select a customer</option>
      {customers.map(c => (
        <option key={c.customerId} value={c.customerId}>{c.customerName}</option>
      ))}
    </select>

    <button
      onClick={handleOpenModal}
      style={{
        backgroundColor: '#28a745',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      Add New SOW
    </button>
  </div>
</div>

          {selectedCustomerId && (
            <>
              <h3 style={{ fontWeight: 'bold' }}>SOWs for Customer ID: CID{selectedCustomerId}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', backgroundColor: 'white' }}>
                <thead>
  <tr> 
    <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px', textAlign: 'left' }}>SOW ID</th>
     <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px', textAlign: 'left' }}>SOW Name</th>
    <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px', textAlign: 'left' }}>SOW Start Date</th>
    <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px', textAlign: 'left' }}>SOW End Date</th>
    <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px', textAlign: 'left' }}>Total Effort (PD)</th>
    <th style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px', textAlign: 'left' }}>Total Cost</th>
   
  </tr>
</thead>

                <tbody>
                  {sows.map((sow) => (
                    <tr key={sow.sowId}>
                      <td style={cellBody}>SOW{sow.sowId}</td>
                          <td style={cellBody}>{sow.sowName}</td>
                      <td style={cellBody}>{sow.sowStartDate}</td>
                      <td style={cellBody}>{sow.sowEndDate}</td>
                      <td style={cellBody}>{sow.totalEffort}</td>
                      <td style={cellBody}>{sow.totalCost}</td>
                  
                    </tr>
                  ))}
                  {sows.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No SOWs available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* Modal for Adding New SOW */}
          {showModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0,
              width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                width: '500px',
                position: 'relative'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Add New SOW</h3>
<label>SOW Name *</label>
<input
  type="text"
  value={formData.sowName}
  onChange={(e) => setFormData({ ...formData, sowName: e.target.value })}
  style={inputStyle}
/>

                <label>SOW Start Date *</label>
                <input type="date" value={formData.sowStartDate}
                  onChange={(e) => setFormData({ ...formData, sowStartDate: e.target.value })}
                  style={inputStyle}
                />

                <label>SOW End Date *</label>
                <input type="date" value={formData.sowEndDate}
                  onChange={(e) => setFormData({ ...formData, sowEndDate: e.target.value })}
                  style={inputStyle}
                />

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Total Effort (PD) *</label>
                    <input type="number" value={formData.totalEffort}
                      onChange={(e) => setFormData({ ...formData, totalEffort: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Total Cost *</label>
                    <input type="number" value={formData.totalCost}
                      onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={handleSubmitSow}
                    style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '4px', marginRight: '10px' }}>
                    Submit
                  </button>
                  <button onClick={handleCloseModal}
                    style={{ backgroundColor: '#6c757d', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '4px' }}>
                    Cancel
                  </button>
                </div>

                <button onClick={handleCloseModal}
                  style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px',   color:"black", cursor: 'pointer' }}>
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerSowManager;

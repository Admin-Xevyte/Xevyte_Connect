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
  const [selectedCustomerStartDate, setSelectedCustomerStartDate] = useState('');
const [selectedCustomerEndDate, setSelectedCustomerEndDate] = useState('');
  const [sows, setSows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
     sowName: '',   
    sowStartDate: '',
    sowEndDate: '',
    totalEffort: '',
    totalCost: '',
      sowDoc: null
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
  const selectedId = e.target.value;
  setSelectedCustomerId(selectedId);

  const customer = customers.find(c => c.customerId.toString() === selectedId);
  if (customer) {
    setSelectedCustomerName(customer.customerName || '');
    setSelectedCustomerStartDate(customer.startDate || '');
    setSelectedCustomerEndDate(customer.endDate || '');
  } else {
    setSelectedCustomerName('');
    setSelectedCustomerStartDate('');
    setSelectedCustomerEndDate('');
  }
};



  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      sowName:'',
      sowStartDate: '',
      sowEndDate: '',
      totalEffort: '',
      totalCost: '',
       sowDoc: null 
    });
  };

// const handleSubmitSow = () => {
//   // Validate required fields
//   if (!formData.sowName.trim()) {
//     alert("Please enter the SOW Name.");
//     return;
//   }
//   if (!formData.sowStartDate) {
//     alert("Please select the SOW Start Date.");
//     return;
//   }
//   if (!formData.sowEndDate) {
//     alert("Please select the SOW End Date.");
//     return;
//   }
//   if (!formData.totalEffort || isNaN(parseInt(formData.totalEffort)) || parseInt(formData.totalEffort) <= 0) {
//     alert("Please enter a valid Total Effort (positive number).");
//     return;
//   }
//   if (!formData.totalCost || isNaN(parseFloat(formData.totalCost)) || parseFloat(formData.totalCost) <= 0) {
//     alert("Please enter a valid Total Cost (positive number).");
//     return;
//   }
//   if (!selectedCustomerId) {
//     alert("Please select a customer.");
//     return;
//   }
//   if (new Date(formData.sowStartDate) > new Date(formData.sowEndDate)) {
//     alert("SOW Start Date cannot be after the End Date.");
//     return;
//   }
//   if (!formData.sowDoc) {
//     alert("Please upload a SOW document (PDF, Word, etc.).");
//     return;
//   }

//   // Create FormData for multipart/form-data
//   const payload = new FormData();
//   payload.append("sowName", formData.sowName.trim());
//   payload.append("sowStartDate", formData.sowStartDate);
//   payload.append("sowEndDate", formData.sowEndDate);
//   payload.append("totalEffort", formData.totalEffort);
//   payload.append("totalCost", formData.totalCost);
//   payload.append("customerId", selectedCustomerId);
//   payload.append("sowDoc", formData.sowDoc); // ✅ File attachment

//   // Send request to backend
//   fetch('/api/sows', {
//     method: 'POST',
//     body: payload
//     // ❌ Don't set Content-Type manually — browser will set the correct boundary
//   })
//     .then(res => {
//       if (!res.ok) {
//         throw new Error("Failed to create SOW");
//       }
//       return res.json();
//     })
//     .then(data => {
//       setSows(prev => [...prev, data]);
//       handleCloseModal();
//     })
//     .catch(err => {
//       console.error('Failed to create SOW:', err);
//       alert("SOW creation failed. See console for details.");
//     });
// };
const handleSubmitSow = (event) => {
  event.preventDefault();

  const form = event.target;

  // Use native HTML5 validation
  if (!form.checkValidity()) {
    form.reportValidity(); // This shows the native tooltip message (like in your screenshot)
    return;
  }

  // Additional JS validations that HTML can't handle (e.g. date comparison)
  if (new Date(formData.sowStartDate) > new Date(formData.sowEndDate)) {
    // Show custom validation message with setCustomValidity and reportValidity
    const endDateInput = form.querySelector('input[name="sowEndDate"]');
    endDateInput.setCustomValidity("SOW Start Date cannot be after the End Date.");
    endDateInput.reportValidity();
    endDateInput.setCustomValidity(""); // Reset after showing
    return;
  }

  // Create FormData for multipart/form-data
  const payload = new FormData();
  payload.append("sowName", formData.sowName.trim());
  payload.append("sowStartDate", formData.sowStartDate);
  payload.append("sowEndDate", formData.sowEndDate);
  payload.append("totalEffort", formData.totalEffort);
  payload.append("totalCost", formData.totalCost);
  payload.append("customerId", selectedCustomerId);
  payload.append("sowDoc", formData.sowDoc); // File attachment

  // Send request to backend
  fetch('/api/sows', {
    method: 'POST',
    body: payload,
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to create SOW");
      }
      return res.json();
    })
    .then(data => {
      setSows(prev => [...prev, data]);
      handleCloseModal();
    })
    .catch(err => {
      console.error('Failed to create SOW:', err);
      // Optional: use a toast notification instead of alert here if you want no popups at all
      alert("SOW creation failed. See console for details.");
    });
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
const handleOpenModal = () => {
  if (!selectedCustomerId) {
    alert('Please select a customer before adding SOWs.');
    return;
  }
  setShowModal(true);
};
const handleDownload = async (sowId, filename) => {
  try {
    const response = await fetch(`/api/sows/${sowId}/download`, {
      method: 'GET',
    });

    if (!response.ok) {
      alert('Failed to download file.');
      return;
    }

    // Get the file data as a blob
    const blob = await response.blob();

    // Create a URL for the blob object
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;  // Set the filename for the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading the file:', error);
    alert('An error occurred while downloading the file.');
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
                           <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                             <Link
                               to="/customers"
                               style={{
                                 textDecoration: 'none',
                            color:'rgba(255, 255, 255, 0.7)',
                                 fontSize: '14px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color ='rgba(255, 255, 255, 0.7)')}
                             >
                               Customers
                             </Link>
                           </li>
                           <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                             <Link
                               to="/sows"
                               style={{
                                 textDecoration: 'none',
                                color:'white',
                                 fontSize: '14px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color = 'white')}
                             >
                               SOWs
                             </Link>
                           </li>
                           <li style={{ marginBottom: '4px' ,marginLeft:'60px'}}>
                             <Link
                               to="/projects"
                               style={{
                                 textDecoration: 'none',
                               color:'rgba(255, 255, 255, 0.7)',
                                 fontSize: '14px',
                                 display: 'block',
                                 padding: '4px 0',
                               }}
                               onMouseOver={(e) => (e.target.style.color = '#fff')}
                               onMouseOut={(e) => (e.target.style.color = 'rgba(255, 255, 255, 0.7)')}
                             >
                               Projects
                             </Link>
                           </li>
                           <li style={{ marginBottom: '4px',marginLeft:'60px' }}>
                             <Link
                               to="/allocation"
                               style={{
                                 textDecoration: 'none',
                            color:'rgba(255, 255, 255, 0.7)',
                                 fontSize: '14px',
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
  <h2>
  <span style={{ fontWeight: 'bold' }}>Customer:</span>{' '}
  <span style={{ fontWeight: 'normal', fontSize: '0.9em' }}>
    {selectedCustomerName} {selectedCustomerId && `(CID${selectedCustomerId})`}
  </span>
</h2>



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
      <option value="" disabled>-- Select a customer --</option>
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
         <div style={{ marginTop: 20 }}>
  <h3 style={{ fontWeight: "bold" }}>SOWs</h3>
  {sows.length === 0 ? (
    <p style={{ color: "#666", marginTop: 4 }}>
      No SOWs found for this customer.
    </p>
  ) : (
   <div
  style={{
    maxHeight: "calc(100vh - 300px)",
    overflowY: "scroll",
    border: "1px solid #ccc",
    borderRadius: 4,
    backgroundColor: "white",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 0,
      backgroundColor: "white",
    }}
  >
    <thead>
      <tr>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>SOW ID</th>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>SOW Name</th>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>SOW Document</th>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Start Date</th>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>End Date</th>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Total Effort (PD)</th>
        <th style={{ backgroundColor: "#2c3e50", color: "white", padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Total Cost</th>
      </tr>
    </thead>
    <tbody>
      {sows
        .slice()
        .sort((a, b) => b.sowId - a.sowId) // 👈 Sort by SOW ID descending
        .map((sow) => (
          <tr key={sow.sowId}>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              SOW{sow.sowId}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd" }}>{sow.sowName}</td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {sow.sowDocName ? (
                <span
                  onClick={() => handleDownload(sow.sowId, sow.sowDocName)}
                  title={sow.sowDocName}
                  style={{ color: "blue", textDecoration: "none", cursor: "pointer" }}
                >
                  {sow.sowDocName.length > 10
                    ? `${sow.sowDocName.substring(0, 10)}...`
                    : sow.sowDocName}
                </span>
              ) : (
                <span style={{ color: "#999" }}>No document</span>
              )}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {new Date(sow.sowStartDate).toLocaleDateString("en-GB")}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {new Date(sow.sowEndDate).toLocaleDateString("en-GB")}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {sow.totalEffort}
            </td>
            <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
              {sow.totalCost}
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>

  )}
</div>


          {/* Modal for Adding New SOW */}
        {showModal && (
  <div
    style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '500px',
        position: 'relative',
      }}
    >
      <h3 style={{ marginBottom: '20px' }}>Add New SOW</h3>

      {/* Wrap inputs inside a form */}
      <form onSubmit={handleSubmitSow} noValidate>
        <label>SOW Name *</label>
        <input
          type="text"
          value={formData.sowName}
          onChange={(e) => setFormData({ ...formData, sowName: e.target.value })}
          required
          style={inputStyle}
        />

        <label>SOW Document *</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => setFormData({ ...formData, sowDoc: e.target.files[0] })}
          required
          style={inputStyle}
        />

        <label>SOW Start Date *</label>
        <input
  type="date"
  value={formData.sowStartDate}
  onChange={(e) => setFormData({ ...formData, sowStartDate: e.target.value })}
  min={selectedCustomerStartDate}
  max={selectedCustomerEndDate}
  required
  style={inputStyle}
/>

        <label>SOW End Date *</label>
        <input
  type="date"
  value={formData.sowEndDate}
  onChange={(e) => setFormData({ ...formData, sowEndDate: e.target.value })}
  min={selectedCustomerStartDate}
  max={selectedCustomerEndDate}
  required
  style={inputStyle}
/>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label>Total Effort (PD) *</label>
            <input
              type="number"
              value={formData.totalEffort}
              onChange={(e) => setFormData({ ...formData, totalEffort: e.target.value })}
              required
              min="1"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Total Cost *</label>
            <input
              type="number"
              value={formData.totalCost}
              onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
              required
              min="1"
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
          }}
        >
          <button
            type="submit"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '4px',
              marginRight: '10px',
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleCloseModal}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <button
        onClick={handleCloseModal}
        style={{
          position: 'absolute',
          top: '10px',
          right: '15px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          color: 'black',
          cursor: 'pointer',
        }}
      >
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

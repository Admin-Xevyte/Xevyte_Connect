import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

// A new component for the modal form
const ModalForm = ({ onClose, onSubmit }) => {
  const [customerName, setCustomerName] = useState("");
  const [msaDoc, setMsaDoc] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalEffort, setTotalEffort] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setMsaDoc(e.target.files[0]);
  };

  const handleClear = () => {
    setCustomerName("");
    setMsaDoc(null);
    setStartDate("");
    setEndDate("");
    setTotalEffort("");
    setTotalCost("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (new Date(endDate) < new Date(startDate)) {
      alert("End Date cannot be before Start Date.");
      return;
    }

    if (
      !customerName ||
      !msaDoc ||
      !startDate ||
      !endDate ||
      !totalEffort ||
      !totalCost
    ) {
      alert("Please fill all fields and upload the MSA document.");
      return;
    }

    onSubmit({
      customerName,
      msaDoc,
      startDate,
      endDate,
      totalEffort,
      totalCost,
    });
    handleClear();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose} // close on backdrop click
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent closing on modal click
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          width: 400,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontWeight: "bold", fontSize: 18 }}>
            Add New SOW
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: 24,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#333",
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            Customer Name <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          {/* MSA Document */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            MSA Document <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            required
            style={{
              width: "100%",
              marginBottom: 15,
              fontSize: 14,
            }}
          />

          {/* Start Date */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            SOW Start Date <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            placeholder="dd-mm-yyyy"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          {/* End Date */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            SOW End Date <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            placeholder="dd-mm-yyyy"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          {/* Total Effort & Total Cost side by side */}
          <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
              >
                Total Effort (PD) <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                value={totalEffort}
                onChange={(e) => setTotalEffort(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: 14,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
              >
                Total Cost <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: 14,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 15 }}>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: 6,
                fontWeight: "bold",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: 6,
                fontWeight: "bold",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const handleDownload = async (customerId, filename) => {
  try {
    const response = await fetch(`/api/customers/${customerId}/download`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'msa-document'; // fallback filename
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to download the file.");
  }
};


function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);

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

    useEffect(() => {
        fetchCustomers();
    }, []);

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

    const fetchCustomers = () => {
        axios.get("/api/customers")
            .then(res => setCustomers(res.data))
            .catch(err => console.error("Error fetching customers:", err));
    };

 const handleFormSubmit = async ({ customerName, msaDoc, startDate, endDate }) => {
    const formData = new FormData();
    formData.append("customerName", customerName);  // ✅ Matches Spring @RequestParam
    formData.append("msaDoc", msaDoc);              // ✅ Matches Spring @RequestParam
    formData.append("startDate", startDate);        // ✅ Matches Spring @RequestParam
    formData.append("endDate", endDate);            // ✅ Matches Spring @RequestParam


        try {
            await axios.post("/api/customers", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowModal(false);
            fetchCustomers();
        } catch (error) {
            console.error("Error adding customer:", error);
            alert("Failed to add customer.");
        }
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

    // Filter the customers based on the search term
 // Filter the customers based on the search term
// Filter the customers based on the search term
const filteredCustomers = customers.filter(customer => {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const customerIdString = `CID${customer.customerId}`.toLowerCase(); // Convert ID to 'CID...' string for comparison

  return (
    (customerIdString).includes(lowerCaseSearchTerm) || // Check the customer ID
    (customer.customerName || "").toLowerCase().includes(lowerCaseSearchTerm) ||
    (customer.msaDoc || "").toLowerCase().includes(lowerCaseSearchTerm) ||
    (customer.startDate || "").toString().toLowerCase().includes(lowerCaseSearchTerm) ||
    (customer.endDate || "").toString().toLowerCase().includes(lowerCaseSearchTerm)
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
                                     <Link to="/dashboard" className="side" style={{ textDecoration: 'none',color: 'rgba(255, 255, 255, 0.7)'}}>
                                       <span style={{ display: 'flex', alignItems: 'center', gap: '10px',color: 'rgba(255, 255, 255, 0.7)'}}>
                                         Home
                                        
                                       </span>
                                     </Link>
                                   </h3>
                                   <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Claims</Link></h3>
                                   <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Time Sheet</Link></h3>
                                   <h3><Link to="/home2" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Handbook</Link></h3>
                                   <h3><Link to="/home3" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Directory</Link></h3>
                                   <h3><Link to="/home4" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Exit Management</Link></h3>
                                   <h3><Link to="/home5" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Holiday Calendar</Link></h3>
                                   <h3><Link to="/home6" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Helpdesk</Link></h3>
                                   <h3><Link to="/home7" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Leaves</Link></h3>
                                 
                                   <h3><Link to="/home9" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Pay slips</Link></h3>
                                   <h3><Link to="/home10" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Performance</Link></h3>
                                   <h3><Link to="/home11" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Training</Link></h3>
                                   <h3><Link to="/home12" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Travel</Link></h3>
                                
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
                <div style={{ padding: "20px" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
                        <h2>Customers List</h2>
                        <button
  onClick={() => setShowModal(true)}
  style={{
    padding: "10px 15px",
    cursor: "pointer",
    backgroundColor: "#28a745", // ✅ Green background
    color: "white",             // ✅ White text
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "14px"
  }}
>
  Add New Customer
</button>

                    </div>
                                       <div
  className="sow-table-container"
  style={{
    maxHeight: "calc(100vh - 250px)",
    overflowY: "auto",
     // optional for horizontal scroll
    border: "1px solid #ccc",
    borderRadius: "6px",
  }}
>
                    <table border="1" cellPadding="10" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>Customer ID</th>
                                <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>Customer Name</th>
                                <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>MSA Document</th>
                                <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>Start Date</th>
                                <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>End Date</th>
                                 <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>SOWs</th>
                            </tr>
                        </thead>
<tbody>
  {filteredCustomers.map(customer => (
    <tr key={customer.customerId}>
    <td>{`CID${customer.customerId}`}</td>

      <td>{customer.customerName}</td>
      <td>
  {customer.msaDoc ? (
    <span
  onClick={() => handleDownload(customer.customerId, customer.msaDoc)}
  title={customer.msaDoc}
  style={{
    color: "blue",
    textDecoration: "none",
    cursor: "pointer",
  }}
>
  {customer.msaDoc.length > 10
    ? `${customer.msaDoc.substring(0, 10)}...`
    : customer.msaDoc}
</span>

  ) : (
    "No document"
  )}
</td>

      <td>
        {customer.startDate
          ? new Date(customer.startDate).toLocaleDateString("en-GB")
          : ""}
      </td>
      <td>
        {customer.endDate
          ? new Date(customer.endDate).toLocaleDateString("en-GB")
          : ""}
      </td>
      <td>
        <button
          style={{ padding: "6px 12px", cursor: "pointer" ,  backgroundColor: "#3498db"}}
          onClick={() => navigate(`/customers/${customer.customerId}/sows`)}
        >
          View SOWs
        </button>
      </td>
    </tr>
  ))}
</tbody>


                    </table>
                </div>
                </div>
            </div>
            {showModal && <ModalForm onClose={() => setShowModal(false)} onSubmit={handleFormSubmit} />}
        </div>
    );
}

export default CustomerList;
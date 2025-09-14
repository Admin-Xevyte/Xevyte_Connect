import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./ManagerDashboard.css";
import { Link, useNavigate } from 'react-router-dom';
import "./Dashboard.css";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';


pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.js`;
function ManagerDashBoard() {
  const [claims, setClaims] = useState([]);
  const [originalClaims, setOriginalClaims] = useState([]); // New state to hold all claims
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [role, setRole] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
const [loading, setLoading] = useState(true);
  // New state variables for PDF/Image preview
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isContractOpen, setIsContractOpen] = useState(false);
const [validationErrors, setValidationErrors] = React.useState({});
const [allocationErrors, setAllocationErrors] = React.useState([]);
  const allowedUsers = ["H100646", "H100186", "H100118", "EMP111"];
const toggleContractMenu = () => {
  setIsContractOpen(!isContractOpen);
};
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  useEffect(() => {
  const storedId = localStorage.getItem("employeeId");
  const storedName = localStorage.getItem("employeeName");
  const storedRole = localStorage.getItem("role");

  setEmployeeId(storedId);
  setRole(storedRole);
  setEmployeeName(storedName);

  if (storedId) {
    fetchClaims(storedId);

    fetch(`/profile/${storedId}`)
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
      .catch(err => {
        console.error("Failed to fetch profile info:", err);
      });
  }
}, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);
useEffect(() => {
  if (searchTerm.length > 0) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = originalClaims.filter(claim => {
      // Check multiple fields for the search term
      const matchesClaimId = String(claim.id).toLowerCase().includes(lowerCaseSearchTerm);
      const matchesEmployeeId = String(claim.employeeId).toLowerCase().includes(lowerCaseSearchTerm);
      const matchesEmployeeName = claim.name && claim.name.toLowerCase().includes(lowerCaseSearchTerm);
      const matchesCategory = claim.category && claim.category.toLowerCase().includes(lowerCaseSearchTerm);
      const matchesBusinessPurpose = claim.businessPurpose && claim.businessPurpose.toLowerCase().includes(lowerCaseSearchTerm);
      const matchesAdditionalNotes = claim.additionalNotes && claim.additionalNotes.toLowerCase().includes(lowerCaseSearchTerm);
      const matchesAmount = String(claim.amount).toLowerCase().includes(lowerCaseSearchTerm);
      const matchesDescription = claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(lowerCaseSearchTerm);
      
      // Special check for date field
      const matchesExpenseDate = claim.expenseDate && claim.expenseDate.includes(searchTerm);
      const matchesSubmittedDate = new Date(claim.submittedDate).toLocaleString().toLowerCase().includes(lowerCaseSearchTerm);

      return (
        matchesClaimId || 
        matchesEmployeeId || 
        matchesEmployeeName || 
        matchesCategory || 
        matchesBusinessPurpose || 
        matchesAdditionalNotes || 
        matchesAmount || 
        matchesDescription || 
        matchesExpenseDate ||
        matchesSubmittedDate
      );
    });
    setClaims(filtered);
  } else {
    setClaims(originalClaims);
  }
}, [searchTerm, originalClaims]);

  const fetchClaims = (managerId) => {
  setLoading(true); // ← Set loading to true before the request
  axios
    .get(`/claims/manager/${managerId}`)
    .then((res) => {
      const sortedClaims = res.data.sort((a, b) => {
        const dateA = new Date(a.submittedDate);
        const dateB = new Date(b.submittedDate);
        return dateB - dateA;
      });
      setClaims(sortedClaims);
      setOriginalClaims(sortedClaims);
      console.log("Fetched and sorted assigned claims:", sortedClaims);
    })
    .catch((err) => {
      console.error("Error fetching claims:", err);
    })
    .finally(() => {
      setLoading(false); // ← Set loading to false after the request completes
    });
};


  const handleApprove = (id) => {
    axios
      .post(`/claims/approve/${id}?role=Manager`)
      .then(() => fetchClaims(employeeId));
  };

  const handleRejectClick = (id) => {
    setSelectedClaimId(id);
    setShowReasonBox(true);
  };

  const handleRejectConfirm = () => {
    if (rejectionReason.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters long.");
      return;
    }

    axios
      .post(
        `/claims/reject/${selectedClaimId}?role=Manager&reason=${encodeURIComponent(
          rejectionReason
        )}`
      )
      .then(() => {
        setShowReasonBox(false);
        setRejectionReason("");
        fetchClaims(employeeId);
      });
  };

  const handleCancelReject = () => {
    setShowReasonBox(false);
    setRejectionReason("");
  };

  const handleViewReceipt = (id, receiptName) => {
    axios
      .get(`/claims/receipt/${id}`, { responseType: "blob" })
      .then((res) => {
        const fileExtension = receiptName.split('.').pop().toLowerCase();
        const fileUrl = URL.createObjectURL(res.data);
        setPreviewFile(fileUrl);
        if (fileExtension === 'pdf') {
          setFileType('pdf');
        } else {
          setFileType('image');
        }
        setIsModalOpen(true);
      })
      .catch((err) => console.error("Error fetching receipt:", err));
  };

  const handleDownloadReceipt = (id, receiptName) => {
    axios
      .get(`/claims/receipt/${id}`, {
        responseType: "blob",
      })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", receiptName || "receipt.pdf");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Download error:", err));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
    URL.revokeObjectURL(previewFile);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const prevPage = () => changePage(-1);
  const nextPage = () => changePage(1);

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

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
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
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
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
              <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" />

              <div className="profile-wrapper" style={{ position: 'relative' }}>
                <img
                  src={profilePic}
                  alt="Profile"
                  className="profile-pic"
                  onClick={toggleProfileMenu}
                  style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                {profileOpen && (
                  <div ref={profileDropdownRef} className="profile-dropdown" style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                    zIndex: 1000,
                    width: '150px',
                  }}>
                    <button onClick={handleEditProfile} style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}>Edit Profile</button>
                    <button onClick={handleLogout} style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}>Logout</button>
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
                  }}>{successMessage}</div>
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
        {loading ? (
  <p>Loading claims...</p>
) : claims.length === 0 ? (
  <p>You do not have any assigned claims at the moment.</p>
) : (

          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Category</th>
                  {/* <th>Business Purpose</th> */}
                  {/* <th>Additional Notes</th> */}
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Expense Date</th>
                  <th>Receipt</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(claim => (
                  <tr key={claim.id}>
                    <td>{claim.id}</td>
                    <td>{claim.employeeId}</td>
                    <td>{claim.name}</td>
                    <td>{claim.category}</td>
                    {/* <td>{claim.businessPurpose}</td> */}
                    {/* <td>{claim.additionalNotes}</td> */}
                    <td>{claim.amount}</td>
                    <td>{claim.expenseDescription}</td>
                <td>{new Date(claim.expenseDate).toLocaleDateString('en-GB').replaceAll('/', '-')}</td>

                    <td>
                      {claim.receiptName ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewReceipt(claim.id, claim.receiptName);
                          }}
                          style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                        >
                          <span title={claim.receiptName}>
                            {claim.receiptName.length > 10
                              ? `${claim.receiptName.substring(0, 10)}...`
                              : claim.receiptName}
                          </span>
                        </a>
                      ) : (
                        "No Receipt"
                      )}
                    </td>
                    <td>{formatDate(claim.submittedDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="approve-btn" onClick={() => handleApprove(claim.id)}>Approve</button>
                        <button className="reject-btn" onClick={() => handleRejectClick(claim.id)}>Reject</button>
                        <button className="download-btn" onClick={() => handleDownloadReceipt(claim.id, claim.receiptName)}>Download</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showReasonBox && (
          <div className="reason-popup">
            <h4>Enter Rejection Reason</h4>
            <textarea
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
            />
            <p style={{ fontSize: "0.9em", color: "gray" }}>Minimum 10 characters required</p>
            <button
              onClick={handleRejectConfirm}
              style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', marginRight: '10px' }}
            >
              Submit
            </button>
            <button
              onClick={() => setShowReasonBox(false)}
              style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}
            >
              Cancel
            </button>
          </div>
        )}

        {isModalOpen && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#fff", padding: "20px", borderRadius: "8px",
              boxShadow: "0 0 10px rgba(0,0,0,0.25)", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", textAlign: "center"
            }}>
              <h3>Receipt Preview</h3>
              {fileType === 'pdf' ? (
                <>
                  <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <Document
                      file={previewFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={(error) => console.error("Error loading PDF:", error)}
                    >
                      <Page pageNumber={pageNumber} />
                    </Document>
                  </div>
                  {numPages > 1 && (
                    <div className="pdf-controls" style={{ marginTop: '10px' }}>
                      <p>Page {pageNumber} of {numPages}</p>
                      <button onClick={prevPage} disabled={pageNumber <= 1} style={{ marginRight: '10px' }}>
                        Previous
                      </button>
                      <button onClick={nextPage} disabled={pageNumber >= numPages}>
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <img src={previewFile} alt="Receipt" style={{ maxWidth: "100%", maxHeight: "70vh", marginBottom: "20px" }} />
              )}
              <br />
              <button onClick={handleCloseModal} style={{
                padding: "10px 20px", border: "none", backgroundColor: "#f44336",
                color: "#fff", borderRadius: "5px", cursor: "pointer"
              }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashBoard;

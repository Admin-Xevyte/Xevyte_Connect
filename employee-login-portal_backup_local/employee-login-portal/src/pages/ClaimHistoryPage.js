import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import './Dashboard.css';
import { Document, Page, pdfjs } from 'react-pdf';
 
import './ClaimHistoryPage.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
 
// Correctly set the workerSrc from your installed package
 
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
function ClaimHistoryPage() {
  const [claims, setClaims] = useState([]);
  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const location = useLocation();
 const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
   const [isContractOpen, setIsContractOpen] = useState(false);
 
 const toggleContractMenu = () => {
   setIsContractOpen(!isContractOpen);
 };
  // Helper function to format the date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
  // Helper function to truncate long file names
  const truncateFileName = (fileName, length = 10) => {
    if (!fileName) {
      return "No Receipt";
    }
    if (fileName.length > length) {
      return `${fileName.substring(0, length)}...`;
    }
    return fileName;
  };
 
  // Memoized function to fetch claims to prevent unnecessary re-creations
  const fetchClaims = useCallback(() => {
    fetch(`/claims/history/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        const sortedClaims = data.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
        setClaims(sortedClaims);
      })
      .catch((err) => console.error("Error fetching history:", err));
  }, [employeeId]);
 
  // Combined useEffect for all data fetching and side effects
  useEffect(() => {
    // Fetch claims data
    fetchClaims();
 
    // Fetch profile picture
    if (employeeId) {
      fetch(`/profile/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem("employeeProfilePic", data.profilePic);
          }
        })
        .catch(err => console.error("Failed to fetch profile info:", err));
    }
 
    // Check for 'refresh' parameter in URL
    const params = new URLSearchParams(location.search);
    if (params.get('refresh') === 'true') {
      fetchClaims();
      // Remove the `?refresh=true` from the URL to prevent continuous refreshes.
      navigate(location.pathname, { replace: true });
    }
  }, [employeeId, location.search, navigate, fetchClaims]);
 
  // Effect for handling clicks outside the profile dropdown
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
 
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);
 
  // Handles viewing a receipt (both image and PDF)
  const handleViewReceipt = (id, receiptName) => {
    axios
      .get(`/claims/receipt/${id}`, { responseType: "arraybuffer" })
      .then((res) => {
        const fileExtension = receiptName.split('.').pop().toLowerCase();
        const blob = new Blob([res.data]);
        const fileUrl = URL.createObjectURL(blob);
 
        if (fileExtension === 'pdf') {
          setFileType('pdf');
          setPreviewFile(fileUrl);
        } else {
          setFileType('image');
          setPreviewFile(fileUrl);
        }
 
        setIsModalOpen(true);
      })
      .catch((err) => console.error("Error fetching receipt:", err));
  };
 
  const handleDownloadReceipt = (id, receiptName) => {
    axios
      .get(`/claims/receipt/${id}`, { responseType: "blob" })
      .then((res) => {
        const fileUrl = URL.createObjectURL(res.data);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.setAttribute("download", receiptName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileUrl);
      })
      .catch((err) => console.error("Error downloading receipt:", err));
  };
 
  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (previewFile) {
      URL.revokeObjectURL(previewFile);
      setPreviewFile(null);
    }
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
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
        alert("Failed to update profile picture.");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture.");
    }
  };
 
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };
 
  // Filtering logic based on the search term
  const filteredClaims = claims.filter(claim => {
    const searchString = searchTerm.toLowerCase();
    return (
      (claim.id && String(claim.id).toLowerCase().includes(searchString)) ||
      (claim.employeeId && String(claim.employeeId).toLowerCase().includes(searchString)) ||
      (claim.name && claim.name.toLowerCase().includes(searchString)) ||
      (claim.category && claim.category.toLowerCase().includes(searchString)) ||
      (claim.amount && String(claim.amount).toLowerCase().includes(searchString)) ||
      (claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(searchString)) ||
      (claim.businessPurpose && claim.businessPurpose.toLowerCase().includes(searchString)) ||
      (claim.additionalNotes && claim.additionalNotes.toLowerCase().includes(searchString)) ||
      (claim.expenseDate && claim.expenseDate.toLowerCase().includes(searchString)) ||
      (claim.receiptName && claim.receiptName.toLowerCase().includes(searchString)) ||
      (claim.submittedDate && new Date(claim.submittedDate).toLocaleDateString().toLowerCase().includes(searchString)) ||
      (claim.status && claim.status.toLowerCase().includes(searchString)) ||
      (claim.rejectionReason && claim.rejectionReason.toLowerCase().includes(searchString))
    );
  });
 
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
                    <button onClick={handleEditProfile} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                    <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Logout</button>
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
 
        <div style={{ padding: "0" }}>
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
          <h2>Your Claim History</h2>
          {filteredClaims.length === 0 ? (
            <p>No claims found matching your search criteria.</p>
          ) : (
            <div className="tablee">
              <table className="status-table">
                <thead>
                  <tr>
                   
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Expense Date</th>
                    <th>Receipt</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th>Rejection Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id}>
                 
                      <td>{claim.category}</td>
                      <td>{claim.amount}</td>
                      <td>{claim.expenseDescription}</td>
                      <td>{formatDate(claim.expenseDate)}</td>
                      <td>
  {claim.receiptName ? (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        // Change from handleViewReceipt to handleDownloadReceipt
        handleDownloadReceipt(claim.id, claim.receiptName);
      }}
      style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
    >
      <span title={claim.receiptName}>
        {truncateFileName(claim.receiptName)}
      </span>
    </a>
  ) : "No Receipt"}
</td>
<td>{claim.submittedDate ? formatDate(claim.submittedDate) : "N/A"}</td>
                      <td>{claim.status}</td>
                      <td>{claim.rejectionReason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                boxShadow: "0 0 10px rgba(0,0,0,0.25)", maxWidth: "90%", maxHeight: "90%", textAlign: "center"
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
                      <div className="pdf-controls">
                        <p>Page {pageNumber} of {numPages}</p>
                        <button onClick={prevPage} disabled={pageNumber <= 1}>
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
                  padding: "10px 20px", border: "none", backgroundColor: "rgba(16, 3, 2, 1)",
                  color: "#fff", borderRadius: "5px", cursor: "pointer"
                }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default ClaimHistoryPage;
 

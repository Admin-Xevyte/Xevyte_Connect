import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import './ClaimStatusPage.css';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
 
// Correct way for mjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
 
function ClaimStatusPage() {
  const [claims, setClaims] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
    const [isContractOpen, setIsContractOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const toggleContractMenu = () => {
    setIsContractOpen(!isContractOpen);
  };
 
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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
  }, [employeeId]);
 


  useEffect(() => {
    setLoading(true); // start loading before fetch
    fetch(`/claims/history/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        const filteredClaims = data.filter(
          claim => claim.status !== "Rejected" && claim.status !== "Paid"
        );

 const sortedClaims = data.sort((a, b) => b.id - a.id);
setClaims(sortedClaims);
setLoading(false); // done loading

        setClaims(sortedClaims);
        setLoading(false); // done loading after data set
      })
      .catch(err => {
        console.error("Error fetching status:", err);
        setLoading(false); // also stop loading on error
      });
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);
 
 
  const handleDownloadReceipt = async (claimId, fileName) => {
    try {
        const response = await axios.get(
            `/claims/receipt/${claimId}`,
            { responseType: "blob" } // Ensure the response is a blob
        );
 
        // Create a temporary URL for the blob data
        const fileURL = window.URL.createObjectURL(new Blob([response.data]));
 
        // Create a hidden anchor element
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', fileName); // Set the filename for download
        document.body.appendChild(link); // Append to the document body
 
        // Trigger the download
        link.click();
 
        // Clean up by removing the link and revoking the URL
        document.body.removeChild(link);
        window.URL.revokeObjectURL(fileURL);
 
    } catch (error) {
        console.error("Error downloading receipt:", error);
        alert("Failed to download the receipt.");
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
 
      if (res.ok && data.profilePic) {
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
      console.error("Upload error:", error);
      alert("Error uploading profile picture.");
    }
  };
 
  // --- UPDATED PREVIEW LOGIC ---
  const handleViewReceipt = async (claimId, fileName) => {
    try {
      const response = await axios.get(
        `/claims/receipt/${claimId}`,
        { responseType: "blob" }
      );
     
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const fileUrl = URL.createObjectURL(response.data);
     
      setPreviewFile(fileUrl);
      if (fileExtension === 'pdf') {
        setFileType('pdf');
      } else {
        setFileType('image');
      }
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching receipt:", error);
    }
  };
 
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on load
  };
 
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
    URL.revokeObjectURL(previewFile); // Clean up the object URL
  };
 
  const goToPrevPage = () => setPageNumber(prevPageNumber => prevPageNumber - 1);
  const goToNextPage = () => setPageNumber(prevPageNumber => prevPageNumber + 1);
 
  // Filter the claims based on the search term.
  // We use useMemo to optimize and prevent re-calculation on every render.
  const filteredClaims = useMemo(() => {
    if (!searchTerm) {
      return claims;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return claims.filter(claim => {
      // Create an array of values from the claim object to search through.
      // This includes all the fields in your table.
      const searchableFields = [
        String(claim.id),
        String(claim.employeeId),
        claim.name,
        claim.category,
        String(claim.amount),
        claim.expenseDescription,
        claim.businessPurpose,
        claim.additionalNotes,
        claim.expenseDate,
        claim.receiptName,
        claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString() : "N/A",
        claim.status,
        claim.nextApprover,
      ];
 
      // Check if any of the fields contain the search term.
      return searchableFields.some(field =>
        field && field.toLowerCase().includes(lowercasedSearchTerm)
      );
    });
  }, [claims, searchTerm]);
 
  return (
    <div className="dashboard-container">
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
 
            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
              <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                  <div ref={profileDropdownRef} className="profile-dropdown"
                    style={{
                      position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', zIndex: 1000, width: '150px'
                    }}>
                    <button onClick={handleEditProfile} style={{ padding: '10px', width: '100%', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                    <button onClick={handleLogout} style={{ padding: '10px', width: '100%' }}>Logout</button>
                  </div>
                )}
                {successMessage && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, backgroundColor: '#4BB543',
                    color: 'white', padding: '8px 12px', borderRadius: '4px',
                    fontSize: '14px', marginTop: '5px'
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
 
  <h2>Your Claim Status</h2>
 
{loading ? null : claims.length === 0 ? (
  <p>No claims submitted yet.</p>
) : filteredClaims.length === 0 ? (
  <p>No claims found for your search criteria.</p>
) : (
    <div className="table">
      <table className="status-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
           
            <th>Category</th>
            <th>Amount</th>
            <th>Description</th>
         
            <th>Expense Date</th>
            <th>Receipt</th>
            <th>Submitted Date</th>
            <th>Status</th>
            <th>Next Approver</th>
          </tr>
        </thead>
        <tbody>
          {filteredClaims.map((claim) => (
            <tr key={claim.id}>
              
              <td>{claim.category}</td>
              <td>{claim.amount}</td>
              <td>{claim.expenseDescription}</td>
              {/* <td>{claim.businessPurpose}</td> */}
              {/* <td>{claim.additionalNotes}</td> */}
               <td>{formatDate(claim.expenseDate)}</td>
 <td>
                                                {claim.receiptName ? (
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
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
              <td>{claim.nextApprover || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
 
  {isModalOpen && previewFile && (
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
              <Document file={previewFile} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} />
              </Document>
            </div>
            <div className="pdf-controls">
              <p>Page {pageNumber} of {numPages}</p>
              <button onClick={goToPrevPage} disabled={pageNumber <= 1}>Previous</button>
              <button onClick={goToNextPage} disabled={pageNumber >= numPages}>Next</button>
            </div>
          </>
        ) : (
          <img
            src={previewFile}
            alt="Receipt"
            style={{ maxWidth: "100%", maxHeight: "70vh", marginBottom: "20px" }}
          />
        )}
        <br />
        <button onClick={handleCloseModal} style={{
          padding: "10px 20px", border: "none", backgroundColor: "#f44336",
          color: "#fff", borderRadius: "5px", cursor: "pointer", marginTop: '0'
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
 
export default ClaimStatusPage;

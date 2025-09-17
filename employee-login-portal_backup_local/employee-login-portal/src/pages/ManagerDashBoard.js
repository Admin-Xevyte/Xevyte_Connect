import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./ManagerDashboard.css";
import { Link, useNavigate } from 'react-router-dom';
import "./Dashboard.css";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import Sidebar from './Sidebar.js';
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;
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
  
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
const [loading, setLoading] = useState(true);
  // New state variables for PDF/Image preview
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  
const [validationErrors, setValidationErrors] = React.useState({});
const [allocationErrors, setAllocationErrors] = React.useState([]);



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

    fetch(`http://3.7.139.212:8080/profile/${storedId}`)
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
      .post(`http://3.7.139.212:8080/claims/approve/${id}?role=Manager`)
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
        `http://3.7.139.212:8080/claims/reject/${selectedClaimId}?role=Manager&reason=${encodeURIComponent(
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
      .get(`http://3.7.139.212:8080/claims/receipt/${id}`, { responseType: "blob" })
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
      .get(`http://3.7.139.212:8080/claims/receipt/${id}`, {
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



  return (
   <Sidebar>
     
      <div className="manager-dashboard">
       
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
                 {loading ? null : !employeeId ? (
  <p>Please login or provide an employee ID.</p>
) : originalClaims.length === 0 ? (
  <p>You do not have any assigned claims at the moment.</p>
) : claims.length === 0 ? (
  <p>No claims found matching your search criteria.</p>
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
                      <button
                        type="button"
                        className="approve-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          handleApprove(claim.id);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="reject-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRejectClick(claim.id);
                        }}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="download-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadReceipt(claim.id, claim.receiptName);
                        }}
                      >
                        Download
                      </button>
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
   </Sidebar>
  );
}

export default ManagerDashBoard;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import './HRDashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
 import Sidebar from './Sidebar.js';
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;
 
function HRDashboard() {
    const [claims, setClaims] = useState([]);
    const [originalClaims, setOriginalClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || "");
    const [searchTerm, setSearchTerm] = useState("");

 
    const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
    const [profileOpen, setProfileOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);
    const profileDropdownRef = useRef(null);
    
 const allowedUsers = ["H100646", "H100186", "H100118", "EMP111"];
   const navigate = useNavigate();

 const [validationErrors, setValidationErrors] = React.useState({});
 const [allocationErrors, setAllocationErrors] = React.useState([]);

    const employeeId = localStorage.getItem("employeeId");
 
    // New state for PDF preview
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

      const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
 
    useEffect(() => {
        const storedName = localStorage.getItem("employeeName");
        setEmployeeName(storedName);
        if (employeeId) {
            fetchHRClaims(employeeId);
            fetchProfileInfo(employeeId);
        }
    }, [employeeId]);
 
 const fetchHRClaims = (hrId) => {
  setLoading(true);

  axios
    .get(`http://3.7.139.212:8080/claims/hr/${hrId}`)
    .then((response) => {
      const fetchedClaims = response.data;

      const sortedClaims = fetchedClaims.sort((a, b) => b.id - a.id);

      setClaims(sortedClaims);
      setOriginalClaims(sortedClaims);
      console.log("Fetched and sorted assigned claims:", sortedClaims);
    })
    .catch((err) => {
      console.error("Error fetching claims:", err);
    })
    .finally(() => {
      setLoading(false);
    });
};


    const fetchProfileInfo = (empId) => {
        fetch(`http://3.7.139.212:8080/profile/${empId}`)
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
    };
 
  
 
 
   
 
  const updateStatus = (claimId, status) => {
    axios
        .put(`http://3.7.139.212:8080/claims/hr/update-status/${claimId}?status=${status}`)
        .then(() => {
            // Update the claims state to reflect the new status
            setClaims(prevClaims =>
                prevClaims.map(claim =>
                    claim.id === claimId ? { ...claim, status: status } : claim
                )
            );
            // Also update the originalClaims state for the search functionality
            setOriginalClaims(prevClaims =>
                prevClaims.map(claim =>
                    claim.id === claimId ? { ...claim, status: status } : claim
                )
            );
            // Optionally, show a success message to the user
            setSuccessMessage(`Claim ${claimId} status updated to ${status}!`);
            setTimeout(() => setSuccessMessage(""), 3000);
        })
        .catch((error) => console.error(`Error updating status:`, error));
};
 
    // Modified handleViewReceipt to support both images and PDFs
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
   
    // Handlers for the modal and PDF
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPreviewFile(null);
        setFileType(null);
        setNumPages(null);
        setPageNumber(1);
        // Clean up the URL object to free up memory
        if (previewFile) {
            URL.revokeObjectURL(previewFile);
        }
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
 
    // useEffect hook for filtering claims
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
               
                // Special check for date fields
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
            // If search term is empty, show all claims from the original list
            setClaims(originalClaims);
        }
    }, [searchTerm, originalClaims]);
 
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
                                    <th>Amount</th>
                                    <th>Description</th>
                                    {/* <th>Business Purpose</th> */}
                                    <th>Expense Date</th>
                                    <th>Receipt</th>
                                    <th>Submitted Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.map((claim) => (
                                    <tr key={claim.id}>
                                        <td>{claim.id}</td>
                                        <td>{claim.employeeId}</td>
                                        <td>{claim.name}</td>
                                        <td>{claim.category}</td>
                                        <td>{claim.amount}</td>
                                        <td>{claim.expenseDescription}</td>
                                        {/* <td>{claim.businessPurpose}</td> */}
                                     <td>{new Date(claim.expenseDate).toLocaleDateString('en-GB').replaceAll('/', '-')}</td>

                                        <td>
    {claim.receiptName ? (
        <button
            onClick={() => handleViewReceipt(claim.id, claim.receiptName)}
            style={{
                cursor: "pointer",
                color: "blue",
                textDecoration: "underline",
                backgroundColor: "transparent",
                border: "none",
                padding: 0
            }}
        >
            {claim.receiptName.length > 10
                ? `${claim.receiptName.substring(0, 10)}...`
                : claim.receiptName}
        </button>
    ) : (
        "No Receipt"
    )}
</td>
                                         <td>{formatDate(claim.submittedDate)}</td>
                                        <td>{claim.status}</td>
                                        <td>
                                            {claim.status !== "Paid" && (
                                                <div className="action-buttons">
                                                    <button type="button" className="approve-btn" onClick={() => updateStatus(claim.id, "Initiated")}>Initiated</button>
<button type="button" className="reject-btn" onClick={() => updateStatus(claim.id, "Payment Under Process")}>Payment Under Process</button>
<button type="button" className="download-btn" onClick={() => updateStatus(claim.id, "Paid")}>Paid</button>

                                                </div>
                                            )}
                                        </td>
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
                            boxShadow: "0 0 10px rgba(0,0,0,0.25)", maxWidth: "90%", maxHeight: "90vh", textAlign: "center",
                            display: 'flex', flexDirection: 'column', gap: '10px'
                        }}>
                            <h3>Receipt Preview</h3>
                            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                                {fileType === 'pdf' ? (
                                    <div className="pdf-container">
                                        <Document
                                            file={previewFile}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            onLoadError={(error) => console.error("Error loading PDF:", error)}
                                        >
                                            <Page pageNumber={pageNumber} />
                                        </Document>
                                       
                                    </div>
                                ) : (
                                    <img src={previewFile} alt="Receipt" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: 'contain' }} />
                                )}
                            </div>
                            {numPages > 1 && (
                                <div className="pdf-controls">
                                    <p>Page {pageNumber} of {numPages}</p>
                                    <button onClick={prevPage} disabled={pageNumber <= 1}>Previous</button>
                                    <button onClick={nextPage} disabled={pageNumber >= numPages}>Next</button>
                                </div>
                            )}
                            <button onClick={handleCloseModal} style={{
                                padding: "10px 20px", border: "none", backgroundColor: "#f44336",
                                color: "#fff", borderRadius: "5px", cursor: "pointer", marginTop: 'auto'
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
 
export default HRDashboard;

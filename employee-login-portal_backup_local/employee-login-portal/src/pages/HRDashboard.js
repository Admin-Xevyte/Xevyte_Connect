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
 
function Designhr() {
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
      // Set a success message
      setSuccessMessage(`Claim ${claimId} status updated to ${status}!`);
      setTimeout(() => setSuccessMessage(""), 3000);

      // --- START OF NEW LOGIC ---
      // If the status is "Paid", remove the claim from the front-end state
      if (status === "Paid") {
        setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
        setOriginalClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
      } else {
        // For other statuses, update the status as before
        setClaims(prevClaims =>
          prevClaims.map(claim =>
            claim.id === claimId ? { ...claim, status: status } : claim
          )
        );
        setOriginalClaims(prevClaims =>
          prevClaims.map(claim =>
            claim.id === claimId ? { ...claim, status: status } : claim
          )
        );
      }
      // --- END OF NEW LOGIC ---
    })
    .catch((error) => console.error(`Error updating status:`, error));
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
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
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

  useEffect(() => {
    if (searchTerm.length > 0) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = originalClaims.filter(claim => {
        const matchesClaimId = String(claim.id).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesEmployeeId = String(claim.employeeId).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesEmployeeName = claim.name && claim.name.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesCategory = claim.category && claim.category.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesBusinessPurpose = claim.businessPurpose && claim.businessPurpose.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesAdditionalNotes = claim.additionalNotes && claim.additionalNotes.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesAmount = String(claim.amount).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesDescription = claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(lowerCaseSearchTerm);
        
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

  return (
    <div className="manager-dashboard">
      {loading ? null : !employeeId ? (
        <p>Please login or provide an employee ID.</p>
      ) : originalClaims.length === 0 ? (
        <p>You do not have any assigned claims at the moment.</p>
      ) : claims.length === 0 ? (
        <p>No claims found matching your search criteria.</p>
      ) : (
     <div
  className="table-wrapper"
  style={{
    maxHeight: "calc(100vh - 300px)",
    overflowY: "auto",
  }}
>
          <table className="status-table">
            <thead>
              <tr>
                <th style={{ backgroundColor: 'darkblue', color: 'white', width: '90px' }}>Claim ID</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Employee ID</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Employee Name</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Category</th>
              <th style={{ backgroundColor: 'darkblue', color: 'white', width: '80px' }}>Amount</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Description</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Expense Date</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' , width: '110px'}}>Receipt</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Submitted Date</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white', width: '90px' }}>Status</th>
                <th style={{ backgroundColor: 'darkblue', color: 'white' , width: '120px'}}>Actions</th>
              </tr>
            </thead>
           <tbody style={{  backgroundColor:'#f7f9fa',}}>
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td>{claim.id}</td>
                  <td>{claim.employeeId}</td>
                  <td>{claim.name}</td>
                  <td>{claim.category}</td>
                  <td>{claim.amount}</td>
                  <td>{claim.expenseDescription}</td>
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
                          ? `${claim.receiptName.substring(0, 8)}...`
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
                        <button type="button" className="approve-btn" onClick={() => updateStatus(claim.id, "Initiated")}     style={{
        width: "90px",       // 👈 same width
        padding: "6px 0",
        textAlign: "center",
      }}
    >Initiated</button>
                        <button type="button" className="reject-btn" onClick={() => updateStatus(claim.id, "Payment Under Process")}    style={{
        width: "90px",       // 👈 same width
        padding: "6px 0",
        textAlign: "center",
      }}
    >Payment in process</button>
                        <button type="button" className="download-btn" onClick={() => updateStatus(claim.id, "Paid")}    style={{
        width: "90px",       // 👈 same width
        padding: "6px 0",
        textAlign: "center",
      }}
    >Paid</button>
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
  );
}

export default Designhr;

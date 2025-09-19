import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import './Dashboard.css';
import { Document, Page, pdfjs } from 'react-pdf';
 import Sidebar from './Sidebar.js';
import './ClaimHistoryPage.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
 
// Correctly set the workerSrc from your installed package
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;
function DesignHistory() {
  const [claims, setClaims] = useState([]);
  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
 
 
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const location = useLocation();

 const [loading, setLoading] = useState(true);

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
 
const fetchClaims = useCallback(() => {
  setLoading(true); // start loading
  fetch(`http://3.7.139.212:8080/claims/history/${employeeId}`)
    .then((res) => res.json())
    .then((data) => {
   const sortedClaims = data.sort((a, b) => b.id - a.id);
setClaims(sortedClaims);
setLoading(false); // done loading // done loading
    })
    .catch((err) => {
      console.error("Error fetching history:", err);
      setLoading(false); // stop loading even on error
    });
}, [employeeId]);

 
  // Combined useEffect for all data fetching and side effects
  useEffect(() => {
    // Fetch claims data
    fetchClaims();
 
    // Fetch profile picture
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/profile/${employeeId}`)
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

 

 
  // Handles viewing a receipt (both image and PDF)
  const handleViewReceipt = (id, receiptName) => {
    axios
      .get(`http://3.7.139.212:8080/claims/receipt/${id}`, { responseType: "arraybuffer" })
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
      .get(`http://3.7.139.212:8080/claims/receipt/${id}`, { responseType: "blob" })
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
 
        <div style={{ padding: "0" }}>
     {loading ? null : claims.length === 0 ? (
  <p>No claims submitted yet.</p>
) : filteredClaims.length === 0 ? (
  <p>No claims found for your search criteria.</p>
) : (
            <div className="tablee">
              <table className="status-table">
              <thead>
  <tr>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Claim ID</th>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Category</th>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Amount</th>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Description</th>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Expense Date</th>
 
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Submitted Date</th>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Status</th>
    <th style={{ backgroundColor: 'darkblue', color: 'white' }}>Rejection Reason</th>
  </tr>
</thead>

                  <tbody style={{  backgroundColor:'#f7f9fa',}}>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id}>
                     <td>{claim.id}</td>
                      <td>{claim.category}</td>
                      <td>{claim.amount}</td>
                      <td>{claim.expenseDescription}</td>
                      <td>{formatDate(claim.expenseDate)}</td>
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
  
  );
}
 
export default DesignHistory;
 

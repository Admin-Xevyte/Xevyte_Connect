import React, { useState, useEffect, useRef } from 'react';
import './Saveddrafts.css';
import { Link, useNavigate } from 'react-router-dom';
import "./Dashboard.css";
import axios from 'axios';
 import Sidebar from './Sidebar.js';
function Saveddrafts() {
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [role, setRole] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};
 
 

 
  const fetchDrafts = () => {
    const empId = localStorage.getItem("employeeId");
    if (empId) {
      axios.get(`http://3.7.139.212:8080/claims/drafts/${empId}`)
        .then(res => {
          const sortedDrafts = res.data.sort((a, b) => b.expenseId - a.expenseId);
          setDrafts(sortedDrafts);
          // setMessage('Drafts loaded successfully.');
        })
        .catch(err => {
          console.error('Failed to fetch drafts:', err);
          setMessage('Error fetching drafts.');
        });
    }
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
    const empId = localStorage.getItem("employeeId");
    setEmployeeId(empId);
    setEmployeeName(localStorage.getItem("employeeName"));
    setRole(localStorage.getItem("role"));
 
    fetchDrafts();
 
    fetch(`http://3.7.139.212:8080/profile/${empId}`)
      .then(res => res.json())
      .then(data => {
        setProfilePic(data.profilePic);
        setEmployeeName(data.name);
      })
      .catch(err => console.error("Profile fetch failed:", err));
  }, []);
 
  const handleDelete = (draftId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this draft?");
    if (confirmDelete) {
        axios.delete(`http://3.7.139.212:8080/claims/draft/delete/${draftId}`)
            .then(res => {
                // Remove the draft from the frontend state
                const updatedDrafts = drafts.filter((draft) => draft.expenseId !== draftId);
                setDrafts(updatedDrafts);
                // setMessage('Draft deleted from backend and view.');
            })
            .catch(err => {
                console.error("Error deleting draft:", err);
                setMessage('Error deleting draft from backend.');
            });
    }
};
 
 
  const handleEdit = (draftId) => {
    navigate('/new', { state: { draftId: draftId } });
  };

 
  const filteredDrafts = drafts.filter(draft => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return (
      String(draft.expenseId).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.description?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.category?.toLowerCase().includes(lowercasedSearchTerm) ||
      String(draft.amount).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.date?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.businessPurpose?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.additionalNotes?.toLowerCase().includes(lowercasedSearchTerm)
    );
  });
 
  return (
 
   <Sidebar>
      <div className="manager-dashboard">
       
 
      <div className="form-container">
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
 
  <h1>Saved Drafts</h1>
  {message && <div style={{ color: 'green' }}>{message}</div>}
 
  <div className="table-scroll">
    <table className="drafts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Draft ID</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Expense Date</th>
          <th>Receipts</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredDrafts.length === 0 ? (
          <tr>
            {/* <td colSpan="9" style={{ textAlign: 'center' }}>
              {drafts.length === 0 ? "No drafts saved." : "No matching drafts found."}
            </td> */}
          </tr>
        ) : (
          filteredDrafts.map((draft) => (
            <tr key={draft.expenseId}>
              <td>{draft.expenseId}</td>
              <td>{draft.description}</td>
              <td>{draft.category}</td>
              <td>₹{draft.amount}</td>
              <td>{formatDate(draft.date)}</td>
             <td className="receipt-cell">
  {draft.receiptName ? (
    <a
  href={`http://3.7.139.212:8080/claims/draft/receipt/${draft.expenseId}`}
  download={draft.receiptName}
  target="_blank"
  rel="noopener noreferrer"
>
      <span title={draft.receiptName}>
        {draft.receiptName.length > 10
          ? `${draft.receiptName.substring(0, 10)}...`
          : draft.receiptName}
      </span>
    </a>
  ) : (
    '—'
  )}
</td>
              <td>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEdit(draft.expenseId)}
                    style={{
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(draft.expenseId)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
 
  <Link
    to="/new"
    style={{
      display: 'inline-block',
      marginTop: '15px',
      textDecoration: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px'
    }}
  >
    + Add New Claim
  </Link>
</div>
 
      </div>
 </Sidebar>
  );
}
 
export default Saveddrafts;
 

import React, { useState, useEffect, useRef } from 'react';
import './Saveddrafts.css';
import { Link, useNavigate } from 'react-router-dom';
import "./Dashboard.css";
import axios from 'axios';

function Designdraft() {
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [role, setRole] = useState(null);

 const [loading, setLoading] = useState(true);
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
      axios.get(`http://localhost:8082/claims/drafts/${empId}`)
        .then(res => {
          const sortedDrafts = res.data.sort((a, b) => b.expenseId - a.expenseId);
          setDrafts(sortedDrafts);
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

    fetch(`http://localhost:8082/profile/${empId}`)
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
      axios.delete(`http://localhost:8082/claims/draft/delete/${draftId}`)
        .then(res => {
          const updatedDrafts = drafts.filter((draft) => draft.expenseId !== draftId);
          setDrafts(updatedDrafts);
        })
        .catch(err => {
          console.error("Error deleting draft:", err);
          setMessage('Error deleting draft from backend.');
        });
    }
  };

  const handleEdit = (draftId) => {
    navigate('/design', { state: { activeTab: 'New Claim', draftId } });
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
  <div style={{ padding: "0" }}>
<div className="tableas-scroll">
  {filteredDrafts.length === 0 ? (
    // Show only the message without any borders
    <p>
      {drafts.length === 0 ? (
        "No drafts saved yet."
      ) : (
        "No matching drafts found for your search criteria."
      )}
    </p>
  ) : (
    // Otherwise, show the full table with headers and data
    <table className="draftss-table">
      <thead>
        <tr>
          <th style={{ backgroundColor: 'darkblue', color: 'white' , textAlign: 'center'}}>Draft ID</th>
          <th style={{ backgroundColor: 'darkblue', color: 'white', textAlign: 'center' }}>Description</th>
          <th style={{ backgroundColor: 'darkblue', color: 'white', textAlign: 'center' }}>Category</th>
          <th style={{ backgroundColor: 'darkblue', color: 'white', textAlign: 'center' }}>Amount</th>
          <th style={{ backgroundColor: 'darkblue', color: 'white', textAlign: 'center' }}>Expense Date</th>
          <th style={{ backgroundColor: 'darkblue', color: 'white', textAlign: 'center' }}>Receipts</th>
          <th style={{ backgroundColor: 'darkblue', color: 'white', textAlign: 'center' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredDrafts.map((draft) => (
          <tr key={draft.expenseId}>
            <td onClick={() => handleEdit(draft.expenseId)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline', textAlign: 'center' }}>
              {draft.expenseId}
            </td>
            <td>{draft.description}</td>
            <td>{draft.category}</td>
            <td>₹{draft.amount}</td>
            <td>{formatDate(draft.date)}</td>
            <td className="receipt-cell">
              {draft.receiptName ? (
                <a
                  href={`http://localhost:8082/claims/draft/receipt/${draft.expenseId}`}
                  download={draft.receiptName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span title={draft.receiptName}>
                    {truncateFileName(draft.receiptName)}
                  </span>
                </a>
              ) : (
                '—'
              )}
            </td>
            <td>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
        ))}
      </tbody>
    </table>
  )}
</div>
      
    </div>
  );
}

export default Designdraft;

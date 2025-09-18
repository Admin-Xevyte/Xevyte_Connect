import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
function LeavesDrafts() {
  // Common states for sidebar and top bar
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");
  const [holidays, setHolidays] = useState([]);
;
  const navigate = useNavigate();

  // States for LeavesDrafts functionality
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState("");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // UPDATED: calculateTotalDays function to exclude holidays
  const calculateTotalDays = (startDate, endDate, holidays) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const currentDate = new Date(start.getTime());

    // Convert holidays array to a Set for faster lookup
    const holidayDates = new Set(holidays.map(h => h.toISOString().slice(0, 10)));

    // Loop through each day from start to end
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dateString = currentDate.toISOString().slice(0, 10);

      // Check if the current day is a weekday (Monday to Friday) AND not a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateString)) {
        count++;
      }
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  };

  // UPDATED: draftsWithDays useMemo to pass the holidays state
  const draftsWithDays = useMemo(() => {
    return drafts.map(draft => ({
      ...draft,
      totalDays: calculateTotalDays(draft.startDate, draft.endDate, holidays),
    }));
  }, [drafts, holidays]);


  // UPDATED: useEffect to load holidays and then drafts
  useEffect(() => {
    async function loadData() {
      if (!employeeId) return;
      setLoadingDrafts(true);
      setDraftsError("");

      try {
        // First, fetch holidays
        await fetchHolidays();

        // Then, fetch drafts
        const res = await fetch(`http://3.7.139.212:8080/leaves/drafts/${employeeId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        // Ensure data is an array before sorting
        const draftsData = Array.isArray(data) ? data : [];

        // Sort drafts by ID desc
        const sortedDrafts = draftsData.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        setDrafts(sortedDrafts);
      } catch (err) {
        console.error("Failed to fetch data from backend", err);
        setDrafts([]);
        setDraftsError("Failed to load drafts. Please try again.");
      } finally {
        setLoadingDrafts(false);
      }
    }
    loadData();
  }, [employeeId]);






  // Handlers for LeavesDrafts
  const handleEditDraft = (draftToEdit) => {
    navigate('/home7', { state: { draftToEdit: draftToEdit } });
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`http://3.7.139.212:8080/leaves/holidays`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const holidayDates = data.map(h => new Date(h.holidayDate + 'T00:00:00'));
      setHolidays(holidayDates);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    }
  };

  // ✅ Delete draft from backend and update list with message
  const handleDeleteDraft = async (draftId) => {
    try {
      const res = await fetch(`http://3.7.139.212:8080/leaves/drafts/${draftId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
        setDrafts(updatedDrafts);
        setSuccessMessage("Draft deleted successfully 🗑️");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Failed to delete draft");
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert("Error deleting draft. See console for details.");
    }
  };

  // ✅ Improved download (forces browser to download)
  const handleDownloadDraft = async (draft) => {
    try {
      const res = await fetch(`http://3.7.139.212:8080/leaves/drafts/download/${draft.id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = draft.fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download draft file:", err);
      alert("Failed to download file.");
    }
  };

  const filteredDrafts = useMemo(() => {
    if (!searchTerm) {
      return draftsWithDays; // Use the calculated drafts
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return draftsWithDays.filter(draft => {
      const draftValues = [
        String(draft.type ?? ''),
        String(draft.startDate ?? ''),
        String(draft.endDate ?? ''),
        String(draft.totalDays ?? ''),
        String(draft.fileName || ''),
        String(draft.reason ?? ''),
      ].map(value => value.toLowerCase());

      return draftValues.some(value => value.includes(lowercasedSearchTerm));
    });
  }, [draftsWithDays, searchTerm]);

  return (
  <Sidebar>
      <div className="main-content">
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "20px 0 20px 0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
            width: "fit-content",
            display: "block",
          }}
        >
          ⬅ Back
        </button>

        {/* Leaves Drafts Content */}
        <div className="dashboard-content" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: '1', padding: '0 20px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '15px' }}>My Saved Leave Drafts</h3>

            {loadingDrafts && (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                Loading drafts…
              </div>
            )}

            {!!draftsError && (
              <div style={{ textAlign: 'center', color: '#d9534f', marginTop: '20px' }}>
                {draftsError}
              </div>
            )}

            {!loadingDrafts && !draftsError && filteredDrafts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                No saved drafts found.
              </div>
            ) : (
              !loadingDrafts && !draftsError && (
                <div
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    maxHeight: 'calc(100vh - 300px)',
                    overflowY: 'auto',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'center', border: '1px solid #ddd', zIndex: 2, width: '8%' }}>Draft ID</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '10%' }}>Leave Type</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '12%' }}>Start Date</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '12%' }}>End Date</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'center', border: '1px solid #ddd', zIndex: 2, width: '8%' }}>Total Days</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '15%' }}>Uploaded File</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'left', border: '1px solid #ddd', zIndex: 2, width: '25%' }}>Reason</th>
                        <th style={{ position: 'sticky', top: 0, backgroundColor: '#4c82d3', color: '#ffffff', padding: '10px', textAlign: 'center', border: '1px solid #ddd', zIndex: 2, width: '10%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrafts.map((draft) => (
                        <tr key={draft.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top' }}>
                            {draft.id || "--"}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>{draft.type || "--"}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            {draft.startDate ? formatDate(draft.startDate) : "--"}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            {draft.endDate ? formatDate(draft.endDate) : "--"}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top' }}>
                            {draft.totalDays || "--"}
                          </td>
                         <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            {draft.hasFile ? (
                              <button
                                onClick={() => handleDownloadDraft(draft)}
                                style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                title={draft.fileName} // Tooltip for full filename
                              >
                                {draft.fileName.length > 10 ? `${draft.fileName.substring(0, 10)}...` : draft.fileName}
                              </button>
                            ) : (
                              'No File Uploaded'
                            )}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', wordWrap: 'break-word', whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {draft.reason || "--"}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              border: '1px solid #ddd',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <button
                              onClick={() => handleEditDraft(draft)}
                              style={{
                                padding: '8px 18px',
                                fontSize: '14px',
                                fontWeight: '500',
                                backgroundColor: '#1E90FF',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                width: '100px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'background-color 0.2s, transform 0.1s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4169E1')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1E90FF')}
                              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft.id)}
                              style={{
                                padding: '8px 18px',
                                fontSize: '14px',
                                fontWeight: '500',
                                backgroundColor: '#DC143C',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                width: '100px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'background-color 0.2s, transform 0.1s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B22222')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#DC143C')}
                              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
</Sidebar>
  );
}

export default LeavesDrafts;









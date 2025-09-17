
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Travel.css';
import Sidebar from './Sidebar.js';
function Travel() {
  const employeeId = localStorage.getItem("employeeId");
  const role = localStorage.getItem("role");
  const adminId = (role === "admin") ? employeeId : null;
  const [selectedFiles, setSelectedFiles] = useState({});
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || '');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
 const [canViewTasks, setCanViewTasks] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('New Ticket');
  
  const [newRequest, setNewRequest] = useState({
    name: '',
    fromLocation: '',
    toLocation: '',
    modeOfTravel: 'Select',
    category: 'Select',
    departureDate: '',
    returnDate: '',
    accommodationRequired: 'No',
    advanceRequired: 'No',
    remarks: '',
    employeeId: employeeId,
  });
  const [activeTickets, setActiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);

const [filters, setFilters] = useState({
  travelId: '',
  category: 'All',
  modeOfTravel: 'All',
  departDate: 'DESC',
  returnDate: 'DESC',
  fromLocation: '',
  toLocation: '',
  accommodationRequired: 'All',
  advanceRequired: 'All',
  remarks: '',
  status: 'All',
  rejectedReason: ''
});

const handleFilterChange = (event) => {
  const { name, value } = event.target;
  setFilters(prevFilters => ({
    ...prevFilters,
    [name]: value
  }));
};

 useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        const { manager, admin } = data; // Only care about manager and admin

        const canView = manager || admin; // Only manager or admin can view tasks

        setCanViewTasks(canView);
      })
      .catch(err => {
        console.error("Error fetching task visibility:", err);
        setCanViewTasks(false); // Default to false if there's an error
      });
  }
}, [employeeId]);


const filteredHistory = useMemo(() => {
  let filtered = [...historyTickets];

  // Apply filters
  if (filters.travelId) {
    filtered = filtered.filter(ticket => ticket.id.toString().includes(filters.travelId));
  }
  if (filters.category !== 'All') {
    filtered = filtered.filter(ticket => ticket.category === filters.category);
  }
  if (filters.modeOfTravel !== 'All') {
    filtered = filtered.filter(ticket => ticket.modeOfTravel === filters.modeOfTravel);
  }
  if (filters.fromLocation) {
    filtered = filtered.filter(ticket => ticket.fromLocation.toLowerCase().includes(filters.fromLocation.toLowerCase()));
  }
  if (filters.toLocation) {
    filtered = filtered.filter(ticket => ticket.toLocation.toLowerCase().includes(filters.toLocation.toLowerCase()));
  }
  if (filters.accommodationRequired !== 'All') {
    filtered = filtered.filter(ticket => ticket.accommodationRequired === filters.accommodationRequired);
  }
  if (filters.advanceRequired !== 'All') {
    filtered = filtered.filter(ticket => ticket.advanceRequired === filters.advanceRequired);
  }
  if (filters.remarks) {
    filtered = filtered.filter(ticket => ticket.remarks.toLowerCase().includes(filters.remarks.toLowerCase()));
  }
  if (filters.status !== 'All') {
    filtered = filtered.filter(ticket => ticket.status === filters.status);
  }
  if (filters.rejectedReason) {
    filtered = filtered.filter(ticket => ticket.rejectedReason && ticket.rejectedReason.toLowerCase().includes(filters.rejectedReason.toLowerCase()));
  }

  // Apply sorting
  if (filters.departDate === 'ASC') {
    filtered.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  } else {
    filtered.sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));
  }
  if (filters.returnDate === 'ASC') {
    filtered.sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));
  } else {
    filtered.sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate));
  }
  
return filtered;
}, [historyTickets, filters]);

const handleFileChange = (requestId, e) => {
  const newFiles = Array.from(e.target.files); // Convert FileList to array

  setSelectedFiles(prev => ({
    ...prev,
    [requestId]: prev[requestId]
      ? [...prev[requestId], ...newFiles] // Append to existing
      : newFiles, // First time selection
  }));
};

             // helper function to split text into equal rows
const splitIntoRows = (text, rowLength) => {
  const rows = [];
  for (let i = 0; i < text.length; i += rowLength) {
    rows.push(text.slice(i, i + rowLength));
  }
  return rows;
};
useEffect(() => {
    const fetchActiveRequests = async () => {
        try {
            const response = await fetch(`http://3.7.139.212:8080/api/travel/employee/active/${employeeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch active requests');
            }
            const data = await response.json();
            setActiveTickets(data);
        } catch (error) {
            console.error("Error fetching active requests:", error);
            // Handle the error, maybe set an error state
        }
    };

    if (activeTab === 'Awaiting Approval') {
        fetchActiveRequests();
    }
}, [activeTab, employeeId]);
useEffect(() => {
    const fetchHistoryRequests = async () => {
        try {
            const response = await fetch(`http://3.7.139.212:8080/api/travel/employee/all/${employeeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }
            const data = await response.json();
            setHistoryTickets(data); // <-- Corrected line
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    if (activeTab === 'History') {
        fetchHistoryRequests();
    }
}, [activeTab, employeeId]);

const handleUpload = async (requestId) => {
  const files = selectedFiles[requestId];
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
  let totalSize = 0;

  if (!files || files.length === 0) {
    alert("Kindly attach the booking details to complete your submission.");
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  const invalidFiles = [];
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      invalidFiles.push(file.name);
    }
    totalSize += file.size;
  }

  if (invalidFiles.length > 0) {
    alert(
      `The following files are not allowed:\n${invalidFiles.join("\n")}\n\nOnly PDF, JPG, and PNG files are supported.`
    );
    return;
  }

  if (totalSize > MAX_SIZE) {
    alert("Total file size exceeds the 5 MB limit. Please select smaller files.");
    return;
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const res = await fetch(
      `http://3.7.139.212:8080/api/travel/admin/upload-pdfs/${requestId}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (res.ok) {
      alert("Booking details have been sent successfully.");

      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));

      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } else {
      const error = await res.text();
      alert("Upload failed: " + error);
    }
  } catch (err) {
    alert("Error uploading files: " + err.message);
  }
};

  const [drafts, setDrafts] = useState([]);

useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/api/travel/drafts/employee/${employeeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch drafts');
        return res.json();
      })
      .then(data => setDrafts(data))
      .catch(err => console.error('Error fetching drafts:', err));
  }
}, [employeeId]);

  // **FIX:** Use useEffect to save drafts to localStorage whenever the 'drafts' state changes
  useEffect(() => {
    localStorage.setItem(`travelDrafts_${employeeId}`, JSON.stringify(drafts));
  }, [drafts, employeeId]);




  // Handle clicks outside the profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Fetches tickets based on the endpoint and sets state
  const fetchTickets = (endpoint, setState) => {
    fetch(`http://3.7.139.212:8080/api/travel/${endpoint}/${employeeId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ${endpoint}`);
        }
        return res.json();
      })
      .then(data => setState(data))
      .catch(err => console.error(`Error fetching ${endpoint}:`, err));
  };

  // Corrected function to fetch pending requests based on role
  const fetchPendingRequests = () => {
    if (role === "Manager") {
      // Corrected endpoint for manager pending requests
      fetch(`http://3.7.139.212:8080/api/travel/manager/pending/${employeeId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch pending requests');
          return res.json();
        })
        .then(data => setPendingRequests(data))
        .catch(err => console.error("Error fetching pending requests:", err));
    } else if (role === "admin") {
      // Corrected endpoint for admin pending requests
      fetch(`http://3.7.139.212:8080/api/travel/admin/assigned-requests/${adminId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch pending requests for admin');
          return res.json();
        })
        .then(data => setPendingRequests(data))
        .catch(err => console.error("Error fetching admin pending requests:", err));
    }
  };

  // Effect to fetch data for active and history tabs
  useEffect(() => {
    if (activeTab === 'History') {
      fetchTickets('history', setHistoryTickets);
    } else if (activeTab === 'Awaiting Approval') {
      fetchTickets('active', setActiveTickets);
    }
  }, [activeTab, employeeId]);

useEffect(() => {
  if (activeTab === "Pending Requests") {
    navigate('/myteam3');
  }
}, [activeTab]);


  const handleApprove = async (id) => {
    try {
      const params = new URLSearchParams({ managerId: employeeId });
      const res = await fetch(`http://3.7.139.212:8080/api/travel/approve/${id}?${params.toString()}`, {
        method: "PUT"
      });
      if (res.ok) {
        alert("Request approved!");
        fetchPendingRequests();
      } else {
        alert("Failed to approve request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving request.");
    }
  };

  // Reject a travel request (Manager/Admin function)
const handleReject = async (id) => {
  let remarks = prompt("Enter rejection reason (minimum 10 characters):");
  if (remarks === null) return; // user cancelled
  remarks = remarks.trim();
  if (remarks.length < 10) {
    alert("Rejected reason must be at least 10 characters.");
    return;
  }

  try {
    const params = new URLSearchParams({
      managerId: employeeId,
      rejectedReason: remarks // match backend param name
    });

    const res = await fetch(`http://3.7.139.212:8080/api/travel/reject/${id}?${params.toString()}`, {
      method: "PUT"
    });

    if (res.ok) {
      alert("Request rejected!");
      fetchPendingRequests();
    } else {
      alert("Failed to reject request. Please try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Error rejecting request.");
  }
};

 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for clearing the form fields
  const handleCancel = (e) => {
    e.preventDefault();
    setNewRequest({
      name: '',
      fromLocation: '',
      toLocation: '',
      modeOfTravel: 'Select',
      category: 'Select',
      departureDate: '',
      returnDate: '',
      accommodationRequired: 'No',
      advanceRequired: 'No',
      remarks: '',
      employeeId: employeeId,
    });
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Required fields (must match state keys exactly!)
  const requiredFields = [
    "category",
    "modeOfTravel",
    "fromLocation",
    "toLocation",
    "departureDate",
    "accommodationRequired",
    "advanceRequired",
    "remarks", // ✅ lowercase - matches newRequest.remarks
  ];

  // Human-readable labels for alerts
  const fieldLabels = {
    category: "Category",
    modeOfTravel: "Mode of Travel",
    fromLocation: "From Location",
    toLocation: "To Location",
    departureDate: "Departure Date",
    accommodationRequired: "Accommodation Required",
    advanceRequired: "Advance Required",
    remarks: "Purpose of Travel", // ✅ custom label
  };

  for (const field of requiredFields) {
    const value = newRequest[field];
    if (!value || (typeof value === "string" && value.trim() === "") || value === "Select") {
      alert(`Please fill in the required field: ${fieldLabels[field]}`);
      return;
    }
  }
  // 2. Date validations
  const { category, departureDate, returnDate, id } = newRequest; // ✅ include id
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depart = new Date(departureDate);
  depart.setHours(0, 0, 0, 0);
  const returnD = returnDate ? new Date(returnDate) : null;
  if (returnD) returnD.setHours(0, 0, 0, 0);

  if (depart < today) {
    alert("Departure date cannot be in the past.");
    return;
  }

  if (returnD && returnD < depart) {
    alert("Return date cannot be before the departure date.");
    return;
  }

  if (category === 'Domestic') {
    const minDomesticDate = new Date(today);
    minDomesticDate.setDate(today.getDate() + 7);
    if (depart < minDomesticDate) {
      alert("For domestic travel, the ticket must be booked at least one week in advance.");
      return;
    }
  } else if (category === 'International') {
    const minInternationalDate = new Date(today);
    minInternationalDate.setDate(today.getDate() + 30);
    if (depart < minInternationalDate) {
      alert("For international travel, the ticket must be booked at least one month in advance.");
      return;
    }
  }

  // 3. Submit request
  const requestData = {
    ...newRequest,
    employeeId: employeeId,
    name: employeeName
  };

  console.log("Submitting request:", requestData);

  try {
    const res = await fetch("http://3.7.139.212:8080/api/travel/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (res.ok) {
      alert("Travel request submitted successfully!");

      // ✅ If this was created from a draft, delete that draft permanently
      if (id) {
        try {
          await fetch(`http://3.7.139.212:8080/api/travel/drafts/${id}?employeeId=${employeeId}`, {
            method: "DELETE",
          });

          // remove from local state too
          setDrafts(prevDrafts => prevDrafts.filter(draft => draft.id !== id));
        } catch (deleteError) {
          console.error("Failed to delete draft after submission:", deleteError);
        }
      }

      // ✅ Reset form
      setNewRequest({
        id: "",
        name: '',
        fromLocation: '',
        toLocation: '',
        modeOfTravel: 'Select',
        category: 'Select',
        departureDate: '',
        returnDate: '',
        accommodationRequired: 'No',
        advanceRequired: 'No',
        remarks: '',
        employeeId: employeeId
      });

    } else {
      const errorText = await res.text();
      alert(`Failed to submit travel request: ${errorText}`);
    }
  } catch (error) {
    console.error("Error submitting travel request:", error);
    alert("Error submitting travel request. Please check the console for details.");
  }
};

const handleSaveDraft = async (e) => {
  e.preventDefault();

  // ✅ Include the ID if editing
  const draftToSave = { ...newRequest };

  try {
    const res = await fetch("http://3.7.139.212:8080/api/travel/drafts", {
      method: "POST", // backend will upsert based on `id`
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftToSave),
    });

    if (!res.ok) {
      const errorText = await res.text();
      alert(`Failed to save draft: ${errorText}`);
      return;
    }

    const savedDraft = await res.json();

    setDrafts((prevDrafts) => {
      const exists = prevDrafts.some((d) => d.id === savedDraft.id);
      if (exists) {
        // ✅ Update the draft in state
        return prevDrafts.map((d) => (d.id === savedDraft.id ? savedDraft : d));
      } else {
        // ✅ Add as new draft
        return [...prevDrafts, savedDraft];
      }
    });

    // ✅ Reset form but keep `id` cleared (so next new save won’t overwrite the last draft)
    setNewRequest({
      id: "", // clear id so next is a new draft
      name: "",
      fromLocation: "",
      toLocation: "",
      modeOfTravel: "Select",
      category: "Select",
      departureDate: "",
      returnDate: "",
      accommodationRequired: "No",
      advanceRequired: "No",
      remarks: "",
      employeeId: employeeId,
    });

    alert(draftToSave.id ? "Draft updated successfully!" : "Draft saved successfully!");
  } catch (error) {
    console.error("Error saving draft:", error);
    alert("Error saving draft. See console for details.");
  }
};

// Fetch drafts for employee
useEffect(() => {
  const fetchDrafts = async () => {
    try {
      const res = await fetch(`http://3.7.139.212:8080/api/travel/drafts?employeeId=${employeeId}`);
      if (!res.ok) {
        console.error("Failed to fetch drafts");
        return;
      }
      const data = await res.json();
      setDrafts(data);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };

  fetchDrafts();
}, [employeeId]);

// Edit draft
const handleEditDraft = (draft) => {
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const draftForForm = {
    ...draft,
    departureDate: formatDateForInput(draft.departureDate),
    returnDate: formatDateForInput(draft.returnDate),
  };

  setNewRequest(draftForForm); // ✅ load with ID
  setActiveTab("New Ticket");
};

// Delete Draft
const handleDeleteDraft = async (id, showAlert = true) => {
  try {
    const res = await fetch(`http://3.7.139.212:8080/api/travel/drafts/${id}?employeeId=${employeeId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      alert('Failed to delete draft.');
      return;
    }

    setDrafts(prevDrafts => prevDrafts.filter(draft => draft.id !== id));

    if (showAlert) {
      alert("Draft deleted successfully!");
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    alert('Error deleting draft. See console for details.');
  }
};


const filteredDrafts = drafts.filter(draft =>
  Object.values(draft).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);

const filteredActiveTickets = activeTickets.filter(ticket =>
  Object.values(ticket).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);

const filteredPendingRequests = pendingRequests.filter(req =>
  Object.values(req).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);
  const thStyle = { backgroundColor: '#4169E1' };

  // Add this function to your component
const handleRemoveFile = (requestId, fileIndexToRemove) => {
  setSelectedFiles(prevFiles => {
    const newFiles = { ...prevFiles };
    // Filter out the file at the specified index
    newFiles[requestId] = newFiles[requestId].filter(
      (_, index) => index !== fileIndexToRemove
    );
    // If no files are left, you might want to clean up the state
    if (newFiles[requestId].length === 0) {
      delete newFiles[requestId];
    }
    return newFiles;
  });
};

  return (
     <Sidebar>

      <div className="main-content">
     
 

        <div className="travel-management">
<div className="tabs">
  {[
    'New Ticket',
    'Awaiting Approval',
    'History',
    'Drafts',
    ...(canViewTasks ? ['Pending Requests'] : []),
  ].map((tab) => (
    <button
      key={tab}
      className={activeTab === tab ? 'tab active' : 'tab'}
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  ))}
</div>


          <div className="travel-content">
{activeTab === 'New Ticket' && (
  <>
    <p
      className={
        newRequest.category === 'Domestic' ||
        newRequest.category === 'International'
          ? 'warning-text'
          : 'welcome-text'
      }
      style={{ marginTop: '20px' }}
    >
      {newRequest.category === 'Domestic'
        ? 'Kindly book the ticket at least one week before the travel date.'
        : newRequest.category === 'International'
        ? 'Kindly book the ticket at least one month before the travel date.'
        : 'Welcome! Please fill out the form to create a new travel ticket.'}
    </p>
    <form>
      <div
        className="travelform-container"
        style={{
          display: 'flex',
          gap: '40px', // space between columns
          justifyContent: 'space-between',
          flexWrap: 'wrap', // wrap on small screens
        }}
      >
        <div className="travelform-column">
          <label style={{ display: 'block', marginBottom: '7px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              Category <span style={{ color: 'red' }}>*</span>
            </span>
            <select
              name="category"
              value={newRequest.category}
              onChange={(e) => {
                handleInputChange(e);
                if (e.target.value === 'International') {
                  handleInputChange({
                    target: { name: 'modeOfTravel', value: 'Flight' },
                  });
                }
              }}
              required
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            >
              <option value="">Select</option>
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: '7px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              Mode of Travel <span style={{ color: 'red' }}>*</span>
            </span>
            <select
              name="modeOfTravel"
              value={newRequest.modeOfTravel}
              onChange={handleInputChange}
              required
              disabled={newRequest.category === 'International'}
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            >
              {newRequest.category === 'International' ? (
                <option value="Flight">Flight</option>
              ) : (
                <>
                  <option value="">Select</option>
                  <option value="Flight">Flight</option>
                  <option value="Bus">Bus</option>
                  <option value="Train">Train</option>
                </>
              )}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: '0px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              From <span style={{ color: 'red' }}>*</span>
            </span>
            <input
              name="fromLocation"
              value={newRequest.fromLocation}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '0' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              To <span style={{ color: 'red' }}>*</span>
            </span>
            <input
              name="toLocation"
              value={newRequest.toLocation}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            />
          </label>
        </div>

        <div className="travelform-column">
          <label style={{ display: 'block', marginBottom: '-7px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              Depart Date <span style={{ color: 'red' }}>*</span>
            </span>
            <input
              type="date"
              name="departureDate"
              value={newRequest.departureDate}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '-9px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              Return Date
            </span>
            <input
              type="date"
              name="returnDate"
              value={newRequest.returnDate}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '15px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              Accommodation Required <span style={{ color: 'red' }}>*</span>
            </span>
            <select
              name="accommodationRequired"
              value={newRequest.accommodationRequired}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: '15px' }}>
            <span
              style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}
            >
              Advance Required <span style={{ color: 'red' }}>*</span>
            </span>
            <select
              name="advanceRequired"
              value={newRequest.advanceRequired}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>
        </div>
      </div>

      <label style={{ display: 'block', marginTop: '0', fontWeight: '600' }}>
        Purpose Of Travel <span style={{ color: 'red' }}>*</span>
        <textarea
          name="remarks"
          value={newRequest.remarks}
          onChange={handleInputChange}
          placeholder="Please Enter The Purpose Of Your Travel"
          maxLength={255}
          required
          rows={2} // ✅ controls visible height
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '8px',
            fontSize: '1rem',
            resize: 'vertical', // ✅ allows manual resize (you can use "none" to disable)
          }}
        />
        <small style={{ fontSize: '0.8rem', color: '#555' }}>
          Maximum 255 characters allowed
        </small>
      </label>

      <div className="submit-button-container">
        <button className="submit-button" onClick={handleSaveDraft} type="button">
          Save Draft
        </button>
        <button className="submit-button" type="submit" onClick={handleSubmit}>
          Submit Request
        </button>
        <button className="submit-button" type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  </>
)}

{activeTab === 'Awaiting Approval' && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Active Travel Requests</h3>
    {/* Use filteredActiveTickets here */}
    {filteredActiveTickets.length === 0 ? (
      <p>No active requests found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}
      >
        <thead
          className="columns-header"
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            <th style={{ ...thStyle, minWidth: '140px' }}>Category</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Mode of Travel</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Depart Date</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Return Date</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>From</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>To</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Accommodation Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Advance Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Purpose Of Travel</th>
            <th style={{ ...thStyle, minWidth: '180px' }}>Status</th>
            <th style={{ ...thStyle, minWidth: '180px' }}>Download Ticket</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredActiveTickets for the map function */}
          {filteredActiveTickets.map((ticket) => (
            <tr key={ticket.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  {new Date(ticket.departureDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>
<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  {ticket.returnDate
    ? new Date(ticket.returnDate).toLocaleDateString('en-GB').replace(/\//g, '-')
    : ''}
</td>

              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.advanceRequired}</td>

<td
  style={{
    padding: '10px',
    borderBottom: '1px solid #ddd',
    whiteSpace: 'pre-wrap', // preserve line breaks
    fontFamily: 'monospace', // makes rows align evenly
  }}
>
  {splitIntoRows(ticket.remarks, 50).map((row, idx) => (
    <div key={idx}>{row}</div>
  ))}
</td>

              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.status}</td>

<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  <button
    style={{
      backgroundColor: ticket.status === 'Booked' ? '#007bff' : '#cccccc', // Conditional background color
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      cursor: ticket.status === 'Booked' ? 'pointer' : 'not-allowed', // Conditional cursor
      borderRadius: '4px',
      fontSize: '0.85em'
    }}
    onClick={async () => {
      try {
        // Step 1: Fetch the list of documents for this request
        const res = await fetch(`/api/travel/documents/${ticket.id}`);
        if (!res.ok) throw new Error("Failed to fetch documents");
        const docs = await res.json();

        if (docs.length === 0) {
          alert("No documents found for this request.");
          return;
        }

        // Step 2: Download each document
        for (const doc of docs) {
          const downloadRes = await fetch(`/api/travel/download-document/${doc.id}`);
          if (!downloadRes.ok) throw new Error("Download failed for file: " + doc.fileName);

          const blob = await downloadRes.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = doc.fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();

          window.URL.revokeObjectURL(url);
        }

        // ✅ Step 3: Mark request as downloaded
        await fetch(`/api/travel/mark-downloaded/${ticket.id}`, {
          method: "PUT"
        });

        // ✅ Step 4: Remove ticket from the correct state
        if (activeTab === "Pending Requests") {
          setPendingRequests(prev => prev.filter(t => t.id !== ticket.id));
        } else if (activeTab === "Awaiting Approval") {
          setActiveTickets(prev => prev.filter(t => t.id !== ticket.id));
        } else if (activeTab === "History") {
          setHistoryTickets(prev => prev.filter(t => t.id !== ticket.id));
        }

      } catch (err) {
        alert("Error fetching/downloading documents: " + err.message);
      }
    }}
    disabled={ticket.status !== 'Booked'}
  >
    Booking Details
  </button>
</td>

            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

{activeTab === 'History' && (
  <div style={{
    height: 'calc(100vh - 200px)',
    overflowY: 'auto',
    border: '1px solid #ccc',
    padding: '0px',
  }}>
    <h3>Booking History</h3>
    
    <table
      border="1"
      cellPadding="10"
      style={{
        width: '100%',
        textAlign: 'left',
        borderCollapse: 'collapse',
      }}
    >
      <thead
        className="columns-header"
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#f2f2f2',
          zIndex: 1,
        }}
      >
        {/* Row for Column Names */}
        <tr>
          <th style={{ ...thStyle, minWidth: '140px' }}>Travel ID</th>
          <th style={{ ...thStyle, minWidth: '140px' }}>Category</th>
          <th style={{ ...thStyle, minWidth: '140px' }}>Mode of Travel</th>
          <th style={{ ...thStyle, minWidth: '120px' }}>Depart Date</th>
          <th style={{ ...thStyle, minWidth: '120px' }}>Return Date</th>
          <th style={{ ...thStyle, minWidth: '140px' }}>From</th>
          <th style={{ ...thStyle, minWidth: '140px' }}>To</th>
          <th style={{ ...thStyle, minWidth: '120px' }}>Accommodation Required</th>
          <th style={{ ...thStyle, minWidth: '120px' }}>Advance Required</th>
          <th style={{ ...thStyle, minWidth: '120px' }}>Purpose Of Travel</th>
          <th style={{ ...thStyle, minWidth: '180px' }}>Status</th>
          <th style={{ ...thStyle, minWidth: '180px' }}>Rejected Reason</th>
          <th style={{ ...thStyle, minWidth: '180px' }}>Download Details</th>
        </tr>

        {/* Row for Filters */}
        <tr>
          {/* Travel ID Filter */}
          <th style={{ ...thStyle, minWidth: '140px' }}>
            <input
              type="text"
              name="travelId"
              value={filters.travelId}
              onChange={handleFilterChange}
              placeholder="Search by ID..."
              style={{ width: '90%', padding: '5px', boxSizing: 'border-box' }}
            />
          </th>

          {/* Category Filter */}
          <th style={{ ...thStyle, minWidth: '140px' }}>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="All">All</option>
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
            </select>
          </th>

          {/* Mode of Travel Filter */}
          <th style={{ ...thStyle, minWidth: '140px' }}>
            <select
              name="modeOfTravel"
              value={filters.modeOfTravel}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="All">All</option>
              <option value="Flight">Flight</option>
              <option value="Bus">Bus</option>
              <option value="Train">Train</option>
            </select>
          </th>

          {/* Depart Date Sort */}
          <th style={{ ...thStyle, minWidth: '120px' }}>
            <select
              name="departDate"
              value={filters.departDate}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </select>
          </th>

          {/* Return Date Sort */}
          <th style={{ ...thStyle, minWidth: '120px' }}>
            <select
              name="returnDate"
              value={filters.returnDate}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </select>
          </th>

          {/* From Location Filter */}
          <th style={{ ...thStyle, minWidth: '140px' }}>
            <input
              type="text"
              name="fromLocation"
              value={filters.fromLocation}
              onChange={handleFilterChange}
              placeholder="Search from..."
              style={{ width: '90%', padding: '5px', boxSizing: 'border-box' }}
            />
          </th>

          {/* To Location Filter */}
          <th style={{ ...thStyle, minWidth: '140px' }}>
            <input
              type="text"
              name="toLocation"
              value={filters.toLocation}
              onChange={handleFilterChange}
              placeholder="Search to..."
              style={{ width: '90%', padding: '5px', boxSizing: 'border-box' }}
            />
          </th>

          {/* Accommodation Required Filter */}
          <th style={{ ...thStyle, minWidth: '120px' }}>
            <select
              name="accommodationRequired"
              value={filters.accommodationRequired}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </th>

          {/* Advance Required Filter */}
          <th style={{ ...thStyle, minWidth: '120px' }}>
            <select
              name="advanceRequired"
              value={filters.advanceRequired}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </th>

          {/* Purpose of Travel Filter */}
          <th style={{ ...thStyle, minWidth: '120px' }}>
            <input
              type="text"
              name="remarks"
              value={filters.remarks}
              onChange={handleFilterChange}
              placeholder="Search purpose..."
              style={{ width: '90%', padding: '5px', boxSizing: 'border-box' }}
            />
          </th>

          {/* Status Filter - Updated with new options */}
          <th style={{ ...thStyle, minWidth: '180px' }}>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{ width: '90%', padding: '5px' }}
            >
              <option value="All">All</option>
              <option value="Pending For Approval">Pending For Approval</option>
              <option value="Booking In Progress">Booking In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Booked">Booked</option>
              <option value="Downloaded">Downloaded</option>
            </select>
          </th>

          {/* Rejected Reason Filter */}
          <th style={{ ...thStyle, minWidth: '180px' }}>
            <input
              type="text"
              name="rejectedReason"
              value={filters.rejectedReason}
              onChange={handleFilterChange}
              placeholder="Search reason..."
              style={{ width: '90%', padding: '5px', boxSizing: 'border-box' }}
            />
          </th>

          {/* Empty cell for the Download button column */}
          <th style={{ ...thStyle, minWidth: '180px' }}></th>
        </tr>
      </thead>

      <tbody>
        {filteredHistory.length === 0 ? (
          <tr>
            <td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>
              No bookings found matching your criteria.
            </td>
          </tr>
        ) : (
          filteredHistory.map((ticket) => (
            <tr key={ticket.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.id}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {new Date(ticket.departureDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {ticket.returnDate
                  ? new Date(ticket.returnDate).toLocaleDateString('en-GB').replace(/\//g, '-')
                  : ''}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.advanceRequired}</td>
              <td style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}>
                {splitIntoRows(ticket.remarks, 50).map((row, idx) => (
                  <div key={idx}>{row}</div>
                ))}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.status}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.rejectedReason}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <button
                  style={{
                    backgroundColor: (ticket.status === 'Booked' || ticket.status === 'Downloaded') ? '#007bff' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: (ticket.status === 'Booked' || ticket.status === 'Downloaded') ? 'pointer' : 'not-allowed',
                    borderRadius: '4px',
                    fontSize: '0.85em'
                  }}
                  onClick={async () => {
                    // ... (download logic remains the same)
                  }}
                  disabled={!(ticket.status === 'Booked' || ticket.status === 'Downloaded')}
                >
                  Booking Details
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{activeTab === 'Pending Requests' && (role === "Manager" ) && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
  
    <h3>Pending Travel Requests</h3>
    
    {/* Use filteredPendingRequests for the length check */}
    {filteredPendingRequests.length === 0 ? (
      <p>No pending requests found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            
            <th style={{ ...thStyle, minWidth: '140px' }}>Employee ID</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Employee Name</th>
             <th style={{ ...thStyle, minWidth: '140px' }}>Category</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Mode of Travel</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Depart Date</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Return Date</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>From</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>To</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Accommodation Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Advance Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Purpose Of Travel</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredPendingRequests for the map function */}
          {filteredPendingRequests.map((req) => (
            <tr key={req.id}>
            
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeId}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeName}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  {new Date(req.departureDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>
<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  {req.returnDate
    ? new Date(req.returnDate).toLocaleDateString('en-GB').replace(/\//g, '-')
    : ''}
</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.advanceRequired}</td>
           <td
  style={{
    padding: '10px',
    borderBottom: '1px solid #ddd',
    whiteSpace: 'pre-wrap', // preserve line breaks
    fontFamily: 'monospace', // makes rows align evenly
  }}
>
  {splitIntoRows(req.remarks, 50).map((row, idx) => (
    <div key={idx}>{row}</div>
  ))}
</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <button
                  onClick={() => handleApprove(req.id)}
                  style={{
                    marginRight: '10px',
                    backgroundColor: 'green',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                >
                  Approve
                </button>
         <button
  onClick={() => handleReject(req.id)}
  style={{
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    width: '75px', // <-- Increased width
  }}
>
  Reject
</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
{activeTab === 'Pending Requests' && (role === "admin") && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Pending Travel Requests</h3>
    {/* Use filteredPendingRequests for the length check */}
    {filteredPendingRequests.length === 0 ? (
      <p>No pending requests found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
         <th style={{ ...thStyle, minWidth: '140px' }}>Employee ID</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Employee Name</th>
             <th style={{ ...thStyle, minWidth: '140px' }}>Category</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Mode of Travel</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Depart Date</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Return Date</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>From</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>To</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Accommodation Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Advance Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Purpose Of Travel</th>
            <th style={{ ...thStyle, minWidth: '180px' }}>Upload Ticket (PDF)*</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredPendingRequests for the map function */}
          {filteredPendingRequests.map((req) => (
            <tr key={req.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeId}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeName}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.modeOfTravel}</td>
             <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  {new Date(req.departureDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
</td>
<td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  {req.returnDate
    ? new Date(req.returnDate).toLocaleDateString('en-GB').replace(/\//g, '-')
    : ''}
</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.advanceRequired}</td>
            <td
  style={{
    padding: '10px',
    borderBottom: '1px solid #ddd',
    whiteSpace: 'pre-wrap', // preserve line breaks
    fontFamily: 'monospace', // makes rows align evenly
  }}
>
  {splitIntoRows(req.remarks, 50).map((row, idx) => (
    <div key={idx}>{row}</div>
  ))}
</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
  <label
    htmlFor={`file-upload-${req.id}`}
    style={{
      display: 'inline-block',
      padding: '6px 12px',
      backgroundColor: '#6e7073ff',
      color: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9em',
      userSelect: 'none',
    }}
  >
    Choose File
  </label>
  <input
    id={`file-upload-${req.id}`}
    type="file"
    accept="application/pdf"
    multiple // <-- ALLOW MULTIPLE FILES
    style={{ display: 'none' }}
    onChange={(e) => handleFileChange(req.id, e)}
  />

  <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#333' }}>
    {selectedFiles[req.id] && selectedFiles[req.id].length > 0
      ? selectedFiles[req.id].map((file, index) => {
          const truncatedName =
            file.name.length > 10 ? file.name.slice(0, 10) + '...' : file.name;
          return (
            <div
              key={index}
              title={file.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingRight: '10px', // Spacing for the 'x'
                cursor: 'default',
              }}
            >
              <div style={{ flexGrow: 1 }}>{truncatedName}</div>
              <span
                onClick={() => handleRemoveFile(req.id, index)}
                style={{
                  cursor: 'pointer',
                  color: 'red',
                  fontWeight: 'bold',
                  marginLeft: '10px',
                  userSelect: 'none',
                }}
              >
                &times;
              </span>
            </div>
          );
        })
      : 'No file selected'}
  </div>
</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <button
                  onClick={() => handleUpload(req.id)}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  Confirm
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

{activeTab === 'Drafts' && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Saved Drafts</h3>
    {/* Use filteredDrafts for the length check */}
    {filteredDrafts.length === 0 ? (
      <p>No drafts found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            <th style={{ ...thStyle, minWidth: '140px' }}>Travel ID</th>
             <th style={{ ...thStyle, minWidth: '140px' }}>Category</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Mode of Travel</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Depart Date</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Return Date</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>From</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>To</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Accommodation Required</th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Advance Required</th>
            <th style={{ ...thStyle, minWidth: '140px' }}>Purpose Of Travel </th>
            <th style={{ ...thStyle, minWidth: '120px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredDrafts for the map function */}
          {filteredDrafts.map((draft) => (
            <tr key={draft.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.id}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.modeOfTravel}</td>
              <td>
  {draft.departureDate
    ? new Date(draft.departureDate)
        .toLocaleDateString('en-GB')
        .replace(/\//g, '-')
    : ''}
</td>
<td>
  {draft.returnDate
    ? new Date(draft.returnDate)
        .toLocaleDateString('en-GB')
        .replace(/\//g, '-')
    : ''}
</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.toLocation}</td>

              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.advanceRequired}</td>
               
<td
  style={{
    padding: '10px',
    borderBottom: '1px solid #ddd',
    whiteSpace: 'pre-wrap', // preserve line breaks
    fontFamily: 'monospace', // makes rows align evenly
  }}
>
  {splitIntoRows(draft.remarks, 50).map((row, idx) => (
    <div key={idx}>{row}</div>
  ))}
</td>
            <td style={{ padding: '20px', borderBottom: '1px solid #ddd', width: '25px' }}>
  <button
    onClick={() => handleEditDraft(draft)}
    style={{
      marginRight: '10px',
      backgroundColor: '#007bff',
      color: 'white',
      width: '80px',   // fixed width
      height: '40px',  // fixed height
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      margin: '2px'
    }}
  >
    Edit
  </button>
  <button
    onClick={() => handleDeleteDraft(draft.id)}
    style={{
      backgroundColor: '#dc3545',
      color: 'white',
      width: '80px',   // same width
      height: '40px',  // same height
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    Delete
  </button>
</td>

            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
          </div>
        </div>
      </div>
  </Sidebar>
  );
}

export default Travel;








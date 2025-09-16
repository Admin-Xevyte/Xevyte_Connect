import "./Newclaim.css";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
 
function NewClaim() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
 const [profileOpen, setProfileOpen] = useState(false);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [originalDraftId, setOriginalDraftId] = useState(null);
 
 const allowedUsers = ["H100646", "H100186", "H100118","EMP111"];
   const [isContractOpen, setIsContractOpen] = useState(false);
 
 const toggleContractMenu = () => {
   setIsContractOpen(!isContractOpen);
 };
 
  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const allowedCategories = ["Food", "Accomodation", "Travel", "Medical", "Mobile", "Office", "Others"];
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
 
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
 
  const [successMessage, setSuccessMessage] = useState("");
 
  const getTodayDate = () => new Date().toISOString().split("T")[0];
 
const [formData, setFormData] = useState({
  employeeId: "",
  name: "",
  expenseDescription: "",  // 🔁 instead of description
  category: "",
  amount: "",
  expenseDate: getTodayDate(),  // 🔁 instead of date
  businessPurpose: "",
  additionalNotes: ""
});
 
 
  const [receiptFile, setReceiptFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
 
  useEffect(() => {
    const id = localStorage.getItem("employeeId") || "";
    const name = localStorage.getItem("employeeName") || "";
    setFormData((prev) => ({ ...prev, employeeId: id, name }));
 
    if (id) {
      fetch(`http://3.7.139.212:8080/profile/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem("employeeProfilePic", data.profilePic);
          }
          if (data.name) {
            localStorage.setItem("employeeName", data.name);
          }
        })
        .catch(err => console.error("Profile fetch failed:", err));
    }
 
    if (location.state && location.state.draftId) {
      const draftId = location.state.draftId;
      setOriginalDraftId(draftId);
 
      axios.get(`http://3.7.139.212:8080/claims/draft/${draftId}`)
        .then(draftRes => {
          const draft = draftRes.data;
          setFormData({
            employeeId: draft.employeeId,
            name: draft.name,
            expenseDescription: draft.description || "",
            category: draft.category || "",
            amount: draft.amount || "",
            expenseDate: draft.date || "",
            businessPurpose: draft.businessPurpose || "",
            additionalNotes: draft.additionalNotes || ""
          });
          setDraftLoaded(true);
 
          if (draft.receiptName) {
            axios.get(`http://3.7.139.212:8080/claims/draft/receipt/${draftId}`, { responseType: 'blob' })
              .then(receiptRes => {
                const fileBlob = receiptRes.data;
                const fileName = draft.receiptName;
                const fileType = fileBlob.type;
                const fetchedFile = new File([fileBlob], fileName, { type: fileType });
                setReceiptFile(fetchedFile);
                const url = URL.createObjectURL(fetchedFile);
                setReceiptPreviewUrl(url);
              })
              .catch(err => console.error("Failed to fetch receipt:", err));
          } else {
            setReceiptFile(null);
            setReceiptPreviewUrl(null);
          }
        })
        .catch(err => {
          console.error("Failed to fetch draft:", err);
          setError("Failed to load draft data.");
        });
    } else {
      setFormData((prev) => ({ ...prev, expenseDate: getTodayDate() }));
      setOriginalDraftId(null);
      setDraftLoaded(false);
      setReceiptFile(null);
      setReceiptPreviewUrl(null);
    }
  }, [location.state]);
 
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target) &&
        !profileInputRef.current?.contains(e.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
 
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
 
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("name", employeeName);
    formData.append("profilePic", file);
 
    try {
      const res = await fetch(`http://3.7.139.212:8080/profile/update/${employeeId}`, {
        method: "PUT",
        body: formData,
      });
 
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
 
      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated!");
        setTimeout(() => setSuccessMessage(""), 2000);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload profile image");
    }
  };
 
  const handleEditProfile = () => {
    setIsProfileMenuOpen(false);
    profileInputRef.current.click();
  };
 
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };
 
  const getMaxDate = () => new Date().toISOString().split("T")[0];
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split("T")[0];
  };
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };
 
 const handleFileChange = (e) => {
  const file = e.target.files[0];
 
  if (file) {
    // 1. Define allowed file types and max size
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
 
    // 2. Perform File Type Validation
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        receiptFile: "Unsupported file type. Only JPG, PNG, and PDF are allowed."
      }));
      setReceiptFile(null);
      setReceiptPreviewUrl(null);
      return;
    }
 
    // 3. Perform File Size Validation
    if (file.size > maxSize) {
      setFieldErrors((prev) => ({
        ...prev,
        receiptFile: "Maximum upload file size allowed is 5MB."
      }));
      setReceiptFile(null);
      setReceiptPreviewUrl(null);
      return;
    }
 
    // 4. If both validations pass, update state
    setFieldErrors((prev) => ({
      ...prev,
      receiptFile: null,
    }));
    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreviewUrl(url);
 
  } else {
    // No file selected
    setReceiptFile(null);
    setReceiptPreviewUrl(null);
    setFieldErrors((prev) => ({
      ...prev,
      receiptFile: "No file selected",
    }));
  }
};
 
 
const validateRequired = () => {
  const missingFields = [];
 
  if (!formData.expenseDescription.trim()) missingFields.push("expense description");
  if (!formData.category || formData.category === "Select category") missingFields.push("category");
  if (!formData.amount || Number(formData.amount) <= 0) missingFields.push("amount");
  if (!formData.expenseDate) missingFields.push("expense date");
  if (!receiptFile) missingFields.push("receipt");
 
  // Additional date validation
  if (formData.expenseDate) {
    const selectedDate = new Date(formData.expenseDate);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const ninetyDaysAgoStart = new Date(todayStart);
    ninetyDaysAgoStart.setDate(todayStart.getDate() - 90);
    const selectedDateStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
 
    if (selectedDateStart > todayStart || selectedDateStart < ninetyDaysAgoStart) {
      missingFields.push("valid expense date");
    }
  }
 
  if (missingFields.length > 0) {
    const formatted = missingFields.join(", ");
    setError(`Please fill the required fields: ${formatted}`);
    return false;
  }
 
  setError("");
  return true;
};
 
const handleSubmit = async () => {
    // Validate that all required fields are filled.
    if (!validateRequired()) return;
 
    // Create a data object with property names that EXACTLY match
    // the field names of your 'Claim' entity on the backend.
    const claimData = {
        employeeId: formData.employeeId,
        name: formData.name,
        // The backend expects expenseDescription and expenseDate,
        // but the 'submitUpdatedDraft' method will correctly map these from the Claim entity.
        expenseDescription: formData.expenseDescription,
        category: formData.category,
        amount: formData.amount,
        expenseDate: formData.expenseDate,
        businessPurpose: formData.businessPurpose,
        additionalNotes: formData.additionalNotes,
    };
 
    const data = new FormData();
    // Append the correctly structured data object as a JSON string.
    data.append("claim", JSON.stringify(claimData));
   
    // Attach the receipt file to the FormData object if it exists.
    if (receiptFile) {
        data.append("receiptFile", receiptFile);
    }
 
    try {
        if (originalDraftId) {
            // ✅ CORRECTED: Use axios.put for submitting an updated draft
            await axios.put(
                `http://3.7.139.212:8080/claims/submit-draft/${originalDraftId}`,
                data,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessage("Expense claim submitted successfully from draft!");
           
            // Clear the draft-related state variables after successful submission.
            setOriginalDraftId(null);
            setDraftLoaded(false);
 
            // Navigate to the claims status page after a brief delay.
            // setTimeout(() => {
            //     navigate("/claim-status?refresh=true");
            // }, 2000);
        } else {
            // If it's a brand new claim, use a POST request to the main 'submit' endpoint.
            await axios.post(
                "http://3.7.139.212:8080/claims/submit",
                data,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessage("Expense claim submitted successfully!");
 
            // Navigate to the claims status page after a brief delay.
            // setTimeout(() => {
            //     navigate("/claim-status?refresh=true");
            // }, 2000);
        }
 
        // Reset the form regardless of whether a new claim or a draft was submitted.
        setFormData({
            category: "",
            amount: "",
            expenseDescription: "",
            expenseDate: getTodayDate(),
            businessPurpose: "",
            additionalNotes: ""
        });
        setReceiptFile(null);
        setReceiptPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
       
        // Clear success/error messages after a delay.
        setTimeout(() => setMessage(""), 2000);
        setError("");
       
    } catch (err) {
        console.error("Submission error:", err);
        setError("Submission failed. Try again.");
        setMessage("");
    }
};
 
const handleSaveDraft = async () => {
  const draftPayload = {
    expenseId: originalDraftId || null,
    employeeId: formData.employeeId,
    name: formData.name,
    description: formData.expenseDescription,
    category: formData.category,
    amount: formData.amount,
    date: formData.expenseDate,
    businessPurpose: formData.businessPurpose,
    additionalNotes: formData.additionalNotes,
    status: "draft"
  };
 
  const data = new FormData();
  data.append("claimDraft", JSON.stringify(draftPayload));
  if (receiptFile) {
    data.append("receiptFile", receiptFile);
  }
 
  try {
    let res;
    if (originalDraftId) {
      // Update existing draft
      res = await axios.put(
        `http://3.7.139.212:8080/claims/draft/${originalDraftId}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage("Draft updated successfully!");
    } else {
      // Create a new draft
      res = await axios.post(
        "http://3.7.139.212:8080/claims/draft",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage("Draft saved successfully!");
      // Update the state with the new draft's ID
      setOriginalDraftId(res.data.id);
    }
 
    setError("");
   
    // ✅ ADDED: Clear the form and state after successful save
    setFormData({
      employeeId: localStorage.getItem("employeeId"),
      name: localStorage.getItem("employeeName"),
      expenseDescription: "",
      category: "",
      amount: "",
      expenseDate: getTodayDate(),
      businessPurpose: "",
      additionalNotes: ""
    });
    setReceiptFile(null);
    setReceiptPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOriginalDraftId(null);
 
    setTimeout(() => setMessage(""), 2000);
  } catch (err) {
    console.error("Error saving draft:", err);
    setError("Failed to save draft. Try again.");
    setMessage("");
  }
};
  return (
    <div className="claims-container">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="logo" className="office-vng" />
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
 
      <div className="main-area">
 
        <div className="dashboard-header"   style={{
    padding: '20px 20px 0px 40px ',
    paddingLeft: '30px',
  }}>
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
            <img
              src={require('../assets/Vector.png')}
              alt="Notifications"
              className="icon"
              style={{ cursor: 'pointer' }}
            />
            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-pic"
                onClick={toggleProfileMenu}
                style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            {isProfileMenuOpen && (
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
                  <button onClick={handleEditProfile} style={{ padding: '10px', width: '100%', border: 'none', background: 'none', textAlign: 'left', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ padding: '10px', width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>Logout</button>
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
             <input
                type="file"
                ref={profileInputRef}   // ✅ FIXED HERE
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
 
            </div>
          </div>
        </div>
<hr className="divider-line" style={{ marginTop: "10px" }} />
 
        </div>
             
        <div className="new-claim-wrapper">
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
      margin: "0px 20px 20px 45px", // Top and bottom margins only
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        transition: "background-color 0.3s ease",
        width: "fit-content", // Make width only as big as content
        display: "block",
   // Ensure it respects margin auto if needed
    }}
>
    ⬅ Back
</button>
          <h2 className="page-title">New Expense Claim</h2>
          <p className="page-subtitle">Submit a new expense claim for reimbursement</p>
 
          <div className="form-main-layout">
            <div className="expense-details">
              <h3 style={{ marginBottom: "20px" }}>Expense Details</h3>
         
              <div className="form-group">
                <label>Expense Description *</label>
                <input
                  name="expenseDescription"
                  value={formData.expenseDescription}
                  onChange={handleChange}
                  placeholder="Enter a brief description of the expense (max 255 characters)"
                  maxLength={255}
                />
                {fieldErrors.expenseDescription && (
                  <p className="error-text">{fieldErrors.expenseDescription}</p>
                )}
              </div>
 
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option>Select category</option>
                    {allowedCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <p className="error-text">{fieldErrors.category}</p>}
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
  type="text"
  name="amount"
  value={formData.amount}
  onChange={(e) => {
    const value = e.target.value;
    // Check if value contains only digits and length <= 10
    if (/^\d*$/.test(value) && value.length <= 10) {
      handleChange(e);
    }
  }}
/>
 
                  {fieldErrors.amount && <p className="error-text">{fieldErrors.amount}</p>}
                </div>
              </div>
              <div className="form-group">
                <label>Expense Date *</label>
                <DatePicker
  selected={formData.expenseDate ? new Date(formData.expenseDate) : null}
  onChange={(date) => {
    if (date) {
      // Format as yyyy-MM-dd for internal state (e.g., backend)
      const formatted = date.toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, expenseDate: formatted }));
      setFieldErrors((prev) => ({ ...prev, expenseDate: "" }));
    }
  }}
  dateFormat="dd-MM-yyyy"  // ✅ This updates the display format
  minDate={new Date(getMinDate())}
  maxDate={new Date(getMaxDate())}
  showMonthDropdown
  showYearDropdown
  dropdownMode="select"
  placeholderText="Select date"
  className="your-custom-classname-if-needed"
/>
 
                {fieldErrors.expenseDate && <p className="error-text">{fieldErrors.expenseDate}</p>}
              </div>
         
              <div className="form-group">
                <label><h3>Receipt Upload *</h3></label>
                <div className="custom-file-input-wrapper">
                  <input
                    type="text"
                    className="custom-file-input-display"
                    value={receiptFile ? receiptFile.name : "No file chosen"}
                    readOnly
                    onClick={() => fileInputRef.current.click()}
                  />
                  <button
                    type="button"
                    className="custom-file-input-button"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Choose File
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                  />
                </div>
                <p className="receipt-hint" style={{ fontWeight: 'bold' , color: "black", fontSize: "15px"}}>Supported: JPG, PNG, PDF (Max 5MB)</p>
                {fieldErrors.receiptFile && (
                 
  <p style={{ color: 'red', marginTop: '4px', fontSize: '0.9rem' }}>{fieldErrors.receiptFile}</p>
                )}
              </div>
            </div>
 
            <div className="side-widgets">
              <div className="summary-box">
                <h3>Expense Summary</h3>
                <div className="summary-item"><span>Amount:</span> <strong>₹{formData.amount || '0.00'}</strong></div>
                <div className="summary-item"><span>Category:</span> <strong>{formData.category || 'Not selected'}</strong></div>
                <div className="summary-item">
  <span>Expense Date:</span>
  <strong>
    {formData.expenseDate
      ? formData.expenseDate.split('-').reverse().join('-')
      : 'Not selected'}
  </strong>
</div>
 
                <div className="summary-item"><span>Receipts:</span> <strong>{receiptFile ? '1 file' : '0 file'}</strong></div>
              </div>
              <div className="actions-box">
                <button className="btn primary" onClick={handleSubmit}>Submit for Approval</button>
                <button className="btn secondary" onClick={handleSaveDraft}>Save as Draft</button>
                <Link to="/home0" className="btn secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default NewClaim;
 
 

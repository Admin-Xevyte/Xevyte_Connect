import "./Newclaim.css";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
 import Sidebar from './Sidebar.js';
function NewClaim() {
  const location = useLocation();
  const navigate = useNavigate();

  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [originalDraftId, setOriginalDraftId] = useState(null);
 
 
  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const allowedCategories = ["Food", "Accomodation", "Travel", "Medical", "Mobile", "Office", "Others"];
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024;
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
})
  const [receiptFile, setReceiptFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
   <Sidebar>
      <div className="main-area">
 
        <div className="dashboard-header"   style={{
    padding: '20px 20px 0px 40px ',
    paddingLeft: '30px',
  }}>
    
 
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
    </Sidebar>
  );
}
export default NewClaim;
 
 

import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar.js';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const ModalForm = ({ onClose, onSubmit }) => {
  const [customerName, setCustomerName] = useState("");
  const [msaDoc, setMsaDoc] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setMsaDoc(e.target.files[0]);
  };

  const handleClear = () => {
    setCustomerName("");
    setMsaDoc(null);
    setStartDate("");
    setEndDate("");
   
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (new Date(endDate) < new Date(startDate)) {
      alert("End Date cannot be before Start Date.");
      return;
    }

    if (
      !customerName ||
      !msaDoc ||
      !startDate ||
      !endDate 
    ) {
      alert("Please fill all fields and upload the MSA document.");
      return;
    }

    onSubmit({
      customerName,
      msaDoc,
      startDate,
      endDate,
     
    });
    handleClear();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose} // close on backdrop click
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent closing on modal click
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          width: 400,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontWeight: "bold", fontSize: 18 }}>
            Add New Customer
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: 24,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#333",
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            Customer Name <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          {/* MSA Document */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            MSA Document <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            required
            style={{
              width: "100%",
              marginBottom: 15,
              fontSize: 14,
            }}
          />

          {/* Start Date */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            MSA Start Date <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            placeholder="dd-mm-yyyy"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          {/* End Date */}
          <label
            style={{ fontWeight: "600", marginBottom: 6, display: "block" }}
          >
            MSA End Date <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            placeholder="dd-mm-yyyy"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

       

          {/* Buttons */}
          <div style={{ display: "flex", gap: 15 }}>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: 6,
                fontWeight: "bold",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: 6,
                fontWeight: "bold",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const handleDownload = async (customerId, filename) => {
  try {
    const response = await fetch(`http://3.7.139.212:8080/api/customers/${customerId}/download`, {
      method: 'GET',
    });

    if (!response.ok) {
      alert('Failed to download file.');
      return;
    }

    // Get the file data as a blob
    const blob = await response.blob();

    // Create a URL for the blob object
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;  // Set the filename for the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading the file:', error);
    alert('An error occurred while downloading the file.');
  }
};

function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const employeeId = localStorage.getItem("employeeId");
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchCustomers();
    }, []);


    const fetchCustomers = () => {
        axios.get("/api/customers")
            .then(res => setCustomers(res.data))
            .catch(err => console.error("Error fetching customers:", err));
    };

 const handleFormSubmit = async ({ customerName, msaDoc, startDate, endDate }) => {
    const formData = new FormData();
    formData.append("customerName", customerName);  // ✅ Matches Spring @RequestParam
    formData.append("msaDoc", msaDoc);              // ✅ Matches Spring @RequestParam
    formData.append("startDate", startDate);        // ✅ Matches Spring @RequestParam
    formData.append("endDate", endDate);            // ✅ Matches Spring @RequestParam


        try {
            await axios.post("/api/customers", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowModal(false);
            fetchCustomers();
        } catch (error) {
            console.error("Error adding customer:", error);
            alert("Failed to add customer.");
        }
    };

const filteredCustomers = customers.filter(customer => {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const customerIdString = `CID${customer.customerId}`.toLowerCase();

  return (
    customerIdString.includes(lowerCaseSearchTerm) ||
    (customer.customerName || "").toLowerCase().includes(lowerCaseSearchTerm) ||
    (customer.msaDocName || "").toLowerCase().includes(lowerCaseSearchTerm) || // ✅ fixed line
    (customer.startDate || "").toString().toLowerCase().includes(lowerCaseSearchTerm) ||
    (customer.endDate || "").toString().toLowerCase().includes(lowerCaseSearchTerm)
  );
});


    return (
         <Sidebar>
        <div className="dashboard-container">

            <div className="main-content">
                <div style={{ padding: "20px" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
                        <h2>Customers List</h2>
                        <button
  onClick={() => setShowModal(true)}
  style={{
    padding: "10px 15px",
    cursor: "pointer",
    backgroundColor: "#28a745", // ✅ Green background
    color: "white",             // ✅ White text
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "14px"
  }}
>
  Add New Customer
</button>

                    </div>
                 <div
  style={{
    maxHeight: "calc(100vh - 250px)",
    overflowY: "scroll",
    border: "1px solid #ccc",
    borderRadius: 4,
    backgroundColor: "white",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  }}
>
  <table border="1" cellPadding="10" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>Customer ID</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>Customer Name</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>MSA Document</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>Start Date</th>
        <th style={{ backgroundColor: '#2c3e50', color: 'white' }}>End Date</th>
      </tr>
    </thead>
    <tbody>
      {filteredCustomers
        .slice()
        .sort((a, b) => b.customerId - a.customerId) // sort by customerId descending
        .map(customer => (
          <tr key={customer.customerId}>
            <td>{`CID${customer.customerId}`}</td>
            <td>{customer.customerName}</td>
            <td>
              {customer.msaDocName ? (
                <span
                  onClick={() => handleDownload(customer.customerId, customer.msaDocName)}
                  title={customer.msaDocName}
                  style={{ color: "blue", textDecoration: "none", cursor: "pointer" }}
                >
                  {customer.msaDocName.length > 10
                    ? `${customer.msaDocName.substring(0, 10)}...`
                    : customer.msaDocName}
                </span>
              ) : (
                "No document"
              )}
            </td>
            <td>
              {customer.startDate
                ? new Date(customer.startDate).toLocaleDateString("en-GB")
                : ""}
            </td>
            <td>
              {customer.endDate
                ? new Date(customer.endDate).toLocaleDateString("en-GB")
                : ""}
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>

                </div>
            </div>
            {showModal && <ModalForm onClose={() => setShowModal(false)} onSubmit={handleFormSubmit} />}
        </div>
        </Sidebar>
    );
}

export default CustomerList;

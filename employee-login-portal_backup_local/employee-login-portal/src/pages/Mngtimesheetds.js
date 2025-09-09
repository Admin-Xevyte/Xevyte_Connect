import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';

function ManagerGoals() {
  const [subordinates, setSubordinates] = useState([]);
  const [filteredSubordinates, setFilteredSubordinates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [freezeSuccessMessage, setFreezeSuccessMessage] = useState("");
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false); // New state for modal
  const [freezeDates, setFreezeDates] = useState({
    startDate: '',
    endDate: ''
  });
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const employeeId = localStorage.getItem('employeeId');


  useEffect(() => {
    if (employeeId) {
      fetch(`/profile/${employeeId}`)
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
        .catch(err => console.error("Failed to fetch profile info:", err));
    }
  }, [employeeId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsFreezeModalOpen(false);
      }
    }
    if (profileOpen || isFreezeModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen, isFreezeModalOpen]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("name", employeeName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`/profile/update/${employeeId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => {
          setSuccessMessage("");
          setProfileOpen(false);
        }, 2000);
      } else {
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };

useEffect(() => {
  if (!employeeId) {
    setErrorMessage('User ID not found. Please log in.');
    setSubordinates([]);
    return;
  }
  
  // No role check anymore, always fetch subordinates for this employeeId as managerId
  fetch(`/api/goals/manager/${employeeId}/employees`)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      setSubordinates(data);
      setErrorMessage('');
    })
    .catch((error) => {
      console.error('Error fetching subordinates:', error);
      setErrorMessage('Failed to fetch subordinates.');
      setSubordinates([]);
    });
}, [employeeId]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    if (subordinates.length > 0) {
      const tempFiltered = subordinates.filter(sub => {
        const id = sub.employeeId ? String(sub.employeeId).toLowerCase() : '';
        const name = sub.name ? sub.name.toLowerCase() : '';
        const email = sub.email ? sub.email.toLowerCase() : '';
        return (
          id.includes(lowercasedSearchTerm) ||
          name.includes(lowercasedSearchTerm) ||
          email.includes(lowercasedSearchTerm)
        );
      });
      setFilteredSubordinates(tempFiltered);
    } else {
      setFilteredSubordinates([]);
    }
  }, [searchTerm, subordinates]);

  const handleEmployeeClick = (empId) => {
    localStorage.setItem("selectedEmployeeId", empId);
    navigate("/mngreq", { state: { employeeId: empId } });
  };

  const handleFreezeAllTimesheets = () => {
    setFreezeSuccessMessage(""); // Clear any previous messages
    if (filteredSubordinates.length === 0) {
      setFreezeSuccessMessage("No employees to freeze timesheets for.");
      setTimeout(() => setFreezeSuccessMessage(""), 4000);
      return;
    }
    // Open the modal to get dates from the user
    setIsFreezeModalOpen(true);
  };

  const confirmFreeze = async () => {
    if (!freezeDates.startDate || !freezeDates.endDate) {
      setFreezeSuccessMessage("Please select both a start and end date.");
      return;
    }
    if (freezeDates.startDate > freezeDates.endDate) {
      setFreezeSuccessMessage("Start date cannot be after end date.");
      return;
    }
    setIsFreezeModalOpen(false);
    setFreezeSuccessMessage("Freezing timesheets... Please wait.");
    
    let allSuccess = true;
    for (const emp of filteredSubordinates) {
      try {
        const payload = {
          managerId: employeeId,
          employeeId: emp.employeeId,
          startDate: freezeDates.startDate,
          endDate: freezeDates.endDate
        };

        const res = await fetch('/daily-entry/freeze', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to freeze timesheets for ${emp.name}: ${text}`);
        }
      } catch (error) {
        console.error(error.message);
        allSuccess = false;
        setFreezeSuccessMessage(`❌ ${error.message}`);
        break;
      }
    }

    if (allSuccess) {
      setFreezeSuccessMessage("✅ All subordinate timesheets have been frozen successfully.");
    }
    setTimeout(() => setFreezeSuccessMessage(""), 4000);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
 <h3>
                        <Link to="/dashboard" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)'}}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)'}}>
                            Home
                           
                          </span>
                        </Link>
                      </h3>
                      <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Claims</Link></h3>
                      <h3><Link to="/home1" className="side" style={{ textDecoration: 'none', color: 'white' }}>Time Sheet</Link></h3>
                      <h3><Link to="/home2" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Handbook</Link></h3>
                      <h3><Link to="/home3" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Employee Directory</Link></h3>
                      <h3><Link to="/home4" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Exit Management</Link></h3>
                      <h3><Link to="/home5" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Holiday Calendar</Link></h3>
                      <h3><Link to="/home6" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Helpdesk</Link></h3>
                      <h3><Link to="/home7" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Leaves</Link></h3>
                    
                      <h3><Link to="/home9" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Pay slips</Link></h3>
                      <h3><Link to="/home10" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Performance</Link></h3>
                      <h3><Link to="/home11" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Training</Link></h3>
                      <h3><Link to="/home12" className="side" style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.7)' }}>Travel</Link></h3>
          </>
        ) : (
          <div className="collapsed-wrapper">
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header with Profile */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeId})</h2>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" style={{ cursor: 'pointer' }} />
            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img src={profilePic} alt="Profile" className="profile-pic" onClick={toggleProfileMenu} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              {profileOpen && (
                <div ref={profileDropdownRef} className="profile-dropdown" style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', zIndex: 1000, width: '150px' }}>
                  <button onClick={handleEditProfile} style={{ padding: '10px', width: '100%', border: 'none', background: 'none', textAlign: 'left', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ padding: '10px', width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>Logout</button>
                </div>
              )}
              {successMessage && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{successMessage}</div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {freezeSuccessMessage && (
          <div style={{ color: freezeSuccessMessage.startsWith('❌') ? 'red' : 'green', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
            {freezeSuccessMessage}
          </div>
        )}

       <div className="emp-container">
  {errorMessage ? (
    <>
      <h2 className="emp-title">Error</h2>
      <p className="emp-error">{errorMessage}</p>
    </>
  ) : subordinates.length === 0 ? (
    <p className="emp-empty">No subordinates found.</p>
  ) : (
    <>
      <h2 className="emp-title">Subordinates for Manager {employeeId}</h2>
      {/* Freeze button */}
      {filteredSubordinates.length > 0 && (
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <button
            onClick={handleFreezeAllTimesheets}
            style={{
              padding: '10px 15px',
              background: 'green',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Freeze All Subordinates' Timesheets
          </button>
        </div>
      )}
      {/* Subordinates table */}
      {filteredSubordinates.length === 0 ? (
        <p className="emp-empty">No subordinates found matching your search.</p>
      ) : (
        <div className="table-wrapper">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubordinates.map((emp) => (
                <tr key={emp.id || emp.employeeId}>
                  <td>
                    <button
                      type="button"
                      style={{
                        color: 'blue',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                      }}
                      onClick={() => handleEmployeeClick(emp.employeeId)}
                    >
                      {emp.employeeId}
                    </button>
                  </td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )}
</div>

      </div>

      {/* Freeze Timesheet Modal */}
      {isFreezeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div ref={modalRef} style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: '0', marginBottom: '20px' }}>Select Date Range to Freeze</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  value={freezeDates.startDate}
                  onChange={(e) => setFreezeDates({ ...freezeDates, startDate: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  value={freezeDates.endDate}
                  onChange={(e) => setFreezeDates({ ...freezeDates, endDate: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
            {freezeSuccessMessage && (
              <p style={{ color: freezeSuccessMessage.startsWith('❌') ? 'red' : 'green', marginTop: '15px' }}>
                {freezeSuccessMessage}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setIsFreezeModalOpen(false)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmFreeze}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerGoals;
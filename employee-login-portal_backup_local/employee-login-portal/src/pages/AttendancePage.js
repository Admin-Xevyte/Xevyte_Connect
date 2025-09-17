import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DailyEntryForm from "./DailyEntryForm";
import Alerts from "./Alerts";
import './Dashboard.css';
import './AttendancePage.css';
import Sidebar from './Sidebar.js';
function TimesheetDashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
 

  const navigate = useNavigate();

 const [canViewTasks, setCanViewTasks] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [holidays, setHolidays] = useState([]);

  

  const [approvedLeaveDates, setApprovedLeaveDates] = useState([]);
  // State to hold submitted entries, now includes full entry object
  const [submittedEntries, setSubmittedEntries] = useState({});
  const [frozenDates, setFrozenDates] = useState([]);
  // NEW STATE: holds the full entry object to be passed to the form for editing
  const [entryToEdit, setEntryToEdit] = useState(null);


const handleMyTasksClick = () => {
  navigate('/myteam1');  // Redirect to the new page with Manager & HR cards
};

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  padding: '25px',
  textAlign: 'left',
  width: '350px',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  marginBottom: '20px'
};
  const [roles, setRoles] = useState({
  manager: false,
  finance: false,
  hr: false,
  reviewer: false,
  admin: false,
  canViewTasks: false,
});

useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setRoles(data);
      })
      .catch(err => console.error("Failed to fetch roles:", err));
  }
}, [employeeId]);
  
 useEffect(() => {
  if (employeeId) {
    fetch(`http://3.7.139.212:8080/access/assigned-ids/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        const { manager, hr } = data;  // only manager and hr

        // Show tasks only if manager or hr
        const canView = manager || hr;

        setCanViewTasks(canView);
      })
      .catch(err => {
        console.error("Error fetching task visibility:", err);
        setCanViewTasks(false);
      });
  }
}, [employeeId]);
  // Fetch frozen dates for the logged-in employee
  useEffect(() => {
    if (!employeeId) return;

    const fetchFrozenDates = async () => {
      try {
        const response = await fetch(`http://3.7.139.212:8080/daily-entry/frozen-dates/${employeeId}`);
        if (!response.ok) throw new Error("Failed to fetch frozen dates");
        const data = await response.json();
        setFrozenDates(data); // backend returns list of LocalDate like ["2025-08-01", "2025-08-15"]
      } catch (error) {
        console.error(error);
        setFrozenDates([]);
      }
    };

    fetchFrozenDates();
  }, [employeeId]);


  // Fetch approved leave dates
  useEffect(() => {
    if (!employeeId) return;

    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch(`http://3.7.139.212:8080/leaves/approved-dates/${employeeId}`);
        if (!response.ok) throw new Error("Failed to fetch approved leaves");
        const data = await response.json();
        setApprovedLeaveDates(data);
      } catch (error) {
        console.error(error);
        setApprovedLeaveDates([]);
      }
    };

    fetchApprovedLeaves();
  }, [employeeId]);

  // Fetch submitted timesheet entries (full objects)
  const fetchSubmittedEntries = async () => {
    if (!employeeId) return;
    try {
      const response = await fetch(`http://3.7.139.212:8080/daily-entry/employee/${employeeId}`);
      if (!response.ok) {
        console.error("Backend response not ok:", response.status);
        throw new Error("Failed to fetch submitted entries");
      }
      const data = await response.json();
      const entriesMap = data.reduce((acc, entry) => {
        acc[entry.date] = entry; // Store the entire entry object
        return acc;
      }, {});
      setSubmittedEntries(entriesMap);
    } catch (error) {
      console.error("Error fetching submitted timesheet entries:", error);
      setSubmittedEntries({});
    }
  };

  // Fetch submitted entries on initial load and when the month changes
  useEffect(() => {
    fetchSubmittedEntries();
  }, [employeeId, month, year]);

 

  // Fetch holidays for the current month/year
  useEffect(() => {
    const url = `http://3.7.139.212:8080/api/holidays/${year}/${month + 1}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch holidays");
        return r.json();
      })
      .then((data) => {
        const ds = data.map((h) => h.holidayDate);
        setHolidays(ds);
      })
      .catch((e) => {
        console.error(e);
        setHolidays([]);
      });
  }, [year, month]);


  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const headerStyle = { fontWeight: "bold", textAlign: "center", padding: "10px" };
  const cellStyle = {
    width: "100px",
    height: "50px",
    padding: "6px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    textAlign: "center",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box"
  };



  // Function to close the form and navigate
  const handleCloseForm = () => {
    setSelectedDate(null);
    setEntryToEdit(null); // IMPORTANT: Clear the entry to edit state
  };

  // Re-fetch submitted dates after a successful form submission
  const handleSuccessfulSubmit = () => {
    setSelectedDate(null); // Hide the form/modal
    setEntryToEdit(null); // Clear the entry to edit state
    fetchSubmittedEntries(); // Re-fetch the submitted entries to update the calendar
  };

  return (
     <Sidebar>
      <div className="main-content">
        <div style={{ padding: 20, fontFamily: "Arial" }}>
          <h2 style={{ textAlign: "center" }}>
            <button
              onClick={handlePrev}
              style={{
                padding: "6px 12px",
                marginRight: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              ⬅️ Prev
            </button> Timesheet Dashboard -{" "}
            {new Date(year, month).toLocaleString("default", { month: "long" })} {year}<button
              onClick={handleNext}
              style={{
                padding: "6px 12px",
                marginLeft: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              Next ➡️
            </button>
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: "10px",
              marginBottom: 15,
            }}
          >
            <button
              onClick={() => navigate("/mytimesheets")}
              style={{
                padding: "11px 8px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              My Timesheets
            </button>
          </div>

         {canViewTasks && (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: "10px",
      marginBottom: 15,
    }}
  >
    <button
      onClick={handleMyTasksClick}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        color: "white",
        border: "none",
        borderRadius: "5px",
        background: "#007bff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
      }}
    >
      My Team
    </button>
  </div>
)}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 10,
              margin: "0 auto",
              maxWidth: 800,
            }}
          >

            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} style={headerStyle}>
                {d}
              </div>
            ))}

            {Array((firstDay.getDay() + 6) % 7)
              .fill(null)
              .map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
            {days.map((date, i) => {
              const iso = fmt(date);
              const dow = date.getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isHoliday = holidays.includes(iso);
              const isApprovedLeave = approvedLeaveDates.includes(iso);
              const isFutureDate = date > today;
              const isSubmitted = submittedEntries.hasOwnProperty(iso);
              // Get the full entry object if it exists
              const entryForDate = submittedEntries[iso] || null;
              const submittedHours = entryForDate ? entryForDate.totalHours : null;

              // ✅ NEW: frozen logic
              const isFrozen = frozenDates.includes(iso);

              let bg = "#e8f7ff"; // default workday
              let titleText = `${iso}`;
              let hoursDisplay = null;

              if (isWeekend) {
                bg = "#ffcccc";
                titleText += " (Weekend)";
              } else if (isHoliday) {
                bg = "#fff7b3";
                titleText += " (Holiday)";
              } else if (isApprovedLeave) {
                bg = "#d3d3d3";
                titleText += " (Approved Leave)";
              }

if (isSubmitted) {
    bg = "#b3f7b3";
    // 1. Calculate total minutes
    const totalMinutes = submittedHours * 60;
    
    // 2. Extract hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // 3. Format the time as "HH:MM"
    const formattedHours = `${hours}:${String(minutes).padStart(2, '0')} `;
    
    hoursDisplay = (
        <div style={{ fontSize: "12px", marginTop: "5px", fontWeight: "bold" }}>
            {formattedHours}
        </div>
    );
}


              // ❄️ Frozen overrides everything
              if (isFrozen) {
                bg = "#f0f0f0"; // light red
              }

              let cursor = "pointer";
              let alertMessage = "";

              if (isFrozen) {
                cursor = "not-allowed";
                alertMessage = "This timesheet is frozen by manager. You cannot edit it.";
              } else if (isFutureDate) {
                cursor = "not-allowed";
                alertMessage = "You cannot fill out a timesheet for a future date.";
              } else if (isApprovedLeave) {
                cursor = "not-allowed";
                alertMessage = "You cannot submit hours for this day as leave has been approved.";
              } else if (isSubmitted && !isFrozen) {
                // If submitted and not frozen, allow editing. No alert message.
              }


              // This is the updated onClickHandler
              const onClickHandler = () => {
                if (isFrozen || isFutureDate || isApprovedLeave) {
                  alert(alertMessage);
                } else if (isSubmitted) {
                  // If the date is submitted and not frozen, pass the entry data
                  setEntryToEdit(entryForDate);
                  setSelectedDate(iso);
                } else {
                  // For a new entry, clear the entry to edit state
                  setEntryToEdit(null);
                  setSelectedDate(iso);
                }
              };

              return (
                <div
                  key={iso}
                  onClick={onClickHandler}
                  title={titleText}
                  style={{
                    ...cellStyle,
                    backgroundColor: bg,
                    cursor,
                    color: isFrozen ? "gray" : "black",
                    pointerEvents: isFrozen ? "none" : "auto",
                  }}
                >
                  <div>{date.getDate()}</div>
                  {hoursDisplay}
                 {isFrozen && (
  <small style={{ color: "green", fontWeight: "bold" }}></small>
)}

                </div>
              );
            })}

          </div>

          {selectedDate && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Submit Hours for Day {selectedDate}</h3>
                <DailyEntryForm
                  date={selectedDate}
                  initialData={entryToEdit} // NEW: Pass the entry object for editing
                  onAlert={(msg) => {
                    // Add the new message to the state
                    setAlerts((currentAlerts) => [...currentAlerts, msg]);

                    // Set a timer to remove the message after 2000 milliseconds (2 seconds)
                    setTimeout(() => {
                      setAlerts((currentAlerts) => {
                        // This creates a new array that excludes the specific message
                        return currentAlerts.filter((alert) => alert !== msg);
                      });
                    }, 2000); // 2 seconds
                  }}
                  onClose={handleCloseForm}
                  onSuccess={handleSuccessfulSubmit}
                />
              </div>
            </div>
          )}

          <div style={{ maxWidth: 900, margin: "20px auto", display: "flex", justifyContent: "center", gap: "30px", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#ffcccc", borderRadius: 4, border: "1px solid #d9534f" }}></div>
              <span>Weekends</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#fff7b3", borderRadius: 4, border: "1px solid #d4af37" }}></div>
              <span>Holidays</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#e8f7ff", borderRadius: 4, border: "1px solid #5bc0de" }}></div>
              <span>Workdays</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#d3d3d3", borderRadius: 4, border: "1px solid #999" }}></div>
              <span>Approved Leave</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#f0f0f0", borderRadius: 4, border: "1px solid #ccc" }}></div>
              <span>Frozen</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#b3f7b3", borderRadius: 4, border: "1px solid #4caf50" }}></div>
              <span>Submitted</span>
            </div>
          </div>

          <Alerts alerts={alerts} />
        </div>
      </div>
  </Sidebar>
  );
}

export default TimesheetDashboard;

import React, { useState, useEffect } from "react";

function DailyEntryForm({ date, initialData, onAlert, onClose, onSuccess }) {
  // Use initialData to set the initial state for editing
  const [entryId, setEntryId] = useState(initialData?.id || null);
  const [client, setClient] = useState(initialData?.client || "");
  const [project, setProject] = useState(initialData?.project || "");
  const [loginTime, setLoginTime] = useState({ hour: "", minute: "", period: "" });
  const [logoutTime, setLogoutTime] = useState({ hour: "", minute: "", period: "" });
  const [totalHours, setTotalHours] = useState(initialData?.totalHours || 0);
  const [remarks, setRemarks] = useState(initialData?.remarks || "");
  const [errors, setErrors] = useState({});
const [clients, setClients] = useState([]);
const [projects, setProjects] = useState([]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  // Helper function to parse HH:MM period string into state object
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: "", minute: "", period: "" };
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':');
    return { hour, minute, period };
  };

  useEffect(() => {
  // Fetch clients on component mount
  fetch('/api/customers')
    .then((res) => res.json())
    .then((data) => setClients(data))
    .catch((err) => console.error('Error fetching clients:', err));
}, []);
useEffect(() => {
  if (client) {
    fetch(`/api/projects/customer/${client}/all-projects`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error("API did not return an array:", data);
          setProjects([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching projects:', err);
        setProjects([]);
      });
  } else {
    setProjects([]);
    setProject("");
  }
}, [client]);


  useEffect(() => {
    if (initialData) {
      setClient(initialData.client);
      setProject(initialData.project);
      setRemarks(initialData.remarks);
      setLoginTime(parseTime(initialData.loginTime));
      setLogoutTime(parseTime(initialData.logoutTime));
      setEntryId(initialData.id);
      setTotalHours(initialData.totalHours);
    } else {
      handleClearForm();
    }
  }, [initialData]);

  useEffect(() => {
    // Only proceed if all time fields are selected
    if (loginTime.hour && loginTime.minute && loginTime.period && logoutTime.hour && logoutTime.minute && logoutTime.period) {
      const get24Hour = (time) => {
        let hour = parseInt(time.hour, 10);
        const minute = parseInt(time.minute, 10);
        
        // Handle PM hours
        if (time.period === "PM" && hour !== 12) {
          hour += 12;
        } 
        // Handle 12 AM (midnight)
        else if (time.period === "AM" && hour === 12) {
          hour = 0; 
        }
        return { hour, minute };
      };

      const login24 = get24Hour(loginTime);
      const logout24 = get24Hour(logoutTime);

      const startMinutes = login24.hour * 60 + login24.minute;
      let endMinutes = logout24.hour * 60 + logout24.minute;

      // Correctly handle overnight shifts by adding 24 hours to the end time in minutes
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }

      const diffInMinutes = endMinutes - startMinutes;
      const calculatedHours = diffInMinutes / 60;

      setTotalHours(calculatedHours > 0 ? calculatedHours.toFixed(2) : 0);
    } else {
      setTotalHours(0);
    }
  }, [loginTime, logoutTime]);

  // New helper function to format decimal hours to HH:MM format
  const formatTotalHours = (decimalHours) => {
    if (decimalHours === 0) return 0;
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!client) newErrors.client = "Please select a client.";
    if (!project) newErrors.project = "Please select a project.";
    if (!loginTime.hour || !loginTime.minute || !loginTime.period || !logoutTime.hour || !logoutTime.minute || !logoutTime.period) {
      newErrors.time = "Please enter hours before submitting.";
    }
    if (loginTime.hour && logoutTime.hour && totalHours <= 0) {
      newErrors.totalHours = "Invalid time range. Please check login/logout.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const employeeId = localStorage.getItem("employeeId");
      if (!employeeId) {
        onAlert(
          <div style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "5px" }}>
            ❌ Employee not logged in.
          </div>
        );
        return;
      }

      const formattedLoginTime = `${loginTime.hour}:${loginTime.minute} ${loginTime.period}`;
      const formattedLogoutTime = `${logoutTime.hour}:${logoutTime.minute} ${logoutTime.period}`;

      // Determine URL and method based on whether an entryId exists
      const url = entryId
        ? `/daily-entry/update/${entryId}`
        : `/daily-entry/submit/${employeeId}`;
      const method = entryId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          client,
          project,
          loginTime: formattedLoginTime,
          logoutTime: formattedLogoutTime,
          totalHours,
          remarks,
        }),
      });

      if (response.ok) {
        onAlert(
          <div style={{ backgroundColor: "#d4edda", color: "#155724", padding: "10px", borderRadius: "5px", border: "1px solid #c3e6cb", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            ✅ Daily entry {entryId ? "updated" : "submitted"}: Success
          </div>
        );
        onSuccess(date);
        onClose();
      } else {
        const error = await response.text();
        onAlert(
          <div style={{ color: "red", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", padding: "10px", borderRadius: "5px" }}>
            ❌ Failed to {entryId ? "update" : "submit"}: {error}
          </div>
        );
      }
    } catch (err) {
      console.error(err);
      onAlert(
        <div style={{ color: "#856404", backgroundColor: "#fff3cd", border: "1px solid #ffeeba", padding: "10px", borderRadius: "5px" }}>
          ⚠️ Error {entryId ? "updating" : "submitting"} daily entry. Please try again.
        </div>
      );
    }
  };

  const handleClearForm = () => {
    setEntryId(null);
    setClient("");
    setProject("");
    setLoginTime({ hour: "", minute: "", period: "" });
    setLogoutTime({ hour: "", minute: "", period: "" });
    setTotalHours(0);
    setRemarks("");
    setErrors({});
  };

  const handleCancelAndClose = () => {
    handleClearForm();
    onClose();
  };

  const handleCloseOnly = () => {
    onClose();
  };

  const labelStyle = { display: "block", margin: "10px 5px 5px", fontWeight: "600" };
  const timeInputContainerStyle = { display: "flex", gap: "5px", width: "100%" };
  const selectStyle = { padding: "8px", border: "1px solid #ccc", borderRadius: "5px", width: "100%" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px", width: "600px", backgroundColor: "#fff", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", position: "relative" }}>
        <button onClick={handleCloseOnly} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}>&times;</button>
        <h3>{initialData ? "Edit Hours" : "Submit Hours"} for Day {date}</h3>
        <form onSubmit={handleSubmit}>
          {/* Client */}
       <label style={labelStyle} htmlFor="client-select">
  Client <span style={{ color: "red" }}>*</span>
</label>
<select
  id="client-select"
  value={client}
  onChange={(e) => {
    setClient(e.target.value);
    setErrors((prev) => ({ ...prev, client: "" }));
  }}
  style={{ padding: "8px", margin: "5px", border: "1px solid #ccc", borderRadius: "5px", width: "99%" }}
>
  <option value="">-- Select Client --</option>
  {clients.map((c) => (
    <option key={c.customerId} value={c.customerId}>
      {c.customerName}
    </option>
  ))}
</select>
{errors.client && (
  <div style={{ color: "red", marginLeft: "5px" }}>{errors.client}</div>
)}


         <label style={labelStyle} htmlFor="project-select">
  Project <span style={{ color: "red" }}>*</span>
</label>
<select
  id="project-select"
  value={project}
  onChange={(e) => {
    setProject(e.target.value);
    setErrors((prev) => ({ ...prev, project: "" }));
  }}
  style={{ padding: "8px", margin: "5px", border: "1px solid #ccc", borderRadius: "5px", width: "99%" }}
  disabled={!client}
>
  {/* <option value="">-- Select Project --</option>
  {projects.map((p) => (
    <option key={p.projectId} value={p.projectId}>
      {p.projectName}
    </option> */}
 {projects.map((p) => (
  <option key={p.projectId} value={p.projectId}>
    {`P${p.projectId}`}
  </option>
))}

</select>
{errors.project && (
  <div style={{ color: "red", marginLeft: "5px" }}>{errors.project}</div>
)}

          {/* Login / Logout */}
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            {/* Login Time */}
            <div style={{ flex: 1 }}>
              <label htmlFor="login-time" style={labelStyle}>Login Time <span style={{ color: "red" }}>*</span></label>
              <div style={timeInputContainerStyle}>
                <select value={loginTime.hour} onChange={(e) => setLoginTime({ ...loginTime, hour: e.target.value })} style={selectStyle}>
                  <option value="">Hr</option>
                  {hours.map((h) => (<option key={h} value={h.toString()}>{h}</option>))}
                </select>
                <select value={loginTime.minute} onChange={(e) => setLoginTime({ ...loginTime, minute: e.target.value })} style={selectStyle}>
                  <option value="">Min</option>
                  {minutes.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
                <select value={loginTime.period} onChange={(e) => setLoginTime({ ...loginTime, period: e.target.value })} style={selectStyle}>
                  <option value="">AM/PM</option>
                  {periods.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
            </div>

            {/* Logout Time */}
            <div style={{ flex: 1 }}>
              <label htmlFor="logout-time" style={labelStyle}>Logout Time <span style={{ color: "red" }}>*</span></label>
              <div style={timeInputContainerStyle}>
                <select value={logoutTime.hour} onChange={(e) => setLogoutTime({ ...logoutTime, hour: e.target.value })} style={selectStyle}>
                  <option value="">Hr</option>
                  {hours.map((h) => (<option key={h} value={h.toString()}>{h}</option>))}
                </select>
                <select value={logoutTime.minute} onChange={(e) => setLogoutTime({ ...logoutTime, minute: e.target.value })} style={selectStyle}>
                  <option value="">Min</option>
                  {minutes.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
                <select value={logoutTime.period} onChange={(e) => setLogoutTime({ ...logoutTime, period: e.target.value })} style={selectStyle}>
                  <option value="">AM/PM</option>
                  {periods.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
            </div>
          </div>
          {errors.time && (<div style={{ color: "red", marginTop: "5px", fontWeight: "600" }}>{errors.time}</div>)}
          {errors.totalHours && (<div style={{ color: "red", marginTop: "5px", fontWeight: "600" }}>{errors.totalHours}</div>)}

          {/* Total Hours */}
          <label style={labelStyle} htmlFor="total-hours">Total Hours</label>
          <input id="total-hours" type="text" value={formatTotalHours(totalHours)} readOnly placeholder="Total Hours" style={{ padding: "8px", margin: "5px", border: "1px solid #ccc", borderRadius: "5px", backgroundColor: "#f9f9f9", width: "99%" }} />
          {totalHours > 0 && totalHours < 8 && (<div style={{ color: "red", marginTop: "5px", fontWeight: "600" }}>You have entered fewer than the required hours. Please confirm submission.</div>)}

          {/* Remarks */}
          <label style={labelStyle} htmlFor="remarks">Remarks</label>
          <input id="remarks" type="text" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ padding: "8px", margin: "5px", border: "1px solid #ccc", borderRadius: "5px", width: "99%" }} />

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
            <button type="submit" style={{ flex: 1, padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px", fontWeight: "600", fontSize: "16px", transition: "background-color 0.3s" }} onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")} onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}>Submit</button>
            <button type="button" onClick={handleCancelAndClose} style={{ flex: 1, padding: "10px", background: "#6c757d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "16px", transition: "background-color 0.3s" }} onMouseEnter={(e) => (e.target.style.backgroundColor = "#545b62")} onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DailyEntryForm;
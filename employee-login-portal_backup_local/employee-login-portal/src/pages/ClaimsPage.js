import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import NewClaim from './NewClaim';
import Saveddrafts from './Saveddrafts';
import ClaimHistoryPage from './ClaimHistoryPage';
import MyTasks from './MyTasks';
import DesignSummary from './DesignSummary';

function ClaimsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('New Claim');
  const [draftIdForEdit, setDraftIdForEdit] = useState(null);
  const [summary, setSummary] = useState({
    totalClaims: 0,
    approved: 0,
    rejected: 0,
    paidAmount: 0
  });
  const [canViewTasks, setCanViewTasks] = useState(false);
  const employeeId = localStorage.getItem("employeeId");

  // Load view task permission
  useEffect(() => {
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/claims/assigned-ids/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          setCanViewTasks(data.canViewTasks === true);
        })
        .catch(err => {
          console.error("Error fetching task visibility:", err);
          setCanViewTasks(false);
        });
    }
  }, [employeeId]);

  // Load claim summary
  useEffect(() => {
    if (employeeId) {
      fetch(`http://3.7.139.212:8080/claims/summary/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          setSummary({
            totalClaims: data.totalClaims || 0,
            approved: data.approved || 0,
            rejected: data.rejected || 0,
            paidAmount: data.paidAmount || 0
          });
        })
        .catch(err => console.error("Error fetching summary:", err));
    }
  }, [employeeId]);

  // Handle navigation state (e.g. when editing a draft)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      setDraftIdForEdit(location.state.draftId || null);
    }
  }, [location.state]);

  // Build tab list dynamically
  const tabItems = ['New Claim', 'Drafts', 'History'];
  if (canViewTasks) {
    tabItems.push('My Task');
  }
  tabItems.push('Summary');

  // Styles
  const tabContainerStyle = {
    display: 'flex',
    gap: '2rem',
    padding: '1rem 0',
    borderBottom: '1px solid #ddd',
    fontFamily: 'sans-serif'
  };

  const tabStyle = (tab) => ({
    cursor: 'pointer',
    padding: '0.5rem 0',
    color: activeTab === tab ? '#007bff' : '#333',
    fontWeight: activeTab === tab ? '600' : 'normal',
    position: 'relative',
    borderBottom: activeTab === tab ? '3px solid #add8e6' : 'none',
    transition: 'color 0.3s ease'
  });

  return (
    <Sidebar>
      {/* Tab Navigation */}
      <div style={tabContainerStyle}>
        {tabItems.map((tab) => (
          <div
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab !== 'New Claim') setDraftIdForEdit(null);
            }}
            style={tabStyle(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1rem 0', fontFamily: 'sans-serif' }}>
        {activeTab === 'New Claim' && <NewClaim draftId={draftIdForEdit} />}
        {activeTab === 'Drafts' && <Saveddrafts />}
        {activeTab === 'History' && <ClaimHistoryPage />}
        {activeTab === 'My Task' && canViewTasks && <MyTasks />}
        {activeTab === 'Summary' && <DesignSummary summary={summary} />}
      </div>
    </Sidebar>
  );
}

export default ClaimsPage;

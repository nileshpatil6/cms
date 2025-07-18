import React, { useEffect, useState } from 'react';
import { getComplaints, updateComplaintStatus, triggerAIAnalysis, getUserDetails } from '../services/api';

function AgentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await getUserDetails();
        setCurrentUser(user);
        const data = await getComplaints();
        setComplaints(data);
      } catch (err) {
        setError(err.message || "Failed to load data. Please log in.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await updateComplaintStatus(complaintId, newStatus);
      fetchComplaints(); // Re-fetch complaints to update the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTriggerAI = async (complaintId) => {
    try {
      await triggerAIAnalysis(complaintId);
      fetchComplaints(); // Re-fetch complaints to update with new AI data
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    return (filterStatus === '' || complaint.status === filterStatus) &&
           (filterCategory === '' || complaint.category === filterCategory);
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const uniqueStatuses = [...new Set(complaints.map(c => c.status))];
  const uniqueCategories = [...new Set(complaints.map(c => c.category))];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading && !currentUser) {
    return <div className="page-container">Loading dashboard...</div>;
  }

  if (error && !currentUser) {
    return <div className="page-container error-message">Error: {error}</div>;
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Agent Dashboard</h2>
      {error && <p className="error-message">Error: {error}</p>}
      <div className="filters-and-sort">
        <div className="filters">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <label htmlFor="category-filter">Filter by Category:</label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="sort-buttons">
          <button onClick={() => handleSort('created_at')}>
            Sort by Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button onClick={() => handleSort('status')}>
            Sort by Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {loading && <p>Loading complaints...</p>}
      {sortedComplaints.length === 0 && !loading && !error && (
        <p>No complaints found.</p>
      )}

      <div className="complaints-grid">
        {sortedComplaints.map(complaint => (
          <div key={complaint.id} className="complaint-card">
            <h3>{complaint.subject}</h3>
            <p><strong>ID:</strong> {complaint.id}</p>
            <p><strong>User ID:</strong> {complaint.user_id}</p>
            <p><strong>Description:</strong> {complaint.description}</p>
            <p><strong>Ticket Number:</strong> {complaint.ticket_number}</p>
            <p><strong>Created:</strong> {new Date(complaint.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : '-'}</p>
            <span className={`status ${complaint.status.toLowerCase().replace(' ', '-')}`}>
              {complaint.status}
            </span>
            {complaint.category && <p><strong>Category:</strong> {complaint.category}</p>}
            {complaint.ai_summary && (
              <div className="ai-response">
                <strong>AI Summary:</strong> {complaint.ai_summary}
              </div>
            )}
            {complaint.suggested_response && (
              <div className="ai-response">
                <strong>AI Suggested Response:</strong> {complaint.suggested_response}
              </div>
            )}
            <div className="complaint-actions">
              {complaint.status === 'pending' && (
                <button onClick={() => handleStatusChange(complaint.id, 'in_progress')}>
                  Mark In Progress
                </button>
              )}
              {complaint.status === 'in_progress' && (
                <>
                  <button onClick={() => handleStatusChange(complaint.id, 'resolved')}>
                    Mark Resolved
                  </button>
                  <button onClick={() => handleStatusChange(complaint.id, 'closed')}>
                    Close Complaint
                  </button>
                </>
              )}
              {!complaint.ai_summary && (
                <button onClick={() => handleTriggerAI(complaint.id)} className="analyze-button">
                  Trigger AI Analysis
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentDashboard;
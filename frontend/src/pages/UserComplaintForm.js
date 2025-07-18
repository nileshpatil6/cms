import React, { useState, useEffect } from 'react';
import { submitComplaint, getUserDetails, updateComplaintStatus, getComplaints } from '../services/api';

function UserComplaintForm() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [complaintId, setComplaintId] = useState(null);
  const [showResolutionPrompt, setShowResolutionPrompt] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [checkTicketNumber, setCheckTicketNumber] = useState('');
  const [checkedTicket, setCheckedTicket] = useState(null);
  const [checkError, setCheckError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await getUserDetails();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setMessage("Error: Could not retrieve user information. Please log in again.");
      }
    };
    fetchUserDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    setAiResponse(null);
    setComplaintId(null);
    setShowResolutionPrompt(false);
    try {
      if (!currentUser || !currentUser.id) {
        setMessage('Error: User not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      const response = await submitComplaint({ user_id: currentUser.id, subject, description });
      setMessage('Complaint submitted successfully!');
      setSubject('');
      setDescription('');
      setAiResponse({
        summary: response && response.summary ? response.summary : 'N/A',
        suggested_response: response && response.suggested_response ? response.suggested_response : 'N/A'
      });
      setComplaintId(response && response.id ? response.id : null);
      setTicketNumber(response && response.ticket_number ? response.ticket_number : null);
      setTicketStatus(response && response.status ? response.status : null);
      setShowResolutionPrompt(true);
    } catch (error) {
      setMessage('Error submitting complaint: ' + (error && error.message ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolution = async (solved) => {
    if (!complaintId) return;
    setMessage('');
    try {
      if (solved) {
        await updateComplaintStatus(complaintId, 'closed');
        setTicketStatus('closed');
        setMessage('Thank you! The ticket has been closed.');
      } else {
        await updateComplaintStatus(complaintId, 'pending');
        setTicketStatus('pending');
        setMessage('The ticket will remain pending.');
      }
      setShowResolutionPrompt(false);
    } catch (error) {
      setMessage('Error updating ticket status: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCheckTicket = async (e) => {
    e.preventDefault();
    setCheckError('');
    setCheckedTicket(null);
    try {
      const complaints = await getComplaints();
      const found = complaints.find(c => c.ticket_number === checkTicketNumber.trim());
      if (found) {
        setCheckedTicket(found);
      } else {
        setCheckError('No ticket found with that number.');
      }
    } catch (err) {
      setCheckError('Error fetching ticket status.');
    }
  };

  if (!currentUser) {
    return <div className="page-container">Loading user information...</div>;
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Submit a Complaint</h2>
      {message && (
        <p className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label htmlFor="subject">Subject:</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="form-textarea"
          ></textarea>
        </div>
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
      {aiResponse && (
        <div className="ai-response-card">
          <h3>AI Response</h3>
          <p><strong>Summary:</strong> {aiResponse.summary || 'N/A'}</p>
          <p><strong>Suggested Response:</strong> {aiResponse.suggested_response || 'N/A'}</p>
        </div>
      )}
      {ticketNumber && (
        <div className="ticket-info-card">
          <h3>Ticket Information</h3>
          <p><strong>Ticket Number:</strong> {ticketNumber}</p>
          <p><strong>Status:</strong> {ticketStatus}</p>
        </div>
      )}
      {showResolutionPrompt && (
        <div className="resolution-prompt">
          <p>Did the AI suggested response solve your issue?</p>
          <button onClick={() => handleResolution(true)} className="resolve-button">Yes, close ticket</button>
          <button onClick={() => handleResolution(false)} className="pending-button">No, keep pending</button>
        </div>
      )}
      {/* Ticket Status Check Section */}
      <div className="check-ticket-section">
        <h3>Check Ticket Status</h3>
        <form onSubmit={handleCheckTicket} className="form-card">
          <div className="form-group">
            <label htmlFor="check-ticket-number">Enter Ticket Number:</label>
            <input
              type="text"
              id="check-ticket-number"
              value={checkTicketNumber}
              onChange={e => setCheckTicketNumber(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="submit-button">Check Status</button>
        </form>
        {checkError && <p className="error-message">{checkError}</p>}
        {checkedTicket && (
          <div className="ticket-info-card">
            <h3>Ticket Information</h3>
            <p><strong>Ticket Number:</strong> {checkedTicket.ticket_number}</p>
            <p><strong>Status:</strong> {checkedTicket.status}</p>
            <p><strong>Subject:</strong> {checkedTicket.subject}</p>
            <p><strong>Description:</strong> {checkedTicket.description}</p>
            <p><strong>Created:</strong> {new Date(checkedTicket.created_at).toLocaleString()}</p>
            {checkedTicket.summary && <p><strong>AI Summary:</strong> {checkedTicket.summary}</p>}
            {checkedTicket.suggested_response && <p><strong>AI Suggested Response:</strong> {checkedTicket.suggested_response}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserComplaintForm;
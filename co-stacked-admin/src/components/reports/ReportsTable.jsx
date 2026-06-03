// src/components/reports/ReportsTable.jsx

import { useState } from 'react';
import styles from './ReportsTable.module.css'; 
import { Badge } from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { updateReportStatus, addReportMessage } from '../../features/reports/reportsSlice';
import PropTypes from 'prop-types';

export const ReportsTable = ({ reports }) => {
  const dispatch = useDispatch();
  const [selectedReport, setSelectedReport] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const adminUser = useSelector(state => state.auth.user);

  const handleUpdateStatus = (reportId, status) => {
    if (window.confirm(`Are you sure you want to mark this report as ${status}?`)) {
      dispatch(updateReportStatus({ reportId, status }));
      if (selectedReport && selectedReport._id === reportId) {
        if (status === 'dismissed') setSelectedReport(null);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedReport) return;
    setSending(true);
    try {
      await dispatch(addReportMessage({ reportId: selectedReport._id, content: message })).unwrap();
      setMessage('');
      
      // Update the local selectedReport's messages optimally so the modal rerenders correctly without closing
      const updatedMessages = [
        ...selectedReport.messages, 
        { 
          _id: Date.now().toString(), // temp ID
          sender: adminUser, 
          senderModel: 'Admin', 
          content: message, 
          createdAt: new Date().toISOString() 
        }
      ];
      setSelectedReport({ ...selectedReport, messages: updatedMessages });
    } catch (err) {
      alert(err);
    } finally {
      setSending(false);
    }
  };

  const getReportedItemInfo = (report) => {
    if (report.reportedProject) {
      return {
        type: 'Project',
        name: report.reportedProject.title || '[Deleted Project]',
        url: `http://localhost:5173/projects/${report.reportedProject._id}`,
      };
    }
    if (report.reportedUser) {
      return {
        type: 'User',
        name: report.reportedUser.name || '[Deleted User]',
        url: `http://localhost:5173/users/${report.reportedUser._id}`,
      };
    }
    return {
      type: 'Support Ticket',
      name: report.reason,
      url: null,
    };
  };

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Type</th>
              <th>Reason / Details</th>
              <th>Reported By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => {
              const reportedItem = getReportedItemInfo(report);
              return (
                <tr key={report._id}>
                  <td data-label="Status">
                     <Badge text={report.status.toUpperCase()} />
                  </td>
                  <td data-label="Type">{reportedItem.type}</td>
                  <td data-label="Reason / Details" className={styles.commentCell}>
                    <strong>{reportedItem.type === 'Support Ticket' ? report.reason : reportedItem.name}</strong><br/>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {report.comment ? (report.comment.length > 50 ? report.comment.substring(0, 50) + '...' : report.comment) : 'No comment'}
                    </span>
                  </td>
                  <td data-label="Reported By">
                    {report.reporter?.name || '[Deleted User]'}
                  </td>
                  <td data-label="Date">{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</td>
                  <td data-label="Actions" className={styles.actionsCell}>
                    <button 
                      onClick={() => setSelectedReport(report)}
                      style={{ background: '#4f46e5', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}
                    >
                      View / Reply
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TICKET DETAILS MODAL */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', width: '90%', maxWidth: '600px', borderRadius: '8px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Ticket #{selectedReport._id.slice(-6).toUpperCase()}</h3>
              <button onClick={() => setSelectedReport(null)} style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', background: '#f9f9f9' }}>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
                 <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Original Report / Request</p>
                 <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                   <strong>From:</strong> {selectedReport.reporter?.name} ({selectedReport.reporter?.email})
                 </p>
                 <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                   <strong>Reason:</strong> {selectedReport.reason}
                 </p>
                 <p style={{ margin: 0, fontSize: '0.9rem' }}>
                   {selectedReport.comment || 'No additional details provided.'}
                 </p>
              </div>

              {/* Messages Iteration */}
              {selectedReport.messages && selectedReport.messages.length > 0 ? (
                selectedReport.messages.map((msg, i) => {
                  const isAdmin = msg.senderModel === 'Admin' || (msg.sender && msg.sender.role === 'admin') || (msg.sender && msg.sender.isAdmin);
                  return (
                    <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>
                        {msg.sender?.name || 'Unknown'} • {formatDistanceToNow(new Date(msg.createdAt))} ago
                      </div>
                      <div style={{ 
                        background: isAdmin ? '#ebf4ff' : 'white', 
                        border: '1px solid',
                        borderColor: isAdmin ? '#bfdbfe' : '#ddd',
                        padding: '0.75rem 1rem', 
                        borderRadius: '8px', 
                        maxWidth: '85%',
                        fontSize: '0.9rem'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>No replies yet. Send a message to the user below.</p>
              )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid #ccc', background: 'white' }}>
              {selectedReport.status === 'resolved' || selectedReport.status === 'dismissed' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>This ticket is marked as <strong>{selectedReport.status}</strong>.</p>
                  <button onClick={() => handleUpdateStatus(selectedReport._id, 'open')} style={{ border: '1px solid #ccc', background: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Reopen Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a response to the user..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', fontFamily: 'inherit' }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div>
                      <button type="button" onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')} style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}>
                        Mark Resolved
                      </button>
                      <button type="button" onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')} style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Dismiss
                      </button>
                    </div>
                    <button type="submit" disabled={sending} style={{ background: '#4f46e5', color: 'white', padding: '0.5rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ReportsTable.propTypes = {
  reports: PropTypes.array.isRequired,
};
// src/components/reports/ReportsTable.jsx

import styles from './ReportsTable.module.css'; 
import { Badge } from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { useDispatch } from 'react-redux';
import { updateReportStatus } from '../../features/reports/reportsSlice';
import PropTypes from 'prop-types';

export const ReportsTable = ({ reports }) => {
  const dispatch = useDispatch();

  const handleUpdateStatus = (reportId, status) => {
    if (window.confirm(`Are you sure you want to mark this report as ${status}?`)) {
      dispatch(updateReportStatus({ reportId, status }));
    }
  };

  const getReportedItemInfo = (report) => {
    // --- Added null checks to prevent crashes ---
    if (report.reportedProject) {
      return {
        type: 'Project',
        name: report.reportedProject.title || '[Deleted Project]',
        // Using a placeholder URL for now, adjust as needed for your user-frontend routing
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
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item / Subject</th>
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
                <td data-label="Item / Subject">
                  {reportedItem.url ? (
                    <a href={reportedItem.url} target="_blank" rel="noopener noreferrer" className={styles.itemNameLink}>
                      {reportedItem.name}
                    </a>
                  ) : (
                    <span>{reportedItem.name}</span>
                  )}
                </td>
                <td data-label="Type"><Badge text={reportedItem.type} /></td>
                <td data-label="Reason / Details" className={styles.commentCell}>
                  {reportedItem.type === 'Support Ticket' ? report.comment : report.reason}
                </td>
                <td data-label="Reported By">
                  {/* --- THIS IS THE FIX --- */}
                  {/* Use optional chaining to safely access the name and provide a fallback */}
                  {report.reporter?.name || '[Deleted User]'}
                </td>
                <td data-label="Date">{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</td>
                <td data-label="Actions" className={styles.actionsCell}>
                  <button onClick={() => handleUpdateStatus(report._id, 'resolved')}>
                    Resolve
                  </button>
                  <button onClick={() => handleUpdateStatus(report._id, 'dismissed')} className={styles.dismissBtn}>
                    Dismiss
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

ReportsTable.propTypes = {
  reports: PropTypes.array.isRequired,
};
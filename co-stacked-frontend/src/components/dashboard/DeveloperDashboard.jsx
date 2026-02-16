// src/components/dashboard/DeveloperDashboard.jsx

import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { deleteInterest } from "../../features/interests/interestsSlice";
import { acceptConnectionRequest, removeOrCancelConnection } from "../../features/connections/connectionsSlice";
import styles from "../../pages/DashboardPage.module.css";
import { Card } from "../shared/Card";
import { ProjectCard } from "../shared/ProjectCard";
import { ConnectionRequestCard } from "../connections/ConnectionRequestCard";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { Search, Send, UserPlus, Star } from "lucide-react";
import { ProfileCompletionBadge } from "../profile/ProfileCompletionBadge";
import PropTypes from "prop-types";

const StatCard = ({ title, value, description, Icon, to }) => {
  const cardContent = (
    <Card className={styles.statCardContent}>
      <div className={styles.statHeader}>
        <h3 className={styles.statCardTitle}>{title}</h3>
        <Icon size={16} color="var(--muted-foreground)" />
      </div>
      <p className={styles.statValue}>{value}</p>
      {description && <p className={styles.statDescription}>{description}</p>}
    </Card>
  );
  if (to) { return <Link to={to} className={styles.statCardLink}>{cardContent}</Link>; }
  return cardContent;
};

/**
 * The main UI component for the Developer's dashboard view.
 */
export const DeveloperDashboard = ({
  currentUser,
  sentItems = [],
  developerReviews = [],
  pendingConnections = [], // Accept the new prop with a default value
}) => {
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      // This is now generic and can handle both connection types
      dispatch(deleteInterest(itemToDelete._id));
    }
    setIsModalOpen(false);
    setItemToDelete(null);
  };

  // Handlers for incoming connection requests
  const handleAccept = (requesterId) => {
    dispatch(acceptConnectionRequest(requesterId));
  };
  const handleDecline = (requesterId) => {
    dispatch(removeOrCancelConnection(requesterId));
  };

  const approvedProjectInterests = sentItems.filter((i) => i.status === "approved");

  return (
    <>
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Cut Connection"
        message={`Are you sure you want to end this collaboration? This action cannot be undone.`}
        confirmText="Yes, Cut Connection"
        isDestructive={true}
      />

      <div className={styles.dashboardHeader}>
        <h2 className={styles.title}>Developer Dashboard</h2>
        <ProfileCompletionBadge />
      </div>

      <div className={styles.grid}>
        <StatCard to="/projects" title="Discover Projects" value="Browse Latest" Icon={Search} />
        <StatCard to="/my-applications" title="My Applications" value={sentItems.length} description="Project interests sent" Icon={Send} />
        <StatCard to="/my-network" title="My Network" value={`${pendingConnections.length} New`} description="Connection requests" Icon={UserPlus} />
        <StatCard to="/profile" title="Your Reviews" value={developerReviews.length} description="Total feedback received" Icon={Star} />
      </div>

      {/* --- NEW: Incoming Connection Requests Section --- */}
      {pendingConnections.length > 0 && (
        <>
          <div className={styles.separator} />
          <h3 className={styles.title}>Incoming Connection Requests</h3>
          <div className={styles.grid}>
            {pendingConnections.map((request) => (
              <ConnectionRequestCard
                key={request._id}
                request={request}
                onAccept={() => handleAccept(request.requester._id)}
                onDecline={() => handleDecline(request.requester._id)}
              />
            ))}
          </div>
        </>
      )}

      {/* --- Active Project Collaborations Section --- */}
      {approvedProjectInterests.length > 0 && (
        <>
          <div className={styles.separator} />
          <h3 className={styles.title}>Your Active Project Collaborations</h3>
          <div className={styles.grid}>
            {approvedProjectInterests.map((connection) => {
              const project = connection.projectId;
              return project ? (
                <div key={connection._id}>
                  <ProjectCard project={project} connection={connection} />
                </div>
              ) : null;
            })}
          </div>
        </>
      )}

      <div className={styles.separator} />
      <h3 className={styles.title}>Quick Actions</h3>
      <div className={styles.grid}>
        <Card className={styles.quickActionCard}><Link to="/profile">Update Your Profile</Link><p>Keep your skills and bio fresh.</p></Card>
        <Card className={styles.quickActionCard}><Link to="/settings">Manage Settings</Link><p>Adjust your notifications and visibility.</p></Card>
      </div>
    </>
  );
};

DeveloperDashboard.propTypes = {
  currentUser: PropTypes.object.isRequired,
  sentItems: PropTypes.array,
  developerReviews: PropTypes.array,
  pendingConnections: PropTypes.array, // Add the new prop type
};
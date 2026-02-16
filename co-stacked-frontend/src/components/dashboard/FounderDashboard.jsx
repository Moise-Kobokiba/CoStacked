// src/components/dashboard/FounderDashboard.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteInterest } from '../../features/interests/interestsSlice';
import { acceptConnectionRequest, removeOrCancelConnection } from '../../features/connections/connectionsSlice';
import styles from '../../pages/DashboardPage.module.css';

// Import all necessary UI Components
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { InterestRequestCard } from '../shared/InterestRequestCard';
import { ConnectionRequestCard } from '../connections/ConnectionRequestCard';
import { BoostModal } from '../billing/BoostModal';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import { ConnectionCard } from './ConnectionCard';
import { Bell, Briefcase, MessageSquare, Search, Rocket, UserPlus } from 'lucide-react';
import { ProfileCompletionBadge } from "../profile/ProfileCompletionBadge";
import PropTypes from 'prop-types';

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

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

/**
 * The main UI component for the Founder's dashboard view.
 */
export const FounderDashboard = ({ 
  currentUser, 
  interests = [], 
  userProjects = [], 
  pendingConnections = [] 
}) => {
  const dispatch = useDispatch();
  
  const [isBoostModalOpen, setBoostModalOpen] = useState(false);
  const [projectToBoost, setProjectToBoost] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState(null);

  const handleBoostClick = (project) => { setProjectToBoost(project); setBoostModalOpen(true); };
  const handleDisconnectClick = (connection) => { setConnectionToDelete(connection); setIsDeleteModalOpen(true); };
  const confirmDisconnect = () => {
    if (connectionToDelete) {
      dispatch(deleteInterest(connectionToDelete._id));
    }
    setIsDeleteModalOpen(false);
    setConnectionToDelete(null);
  };

  // Handlers for incoming direct connection requests
  const handleAccept = (requesterId) => {
    dispatch(acceptConnectionRequest(requesterId));
  };
  const handleDecline = (requesterId) => {
    dispatch(removeOrCancelConnection(requesterId));
  };
  
  const incomingInterests = interests.filter(i => i.status === "pending");
  const approvedConnections = interests.filter(i => i.status === "approved");

  return (
    <>
      <BoostModal project={projectToBoost} open={isBoostModalOpen} onClose={() => setBoostModalOpen(false)} />
      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDisconnect}
        title="Cut Connection"
        message={`Are you sure you want to end the collaboration with "${connectionToDelete?.senderId.name}"? This action cannot be undone.`}
        confirmText="Yes, Cut Connection"
        isDestructive={true}
      />
      
      <div className={styles.dashboardHeader}>
        <h2 className={styles.title}>Founder Dashboard</h2>
        <ProfileCompletionBadge />
      </div>
      
      <div className={styles.grid}>
        <StatCard to="/requests" title="Project Interests" value={`${incomingInterests.length} New`} Icon={Bell} />
        <StatCard to="/my-projects" title="My Projects" value={`${userProjects.length} Active`} Icon={Briefcase} />
        <StatCard to="/my-network" title="My Network" value={`${pendingConnections.length} New`} description="Connection requests" Icon={UserPlus} />
        <StatCard to="/users" title="Find Talent" value="Search Now" Icon={Search} />
      </div>
      
      {/* --- Section for direct connection requests --- */}
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

      {/* --- Section for project-specific interest requests --- */}
      {incomingInterests.length > 0 && (
        <>
          <div className={styles.separator} />
          <h3 className={styles.title}>Incoming Project Interests</h3>
          <div className={styles.grid}>
            {incomingInterests.map(interest => <InterestRequestCard key={interest._id} interest={interest} viewerRole="founder"/>)}
          </div>
        </>
      )}

      {approvedConnections.length > 0 && (
        <>
          <div className={styles.separator} />
          <h3 className={styles.title}>Your Active Collaborations</h3>
          <div className={styles.grid}>
            {approvedConnections.map(connection => (
              <ConnectionCard 
                key={connection._id}
                connection={connection}
                onDisconnect={() => handleDisconnectClick(connection)}
              />
            ))}
          </div>
        </>
      )}

      {userProjects.length > 0 && (
        <>
          <div className={styles.separator} />
          <h3 className={styles.title}>Your Projects</h3>
          <div className={styles.projectList}>
            {userProjects.map(project => {
              const isBoostedActive = project.isBoosted && new Date(project.boostExpiresAt) > new Date();
              return (
                <Card key={project._id} className={styles.projectCard}>
                  <div>
                    <p className={styles.projectTitle}>{project.title}</p>
                    {isBoostedActive ? ( <p className={styles.boostStatus}><Rocket size={14} /> Boosted until {formatDate(project.boostExpiresAt)}</p> ) : ( <p className={styles.projectStatus}>Status: Live</p> )}
                  </div>
                  <div className={styles.projectActions}>
                    <Button variant="secondary" to={`/projects/edit/${project._id}`}>Manage</Button>
                    <Button variant="primary" onClick={() => handleBoostClick(project)}>Boost Project</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

       <div className={styles.separator} />
       <h3 className={styles.title}>Quick Actions</h3>
       <div className={styles.grid}>
           <Card className={styles.quickActionCard}><Link to="/post-project">Post a New Project</Link><p>Share your next big idea.</p></Card>
           <Card className={styles.quickActionCard}><Link to="/profile">Update Your Profile</Link><p>Keep your bio and details fresh.</p></Card>
           <Card className={styles.quickActionCard}><Link to="/users">Discover Developers</Link><p>Find talent for your projects.</p></Card>
       </div>
    </>
  );
};

FounderDashboard.propTypes = {
  currentUser: PropTypes.object.isRequired,
  interests: PropTypes.array,
  userProjects: PropTypes.array,
  pendingConnections: PropTypes.array,
};
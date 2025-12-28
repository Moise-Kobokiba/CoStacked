// src/pages/ProjectDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Import all necessary Redux actions
import { sendInterestRequest, fetchSentInterests } from '../features/interests/interestsSlice';
import { fetchProjects } from '../features/projects/projectsSlice';
import { submitReport } from '../features/reports/reportsSlice';

// Import all necessary UI Components
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Tag } from '../components/shared/Tag';
import { ConnectNDAModal } from '../components/connect/ConnectNDAModal';
import { ReportModal } from '../components/reports/ReportModal';
import { VerificationBadge } from '../components/shared/VerificationBadge';
import styles from './ProjectDetailPage.module.css';

const LoadingSpinner = () => <div className={styles.loader}>Loading project details...</div>;

export const ProjectDetailPage = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();

  // Local state for controlling all modals on this page
  const [isNdaModalOpen, setNdaModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  // Get all live data from the Redux store
  const { user: currentUser } = useSelector(state => state.auth);
  const { items: projects, status: projectsStatus } = useSelector(state => state.projects);
  const { status: interestStatus, sentItems } = useSelector(state => state.interests);
  
  const project = projects.find(p => p._id === projectId);

  // Effect to fetch projects if they are not already in the state
  useEffect(() => {
    if (projectsStatus === 'idle') {
      dispatch(fetchProjects());
    }
  }, [projectsStatus, dispatch]);

  // Effect to fetch sent interests to check connection status
  useEffect(() => {
    if (currentUser?.role === 'developer') {
      dispatch(fetchSentInterests());
    }
  }, [currentUser, dispatch]);

  const existingInterest = sentItems.find(i => 
    (i.projectId._id || i.projectId) === projectId
  );

  // --- Handlers for user actions ---
  const handleConnectClick = () => {
    if (!currentUser) {
      alert("Please log in or sign up to connect with projects.");
      return;
    }
    setNdaModalOpen(true);
  };

  const handleConfirmNda = async () => {
    setNdaModalOpen(false);
    const resultAction = await dispatch(sendInterestRequest(projectId));

    if (sendInterestRequest.fulfilled.match(resultAction)) {
      alert("Success! Your interest has been sent to the founder.");
    } else {
      alert(`Error: ${resultAction.payload || 'An unknown error occurred.'}`);
    }
  };

  const handleSubmitReport = async (reportData) => {
    const payload = {
      type: 'project',
      reportedId: projectId,
      ...reportData
    };
    const resultAction = await dispatch(submitReport(payload));
    
    setReportModalOpen(false); // Close modal after submission
    
    if (submitReport.fulfilled.match(resultAction)) {
      alert(resultAction.payload.message);
    } else {
      alert(`Error submitting report: ${resultAction.payload}`);
    }
  };
  
  // --- Conditional Rendering for Loading/Not Found states ---
  if (projectsStatus === 'loading' || projectsStatus === 'idle') {
    return (
      <div className={styles.pageContainer}>
        <LoadingSpinner />
      </div>
    );
  }
  if (projectsStatus === 'succeeded' && !project) {
    return (
      <div className={styles.pageContainer}><div className={styles.contentWrapper}><h1>Project Not Found</h1><p>This project may have been removed.</p><Link to="/projects">← Back to all projects</Link></div></div>
    );
  }

  // Derived state for button visibility
  const isFounderOfProject = project && currentUser && project.founderId === currentUser._id;
  const canConnect = currentUser && currentUser.role === 'developer' && !isFounderOfProject;

  let connectButton = null;

  if (canConnect) {
    if (existingInterest) {
      if (existingInterest.status === 'approved') {
        connectButton = <Button disabled className={styles.connectedButton}>Connected</Button>; // Could link to chat
      } else if (existingInterest.status === 'pending') {
         connectButton = <Button disabled>Request Sent</Button>;
      } else { // rejected
         connectButton = <Button disabled>Not Selected</Button>;
      }
    } else {
      connectButton = (
        <Button onClick={handleConnectClick} disabled={interestStatus === 'loading'}>
          {interestStatus === 'loading' ? 'Sending...' : 'Connect'}
        </Button>
      );
    }
  }

  return (
    <>
      <ConnectNDAModal open={isNdaModalOpen} onClose={() => setNdaModalOpen(false)} onConfirm={handleConfirmNda} />
      <ReportModal 
        open={isReportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleSubmitReport}
        itemType="Project"
        itemName={project?.title}
      />

      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.actions}>
             <Link to="/projects">← Back to Projects</Link>
          </div>
          <Card className={styles.projectCard}>
            <header className={styles.header}>
              <h1>{project.title}</h1>
              {connectButton}
            </header>

            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>
                <h2 className={styles.sectionTitle}>Project Description</h2>
                <p>{project.description}</p>
                <h2 className={styles.sectionTitle}>Skills Needed</h2>
                <div className={styles.skillsContainer}>
                  {project.skillsNeeded.map(skill => <Tag key={skill}>{skill}</Tag>)}
                </div>
              </div>
              <aside className={styles.detailsSidebar}>
                <ul>
                  <li className={styles.detailItem}><strong>Compensation</strong><span>{project.compensation}</span></li>
                  <li className={styles.detailItem}><strong>Stage</strong><span>{project.stage}</span></li>
                  <li className={styles.detailItem}>
                    <strong>Founder</strong>
                    <span>
                      {project.founder}
                      {project.founderId?.isVerified && <VerificationBadge size={14} className={styles.badge} />}
                    </span>
                  </li>
                  <li className={styles.detailItem}><strong>Location</strong><span>{project.location}</span></li>
                </ul>
              </aside>
            </div>
            
            <footer className={styles.footer}>
              {currentUser && !isFounderOfProject && (
                <button className={styles.reportButton} onClick={() => setReportModalOpen(true)}>
                  Report this project
                </button>
              )}
            </footer>
          </Card>
        </div>
      </div>
    </>
  );
};
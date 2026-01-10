// src/pages/ProjectDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Import all necessary Redux actions
import { sendInterestRequest, fetchSentInterests } from '../features/interests/interestsSlice';
import { fetchProjects } from '../features/projects/projectsSlice';
import { submitReport } from '../features/reports/reportsSlice';

// Import all necessary UI Components
import { Button } from '../components/shared/Button';
import { Tag } from '../components/shared/Tag';
import { ConnectNDAModal } from '../components/connect/ConnectNDAModal';
import { ReportModal } from '../components/reports/ReportModal';
import styles from './ProjectDetailPage.module.css';
import { ArrowLeft } from 'lucide-react';

const LoadingSpinner = () => <div className={styles.loader}>Loading project details...</div>;

export const ProjectDetailPage = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();

  const [isNdaModalOpen, setNdaModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  const { user: currentUser } = useSelector(state => state.auth);
  const { items: projects, status: projectsStatus } = useSelector(state => state.projects);
  const { sentItems, status: interestStatus } = useSelector(state => state.interests);
  
  const project = projects.find(p => p._id === projectId);

  useEffect(() => {
    if (projectsStatus === 'idle') {
      dispatch(fetchProjects());
    }
    // Fetch sent interests for developers to check connection status
    if (currentUser?.role === 'developer') {
      dispatch(fetchSentInterests());
    }
  }, [projectsStatus, currentUser?.role, dispatch]);

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
    const payload = { type: 'project', reportedId: projectId, ...reportData };
    const resultAction = await dispatch(submitReport(payload));
    
    setReportModalOpen(false);
    
    if (submitReport.fulfilled.match(resultAction)) {
      alert(resultAction.payload.message);
    } else {
      alert(`Error submitting report: ${resultAction.payload}`);
    }
  };

  if (projectsStatus === 'loading' || (projectsStatus === 'idle' && !project)) {
    return <div className={styles.pageContainer}><LoadingSpinner /></div>;
  }
  
  if (!project) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <h1>Project Not Found</h1>
          <Link to="/projects" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isFounderOfProject = project && currentUser && project.founderId === currentUser._id;
  const canConnect = currentUser && currentUser.role === 'developer' && !isFounderOfProject;

  // Check if developer has already sent an interest for this project
  const existingInterest = sentItems.find(interest => interest.projectId === projectId);
  const interestStatusText = existingInterest ? existingInterest.status : null;

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
          <Link to="/projects" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
          
          <div className={styles.projectCard}>
            
             <header className={styles.header}>
               <h1 className={styles.title}>{project.title}</h1>
               {canConnect && (
                 <Button
                   onClick={handleConnectClick}
                   disabled={interestStatus === 'loading' || interestStatusText === 'pending' || interestStatusText === 'approved'}
                 >
                   {interestStatus === 'loading' ? 'Sending...' :
                    interestStatusText === 'pending' ? 'Request Sent' :
                    interestStatusText === 'approved' ? 'Connected' :
                    'Connect'}
                 </Button>
               )}
             </header>

            <hr className={styles.separator} />
            
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Project Description</h2>
                  <p>{project.description}</p>
                </div>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Skills Needed</h2>
                  <div className={styles.skillsContainer}>
                    {project.skillsNeeded.map(skill => <Tag key={skill}>{skill}</Tag>)}
                  </div>
                </div>
              </div>

              {/* --- THIS IS THE UPDATED JSX STRUCTURE --- */}
              <aside className={styles.detailsSidebar}>
                <div className={styles.detailItem}>
                  <strong>Compensation</strong>
                  <span>{project.compensation}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Stage</strong>
                  <span>{project.stage}</span>
                </div>
                 <div className={styles.detailItem}>
                  <strong>Founder</strong>
                  <span>{project.founder}</span>
                </div>
                 <div className={styles.detailItem}>
                  <strong>Location</strong>
                  <span>{project.location}</span>
                </div>
              </aside>
            </div>
            
            <footer className={styles.footer}>
              {currentUser && !isFounderOfProject && (
                <button className={styles.reportButton} onClick={() => setReportModalOpen(true)}>
                  Report this project
                </button>
              )}
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};
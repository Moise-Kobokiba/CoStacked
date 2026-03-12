import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Redux actions
import { sendInterestRequest, fetchSentInterests } from '../features/interests/interestsSlice';
import { fetchProjects } from '../features/projects/projectsSlice';
import { submitReport } from '../features/reports/reportsSlice';

// UI Components
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
    if (currentUser?.role === 'developer') {
      dispatch(fetchSentInterests());
    }
  }, [projectsStatus, currentUser?.role, dispatch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser?.role === 'developer') {
        dispatch(fetchSentInterests());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser?.role, dispatch]);

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
  const existingInterest = sentItems.find(interest => interest.projectId?._id === projectId);
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
            
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              Home &gt; Projects &gt; {project.title}
            </div>

            {/* Header with title and connect button */}
            <div className={styles.header}>
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
            </div>

            {/* Optional tagline */}
            {project.tagline && <p className={styles.tagline}>{project.tagline}</p>}

            {/* Metadata bar (compensation, stage, founder, location) */}
            <div className={styles.metadata}>
              <div className={styles.metadataItem}>
                <strong>Compensation</strong>
                <span>{project.compensation}</span>
              </div>
              <div className={styles.metadataItem}>
                <strong>Stage</strong>
                <span>{project.stage}</span>
              </div>
              <div className={styles.metadataItem}>
                <strong>Founder</strong>
                <span>{project.founder}</span>
              </div>
              <div className={styles.metadataItem}>
                <strong>Location</strong>
                <span>{project.location}</span>
              </div>
            </div>

            <hr className={styles.separator} />

            {/* About section (uses description) */}
            <section className={styles.section}>
              <h2>About the Project</h2>
              <p>{project.description}</p>
            </section>

            {/* Problem section (optional) */}
            {project.problem && (
              <section className={styles.section}>
                <h2>The Problem</h2>
                <p>{project.problem}</p>
              </section>
            )}

            {/* Solution section (optional) */}
            {project.solution && (
              <section className={styles.section}>
                <h2>Our Solution</h2>
                <p>{project.solution}</p>
              </section>
            )}

            {/* Roles Needed (optional) */}
            {project.rolesNeeded && project.rolesNeeded.length > 0 && (
              <section className={styles.section}>
                <h2>Roles Needed</h2>
                <div className={styles.rolesList}>
                  {project.rolesNeeded.map((role, idx) => (
                    <div key={idx} className={styles.roleItem}>
                      <h3>{role.name}</h3>
                      <p>{role.description}</p>
                      <div className={styles.roleSkills}>
                        {role.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Team section (optional) */}
            {project.team && project.team.length > 0 && (
              <section className={styles.section}>
                <h2>The Team</h2>
                <div className={styles.teamList}>
                  {project.team.map((member, idx) => (
                    <div key={idx} className={styles.teamMember}>
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Original Skills Needed (always shown if present) */}
            {project.skillsNeeded && project.skillsNeeded.length > 0 && (
              <section className={styles.section}>
                <h2>Skills Needed</h2>
                <div className={styles.skillsContainer}>
                  {project.skillsNeeded.map(skill => <Tag key={skill}>{skill}</Tag>)}
                </div>
              </section>
            )}

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
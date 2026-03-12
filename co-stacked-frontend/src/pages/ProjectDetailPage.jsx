import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { sendInterestRequest, fetchSentInterests } from '../features/interests/interestsSlice';
import { fetchProjects } from '../features/projects/projectsSlice';
import { submitReport } from '../features/reports/reportsSlice';
import { Button } from '../components/shared/Button';
import { Tag } from '../components/shared/Tag';
import { ConnectNDAModal } from '../components/connect/ConnectNDAModal';
import { ReportModal } from '../components/reports/ReportModal';
import styles from './ProjectDetailPage.module.css';
import { ArrowLeft, Users, Zap, Clock, MapPin, BarChart3 } from 'lucide-react';

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
    if (projectsStatus === 'idle') dispatch(fetchProjects());
    if (currentUser?.role === 'developer') dispatch(fetchSentInterests());
  }, [projectsStatus, currentUser?.role, dispatch]);

  const handleConnectClick = () => {
    if (!currentUser) { alert("Please log in to connect."); return; }
    setNdaModalOpen(true);
  };

  const handleConfirmNda = async () => {
    setNdaModalOpen(false);
    await dispatch(sendInterestRequest(projectId));
  };

  const handleSubmitReport = async (reportData) => {
    const payload = { type: 'project', reportedId: projectId, ...reportData };
    await dispatch(submitReport(payload));
    setReportModalOpen(false);
  };

  if (projectsStatus === 'loading' || !project) return <div className={styles.pageContainer}><LoadingSpinner /></div>;

  const isFounderOfProject = project && currentUser && project.founderId === currentUser._id;
  const canConnect = currentUser && currentUser.role === 'developer' && !isFounderOfProject;
  const existingInterest = sentItems.find(interest => interest.projectId?._id === projectId);
  const interestStatusText = existingInterest ? existingInterest.status : null;

  return (
    <>
      <ConnectNDAModal open={isNdaModalOpen} onClose={() => setNdaModalOpen(false)} onConfirm={handleConfirmNda} />
      <ReportModal open={isReportModalOpen} onClose={() => setReportModalOpen(false)} onSubmit={handleSubmitReport} itemType="Project" itemName={project?.title} />

      <div className={styles.pageContainer}>
        {/* Navigation */}
        <div className={styles.navContainer}>
          <Link to="/projects" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>

        {/* Hero Banner Section */}
        <div className={styles.heroBanner} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${project.heroImage || '/api/placeholder/1200/400'})` }}>
          <div className={styles.heroContent}>
            <div className={styles.badges}>
              <span className={styles.statusBadge}>{project.stage || 'Active'}</span>
              <span className={styles.phaseBadge}>MVP Phase</span>
            </div>
            <h1 className={styles.heroTitle}>{project.title}</h1>
            <p className={styles.heroSubtitle}>{project.tagline || project.description.substring(0, 100) + '...'}</p>
          </div>
          <div className={styles.heroActions}>
             {canConnect && (
                <button className={styles.joinButton} onClick={handleConnectClick}>
                   <Users size={18} /> Request to Join
                </button>
             )}
          </div>
        </div>

        {/* Content Tabs Header (Visual Only) */}
        <div className={styles.tabBar}>
          <button className={styles.activeTab}>Overview</button>
          <button className={styles.tab}>Roles Needed</button>
          <button className={styles.tab}>Team</button>
          <button className={styles.tab}>Updates</button>
        </div>

        <div className={styles.contentGrid}>
          {/* Main Info */}
          <main className={styles.mainContent}>
            <div className={styles.projectSection}>
              <h2 className={styles.sectionHeading}>About the Project</h2>
              <p>{project.description}</p>
            </div>

            {/* Dynamic Stats Row */}
            <div className={styles.statsStrip}>
              <div className={styles.statBox}>
                <span className={styles.statVal}>4.2k</span>
                <span className={styles.statLab}>Impact Metric</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>120+</span>
                <span className={styles.statLab}>Active Users</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>98%</span>
                <span className={styles.statLab}>Uptime</span>
              </div>
            </div>

            <div className={styles.projectSection}>
              <h2 className={styles.sectionHeading}>Our Solution</h2>
              <div className={styles.skillsContainer}>
                {project.skillsNeeded.map(skill => <Tag key={skill}>{skill}</Tag>)}
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className={styles.sideContent}>
            {/* Project Stats Card */}
            <div className={styles.sideCard}>
              <div className={styles.cardHeader}>
                <h3>Project Stats</h3>
                <BarChart3 size={16} />
              </div>
              <div className={styles.sideList}>
                <div className={styles.sideListItem}>
                  <span className={styles.sideLabel}>Industry</span>
                  <span className={styles.sideValue}>Sustainability</span>
                </div>
                <div className={styles.sideListItem}>
                  <span className={styles.sideLabel}>Location</span>
                  <span className={styles.sideValue}>{project.location}</span>
                </div>
                <div className={styles.sideListItem}>
                   <span className={styles.sideLabel}>Compensation</span>
                   <span className={styles.sideValue}>{project.compensation}</span>
                </div>
              </div>
              
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                   <span>Completion</span>
                   <span>45%</span>
                </div>
                <div className={styles.progressBar}><div className={styles.progressFill} style={{width: '45%'}}></div></div>
              </div>

              <Button 
                className={styles.primaryApplyBtn} 
                onClick={handleConnectClick}
                disabled={interestStatusText === 'pending' || interestStatusText === 'approved'}
              >
                {interestStatusText === 'pending' ? 'Request Sent' : 'Apply to Team'}
              </Button>
              <button className={styles.secondaryBtn}>Contact Founder</button>
            </div>

            {/* Team Section */}
            <div className={styles.sideCard}>
              <div className={styles.cardHeader}>
                <h3>The Team</h3>
                <span className={styles.memberCount}>3 Members</span>
              </div>
              <div className={styles.teamList}>
                <div className={styles.teamMember}>
                  <div className={styles.avatar}></div>
                  <div>
                    <p className={styles.memberName}>{project.founder || 'Lead Founder'}</p>
                    <p className={styles.memberRole}>Founder & CEO</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
        
        <footer className={styles.footer}>
           <button className={styles.reportButton} onClick={() => setReportModalOpen(true)}>Report Project</button>
        </footer>
      </div>
    </>
  );
};

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
import { ArrowLeft, MapPin, Briefcase, Clock, Users, ShieldAlert } from 'lucide-react';

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
    if (!currentUser) return alert("Please log in to connect.");
    setNdaModalOpen(true);
  };

  const handleConfirmNda = async () => {
    setNdaModalOpen(false);
    const resultAction = await dispatch(sendInterestRequest(projectId));
    if (sendInterestRequest.fulfilled.match(resultAction)) alert("Success! Interest sent.");
  };

  if (projectsStatus === 'loading' || !project) return <div className={styles.loader}>Loading...</div>;

  const isFounderOfProject = project && currentUser && project.founderId === currentUser._id;
  const canConnect = currentUser && currentUser.role === 'developer' && !isFounderOfProject;
  const existingInterest = sentItems.find(i => i.projectId?._id === projectId);
  const interestStatusText = existingInterest ? existingInterest.status : null;

  return (
    <div className={styles.pageContainer}>
      <ConnectNDAModal open={isNdaModalOpen} onClose={() => setNdaModalOpen(false)} onConfirm={handleConfirmNda} />
      <ReportModal open={isReportModalOpen} onClose={() => setReportModalOpen(false)} onSubmit={(data) => dispatch(submitReport(data))} itemType="Project" itemName={project.title} />

      {/* Hero Section */}
      <div className={styles.heroWrapper}>
        <div className={styles.heroBanner}>
          <img src={project.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuAbTIXetbVsHe9qPqHjtWWDb-HqDAIwxsgBkjuTmVO5GD2ziH96oV4NljOk8_gWcUtEu1e1Im6k3q00gJx--s-6jYItj_wncZlbWczyaM218KKMfI_tmIM3KlD6YKqRIYB9LjcujmFb2aZcReJ5MqMB81R-bL4IUAoFbgNaU3AcWr2ueictaz4l6c3Vy_kPR9T_DJI_KbRD5UvmeHeSHhApqLdWyC_fhP0MjIl-Q2FNqOd6PXFFQ7EwalwieII4Tft5dIqXEx8gbLw"} alt="Project Cover" className={styles.coverImg} />
          <div className={styles.heroOverlay}>
            <div className={styles.heroText}>
              <div className={styles.badgeRow}>
                <span className={styles.statusBadge}>Active</span>
                <span className={styles.phaseBadge}>{project.stage || "MVP Phase"}</span>
              </div>
              <h1 className={styles.heroTitle}>{project.title}</h1>
              <p className={styles.heroTagline}>{project.tagline || "Building a sustainable future through innovation."}</p>
            </div>
            {canConnect && (
              <Button onClick={handleConnectClick} className={styles.heroButton} disabled={interestStatus === 'loading' || interestStatusText === 'pending' || interestStatusText === 'approved'}>
                {interestStatusText === 'pending' ? 'Request Sent' : interestStatusText === 'approved' ? 'Connected' : 'Request to Join'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbNav}>
          <Link to="/">Home</Link> <ArrowLeft size={12} className={styles.chevron} /> 
          <Link to="/projects">Projects</Link> <ArrowLeft size={12} className={styles.chevron} /> 
          <span className={styles.activeBreadcrumb}>{project.title}</span>
        </nav>

        <div className={styles.mainGrid}>
          {/* Main Content */}
          <div className={styles.leftColumn}>
            <section className={styles.contentSection}>
              <h2 className={styles.sectionHeading}>About the Project</h2>
              <p className={styles.description}>{project.description}</p>
              
              {/* Performance Stats */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}><strong>4.2k</strong><span>Kg Recycled</span></div>
                <div className={styles.metricItem}><strong>120+</strong><span>Active Users</span></div>
                <div className={styles.metricItem}><strong>12</strong><span>Smart Bins</span></div>
                <div className={styles.metricItem}><strong>98%</strong><span>Uptime</span></div>
              </div>
            </section>
            
            <section className={styles.contentSection}>
              <h2 className={styles.sectionHeading}>Skills Needed</h2>
              <div className={styles.tagCloud}>
                {project.skillsNeeded?.map(skill => <Tag key={skill}>{skill}</Tag>)}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.cardHeader}>
                <div><p className={styles.smallLabel}>PROJECT STATS</p><p className={styles.tinyMuted}>Updated 2 days ago</p></div>
              </div>
              <div className={styles.infoRow}><span>Industry</span><strong>{project.industry || "CleanTech"}</strong></div>
              <div className={styles.infoRow}><span>Location</span><strong>{project.location}</strong></div>
              <div className={styles.progressArea}>
                <div className={styles.progressLabel}><span>Completion</span><span>{project.completion || 45}%</span></div>
                <div className={styles.progressBar}><div style={{ width: `${project.completion || 45}%` }} /></div>
              </div>
              <Button className={styles.sidebarAction}>Apply to Team</Button>
            </div>

            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>The Team</h3>
              <div className={styles.teamList}>
                <div className={styles.member}>
                  <div className={styles.avatar}>{project.founder?.charAt(0)}</div>
                  <div><p className={styles.memberName}>{project.founder}</p><p className={styles.memberRole}>Founder & CEO</p></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

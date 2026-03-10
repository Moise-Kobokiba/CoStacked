import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { sendInterestRequest, fetchSentInterests } from '../features/interests/interestsSlice';
import { fetchProjects } from '../features/projects/projectsSlice';
import { Button } from '../components/shared/Button';
import { Tag } from '../components/shared/Tag';
import { ConnectNDAModal } from '../components/connect/ConnectNDAModal';
import styles from './ProjectDetailPage.module.css';
import { ArrowLeft, CheckCircle2, AlertCircle, Globe, Lightbulb } from 'lucide-react';

export const ProjectDetailPage = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const [isNdaModalOpen, setNdaModalOpen] = useState(false);

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
    await dispatch(sendInterestRequest(projectId));
  };

  if (projectsStatus === 'loading' || !project) return <div className={styles.loader}>Loading...</div>;

  const existingInterest = sentItems.find(i => i.projectId?._id === projectId);
  const interestStatusText = existingInterest ? existingInterest.status : null;

  return (
    <div className={styles.pageContainer}>
      <ConnectNDAModal open={isNdaModalOpen} onClose={() => setNdaModalOpen(false)} onConfirm={handleConfirmNda} />

      {/* Hero Section */}
      <div className={styles.heroBanner}>
        <img src={project.coverImage || "/api/placeholder/1200/400"} alt="Cover" className={styles.coverImg} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.statusBadge}>Live Project</span>
              <span className={styles.phaseBadge}>{project.stage || "Beta"}</span>
            </div>
            <h1 className={styles.heroTitle}>{project.title}</h1>
            <p className={styles.heroTagline}>{project.tagline}</p>
          </div>
          <Button onClick={handleConnectClick} className={styles.heroButton} disabled={interestStatusText === 'pending' || interestStatusText === 'approved'}>
            {interestStatusText === 'pending' ? 'Request Sent' : interestStatusText === 'approved' ? 'Connected' : 'Apply to Join'}
          </Button>
        </div>
      </div>

      <div className={styles.layoutWrapper}>
        <nav className={styles.breadcrumb}>
          <Link to="/projects">Projects</Link> <span>/</span> <span className={styles.activePath}>{project.title}</span>
        </nav>

        <div className={styles.contentGrid}>
          {/* Main Content Area */}
          <main className={styles.mainContent}>
            <section className={styles.cardSection}>
              <h2 className={styles.sectionTitle}><Globe size={20}/> About the Project</h2>
              <p className={styles.textBody}>{project.description}</p>
              
              <div className={styles.metricsStrip}>
                <div className={styles.metricCard}><strong>4.2k KG</strong><span>Recycled</span></div>
                <div className={styles.metricCard}><strong>120+</strong><span>Active Users</span></div>
                <div className={styles.metricCard}><strong>12</strong><span>Smart Bins</span></div>
                <div className={styles.metricCard}><strong>98%</strong><span>Uptime</span></div>
              </div>
            </section>

            <section className={styles.cardSection}>
              <h2 className={styles.sectionTitle}><AlertCircle size={20}/> The Problem</h2>
              <p className={styles.textBody}>In many developing cities, over 60% of waste is either dumped or illegally incinerated. Current centralized systems lack the transparency and public participation required for a truly circular economy.</p>
            </section>

            <section className={styles.cardSection}>
              <h2 className={styles.sectionTitle}><Lightbulb size={20}/> Our Solution</h2>
              <ul className={styles.solutionList}>
                <li><CheckCircle2 size={18} className={styles.checkIcon}/> Smart Bin Sensors for real-time fill level detection.</li>
                <li><CheckCircle2 size={18} className={styles.checkIcon}/> Mobile app to track your personal recycling footprint.</li>
                <li><CheckCircle2 size={18} className={styles.checkIcon}/> Web3-based 'EcoCredits' for validated recycling.</li>
              </ul>
            </section>
          </main>

          {/* Sidebar Area */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarWidget}>
              <h3 className={styles.widgetTitle}>Roles Needed</h3>
              <div className={styles.roleBox}>
                <strong>Blockchain Developer</strong>
                <p>Build smart contracts for reward distribution.</p>
              </div>
              <div className={styles.roleBox}>
                <strong>UI/UX Designer</strong>
                <p>Design intuitive dashboards for household users.</p>
              </div>
            </div>

            <div className={styles.sidebarWidget}>
              <h3 className={styles.widgetTitle}>The Team</h3>
              <div className={styles.teamList}>
                {['David Miller', 'Sarah Chen', 'Marcus James'].map((name, i) => (
                  <div key={name} className={styles.teamMember}>
                    <div className={styles.miniAvatar}>{name[0]}</div>
                    <div>
                      <p className={styles.memberName}>{name}</p>
                      <p className={styles.memberRole}>{i === 0 ? 'Founder' : i === 1 ? 'Tech Lead' : 'Full Stack'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

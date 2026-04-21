// src/pages/HomePage.jsx
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchProjects } from '../features/projects/projectsSlice';
import { fetchUsers } from '../features/users/usersSlice';

import { Button } from '../components/shared/Button';
import { FeatureCard } from '../components/shared/FeatureCard';
import { ProjectCard } from '../components/shared/ProjectCard';
import { UserCard } from '../components/shared/UserCard';
import { Carousel } from '../components/shared/Carousel';
import { 
  Lightbulb, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Architecture,
  CloudOff,
  RebaseEdit,
  AccountTree,
  VerifiedUser,
  RuleFolder,
  Groups3,
  Inventory2,
  Hub,
  IdCard,
  DeveloperBoard,
  HistoryEdu,
  Shield
} from 'lucide-react';

import heroLight from '../assets/hero-light.png';
import heroDark from '../assets/hero-dark.png';
import styles from './HomePage.module.css';

// Feature data for "How CoStacked Works" - kept for compatibility but hidden in new design
// We'll integrate it into the "Execution Layer" section

export const HomePage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
  const { token } = useSelector((state) => state.auth);
  const isLoggedIn = !!token;

  const { items: allProjects = [] } = useSelector((state) => state.projects || {});
  const { items: allUsers = [] } = useSelector((state) => state.users || {});

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchProjects());
      dispatch(fetchUsers());
    }
  }, [dispatch, isLoggedIn]);

  const { featuredProjects, latestProjects, featuredUsers, latestUsers } = useMemo(() => {
    if (!isLoggedIn) return { featuredProjects: [], latestProjects: [], featuredUsers: [], latestUsers: [] };
    const now = new Date();

    const sortedProjects = [...allProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fProjects = sortedProjects.filter(p => p.isBoosted && new Date(p.boostExpiresAt) > now);
    const lProjects = sortedProjects.filter(p => !p.isBoosted || new Date(p.boostExpiresAt) <= now).slice(0, 4);

    const sortedUsers = [...allUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fUsers = sortedUsers.filter(u => u.isBoosted && new Date(u.boostExpiresAt) > now);
    const lUsers = sortedUsers.filter(u => !u.isBoosted || new Date(u.boostExpiresAt) <= now).slice(0, 4);

    return { featuredProjects: fProjects, latestProjects: lProjects, featuredUsers: fUsers, latestUsers: lUsers };
  }, [allProjects, allUsers, isLoggedIn]);

  const heroBgImage = theme === 'light' ? heroLight : heroDark;

  return (
    <div className={styles.pageContainer} data-theme={theme}>
      {/* Hero Section - Redesigned */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Architecture size={16} />
              <span>OS V2.0 NOW LIVE</span>
            </div>
            <h1 className={styles.heroTitle}>
              Build startups with <span>structure</span>, not randomness.
            </h1>
            <p className={styles.heroDescription}>
              CoStacked connects founders and developers through verified profiles, structured collaboration, 
              and execution-focused workflows so real startups get built the right way.
            </p>
            <div className={styles.heroActions}>
              <Button to="/projects" variant="primary" className={styles.primaryBtn}>
                Discover Projects
              </Button>
              {!isLoggedIn && (
                <Button to="/signup" variant="outline" className={styles.secondaryBtn}>
                  Join the Community
                </Button>
              )}
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroImageWrapper}>
              <img src={heroBgImage} alt="CoStacked Platform Preview" />
            </div>
            <div className={styles.glowOrb1} />
            <div className={styles.glowOrb2} />
          </div>
        </div>
      </section>

      {/* Logged-in Dashboard Sections */}
      {isLoggedIn && (
        <div className={styles.loggedInContent}>
          {featuredProjects.length > 0 && (
            <div className={styles.dashboardSection}>
              <h2 className={styles.dashboardTitle}>Featured Projects</h2>
              <Carousel>
                {featuredProjects.map(p => <ProjectCard key={p._id} project={p} />)}
              </Carousel>
            </div>
          )}

          {featuredUsers.length > 0 && (
            <div className={styles.dashboardSection}>
              <h2 className={styles.dashboardTitle}>Featured Talent</h2>
              <Carousel>
                {featuredUsers.map(u => <UserCard key={u._id} user={u} />)}
              </Carousel>
            </div>
          )}

          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.dashboardTitle}>Latest Projects</h2>
              <Link to="/projects" className={styles.seeAll}>
                See all <ArrowRight size={16} />
              </Link>
            </div>
            <div className={styles.contentGrid}>
              {latestProjects.map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          </div>

          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.dashboardTitle}>Newest Talent</h2>
              <Link to="/users" className={styles.seeAll}>
                See all <ArrowRight size={16} />
              </Link>
            </div>
            <div className={styles.contentGrid}>
              {latestUsers.map(u => <UserCard key={u._id} user={u} />)}
            </div>
          </div>
        </div>
      )}

      {/* Chaos into Architecture Section */}
      <section className={styles.transformationSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCentered}>
            <span className={styles.sectionLabel}>The Transformation</span>
            <h2 className={styles.sectionTitleLarge}>Chaos into Architecture.</h2>
          </div>
          <div className={styles.phaseGrid}>
            <div className={styles.phaseCard}>
              <div className={styles.phaseIcon}><CloudOff size={32} /></div>
              <h3>Idea Chaos</h3>
              <p>Disjointed documents, unverified assumptions, and "finding a tech co-founder" guesswork.</p>
            </div>
            <div className={`${styles.phaseCard} ${styles.phaseCardActive}`}>
              <div className={`${styles.phaseIcon} ${styles.activeIcon}`}><RebaseEdit size={32} /></div>
              <h3>Structured Execution</h3>
              <p>Automated workflows for formation, technical audits, and role-based access control for teams.</p>
            </div>
            <div className={styles.phaseCard}>
              <div className={styles.phaseIcon}><AccountTree size={32} /></div>
              <h3>Real Startup Build</h3>
              <p>A verified company structure, code in the repo, and a team aligned by the CoStacked Ledger.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Misalignment Section */}
      <section className={styles.misalignmentSection}>
        <div className={styles.container}>
          <div className={styles.misalignmentGrid}>
            <div className={styles.misalignmentContent}>
              <h2 className={styles.misalignmentTitle}>
                Startups fail because of <span>misalignment</span>, not lack of effort.
              </h2>
              <p className={styles.misalignmentText}>
                Most "matching" sites stop at the handshake. CoStacked is an operating system that governs 
                the build from Day 0, preventing the common pitfalls of early-stage formation.
              </p>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <VerifiedUser size={24} />
                  <div>
                    <h4>Identity Verification</h4>
                    <p>Every builder goes through a structural audit. No ghost profiles, no unverified claims.</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <RuleFolder size={24} />
                  <div>
                    <h4>Formation Protocol</h4>
                    <p>Automated legal and equity foundations so you build on solid ground, not verbal promises.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.misalignmentVisual}>
              <div className={styles.statCard}>
                <div className={styles.statPulse} />
                <span className={styles.statLabel}>System Status</span>
                <div className={styles.statValue}>
                  <span>142</span> Startups formed properly this month.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Execution Layer Bento Grid */}
      <section className={styles.executionSection}>
        <div className={styles.container}>
          <div className={styles.executionHeader}>
            <div>
              <span className={styles.sectionLabel}>The Execution Layer</span>
              <h2 className={styles.sectionTitleLarge}>Everything you need to execute.</h2>
            </div>
            <Button to="/methodology" variant="outline" className={styles.exploreBtn}>
              Explore Modules <ArrowRight size={16} />
            </Button>
          </div>
          <div className={styles.bentoGrid}>
            <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <Groups3 size={40} />
              <h3>Structured Team Formation</h3>
              <p>Don't just "find" people. Form teams based on complementary skill matrices and verified performance benchmarks.</p>
              <div className={styles.teamBadge}>
                <span>Team-building Logic Applied</span>
              </div>
            </div>
            <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <Inventory2 size={40} />
              <h3>Idea Validation Engine</h3>
              <p>A systematic approach to stress-testing your concept. Move from "it might work" to "data says build" in 72 hours.</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '75%' }} />
                <div className={styles.progressLabels}>
                  <span>MARKET FIT SCORE</span>
                  <span>75%</span>
                </div>
              </div>
            </div>
            <div className={`${styles.bentoCard} ${styles.bentoFull}`}>
              <div className={styles.collabContent}>
                <div>
                  <Hub size={40} />
                  <h3>Collaborative Building OS</h3>
                  <p>A central ledger that tracks contributions, governs decision-making, and manages the shared technical roadmap.</p>
                </div>
                <div className={styles.collabPreview} />
              </div>
            </div>
            <div className={`${styles.bentoCard} ${styles.bentoHighlight}`}>
              <h3>The Result?</h3>
              <p>Startups that survive the formation phase and achieve investor readiness faster.</p>
              <Button to="/signup" variant="primary" className={styles.resultBtn}>
                Start Executing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Network Section */}
      <section className={styles.networkSection}>
        <div className={styles.container}>
          <div className={styles.networkHeader}>
            <h2 className={styles.networkTitle}>Not a marketplace. A network of verified operators.</h2>
            <p className={styles.networkSubtitle}>
              We distance ourselves from gig-economy platforms. On CoStacked, you are not a freelancer; 
              you are a structural component of a new company.
            </p>
          </div>
          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <IdCard size={32} />
              <h4>Biometric KYC</h4>
              <p>Zero-trust identity layer ensures you are building with real humans.</p>
            </div>
            <div className={styles.trustCard}>
              <DeveloperBoard size={32} />
              <h4>Code-base Audit</h4>
              <p>Technical profiles are verified through direct repo analysis and PR history.</p>
            </div>
            <div className={styles.trustCard}>
              <HistoryEdu size={32} />
              <h4>Role Fidelity</h4>
              <p>Roles are strictly defined by the OS to prevent scope creep and skill mismatch.</p>
            </div>
            <div className={styles.trustCard}>
              <Shield size={32} />
              <h4>IP Escrow</h4>
              <p>Built-in governance for Intellectual Property as it's created.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to build <span>properly?</span></h2>
          <p className={styles.ctaText}>Stop browsing for people. Start executing with a system designed for startup formation.</p>
          <Button to="/signup" variant="primary" size="large" className={styles.ctaButton}>
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};
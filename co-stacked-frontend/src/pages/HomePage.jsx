import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchProjects } from '../features/projects/projectsSlice';
import { fetchUsers } from '../features/users/usersSlice';

import { Button } from '../components/shared/Button';
import { ProjectCard } from '../components/shared/ProjectCard';
import { UserCard } from '../components/shared/UserCard';
import { Carousel } from '../components/shared/Carousel';
import { ArrowRight, Architecture, CloudOff, RebaseEdit, AccountTree, VerifiedUser, RuleFolder, Groups, Inventory, Hub, IdCard, DeveloperBoard, HistoryEdu, Shield } from 'lucide-react';

import heroImg from '../assets/hero-illustration.png'; // Update with your new dashboard asset
import styles from './HomePage.module.css';

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

  // Data processing for Logged-In view
  const { featuredProjects, latestProjects, featuredUsers, latestUsers } = useMemo(() => {
    if (!isLoggedIn) return { featuredProjects: [], latestProjects: [], featuredUsers: [], latestUsers: [] };
    const now = new Date();
    const sortedProjects = [...allProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const sortedUsers = [...allUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      featuredProjects: sortedProjects.filter(p => p.isBoosted && new Date(p.boostExpiresAt) > now),
      latestProjects: sortedProjects.filter(p => !p.isBoosted).slice(0, 4),
      featuredUsers: sortedUsers.filter(u => u.isBoosted && new Date(u.boostExpiresAt) > now),
      latestUsers: sortedUsers.filter(u => !u.isBoosted).slice(0, 4)
    };
  }, [allProjects, allUsers, isLoggedIn]);

  return (
    <div className={styles.pageContainer} data-theme={theme}>
      
      {/* --- HERO SECTION --- */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <div className={styles.badge}>
                <Architecture size={14} />
                <span>OS V2.0 Now Live</span>
              </div>
              <h1 className={styles.heroTitle}>
                Build startups with <span className={styles.italicBlue}>structure</span>, not randomness.
              </h1>
              <p className={styles.heroSubtitle}>
                CoStacked connects founders and developers through verified profiles, structured collaboration, and execution-focused workflows.
              </p>
              <div className={styles.heroActions}>
                <Button to="/projects" variant="primary">Discover Projects</Button>
                {!isLoggedIn && <Button to="/signup" variant="outline">Join the Community</Button>}
              </div>
            </div>
            <div className={styles.heroImageWrapper}>
              <img src={heroImg} alt="Platform Dashboard" className={styles.heroImage} />
            </div>
          </div>
        </div>
      </section>

      {/* --- DASHBOARD (Logged In Only) --- */}
      {isLoggedIn && (
        <div className={styles.dashboardContent}>
           {/* Re-using your existing logic for Projects/Talent */}
           {featuredProjects.length > 0 && (
            <section className={styles.dashboardSection}>
              <h2 className={styles.sectionHeading}>Featured Projects</h2>
              <Carousel>{featuredProjects.map(p => <ProjectCard key={p._id} project={p} />)}</Carousel>
            </section>
          )}
          {/* ... (Keep your existing Latest Projects/Talent loops here) */}
        </div>
      )}

      {/* --- TRANSFORMATION SECTION --- */}
      <section className={styles.transformationSection}>
        <div className={styles.container}>
          <div className={styles.textCenter}>
            <span className={styles.sectionLabel}>The Transformation</span>
            <h2 className={styles.sectionTitle}>Chaos into Architecture.</h2>
          </div>
          <div className={styles.transformationGrid}>
            <div className={styles.transformCard}>
              <div className={styles.iconCircle}><CloudOff /></div>
              <div className={styles.cardContent}>
                <h3>Idea Chaos</h3>
                <p>Disjointed documents and "finding a tech co-founder" guesswork.</p>
              </div>
            </div>
            <div className={`${styles.transformCard} ${styles.activeCard}`}>
              <div className={styles.iconCircleLarge}><RebaseEdit /></div>
              <div className={styles.cardContent}>
                <h3>Structured Execution</h3>
                <p>Automated workflows for formation and technical audits.</p>
              </div>
            </div>
            <div className={styles.transformCard}>
              <div className={styles.iconCircleTertiary}><AccountTree /></div>
              <div className={styles.cardContent}>
                <h3>Real Startup Build</h3>
                <p>A verified company structure and team aligned by the Ledger.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MISALIGNMENT SECTION --- */}
      <section className={styles.standardPadding}>
        <div className={styles.container}>
          <div className={styles.splitGrid}>
            <div>
              <h2 className={styles.sectionTitleLarge}>
                Startups fail because of <span className={styles.textError}>misalignment</span>, not lack of effort.
              </h2>
              <p className={styles.descriptionText}>
                CoStacked is an operating system that governs the build from Day 0, preventing common pitfalls.
              </p>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <div className={styles.smallIcon}><VerifiedUser /></div>
                  <div>
                    <h4>Identity Verification</h4>
                    <p>Every builder goes through a structural audit. No ghost profiles.</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.smallIcon}><RuleFolder /></div>
                  <div>
                    <h4>Formation Protocol</h4>
                    <p>Automated legal foundations so you build on solid ground.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.imageOverlayContainer}>
               <div className={styles.statusBadge}>
                  <span className={styles.pulse}></span>
                  <p>142 Startups formed properly this month.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2 className={styles.ctaHeading}>Ready to build <span className={styles.blueText}>properly?</span></h2>
          <p>Stop browsing for people. Start executing with a system designed for formation.</p>
          <div className={styles.ctaGroup}>
            <Button to="/signup" variant="primary">Get Started Now</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

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
import { Lightbulb, Users, ShieldCheck, ArrowRight, Zap, Target } from 'lucide-react';

import heroLight from '../assets/hero-light.png';
import heroDark from '../assets/hero-dark.png';
import styles from './HomePage.module.css';

const features = [
  { icon: Lightbulb, title: '1. Share Your Vision', description: 'Founders post structured project listings that include required skills, expected commitment, compensation type, and project stage.' },
  { icon: Users, title: '2. Discover Your Match', description: 'Developers browse open projects and apply directly, while founders filter collaborators by skills, availability, and experience.' },
  { icon: ShieldCheck, title: '3. Collaborate & Build', description: 'Once connected, teams collaborate independently using their own tools, with CoStacked acting as the discovery and trust layer.' },
];

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
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.topBadge}>
            <Zap size={14} className={styles.badgeIcon} /> 
            <span>The Startup Operating System</span>
          </div>
          <h1 className={styles.heroTitle}>
            Build startups with <span className={styles.accentText}>structure</span>, not randomness.
          </h1>
          <p className={styles.heroSubtitle}>
            CoStacked is the platform where ambitious founders and talented developers unite to build the future through verified alignment.
          </p>
          <div className={styles.heroActions}>
            <Button to="/projects" variant="primary">Discover Projects</Button>
            {!isLoggedIn && (
              <Button to="/signup" variant="outline" className={styles.joinCommunityBtn}>
                Join the Community
              </Button>
            )}
          </div>
        </div>
        <div className={styles.heroIllustration}>
          <img src={heroBgImage} alt="CoStacked Interface" />
        </div>
      </section>

      {/* Logged In Dashboard */}
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

          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.dashboardTitle}>Latest Projects</h2>
              <Link to="/projects" className={styles.seeAll}>See all <ArrowRight size={16}/></Link>
            </div>
            <div className={styles.contentGrid}>
              {latestProjects.map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* Workflow Section */}
      <section className={styles.workflowSection}>
        <div className={styles.centeredHeader}>
          <span className={styles.workflowLabel}>The Methodology</span>
          <h2 className={styles.sectionTitle}>Chaos into Architecture.</h2>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaHeading}>Ready to build properly?</h2>
          <p className={styles.ctaText}>Stop browsing for people. Start executing with a system designed for startup formation.</p>
          <Button to="/signup" variant="primary">Get Started Now</Button>
        </div>
      </section>
    </div>
  );
};
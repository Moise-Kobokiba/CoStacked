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
import { Lightbulb, Users, ShieldCheck, ArrowRight } from 'lucide-react';

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
  const { theme } = useTheme(); // This is critical for Dark Mode
  
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
    /* We add a data-theme attribute here so CSS can react to Dark Mode */
    <div className={styles.pageContainer} data-theme={theme}>
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Connect, Collaborate, Create. <br /> 
            <span>Your Next Project Starts Here.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            CoStacked is the platform where ambitious founders and talented developers unite to build the future.
          </p>
          <div className={styles.heroActions}>
            <Button to="/projects" variant="primary">Discover Projects</Button>
            {!isLoggedIn && <Button to="/signup" variant="outline" className={styles.joinCommunityBtn}>Join the Community</Button>}
          </div>
        </div>
        <div className={styles.heroIllustration}>
          <img src={heroBgImage} alt="Preview" />
        </div>
      </section>

      {/* Logged In Dashboard - RE-INTEGRATED CONTENT */}
      {isLoggedIn && (
        <div className={styles.loggedInContent}>
          
          {/* 1. Featured Projects */}
          {featuredProjects.length > 0 && (
            <div className={styles.dashboardSection}>
              <h2 className={styles.dashboardTitle}>Featured Projects</h2>
              <Carousel>
                {featuredProjects.map(p => <ProjectCard key={p._id} project={p} />)}
              </Carousel>
            </div>
          )}

          {/* 2. Featured Talent */}
          {featuredUsers.length > 0 && (
            <div className={styles.dashboardSection}>
              <h2 className={styles.dashboardTitle}>Featured Talent</h2>
              <Carousel>
                {featuredUsers.map(u => <UserCard key={u._id} user={u} />)}
              </Carousel>
            </div>
          )}

          {/* 3. Latest Projects */}
          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.dashboardTitle}>Latest Projects</h2>
              <Link to="/projects" className={styles.seeAll}>See all <ArrowRight size={16}/></Link>
            </div>
            <div className={styles.contentGrid}>
              {latestProjects.map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          </div>

          {/* 4. Latest Talent */}
          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.dashboardTitle}>Newest Talent</h2>
              <Link to="/users" className={styles.seeAll}>See all <ArrowRight size={16}/></Link>
            </div>
            <div className={styles.contentGrid}>
              {latestUsers.map(u => <UserCard key={u._id} user={u} />)}
            </div>
          </div>
        </div>
      )}

      {/* Workflow Section */}
      <section className={styles.workflowSection}>
        <span className={styles.workflowLabel}>The Workflow</span>
        <h2 className={styles.sectionTitle}>How CoStacked Works</h2>
        <div className={styles.featuresGrid}>
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2>Ready to build the future?</h2>
          <Button to="/signup" variant="primary">Get Started Now</Button>
        </div>
      </section>
    </div>
  );
};

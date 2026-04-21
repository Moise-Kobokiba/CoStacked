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
import { Lightbulb, Users, ShieldCheck, ArrowRight, Architecture, Zap, BarChart3 } from 'lucide-react';

import heroLight from '../assets/hero-light.png';
import heroDark from '../assets/hero-dark.png';
import styles from './HomePage.module.css';

const features = [
  { icon: Lightbulb, title: '1. Share Your Vision', description: 'Founders post structured project listings that include required skills, expected commitment, and compensation type.' },
  { icon: Users, title: '2. Discover Your Match', description: 'Developers browse open projects and apply directly, while founders filter collaborators by skills and experience.' },
  { icon: ShieldCheck, title: '3. Collaborate & Build', description: 'Once connected, teams collaborate using their own tools, with CoStacked acting as the trust layer.' },
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
      
      {/* Structural Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Zap size={14} className={styles.badgeIcon} />
            <span>Connect. Collaborate. Create.</span>
          </div>
          <h1 className={styles.heroTitle}>
            Build startups with <span className={styles.italicText}>structure</span>, not randomness.
          </h1>
          <p className={styles.heroSubtitle}>
            CoStacked is the platform where ambitious founders and talented developers unite to build the future. Your next project starts here.
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
          <img src={heroBgImage} alt="CoStacked Blueprint Interface" />
        </div>
      </section>

      {/* Methodology Section (Refined Workflow) */}
      <section className={styles.workflowSection}>
        <div className={styles.centeredHeader}>
          <span className={styles.workflowLabel}>The Methodology</span>
          <h2 className={styles.sectionTitle}>Chaos into Architecture.</h2>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* Dashboard Content (Only for Logged In) */}
      {isLoggedIn && (
        <div className={styles.loggedInContent}>
          {/* Featured Sections (Projects & Talent) */}
          {[
            { title: 'Featured Projects', data: featuredProjects, Comp: ProjectCard },
            { title: 'Featured Talent', data: featuredUsers, Comp: UserCard }
          ].map(section => section.data.length > 0 && (
            <div key={section.title} className={styles.dashboardSection}>
              <h2 className={styles.dashboardTitle}>{section.title}</h2>
              <Carousel>
                {section.data.map(item => <section.Comp key={item._id} {...{ [section.Comp === ProjectCard ? 'project' : 'user']: item }} />)}
              </Carousel>
            </div>
          ))}

          {/* Grid Sections (Latest) */}
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

      {/* Final Call to Action */}
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
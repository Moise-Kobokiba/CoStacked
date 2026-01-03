// src/pages/HomePage.jsx

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchProjects } from '../features/projects/projectsSlice';
import { fetchUsers } from '../features/users/usersSlice';

// Import components
import { Button } from '../components/shared/Button';
import { FeatureCard } from '../components/shared/FeatureCard';
import { ProjectCard } from '../components/shared/ProjectCard';
import { UserCard } from '../components/shared/UserCard';
import { Carousel } from '../components/shared/Carousel';
import { Lightbulb, Users, ShieldCheck, ArrowRight } from 'lucide-react';

// Import assets and styles
import heroLight from '../assets/hero-light.jpg';
import heroDark from '../assets/hero-dark.png';
import styles from './HomePage.module.css';

// Data can remain outside the component
const features = [
  { icon: Lightbulb, title: '1. Share Your Vision', description: 'Founders post structured project listings that include required skills, expected commitment, compensation type, and project stage.' },
  { icon: Users, title: '2. Discover Your Match', description: 'Developers browse open projects and apply directly, while founders filter collaborators by skills, availability, and experience.' },
  { icon: ShieldCheck, title: '3. Collaborate & Build', description: 'Once connected, teams collaborate independently using their own tools, with CoStacked acting as the discovery and trust layer.' },
];

export const HomePage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
  // Auth state
  const { token } = useSelector((state) => state.auth);
  const isLoggedIn = !!token;

  // Data state
  const { items: allProjects = [] } = useSelector((state) => state.projects || {});
  const { items: allUsers = [] } = useSelector((state) => state.users || {});

  // Fetch data if logged in
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchProjects());
      dispatch(fetchUsers());
    }
  }, [dispatch, isLoggedIn]);

  // Filter and sort logic
  const { featuredProjects, latestProjects, featuredUsers, latestUsers } = useMemo(() => {
    if (!isLoggedIn) return { featuredProjects: [], latestProjects: [], featuredUsers: [], latestUsers: [] };

    const now = new Date();

    // Projects
    const sortedProjects = [...allProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fProjects = sortedProjects.filter(p => p.isBoosted && new Date(p.boostExpiresAt) > now);
    const lProjects = sortedProjects.filter(p => !p.isBoosted || new Date(p.boostExpiresAt) <= now).slice(0, 4);

    // Users
    const sortedUsers = [...allUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fUsers = sortedUsers.filter(u => u.isBoosted && new Date(u.boostExpiresAt) > now);
    const lUsers = sortedUsers.filter(u => !u.isBoosted || new Date(u.boostExpiresAt) <= now).slice(0, 4);

    return { 
      featuredProjects: fProjects, 
      latestProjects: lProjects, 
      featuredUsers: fUsers, 
      latestUsers: lUsers 
    };
  }, [allProjects, allUsers, isLoggedIn]);

  // Conditionally select the correct image source based on the theme
  const heroBgImage = theme === 'light' ? heroLight : heroDark;

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section - Always Visible */}
      <section 
        className={styles.hero} 
        style={{ '--hero-bg-image': `url(${heroBgImage})` }}
      >
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Connect, Collaborate, Create. <br /> Your Next Project Starts Here.
          </h1>
          <p className={styles.heroSubtitle}>
            CoStacked is the platform where ambitious founders and talented developers unite to build the future. Find your perfect match and bring your ideas to life.
          </p>
          <div className={styles.heroActions}>
            <Button to="/projects" variant="primary">Discover Projects</Button>
            {!isLoggedIn && <Button to="/signup" variant="outline">Join the Community</Button>}
          </div>
        </div>
      </section>

      {/* Logged In Content */}
      {isLoggedIn && (
        <div className={styles.loggedInContent}>
          
          {/* Featured Projects */}
          {featuredProjects.length > 0 && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Featured Projects</h2>
              </div>
              <Carousel>
                {featuredProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
              </Carousel>
            </section>
          )}

          {/* Featured Talent */}
          {featuredUsers.length > 0 && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Featured Talent</h2>
              </div>
              <Carousel>
                {featuredUsers.map((user) => <UserCard key={user._id} user={user} />)}
              </Carousel>
            </section>
          )}

          {/* Latest Projects */}
          {latestProjects.length > 0 && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Latest Projects</h2>
                <Link to="/projects" className={styles.seeAllLink}>
                  See All <ArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.grid}>
                {latestProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
              </div>
            </section>
          )}

          {/* Latest Talent */}
          {latestUsers.length > 0 && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Newest Talent</h2>
                <Link to="/users" className={styles.seeAllLink}>
                  See All <ArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.grid}>
                {latestUsers.map((user) => <UserCard key={user._id} user={user} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* How It Works - Always Visible */}
      <section className={styles.howItWorksSection}>
        <h2 className={styles.sectionTitle}>How CoStacked Works</h2>
        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
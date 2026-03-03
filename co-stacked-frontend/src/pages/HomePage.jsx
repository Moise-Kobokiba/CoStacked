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

// Data preserved from original
const features = [
  { icon: Lightbulb, title: '1. Share Your Vision', description: 'Founders post structured project listings that include required skills, expected commitment, compensation type, and project stage.' },
  { icon: Users, title: '2. Discover Your Match', description: 'Developers browse open projects and apply directly, while founders filter collaborators by skills, availability, and experience.' },
  { icon: ShieldCheck, title: '3. Collaborate & Build', description: 'Once connected, teams collaborate independently using their own tools, with CoStacked acting as the discovery and trust layer.' },
];

export const HomePage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
  // Auth state preserved
  const { token } = useSelector((state) => state.auth);
  const isLoggedIn = !!token;

  // Data state preserved
  const { items: allProjects = [] } = useSelector((state) => state.projects || {});
  const { items: allUsers = [] } = useSelector((state) => state.users || {});

  // Fetch data if logged in - logic preserved
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchProjects());
      dispatch(fetchUsers());
    }
  }, [dispatch, isLoggedIn]);

  // Filter and sort logic - logic preserved exactly
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

  // Dark mode image swap logic preserved
  const heroBgImage = theme === 'light' ? heroLight : heroDark;

  return (
    <div className={styles.pageContainer}>
      {/* 1. HERO SECTION - Updated to match image style */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Connect, Collaborate, Create. <br /> 
            <span>Your Next Project Starts Here.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            CoStacked is the platform where ambitious founders and talented developers unite to build the future. Find your perfect match and bring your ideas to life.
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
        
        {/* NEW: Illustration container from image */}
        <div className={styles.heroIllustration}>
          <img src={heroBgImage} alt="CoStacked Platform Preview" />
        </div>
      </section>

      {/* 2. LOGGED IN CONTENT - All sections preserved */}
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

      {/* 3. HOW IT WORKS - Preserved content, updated layout */}
      <section className={styles.howItWorksSection}>
        <span className={styles.workflowLabel}>The Workflow</span>
        <h2 className={styles.sectionTitle}>How CoStacked Works</h2>
        <p className={styles.sectionSubtitle}>Our platform streamlines the journey from idea to execution through three simple steps.</p>
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

      {/* 4. CTA BANNER - New from image */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2>Ready to build the future?</h2>
          <p>Join thousands of founders and developers already collaborating on CoStacked. Your next big idea is one connection away.</p>
          <Button to="/signup" variant="primary">Get Started Now</Button>
        </div>
      </section>
    </div>
  );
};

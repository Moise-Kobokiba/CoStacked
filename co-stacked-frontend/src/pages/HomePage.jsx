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

import heroLight from '../assets/hero-light.jpg'; 
import heroDark from '../assets/hero-dark.png';
import styles from './HomePage.module.css';

const features = [
  { 
    icon: Lightbulb, 
    title: 'Share Your Vision', 
    description: 'Founders post structured project listings to attract the right technical expertise, defining goals, stack, and equity/compensation.',
    linkText: 'Learn more'
  },
  { 
    icon: Users, 
    title: 'Discover Your Match', 
    description: 'Developers browse and apply for roles while founders use advanced filters and reputation scores to find the perfect technical fit.',
    linkText: 'View developers'
  },
  { 
    icon: ShieldCheck, 
    title: 'Collaborate & Build', 
    description: 'Teams collaborate independently while CoStacked acts as a trust layer, providing frameworks for successful project delivery.',
    linkText: 'Start building'
  },
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

  const heroBgImage = theme === 'light' ? heroLight : heroDark;

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
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
              <Button to="/signup" variant="outline" className={styles.secondaryBtn}>
                Join the Community
              </Button>
            )}
          </div>
        </div>
        
        <div className={styles.heroIllustration}>
          <img src={heroBgImage} alt="CoStacked Platform Preview" />
        </div>
      </section>

      {/* Logged In Dashboard Content */}
      {isLoggedIn && (
        <div className={styles.loggedInContent}>
          {/* Featured Sections (Omitted for brevity, keep your existing carousel logic here) */}
        </div>
      )}

      {/* Workflow Section */}
      <section className={styles.workflowSection}>
        <span className={styles.workflowLabel}>The Workflow</span>
        <h2 className={styles.sectionTitle}>How CoStacked Works</h2>
        <p className={styles.sectionSubtitle}>
          Our platform streamlines the journey from idea to execution through three simple steps.
        </p>
        
        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to build the future?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of founders and developers already collaborating on CoStacked. Your next big idea is one connection away.
          </p>
          <Button to="/signup" variant="primary" className={styles.ctaBtn}>
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};

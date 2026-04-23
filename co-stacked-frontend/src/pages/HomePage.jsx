// src/pages/HomePage.jsx
import React, { useEffect, useMemo } from 'react';
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
  { 
    icon: Lightbulb, 
    title: '1. Share Your Vision', 
    description: 'Founders post structured project listings that include required skills, expected commitment, compensation type, and project stage.' 
  },
  { 
    icon: Users, 
    title: '2. Discover Your Match', 
    description: 'Developers browse open projects and apply directly, while founders filter collaborators by skills, availability, and experience.' 
  },
  { 
    icon: ShieldCheck, 
    title: '3. Collaborate & Build', 
    description: 'Once connected, teams collaborate independently using their own tools, with CoStacked acting as the catalyst.' 
  }
];

const HomePage = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  
  // Existing state selectors
  const { user } = useSelector((state) => state.auth);
  const { items: projects, status: projectsStatus } = useSelector((state) => state.projects);
  const { items: users, status: usersStatus } = useSelector((state) => state.users);

  useEffect(() => {
    if (projectsStatus === 'idle') {
      dispatch(fetchProjects());
    }
    if (usersStatus === 'idle') {
      dispatch(fetchUsers());
    }
  }, [projectsStatus, usersStatus, dispatch]);

  const recentProjects = useMemo(() => projects.slice(0, 5), [projects]);
  const featuredDevelopers = useMemo(() => users.filter(u => u.role === 'developer').slice(0, 5), [users]);

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            Welcome to CoStacked
          </div>
          <h1 className={styles.heroTitle}>
            Build the Future, <span className={styles.textHighlight}>Together.</span>
          </h1>
          <p className={styles.heroDescription}>
            Where visionary founders and talented developers unite to turn ideas into scalable realities.
          </p>
          
          <div className={styles.ctaGroup}>
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="primary" size="lg" className={styles.primaryBtn}>
                    Go to Dashboard <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/projects">
                  <Button variant="outline" size="lg" className={styles.secondaryBtn}>
                    Browse Projects
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register?role=founder">
                  <Button variant="primary" size="lg" className={styles.primaryBtn}>
                    Join as Founder
                  </Button>
                </Link>
                <Link to="/register?role=developer">
                  <Button variant="outline" size="lg" className={styles.secondaryBtn}>
                    Join as Developer
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={styles.heroImageWrapper}>
          <div className={styles.imageGlow}></div>
          <img 
            src={theme === 'dark' ? heroDark : heroLight} 
            alt="CoStacked Platform Preview" 
            className={styles.heroImage}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How CoStacked Works</h2>
          <p className={styles.sectionSubtitle}>A streamlined workflow designed for builders and innovators.</p>
        </div>
        
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCardWrapper}>
              <FeatureCard 
                icon={feature.icon} 
                title={feature.title} 
                description={feature.description} 
              />
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Content Sections */}
      <section className={styles.showcaseSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Projects</h2>
          <Link to="/projects" className={styles.viewAllLink}>
            View all projects <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.carouselWrapper}>
          <Carousel items={recentProjects} renderItem={(project) => <ProjectCard key={project.id} project={project} />} />
        </div>
      </section>

      <section className={`${styles.showcaseSection} ${styles.altBackground}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Developers</h2>
          <Link to="/developers" className={styles.viewAllLink}>
            View all developers <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.carouselWrapper}>
          <Carousel items={featuredDevelopers} renderItem={(dev) => <UserCard key={dev.id} user={dev} />} />
        </div>
      </section>

      {/* Footer is assumed to be part of the main Layout component, but if it was here, it stays untouched. */}
    </div>
  );
};

export default HomePage;

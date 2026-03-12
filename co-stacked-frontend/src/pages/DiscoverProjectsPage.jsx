// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/projects/projectsSlice';
import { ProjectCard } from '../components/shared/ProjectCard';
import { Carousel } from '../components/shared/Carousel';
import { CombinedSearchInput } from '../components/shared/CombinedSearchInput';
import styles from './DiscoverProjectsPage.module.css';

const LoadingSpinner = () => <div className={styles.loader}>Loading projects...</div>;
const ErrorDisplay = ({ error }) => <p className={styles.error}>Error: {error}</p>;

export const DiscoverProjectsPage = () => {
  const dispatch = useDispatch();

  // --- THIS IS THE FIX ---
  // We provide a default empty array `{ items: [] }` to the selector.
  // If `state.projects` is undefined for a moment, `allProjects` will be `[]` instead of `undefined`.
  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProjects());
    }
  }, [dispatch, status]);

  // This logic is now safe because `allProjects` is guaranteed to be an array.
  const sortedAndFilteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];
    
    const now = new Date();

    return [...allProjects]
      .sort((a, b) => {
        const aIsBoosted = a.isBoosted && new Date(a.boostExpiresAt) > now;
        const bIsBoosted = b.isBoosted && new Date(b.boostExpiresAt) > now;
        if (aIsBoosted && !bIsBoosted) return -1;
        if (!aIsBoosted && bIsBoosted) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .filter(project => {
        const searchLower = searchQuery.toLowerCase();
        const locationLower = locationQuery.toLowerCase();
        const matchesSearch = project.title.toLowerCase().includes(searchLower) || 
                              (project.skillsNeeded && project.skillsNeeded.some(skill => skill.toLowerCase().includes(searchLower)));
        const matchesLocation = project.location ? project.location.toLowerCase().includes(locationLower) : true;
        return matchesSearch && matchesLocation;
      });
  }, [allProjects, searchQuery, locationQuery]);

  const now = new Date();
  const featuredProjects = sortedAndFilteredProjects.filter(p => p.isBoosted && new Date(p.boostExpiresAt) > now);
  const latestProjects = sortedAndFilteredProjects.filter(p => !p.isBoosted || new Date(p.boostExpiresAt) <= now);

  let content;

  if (status === 'loading' || status === 'idle') {
    content = <LoadingSpinner />;
  } else if (status === 'succeeded') {
    content = (
      <>
        {featuredProjects.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>Featured Projects</h2>
            <Carousel>
              {featuredProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
            </Carousel>
          </section>
        )}
        
        {latestProjects.length > 0 && (
          <section className={styles.latestSection}>
            <h2 className={styles.sectionTitle}>Latest Projects</h2>
            <div className={styles.grid}>
              {latestProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
            </div>
          </section>
        )}
        
        {sortedAndFilteredProjects.length === 0 && (
          <p className={styles.noResults}>No projects found. Be the first to post one!</p>
        )}
      </>
    );
  } else if (status === 'failed') {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Discover Projects</h1>
        <p className={styles.subtitle}>Find your next challenge. Connect with founders and build the future.</p>
        
        <div className={styles.filtersWrapper}>
            <CombinedSearchInput
              searchValue={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.target.value)}
              locationValue={locationQuery}
              onLocationChange={(e) => setLocationQuery(e.target.value)}
              searchPlaceholder="Search by title or skill..."
              locationPlaceholder="e.g., Cape Town, WC or Remote"
            />
        </div>
      </header>

      <main className={styles.mainContent}>
        {content}
      </main>
    </div>
  );
};

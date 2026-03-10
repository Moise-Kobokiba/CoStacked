// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/projects/projectsSlice';
import { ProjectCard } from '../components/shared/ProjectCard';
import { CombinedSearchInput } from '../components/shared/CombinedSearchInput';
import styles from './DiscoverProjectsPage.module.css';

const LoadingSpinner = () => <div className={styles.loader}>Loading projects...</div>;
const ErrorDisplay = ({ error }) => <p className={styles.error}>Error: {error}</p>;

export const DiscoverProjectsPage = () => {
  const dispatch = useDispatch();
  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Stages');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProjects());
    }
  }, [dispatch, status]);

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];

    return [...allProjects]
      .filter(project => {
        // Stage / Equity filter
        let matchesStage = true;
        if (activeFilter !== 'All Stages') {
          if (activeFilter === 'Equity Only') {
            matchesStage = project.compensation?.toLowerCase().includes('equity') ?? false;
          } else {
            matchesStage = project.stage === activeFilter;
          }
        }

        // Search (title or skills)
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          project.title.toLowerCase().includes(searchLower) ||
          (project.skillsNeeded && project.skillsNeeded.some(skill => skill.toLowerCase().includes(searchLower)));

        // Location
        const locationLower = locationQuery.toLowerCase();
        const matchesLocation = project.location ? project.location.toLowerCase().includes(locationLower) : true;

        return matchesStage && matchesSearch && matchesLocation;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allProjects, searchQuery, locationQuery, activeFilter]);

  const stages = ['All Stages', 'Ideation', 'MVP Phase', 'Scaling', 'Fully Funded', 'Equity Only'];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Discover your next big idea</h1>
          <p className={styles.subtitle}>
            Join high-impact projects, connect with visionary founders, and build the future together.
          </p>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <CombinedSearchInput
              searchValue={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.target.value)}
              locationValue={locationQuery}
              onLocationChange={(e) => setLocationQuery(e.target.value)}
              searchPlaceholder="Search by project name, skills, or founders..."
              locationPlaceholder="e.g., Cape Town, WC or Remote"
            />
            <button className={styles.searchBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search Projects
            </button>
          </div>

          <div className={styles.filterPills}>
            <span className={styles.filterLabel}>FILTER BY:</span>
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => setActiveFilter(stage)}
                className={activeFilter === stage ? styles.pillActive : styles.pill}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {status === 'loading' && <LoadingSpinner />}
        {status === 'failed' && <ErrorDisplay error={error} />}
        {status === 'succeeded' && (
          <>
            <div className={styles.grid}>
              {filteredProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
            {filteredProjects.length === 0 && (
              <p className={styles.noResults}>No projects found. Try adjusting your filters.</p>
            )}
            {/* Static pagination – replace with dynamic component later */}
            <div className={styles.pagination}>
              <button className={styles.pageItem}>1</button>
              <button className={styles.pageItem}>2</button>
              <button className={styles.pageItem}>3</button>
              <span className={styles.pageDots}>...</span>
              <button className={styles.pageItem}>12</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
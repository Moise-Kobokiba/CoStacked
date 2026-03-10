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
  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeStage, setActiveStage] = useState('All Stages');

  const stages = ['All Stages', 'Ideation', 'MVP Phase', 'Scaling', 'Fully Funded'];

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProjects());
    }
  }, [dispatch, status]);

  const sortedAndFilteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];
    
    return [...allProjects]
      .filter(project => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = project.title.toLowerCase().includes(searchLower) || 
                              (project.skillsNeeded && project.skillsNeeded.some(skill => skill.toLowerCase().includes(searchLower)));
        
        // Stage Filter Logic
        const matchesStage = activeStage === 'All Stages' || project.stage === activeStage;
        
        return matchesSearch && matchesStage;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allProjects, searchQuery, activeStage]);

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
          <section style={{ marginBottom: '4rem' }}>
            <h2 className={styles.sectionTitle}>Featured Projects</h2>
            <Carousel>
              {featuredProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
            </Carousel>
          </section>
        )}
        
        <section>
          <h2 className={styles.sectionTitle}>Latest Projects</h2>
          <div className={styles.grid}>
            {latestProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
          </div>
        </section>
        
        {sortedAndFilteredProjects.length === 0 && (
          <p className={styles.noResults}>No projects found matching your criteria.</p>
        )}
      </>
    );
  } else if (status === 'failed') {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Discover your next big idea</h1>
        <p className={styles.subtitle}>Join high-impact projects, connect with visionary founders, and build the future together.</p>
        
        <div className={styles.filtersWrapper}>
            <CombinedSearchInput
              searchValue={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.target.value)}
              locationValue={locationQuery}
              onLocationChange={(e) => setLocationQuery(e.target.value)}
              searchPlaceholder="Search by project name, skills, or founders..."
            />
            <button className={styles.searchButton}>Search Projects</button>
        </div>

        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Filter By:</span>
          {stages.map((stage) => (
            <button
              key={stage}
              className={`${styles.filterPill} ${activeStage === stage ? styles.activePill : ''}`}
              onClick={() => setActiveStage(stage)}
            >
              {stage}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.mainContent}>
        {content}
      </main>
    </div>
  );
};

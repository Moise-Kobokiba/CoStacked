import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/projects/projectsSlice';
import { ProjectCard } from '../components/shared/ProjectCard';
import { Search } from 'lucide-react'; // For the search icon
import styles from './DiscoverProjectsPage.module.css';

const LoadingSpinner = () => <div className={styles.loader}>Loading projects...</div>;
const ErrorDisplay = ({ error }) => <p className={styles.error}>Error: {error}</p>;

export const DiscoverProjectsPage = () => {
  const dispatch = useDispatch();
  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState('');
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
        // Filter by stage / equity
        let matchesStage = true;
        if (activeFilter !== 'All Stages') {
          if (activeFilter === 'Equity Only') {
            matchesStage = project.compensation?.toLowerCase().includes('equity') ?? false;
          } else {
            matchesStage = project.stage === activeFilter;
          }
        }

        // Filter by search query (title or skills)
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          project.title.toLowerCase().includes(searchLower) ||
          (project.skillsNeeded && project.skillsNeeded.some(skill => skill.toLowerCase().includes(searchLower)));

        return matchesStage && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allProjects, searchQuery, activeFilter]);

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
            <input
              type="text"
              placeholder="Search by project name, skills, or founders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.searchBtn}>
              <Search size={18} />
              <span>Search Projects</span>
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
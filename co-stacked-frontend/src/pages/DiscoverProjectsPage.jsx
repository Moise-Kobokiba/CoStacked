// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/projects/projectsSlice';
import { DiscoverProjectCard } from '../components/discover/DiscoverProjectCard';
import { Layers, Search, Category, Analytics, GroupAdd, ChevronDown } from 'lucide-react';
import styles from './DiscoverProjectsPage.module.css';

const LoadingSpinner = () => <div className={styles.loader}>Loading projects...</div>;
const ErrorDisplay = ({ error }) => <p className={styles.error}>Error: {error}</p>;

export const DiscoverProjectsPage = () => {
  const dispatch = useDispatch();

  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['All']);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  // Dummy categories and statuses for UI matching
  const CATEGORIES = ['SaaS', 'FinTech', 'AI', 'HealthTech', 'E-commerce', 'Other'];
  const STATUSES = ['Idea Phase', 'Validation Phase', 'MVP Built', 'Seeking Cofounder'];
  const ROLES = ['Developer', 'Designer', 'Marketer', 'PM'];

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProjects());
    }
  }, [dispatch, status]);

  const toggleCategory = (cat) => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
      return;
    }
    const newCats = selectedCategories.filter(c => c !== 'All');
    if (newCats.includes(cat)) {
      const filtered = newCats.filter(c => c !== cat);
      setSelectedCategories(filtered.length === 0 ? ['All'] : filtered);
    } else {
      setSelectedCategories([...newCats, cat]);
    }
  };

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const clearFilters = () => {
    setSelectedCategories(['All']);
    setSelectedStatus('All');
    setSelectedRoles([]);
    setSearchQuery('');
  };

  const sortedAndFilteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];
    
    return [...allProjects]
      .filter(project => {
        // Basic search filtering (title or description)
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = project.title?.toLowerCase().includes(searchLower) || 
                              project.description?.toLowerCase().includes(searchLower);
        
        // Very basic mock filtering for UI demonstration
        const matchesStatus = selectedStatus === 'All' || project.stage === selectedStatus;
        
        // Roles needed mock filter
        const matchesRoles = selectedRoles.length === 0 || (
          Array.isArray(project.skillsNeeded) && 
          selectedRoles.some(role => project.skillsNeeded.includes(role))
        );

        return matchesSearch && matchesStatus && matchesRoles;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allProjects, searchQuery, selectedStatus, selectedRoles]);

  let content;

  if (status === 'loading' || status === 'idle') {
    content = <LoadingSpinner />;
  } else if (status === 'succeeded') {
    content = (
      <div className={styles.projectsGrid}>
        {sortedAndFilteredProjects.length > 0 ? (
          sortedAndFilteredProjects.map((project) => (
            <DiscoverProjectCard key={project._id} project={project} />
          ))
        ) : (
          <div className={styles.noResults}>
            No projects match your criteria. Try adjusting your filters.
          </div>
        )}
      </div>
    );
  } else if (status === 'failed') {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>Filters</h3>
              <button onClick={clearFilters} className={styles.clearFilters}>Clear all</button>
            </div>

            {/* Category */}
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupHeader}>
                <Layers size={18} />
                <span className={styles.filterGroupTitle}>Category</span>
              </div>
              <div className={styles.filterOptions}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    className={styles.checkbox}
                    checked={selectedCategories.includes('All')}
                    onChange={() => toggleCategory('All')}
                  />
                  <span>All Categories</span>
                </label>
                {CATEGORIES.map(cat => (
                  <label key={cat} className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox}
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupHeader}>
                <Analytics size={18} />
                <span className={styles.filterGroupTitle}>Status</span>
              </div>
              <div className={styles.filterOptions}>
                <label className={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="status"
                    className={styles.radio}
                    checked={selectedStatus === 'All'}
                    onChange={() => setSelectedStatus('All')}
                  />
                  <span>All Phases</span>
                </label>
                {STATUSES.map(status => (
                  <label key={status} className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="status"
                      className={styles.radio}
                      checked={selectedStatus === status}
                      onChange={() => setSelectedStatus(status)}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Roles Needed */}
            <div>
              <div className={styles.filterGroupHeader}>
                <GroupAdd size={18} />
                <span className={styles.filterGroupTitle}>Roles Needed</span>
              </div>
              <div className={styles.rolesFlex}>
                {ROLES.map(role => (
                  <button 
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`${styles.roleTag} ${selectedRoles.includes(role) ? styles.roleTagActive : ''}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <div>
              <h1 className={styles.pageTitle}>Discover Projects</h1>
              <p className={styles.pageSubtitle}>
                Showing {status === 'succeeded' ? sortedAndFilteredProjects.length : 0} projects matching your criteria
              </p>
            </div>
            
            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>Sort by:</span>
              <select className={styles.sortSelect} defaultValue="newest">
                <option value="newest">Recently Added</option>
                <option value="active">Most Active</option>
                <option value="team">Team Size</option>
              </select>
            </div>
          </div>

          {content}
        </main>
      </div>
    </div>
  );
};


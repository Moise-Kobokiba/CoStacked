// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/projects/projectsSlice';
import { DiscoverProjectCard } from '../components/discover/DiscoverProjectCard';
import { LayoutGrid, Search, Activity, UserPlus, ChevronDown } from 'lucide-react';
import styles from './DiscoverProjectsPage.module.css';

const LoadingSpinner = () => (
  <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-100 bg-white text-sm font-medium text-slate-400 shadow-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span>Loading projects...</span>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm font-medium text-red-600 shadow-sm">
    Error: {error ?? "Unable to load projects dynamic index."}
  </div>
);
const ErrorDisplay = ({ error }) => (
  <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm font-medium text-red-600 shadow-sm">
    Error: {error ?? "Unable to load projects."}
  </div>
);

export const DiscoverProjectsPage = () => {
  const dispatch = useDispatch();

  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['All']);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  
  const CATEGORIES = ['SaaS', 'FinTech', 'AI', 'HealthTech', 'E-commerce', 'Other'];
  const STATUSES = ['Concept', 'Wireframe', 'Prototype', 'MVP Development', 'Alpha', 'Live'];
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
    setSortOption('newest');
  };

  const sortedAndFilteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];
    
    return [...allProjects]
      .filter(project => {
        const titleDesc = `${project.title || ''} ${project.description || ''}`.toLowerCase();
        
        // Basic search filtering
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchLower || titleDesc.includes(searchLower);
        
        // Category filtering (Option C: keyword match in title/description)
        const isAllCategories = selectedCategories.includes('All') || selectedCategories.length === 0;
        const matchesCategory = isAllCategories || selectedCategories.some(cat => {
          if (cat === 'Other') return true; 
          return titleDesc.includes(cat.toLowerCase());
        });

        // Status filtering (Map frontend Alpha/Beta to matching backend stages)
        let matchesStatus = false;
        if (selectedStatus === 'All') {
          matchesStatus = true;
        } else if (selectedStatus === 'Alpha') {
          matchesStatus = ['Pre-Alpha', 'Alpha', 'Beta'].includes(project.stage);
        } else {
          matchesStatus = project.stage === selectedStatus;
        }
        
        // Roles needed filter (Keyword mapping)
        const skillsString = (Array.isArray(project.skillsNeeded) 
            ? project.skillsNeeded.join(' ') 
            : project.skillsNeeded || '').toLowerCase();
            
        const matchesRoles = selectedRoles.length === 0 || selectedRoles.some(role => {
           const r = role.toLowerCase();
           if (r === 'developer') return skillsString.includes('dev') || skillsString.includes('react') || skillsString.includes('node') || skillsString.includes('engineer') || skillsString.includes('software');
           if (r === 'designer') return skillsString.includes('design') || skillsString.includes('figma') || skillsString.includes('ui') || skillsString.includes('ux');
           if (r === 'marketer') return skillsString.includes('market') || skillsString.includes('growth') || skillsString.includes('sales');
           if (r === 'pm') return skillsString.includes('product') || skillsString.includes('manager') || skillsString.includes('pm') || skillsString.includes('owner');
           return skillsString.includes(r);
        });

        return matchesSearch && matchesCategory && matchesStatus && matchesRoles;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortOption === 'active') {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        } else if (sortOption === 'team') {
          // Approximate team size by number of skills listed
          const aSkills = Array.isArray(a.skillsNeeded) ? a.skillsNeeded.length : 0;
          const bSkills = Array.isArray(b.skillsNeeded) ? b.skillsNeeded.length : 0;
          return bSkills - aSkills;
        }
        return 0;
      });
  }, [allProjects, searchQuery, selectedCategories, selectedStatus, selectedRoles, sortOption]);

  let content;

  if (status === "loading" || status === "idle") {
    content = <LoadingSpinner />;
  } else if (status === "succeeded") {
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
  } else if (status === "failed") {
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

            {/* Search Input */}
            <div className={styles.filterGroup}>
              <div className={styles.searchContainer} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px 8px 36px', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    backgroundColor: 'var(--input-background)',
                    fontSize: '14px',
                    color: 'var(--foreground)'
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupHeader}>
                <LayoutGrid size={18} />
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
                <Activity size={18} />
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
                <UserPlus size={18} />
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
              <select className={styles.sortSelect} value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
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


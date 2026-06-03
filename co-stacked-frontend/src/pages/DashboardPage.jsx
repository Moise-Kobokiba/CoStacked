// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectsSlice';
import { DiscoverProjectCard } from '../components/discover/DiscoverProjectCard';
import { LayoutGrid, Search, Activity, Settings, HelpCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import styles from './DiscoverProjectsPage.module.css';

const LoadingSpinner = () => (
  <div className={styles.loading}>
    <div className={styles.loaderInner}>
      <div className={styles.spinner} />
      <span>Loading matching projects...</span>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className={styles.error}>
    Error: {error ?? "Unable to safely index project registries."}
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
  const [currentPage, setCurrentPage] = useState(1);
  
  const CATEGORIES = ['SaaS', 'FinTech', 'AI', 'HealthTech', 'E-commerce', 'Other'];
  const STATUSES = ['Concept', 'Wireframe', 'Prototype', 'MVP Development', 'Alpha', 'Live'];
  const ROLES = ['Developer', 'Designer', 'Marketer', 'PM'];
  const PROJECTS_PER_PAGE = 9;

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
    setCurrentPage(1);
  };

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories(['All']);
    setSelectedStatus('All');
    setSelectedRoles([]);
    setSearchQuery('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  const sortedAndFilteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];
    
    return [...allProjects]
      .filter(project => {
        const titleDesc = `${project.title || ''} ${project.description || ''}`.toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchLower || titleDesc.includes(searchLower);
        
        const isAllCategories = selectedCategories.includes('All') || selectedCategories.length === 0;
        const matchesCategory = isAllCategories || selectedCategories.some(cat => {
          if (cat === 'Other') return true; 
          return titleDesc.includes(cat.toLowerCase());
        });

        let matchesStatus = false;
        if (selectedStatus === 'All') {
          matchesStatus = true;
        } else if (selectedStatus === 'Alpha') {
          matchesStatus = ['Pre-Alpha', 'Alpha', 'Beta'].includes(project.stage || '');
        } else {
          matchesStatus = project.stage === selectedStatus;
        }
        
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
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else if (sortOption === 'active') {
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        } else if (sortOption === 'team') {
          const aSkills = Array.isArray(a.skillsNeeded) ? a.skillsNeeded.length : 0;
          const bSkills = Array.isArray(b.skillsNeeded) ? b.skillsNeeded.length : 0;
          return bSkills - aSkills;
        }
        return 0;
      });
  }, [allProjects, searchQuery, selectedCategories, selectedStatus, selectedRoles, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredProjects.length / PROJECTS_PER_PAGE));
  const paginatedProjects = sortedAndFilteredProjects.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  );

  const renderPaginationNumbers = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(4, totalPages); i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          style={{
            height: '2.25rem', width: '2.25rem', borderRadius: '0.5rem', fontSize: '0.875rem',
            fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 150ms ease',
            backgroundColor: currentPage === i ? '#2563eb' : 'transparent',
            color: currentPage === i ? '#ffffff' : '#475569'
          }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  let content;

  if (status === "loading" || status === "idle") {
    content = <LoadingSpinner />;
  } else if (status === "succeeded") {
    content = (
      <>
        <div className={styles.projectsGrid}>
          {paginatedProjects.length > 0 ? (
            paginatedProjects.map((project) => (
              <DiscoverProjectCard key={project._id || project.title} project={project} />
            ))
          ) : (
            <div className={styles.noResults}>
              No alternative platforms map to these choices. Adjust parameters above.
            </div>
          )}
        </div>

        {/* Custom Nav Footer */}
        <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ display: 'flex', height: '2.25rem', width: '2.25rem', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {renderPaginationNumbers()}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ display: 'flex', height: '2.25rem', width: '2.25rem', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </>
    );
  } else if (status === "failed") {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.layout}>
        
        {/* Sidebar Filter Panel */}
        <aside className={styles.sidebar}>
          <div className={styles.filterHeader}>
            <div>
              <LayoutGrid size={16} style={{ color: '#2563eb' }} />
              <span>Project Filters</span>
            </div>
          </div>

          {/* Categories Filter Block */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Categories</span>
            <div className={styles.filterOptions}>
              {['All', ...CATEGORIES].map(cat => (
                <label key={cat}>
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span>{cat === 'All' ? 'All Hubs' : cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lifecycle Matrix Block */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Development Phase</span>
            <div className={styles.filterOptions}>
              {['All', ...STATUSES].map(phase => (
                <label key={phase}>
                  <input 
                    type="radio" 
                    name="status"
                    checked={selectedStatus === phase}
                    onChange={() => setSelectedStatus(phase)}
                  />
                  <span>{phase === 'All' ? 'All Lifecycle Stages' : phase}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Talent Requirements Mapping */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Roles Needed</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ROLES.map(role => {
                const active = selectedRoles.includes(role);
                return (
                  <button 
                    key={role}
                    onClick={() => toggleRole(role)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '0.5rem', border: active ? '1px solid #0f172a' : '1px solid #e2e8f0', backgroundColor: active ? '#0f172a' : '#ffffff', color: active ? '#ffffff' : '#475569', cursor: 'pointer', transition: 'all 150ms ease' }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={clearFilters}
            style={{ width: '100%', padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', backgroundColor: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '0.5rem', cursor: 'pointer', marginTop: 'auto' }}
          >
            Reset Filters
          </button>
        </aside>

        {/* Central Grid Feed Display */}
        <main className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <div>
              <h1 className={styles.pageTitle}>Discover Projects</h1>
              <p className={styles.pageSubtitle}>Deploying tactical tools across a verified matching grid.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.875rem', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search stacks or concepts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '240px', padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{ padding: '0.5rem 2rem 0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontSize: '0.875rem', fontWeight: 600, color: '#475569', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="active">Sort: Active</option>
                  <option value="team">Sort: Stack Size</option>
                </select>
                <Activity size={14} style={{ position: 'absolute', right: '0.75rem', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {content}
        </main>

      </div>
    </div>
  );
};

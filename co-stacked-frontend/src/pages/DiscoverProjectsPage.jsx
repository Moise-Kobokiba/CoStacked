// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Flag,
  Grid2X2,
  HelpCircle,
  Layers,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { fetchProjects } from "../features/projects/projectsSlice";
import ProjectCard from "../components/discover/ProjectCard";
import styles from "./DiscoverProjectsPage.module.css";

const LoadingSpinner = () => (
  <div className={styles.loading}>
    <div className={styles.loaderInner}>
      <div className={styles.spinner} />
      <span>Loading projects...</span>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => <p className={styles.error}>Error: {error ?? "Unable to load projects."}</p>;

export const DiscoverProjectsPage = () => {
  const dispatch = useDispatch();

  const { items: allProjects = [], status, error } = useSelector((state) => state.projects || {});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["All"]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const CATEGORIES = ["SaaS", "FinTech", "AI", "HealthTech", "E-commerce", "Other"];
  const STATUSES = ["Concept", "Wireframe", "Prototype", "MVP Development", "Alpha", "Live"];
  const ROLES = ["Developer", "Designer", "Marketer", "PM"];
  const PROJECTS_PER_PAGE = 12;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProjects());
    }
  }, [dispatch, status]);

  const toggleCategory = (cat) => {
    if (cat === "All") {
      setSelectedCategories(["All"]);
      setCurrentPage(1);
      return;
    }

    const newCats = selectedCategories.filter((c) => c !== "All");

    if (newCats.includes(cat)) {
      const filtered = newCats.filter((c) => c !== cat);
      setSelectedCategories(filtered.length === 0 ? ["All"] : filtered);
    } else {
      setSelectedCategories([...newCats, cat]);
    }

    setCurrentPage(1);
  };

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }

    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories(["All"]);
    setSelectedStatus("All");
    setSelectedRoles([]);
    setSearchQuery("");
    setSortOption("newest");
    setCurrentPage(1);
  };

  const sortedAndFilteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];

    return [...allProjects]
      .filter((project) => {
        const titleDesc = `${project.title || ""} ${project.description || ""}`.toLowerCase();

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchLower || titleDesc.includes(searchLower);

        const isAllCategories = selectedCategories.includes("All") || selectedCategories.length === 0;
        const matchesCategory =
          isAllCategories ||
          selectedCategories.some((cat) => {
            if (cat === "Other") return true;
            return titleDesc.includes(cat.toLowerCase());
          });

        let matchesStatus = false;
        if (selectedStatus === "All") {
          matchesStatus = true;
        } else if (selectedStatus === "Alpha") {
          matchesStatus = ["Pre-Alpha", "Alpha", "Beta"].includes(project.stage);
        } else {
          matchesStatus = project.stage === selectedStatus;
        }

        const skillsString = (
          Array.isArray(project.skillsNeeded) ? project.skillsNeeded.join(" ") : project.skillsNeeded || ""
        ).toLowerCase();

        const matchesRoles =
          selectedRoles.length === 0 ||
          selectedRoles.some((role) => {
            const r = role.toLowerCase();
            if (r === "developer") {
              return (
                skillsString.includes("dev") ||
                skillsString.includes("react") ||
                skillsString.includes("node") ||
                skillsString.includes("engineer") ||
                skillsString.includes("software")
              );
            }
            if (r === "designer") {
              return (
                skillsString.includes("design") ||
                skillsString.includes("figma") ||
                skillsString.includes("ui") ||
                skillsString.includes("ux")
              );
            }
            if (r === "marketer") {
              return skillsString.includes("market") || skillsString.includes("growth") || skillsString.includes("sales");
            }
            if (r === "pm") {
              return (
                skillsString.includes("product") ||
                skillsString.includes("manager") ||
                skillsString.includes("pm") ||
                skillsString.includes("owner")
              );
            }
            return skillsString.includes(r);
          });

        return matchesSearch && matchesCategory && matchesStatus && matchesRoles;
      })
      .sort((a, b) => {
        if (sortOption === "newest") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortOption === "active") {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        } else if (sortOption === "team") {
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
    currentPage * PROJECTS_PER_PAGE,
  );

  const renderPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 4;

    for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i += 1) {
      pages.push(
        <button
          key={i}
          type="button"
          onClick={() => setCurrentPage(i)}
          className={`${styles.pageButton} ${currentPage === i ? styles.pageButtonActive : ""}`}
        >
          {i}
        </button>,
      );
    }

    if (totalPages > maxVisiblePages) {
      pages.push(
        <span key="dots" className={styles.dots}>
          ...
        </span>,
      );
      pages.push(
        <button
          key={totalPages}
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          className={`${styles.pageButton} ${currentPage === totalPages ? styles.pageButtonActive : ""}`}
        >
          {totalPages}
        </button>,
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
        <div className={styles.grid}>
          {paginatedProjects.length > 0 ? (
            paginatedProjects.map((project) => <ProjectCard key={project._id ?? project.title} project={project} />)
          ) : (
            <div className={styles.noResults}>No projects match your criteria. Try adjusting your filters.</div>
          )}
        </div>

        <div className={styles.pagination}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className={styles.pageArrow}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          <div className={styles.paginationNumbers}>{renderPaginationNumbers()}</div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className={styles.pageArrow}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </>
    );
  } else if (status === "failed") {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarIntro}>
          <div className={styles.sidebarHeading}>
            <Filter className={styles.sidebarHeadingIcon} />
            <h2>Project Filters</h2>
          </div>
          <p>Refine your search</p>
        </div>

        <div className={styles.sidebarMenu}>
          <button type="button" className={`${styles.sidebarMenuItem} ${styles.sidebarMenuItemActive}`}>
            <Grid2X2 size={18} />
            <span>All Projects</span>
          </button>
          <button type="button" className={styles.sidebarMenuItem}>
            <Layers size={18} />
            <span>Categories</span>
          </button>
          <button type="button" className={styles.sidebarMenuItem}>
            <Flag size={18} />
            <span>Status</span>
          </button>
          <button type="button" className={styles.sidebarMenuItem}>
            <Users size={18} />
            <span>Roles</span>
          </button>
        </div>

        <section className={styles.quickFilters}>
          <h3>Quick Filters</h3>
          <div className={styles.pills}>
            {["All", ...CATEGORIES].map((cat) => {
              const active = selectedCategories.includes(cat);

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                >
                  {cat === "All" ? "All Categories" : cat}
                </button>
              );
            })}
          </div>
        </section>

        <div className={styles.sidebarBottom}>
          <button type="button" onClick={clearFilters} className={styles.resetButton}>
            Reset Filters
          </button>

          <Link to="/settings" className={styles.sidebarLink}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <Link to="/support" className={styles.sidebarLink}>
            <HelpCircle size={18} />
            <span>Help</span>
          </Link>
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1>Discover Projects</h1>
            <p>Connect with the next generation of high-impact ventures.</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Search projects, stacks, or roles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className={styles.sortBox}>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="active">Most Active</option>
                <option value="team">Team Size</option>
              </select>
            </div>
          </div>
        </header>

        {content}
      </section>
    </main>
  );
};

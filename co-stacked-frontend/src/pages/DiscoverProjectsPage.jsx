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

const FALLBACK_PROJECTS = [
  {
    _id: "healthsphere",
    title: "HealthSphere",
    description:
      "A health platform connecting patients and wellness experts using telehealth, personalized care plans, and embedded analytics to improve outcomes.",
    category: "HealthTech",
    location: "Remote / NY",
    compensation: "Equity + Stipend",
    stage: "Scale Up",
    status: "Live",
    skillsNeeded: ["Product", "UX", "Telehealth"],
    username: "alexmorgan",
    createdAt: "2026-05-15T08:00:00Z",
    thumbnail: "/assets/project-thumbnails/orange.svg",
  },
  {
    _id: "voxling",
    title: "VoxLing",
    description:
      "A real-time voice translation platform for remote teams and global communities, blending AI, speech recognition, and collaborative messaging.",
    category: "FinTech",
    location: "London / Remote",
    compensation: "Paid Contract",
    stage: "Beta Testing",
    status: "MVP",
    skillsNeeded: ["AI", "React", "Speech"],
    username: "sophiak",
    createdAt: "2026-05-12T09:30:00Z",
    thumbnail: "/assets/project-thumbnails/red.svg",
  },
  {
    _id: "pet-platform",
    title: "Pet Platform",
    description:
      "A social marketplace for pet owners, vets, and pet care providers to connect around services, health updates, and community events.",
    category: "E-commerce",
    location: "Singapore",
    compensation: "Co-founder",
    stage: "Concept",
    status: "Concept",
    skillsNeeded: ["Mobile", "Community", "Design"],
    username: "michelleq",
    createdAt: "2026-05-08T11:20:00Z",
    thumbnail: "/assets/project-thumbnails/green.svg",
  },
  {
    _id: "finflow",
    title: "FinFlow",
    description:
      "A workflow engine for modern finance teams that automates compliance, approvals, and reporting through an intuitive dashboard.",
    category: "SaaS",
    location: "Remote",
    compensation: "Equity + Stipend",
    stage: "Live",
    status: "Live",
    skillsNeeded: ["SaaS", "Automation", "Dashboard"],
    username: "jordanp",
    createdAt: "2026-05-04T14:15:00Z",
    thumbnail: "/assets/project-thumbnails/purple.svg",
  },
  {
    _id: "ecotrace",
    title: "EcoTrace",
    description:
      "A supply chain traceability tool for sustainable brands, tracking environmental impact and certifications in one platform.",
    category: "HealthTech",
    location: "Berlin / Remote",
    compensation: "Equity",
    stage: "MVP",
    status: "MVP",
    skillsNeeded: ["Blockchain", "Sustainability", "Data"],
    username: "ninaf",
    createdAt: "2026-04-28T10:00:00Z",
    thumbnail: "/assets/project-thumbnails/blue.svg",
  },
  {
    _id: "robochef",
    title: "RoboChef",
    description:
      "A kitchen automation startup building AI-powered robotics for food prep, recipe personalization, and intelligent meal planning.",
    category: "Other",
    location: "Austin, TX",
    compensation: "Paid Contract",
    stage: "Prototype",
    status: "MVP",
    skillsNeeded: ["Robotics", "AI", "Engineering"],
    username: "milesr",
    createdAt: "2026-04-20T12:45:00Z",
    thumbnail: "/assets/project-thumbnails/orange.svg",
  },
  {
    _id: "smartledger",
    title: "SmartLedger",
    description:
      "A digital ledger built for founder teams to manage budgets, subscriptions, and revenue forecasts from a single source of truth.",
    category: "FinTech",
    location: "Remote / SF",
    compensation: "Equity + Stipend",
    stage: "Live",
    status: "Live",
    skillsNeeded: ["Finance", "SaaS", "UX"],
    username: "elena",
    createdAt: "2026-04-14T09:00:00Z",
    thumbnail: "/assets/project-thumbnails/red.svg",
  },
  {
    _id: "motionmesh",
    title: "MotionMesh",
    description:
      "A platform for creators to publish interactive video experiences and collaborate with motion designers and storytellers.",
    category: "SaaS",
    location: "Remote",
    compensation: "Founder Equity",
    stage: "Beta Testing",
    status: "MVP",
    skillsNeeded: ["Motion", "Video", "Collaboration"],
    username: "tashaw",
    createdAt: "2026-04-10T08:30:00Z",
    thumbnail: "/assets/project-thumbnails/green.svg",
  },
  {
    _id: "greenpulse",
    title: "GreenPulse",
    description:
      "A sustainability intelligence layer for teams to monitor carbon, water, and energy usage across product lines.",
    category: "HealthTech",
    location: "Remote / Amsterdam",
    compensation: "Equity",
    stage: "Concept",
    status: "Concept",
    skillsNeeded: ["Data", "Analytics", "Sustainability"],
    username: "leo",
    createdAt: "2026-04-05T13:10:00Z",
    thumbnail: "/assets/project-thumbnails/purple.svg",
  },
  {
    _id: "devbridge",
    title: "DevBridge",
    description:
      "A community network that matches startup founders with vetted technical co-founders and product builders.",
    category: "E-commerce",
    location: "Remote",
    compensation: "Co-founder",
    stage: "Live",
    status: "Live",
    skillsNeeded: ["Community", "Matching", "Product"],
    username: "ayn",
    createdAt: "2026-03-28T15:40:00Z",
    thumbnail: "/assets/project-thumbnails/blue.svg",
  },
  {
    _id: "marketmuse",
    title: "MarketMuse",
    description:
      "A marketing intelligence console for early-stage startups to plan campaigns, track reach, and connect with growth operators.",
    category: "SaaS",
    location: "Remote / Toronto",
    compensation: "Paid Contract",
    stage: "Beta Testing",
    status: "MVP",
    skillsNeeded: ["Marketing", "Growth", "Brand"],
    username: "leah",
    createdAt: "2026-03-24T10:35:00Z",
    thumbnail: "/assets/project-thumbnails/orange.svg",
  },
  {
    _id: "quantumhub",
    title: "QuantumHub",
    description:
      "A collaboration platform for quantum computing teams, combining hardware access, experiment tracking, and team coordination.",
    category: "AI",
    location: "Remote",
    compensation: "Equity",
    stage: "Concept",
    status: "Concept",
    skillsNeeded: ["Quantum", "Research", "Collaboration"],
    username: "seth",
    createdAt: "2026-03-20T11:50:00Z",
    thumbnail: "/assets/project-thumbnails/red.svg",
  },
];

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
  const [selectedCategories, setSelectedCategories] = useState(["All Categories"]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const CATEGORIES = ["SaaS", "FinTech", "HealthTech", "E-commerce", "Other"];

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProjects());
    }
  }, [dispatch, status]);

  const projectSource = useMemo(() => {
    if (status === "failed" && allProjects.length === 0) {
      return FALLBACK_PROJECTS;
    }
    return Array.isArray(allProjects) && allProjects.length > 0 ? allProjects : FALLBACK_PROJECTS;
  }, [allProjects, status]);

  const toggleCategory = (cat) => {
    if (cat === "All Categories") {
      setSelectedCategories(["All Categories"]);
      setCurrentPage(1);
      return;
    }

    const nextCategories = selectedCategories.filter((c) => c !== "All Categories");
    if (nextCategories.includes(cat)) {
      const filtered = nextCategories.filter((c) => c !== cat);
      setSelectedCategories(filtered.length === 0 ? ["All Categories"] : filtered);
    } else {
      setSelectedCategories([...nextCategories, cat]);
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
    setSelectedCategories(["All Categories"]);
    setSelectedStatus("All");
    setSelectedRoles([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const filteredProjects = useMemo(() => {
    return projectSource
      .filter((project) => {
        const titleDesc = `${project.title || ""} ${project.description || ""}`.toLowerCase();
        const skillsString = (
          Array.isArray(project.skillsNeeded) ? project.skillsNeeded.join(" ") : project.skillsNeeded || ""
        ).toLowerCase();
        const searchLower = searchQuery.toLowerCase();

        const matchesSearch =
          !searchLower ||
          titleDesc.includes(searchLower) ||
          skillsString.includes(searchLower) ||
          (project.category || "").toLowerCase().includes(searchLower);

        const isAllCategories = selectedCategories.includes("All Categories") || selectedCategories.length === 0;
        const matchesCategory =
          isAllCategories ||
          selectedCategories.some((cat) => {
            if (cat === "Other") {
              const normalized = (project.category || "").toLowerCase();
              return !["saas", "fintech", "healthtech", "e-commerce", "ai"].some((base) => normalized.includes(base));
            }
            return (project.category || "").toLowerCase().includes(cat.toLowerCase()) || titleDesc.includes(cat.toLowerCase());
          });

        const matchesStatus =
          selectedStatus === "All" ||
          (project.status || "").toLowerCase().includes(selectedStatus.toLowerCase()) ||
          (project.stage || "").toLowerCase().includes(selectedStatus.toLowerCase());

        const matchesRoles =
          selectedRoles.length === 0 ||
          selectedRoles.some((role) => {
            const normalized = role.toLowerCase();
            if (normalized === "developer") {
              return ["dev", "engineer", "react", "node", "software"].some((term) => skillsString.includes(term));
            }
            if (normalized === "designer") {
              return ["design", "figma", "ui", "ux", "product"].some((term) => skillsString.includes(term));
            }
            if (normalized === "marketer") {
              return ["market", "growth", "brand", "seo", "ads"].some((term) => skillsString.includes(term));
            }
            if (normalized === "founder") {
              return ["founder", "startup", "product", "strategy"].some((term) => skillsString.includes(term));
            }
            return skillsString.includes(normalized);
          });

        return matchesSearch && matchesCategory && matchesStatus && matchesRoles;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [projectSource, searchQuery, selectedCategories, selectedStatus, selectedRoles]);

  const PROJECTS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE));
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE);

  const renderPaginationNumbers = () => {
    const pages = [];
    const last = totalPages;
    const visibleCount = Math.min(4, totalPages);

    for (let i = 1; i <= visibleCount; i += 1) {
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

    if (totalPages > visibleCount + 1) {
      pages.push(
        <span key="dots" className={styles.dots}>
          ...
        </span>,
      );
      pages.push(
        <button
          key={last}
          type="button"
          onClick={() => setCurrentPage(last)}
          className={`${styles.pageButton} ${currentPage === last ? styles.pageButtonActive : ""}`}
        >
          {last}
        </button>,
      );
    } else if (totalPages === visibleCount + 1) {
      pages.push(
        <button
          key={last}
          type="button"
          onClick={() => setCurrentPage(last)}
          className={`${styles.pageButton} ${currentPage === last ? styles.pageButtonActive : ""}`}
        >
          {last}
        </button>,
      );
    }

    return pages;
  };

  const content =
    status === "loading" || status === "idle" ? (
      <LoadingSpinner />
    ) : status === "failed" ? (
      <ErrorDisplay error={error} />
    ) : (
      <>
        <div className={styles.grid}>
          {paginatedProjects.length > 0 ? (
            paginatedProjects.map((project) => <ProjectCard key={project._id ?? project.title} project={project} />)
          ) : (
            <div className={styles.noResults}>
              <h2>No projects found matching these criteria</h2>
              <p>Try clearing active filters or broadening your search to discover more startup opportunities.</p>
              <button type="button" onClick={clearFilters} className={styles.noResultsReset}>
                Reset Filters
              </button>
            </div>
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

  return (
    <main className={styles.page}>
      <div className={`${styles.sidebarBackdrop} ${isSidebarOpen ? styles.sidebarBackdropVisible : ""}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarIntro}>
          <div className={styles.sidebarHeading}>
            <Filter className={styles.sidebarHeadingIcon} />
            <h2>Project Filters</h2>
          </div>
          <p>Refine your search</p>
        </div>

        <div className={styles.sidebarMenu}>
          <button
            type="button"
            onClick={() => setActiveSidebarTab("all")}
            className={`${styles.sidebarMenuItem} ${activeSidebarTab === "all" ? styles.sidebarMenuItemActive : ""}`}
          >
            <Grid2X2 size={18} />
            <span>All Projects</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarTab("categories")}
            className={`${styles.sidebarMenuItem} ${activeSidebarTab === "categories" ? styles.sidebarMenuItemActive : ""}`}
          >
            <Layers size={18} />
            <span>Categories</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarTab("status")}
            className={`${styles.sidebarMenuItem} ${activeSidebarTab === "status" ? styles.sidebarMenuItemActive : ""}`}
          >
            <Flag size={18} />
            <span>Status</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarTab("roles")}
            className={`${styles.sidebarMenuItem} ${activeSidebarTab === "roles" ? styles.sidebarMenuItemActive : ""}`}
          >
            <Users size={18} />
            <span>Roles</span>
          </button>
        </div>

        <section className={styles.quickFilters}>
          <p className={styles.sectionEyebrow}>Quick Filters</p>
          <div className={styles.pillGroup}>
            {["All Categories", ...CATEGORIES].map((cat) => {
              const active = selectedCategories.includes(cat);

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.filterSection}>
          <p className={styles.sectionTitle}>Status</p>
          <div className={styles.filterRow}>
            {["All", "Live", "MVP", "Concept"].map((statusOption) => (
              <button
                key={statusOption}
                type="button"
                onClick={() => {
                  setSelectedStatus(statusOption);
                  setCurrentPage(1);
                }}
                className={`${styles.filterButton} ${selectedStatus === statusOption ? styles.filterButtonActive : ""}`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.filterSection}>
          <p className={styles.sectionTitle}>Roles</p>
          <div className={styles.filterRow}>
            {["Developer", "Designer", "Marketer", "Founder"].map((role) => {
              const active = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`${styles.filterButton} ${active ? styles.filterButtonActive : ""}`}
                >
                  {role}
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
        <div className={styles.mobileHeader}>
          <button type="button" className={styles.mobileToggle} onClick={() => setIsSidebarOpen(true)}>
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>

        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Discover Projects</h1>
            <p className={styles.pageSubtitle}>Connect with the next generation of high-impact ventures.</p>
          </div>

          <div className={styles.headerControls}>
            <div className={styles.searchWrap}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search projects, stacks, or roles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </header>

        {content}
      </section>
    </main>
  );
};

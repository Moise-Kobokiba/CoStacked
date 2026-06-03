// src/pages/DiscoverProjectsPage.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutGrid,
  Search,
  Settings,
  UserPlus,
} from "lucide-react";
import { fetchProjects } from "../features/projects/projectsSlice";
import ProjectCard from "../components/discover/ProjectCard";

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
    Error: {error ?? "Unable to load projects."}
  </div>
);

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
          matchesStatus = ["Pre-Alpha", "Alpha", "Beta"].includes(project.stage || "");
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
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortOption === "active") {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        if (sortOption === "team") {
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
          className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${
            currentPage === i ? "bg-blue-600 text-white shadow-sm shadow-blue-100" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {i}
        </button>,
      );
    }

    if (totalPages > maxVisiblePages) {
      if (totalPages > maxVisiblePages + 1) {
        pages.push(
          <span key="dots" className="px-1 text-sm font-medium text-slate-400">
            ...
          </span>,
        );
      }

      pages.push(
        <button
          key={totalPages}
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${
            currentPage === totalPages ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedProjects.length > 0 ? (
            paginatedProjects.map((project) => <ProjectCard key={project._id ?? project.title} project={project} />)
          ) : (
            <div className="col-span-full flex min-h-[350px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center text-sm font-medium text-slate-400 shadow-sm">
              No projects match your criteria. Try adjusting your filters or search keywords.
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">{renderPaginationNumbers()}</div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  } else if (status === "failed") {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Outfit'] antialiased">
      <div className="mx-auto flex w-full max-w-[1440px] gap-8 px-6 py-8">
        <aside className="flex min-h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col rounded-xl border border-slate-200/80 bg-white px-5 py-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <LayoutGrid className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Project Filters</h2>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Filters</p>
            <div className="flex flex-wrap gap-2">
              {["All", ...CATEGORIES].map((cat) => {
                const isSelected = selectedCategories.includes(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-slate-200/60 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex-1 space-y-7">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Activity className="h-3.5 w-3.5" />
                <span>Categories</span>
              </div>
              <div className="space-y-2.5">
                {["All", ...CATEGORIES].map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                    />
                    <span>{cat === "All" ? "All Projects" : cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Status</span>
              </div>
              <div className="space-y-2.5">
                {["All", ...STATUSES].map((projectStatus) => (
                  <label
                    key={projectStatus}
                    className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === projectStatus}
                      onChange={() => {
                        setSelectedStatus(projectStatus);
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500/20"
                    />
                    <span>{projectStatus === "All" ? "All System Phases" : projectStatus}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Roles Map</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 w-full rounded-lg border border-dashed border-red-200/60 bg-red-50/30 py-2 text-center text-xs font-bold text-red-500 transition hover:bg-red-50"
          >
            Reset All Filters
          </button>

          <nav className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
            <Link to="/settings" className="flex items-center gap-1.5 transition hover:text-slate-700">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <Link to="/support" className="flex items-center gap-1.5 transition hover:text-slate-700">
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Discover Projects</h1>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Connect with the next generation of high-impact ventures.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects, stacks, or roles..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-10 text-sm font-semibold text-slate-600 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-500"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="active">Sort: Active</option>
                  <option value="team">Sort: Stack Size</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {content}
        </main>
      </div>
    </div>
  );
};

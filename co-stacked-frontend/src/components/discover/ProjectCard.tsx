import type { FC } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Flag, MapPin, Wallet } from "lucide-react";

type ProjectStatus = "Live" | "MVP" | "Concept";

export interface ProjectCardProject {
  _id?: string;
  title?: string;
  description?: string;
  status?: ProjectStatus | string;
  stage?: string;
  bannerImageUrl?: string;
  imageUrl?: string;
  location?: string;
  workType?: string;
  compensation?: string;
  contractType?: string;
  founder?: string;
  username?: string;
  avatarUrl?: string;
  founderId?: {
    avatarUrl?: string;
    username?: string;
    name?: string;
  };
}

export interface ProjectCardProps {
  project: ProjectCardProject;
}

const normalizeStatus = (project: ProjectCardProject): ProjectStatus => {
  const source = `${project.status ?? ""} ${project.stage ?? ""}`.toLowerCase();

  if (source.includes("live")) return "Live";
  if (source.includes("mvp") || source.includes("prototype") || source.includes("alpha") || source.includes("beta")) {
    return "MVP";
  }

  return "Concept";
};

const statusStyles: Record<ProjectStatus, string> = {
  Live: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  MVP: "bg-blue-100 text-blue-700 ring-blue-200",
  Concept: "bg-amber-100 text-amber-700 ring-amber-200",
};

const getUsername = (project: ProjectCardProject) =>
  project.username ?? project.founderId?.username ?? project.founderId?.name ?? project.founder ?? "unknown";

const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const status = normalizeStatus(project);
  const title = project.title ?? "Untitled Project";
  const description = project.description ?? "No project description has been provided yet.";
  const bannerImageUrl = project.bannerImageUrl ?? project.imageUrl;
  const location = project.location ?? "Remote";
  const workType = project.workType ?? "Flexible work";
  const compensation = project.compensation ?? "Compensation TBD";
  const contractType = project.contractType ?? "Contract type TBD";
  const stage = project.stage ?? status;
  const username = getUsername(project);
  const avatarUrl = project.avatarUrl ?? project.founderId?.avatarUrl;
  const avatarInitial = username.trim().charAt(0).toUpperCase() || "@";
  const detailsPath = project._id ? `/projects/${project._id}` : "/projects";

  return (
    <article className="font-['Outfit'] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="relative h-40 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 bg-cover bg-center"
        style={bannerImageUrl ? { backgroundImage: `url(${bannerImageUrl})` } : undefined}
      >
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}>
          {status}
        </span>

        <button
          type="button"
          aria-label="Save project"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 transition hover:bg-white"
        >
          <Bookmark className="h-5 w-5 text-slate-700" aria-hidden="true" />
        </button>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-semibold leading-tight text-slate-950">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-5 space-y-3 border-y border-slate-100 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              {location} · {workType}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Wallet className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              {compensation} · {contractType}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Flag className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              {stage} · {status}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`@${username}`}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {avatarInitial}
              </div>
            )}

            <p className="truncate text-sm text-slate-500">
              posted by <span className="font-medium text-slate-800">@{username}</span>
            </p>
          </div>

          <Link
            to={detailsPath}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;

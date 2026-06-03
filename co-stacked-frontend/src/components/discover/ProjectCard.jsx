import { Link } from "react-router-dom";
import { Bookmark, MapPin, TrendingUp, Wallet } from "lucide-react";
import styles from "./ProjectCard.module.css";

const gradients = [
  styles.gradientIndigo,
  styles.gradientCyan,
  styles.gradientOrange,
  styles.gradientPink,
  styles.gradientEmerald,
  styles.gradientBlue,
  styles.gradientDark,
  styles.gradientRed,
];

const normalizeStatus = (project) => {
  const source = `${project.status ?? ""} ${project.stage ?? ""}`.toLowerCase();

  if (source.includes("live") || source.includes("scale")) return "Live";
  if (source.includes("mvp") || source.includes("prototype") || source.includes("alpha") || source.includes("beta")) {
    return "MVP";
  }

  return "Concept";
};

const getGradientClass = (project) => {
  const seed = `${project._id ?? project.title ?? "project"}`;
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return gradients[total % gradients.length];
};

const getUsername = (project) =>
  project.username ?? project.founderId?.username ?? project.founderId?.name ?? project.founder ?? "alexmorgan";

const ProjectCard = ({ project }) => {
  const status = normalizeStatus(project);
  const title = project.title ?? "Untitled Project";
  const description = project.description ?? "No project description has been provided yet.";
  const category = project.category ?? "All";
  const location = project.location ?? project.workType ?? "Remote";
  const compensation = project.compensation ?? project.contractType ?? "Equity Only";
  const stage = project.stage ?? status;
  const username = getUsername(project);
  const avatarUrl = project.avatarUrl ?? project.founderId?.avatarUrl;
  const avatarInitial = username.trim().charAt(0).toUpperCase() || "@";
  const detailsPath = project._id ? `/projects/${project._id}` : "/projects";

  return (
    <article className={styles.card}>
      <div className={styles.banner}>
        <div className={`${styles.bannerArt} ${getGradientClass(project)}`}>
          <div className={styles.stackMark} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.badges}>
          <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>{status}</span>
          {category !== "All" && <span className={styles.categoryBadge}>{category}</span>}
        </div>

        <button type="button" className={styles.saveButton} aria-label="Save project">
          <Bookmark className={styles.saveIcon} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>

        <div className={styles.metadata}>
          <div className={styles.metadataRow}>
            <MapPin className={styles.metadataIcon} aria-hidden="true" />
            <span>{location}</span>
          </div>
          <div className={styles.metadataRow}>
            <Wallet className={styles.metadataIcon} aria-hidden="true" />
            <span>{compensation}</span>
          </div>
          <div className={styles.metadataRow}>
            <TrendingUp className={styles.metadataIcon} aria-hidden="true" />
            <span>{stage}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.poster}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={`@${username}`} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{avatarInitial}</div>
            )}

            <p className={styles.postedBy}>
              posted by <span>@{username}</span>
            </p>
          </div>

          <Link to={detailsPath} className={styles.detailsButton}>
            Details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;

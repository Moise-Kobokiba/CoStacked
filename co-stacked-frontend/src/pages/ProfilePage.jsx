// src/pages/ProfilePage.jsx

import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styles from "./ProfilePage.module.css";

// Import Redux Actions
import { fetchUsers, recordProfileView } from "../features/users/usersSlice";
import { fetchProjects } from "../features/projects/projectsSlice";
import { fetchReviewsForUser } from "../features/reviews/reviewsSlice";
import { fetchReceivedInterests } from "../features/interests/interestsSlice";

// Import All UI Components
import { Card } from "../components/shared/Card";
import { Tag } from "../components/shared/Tag";
import { ProjectCard } from "../components/shared/ProjectCard";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { SocialLinks } from "../components/shared/SocialLinks";
import { ProfileEditor } from "../components/profile/ProfileEditor";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { AvatarUploadModal } from "../components/profile/AvatarUploadModal";
import { LeaveReviewModal } from "../components/reviews/LeaveReviewModal";
import { ProfileBoostModal } from "../components/billing/ProfileBoostModal";
import { MapPin, Link as LinkIcon } from "lucide-react";

const LoadingSpinner = () => <div className={styles.loader}>Loading profile...</div>;

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const { userId } = useParams();

  // State for UI and Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isBoostModalOpen, setBoostModalOpen] = useState(false);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  // State from Redux
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const { items: allUsers, status: usersStatus } = useSelector((state) => state.users);
  const { items: allProjects, status: projectsStatus } = useSelector((state) => state.projects);
  const { reviewsByUser, status: reviewsStatus } = useSelector((state) => state.reviews);
  const { receivedItems: founderConnections } = useSelector((state) => state.interests);

  const userToDisplay = userId ? allUsers.find((u) => u._id === userId) : loggedInUser;
  const isOwnProfile = userToDisplay && loggedInUser && userToDisplay._id === loggedInUser._id;

  const handleShare = useCallback(async () => {
    if (!userToDisplay) return;
    const shareData = {
      title: `${userToDisplay.name} on CoStacked`,
      text: `Check out ${userToDisplay.name}'s profile on CoStacked.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopySuccess("Copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
        setCopySuccess("Failed!");
      }
      setTimeout(() => setCopySuccess(""), 2000);
    }
  }, [userToDisplay]);

  // Data fetching effects
  useEffect(() => {
    if (usersStatus === "idle") dispatch(fetchUsers());
    if (projectsStatus === "idle") dispatch(fetchProjects());
    if (userToDisplay?._id) dispatch(fetchReviewsForUser(userToDisplay._id));
    if (loggedInUser?.role === "founder") dispatch(fetchReceivedInterests());
  }, [userToDisplay?._id, usersStatus, projectsStatus, loggedInUser, dispatch]);

  useEffect(() => {
    if (userId && loggedInUser && userId !== loggedInUser._id) {
      dispatch(recordProfileView(userId));
    }
  }, [userId, loggedInUser, dispatch]);

  // Loading state guard clause
  if (usersStatus === "loading" || !userToDisplay) {
    return (
      <div className={styles.pageContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  // Final derived state for rendering
  const developerReviews = reviewsByUser[userToDisplay._id] || [];
  const userProjects =
    userToDisplay.role === "founder"
      ? allProjects.filter((p) => p.founderId === userToDisplay._id)
      : [];
  const averageRating =
    developerReviews.length > 0
      ? developerReviews.reduce((acc, r) => acc + r.rating, 0) /
      developerReviews.length
      : 0;

  const reviewableProjects =
    founderConnections && Array.isArray(founderConnections)
      ? founderConnections.filter(c =>
        c.senderId?._id === userToDisplay._id &&
        c.status === 'approved' &&
        !developerReviews.some(review => review.projectId?._id === c.projectId?._id)
      )
      : [];

  const canLeaveReview =
    !isOwnProfile &&
    loggedInUser?.role === "founder" &&
    userToDisplay.role === "developer" &&
    reviewableProjects.length > 0;

  return (
    <>
      <ProfileBoostModal user={userToDisplay} open={isBoostModalOpen} onClose={() => setBoostModalOpen(false)} />
      <LeaveReviewModal developer={userToDisplay} reviewableProjects={reviewableProjects} open={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} />
      <AvatarUploadModal open={isAvatarModalOpen} onClose={() => setAvatarModalOpen(false)} />

      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          {isEditing && isOwnProfile ? (
            <ProfileEditor
              user={userToDisplay}
              onSave={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <Card>
              {isOwnProfile &&
                userToDisplay.isBoosted &&
                new Date(userToDisplay.boostExpiresAt) > new Date() && (
                  <div className={styles.boostBanner}>
                    Your profile is boosted until{" "}
                    {formatDate(userToDisplay.boostExpiresAt)}.
                  </div>
                )}

              <ProfileHeader
                user={userToDisplay}
                isOwnProfile={isOwnProfile}
                averageRating={averageRating}
                reviewCount={developerReviews.length}
                canLeaveReview={canLeaveReview}
                onEdit={() => setIsEditing(true)}
                onBoost={() => setBoostModalOpen(true)}
                onReview={() => setReviewModalOpen(true)}
                onAvatarClick={() => setAvatarModalOpen(true)}
                onShare={handleShare}
                copySuccess={copySuccess}
              />

              <div className={styles.content}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Socials</h3>
                  <SocialLinks socials={userToDisplay.socials} />
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>About Me</h3>
                  <p>{userToDisplay.bio || "No bio provided."}</p>
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Skills</h3>
                  <div className={styles.skillsContainer}>
                    {Array.isArray(userToDisplay.skills) &&
                      userToDisplay.skills.length > 0 ? (
                      userToDisplay.skills.map((s) => <Tag key={s}>{s}</Tag>)
                    ) : (
                      <p>No skills listed.</p>
                    )}
                  </div>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <MapPin size={18} />
                    <span>{userToDisplay.location || "N/A"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <LinkIcon size={18} />
                    <a href={userToDisplay.portfolioLink} target="_blank" rel="noopener noreferrer">
                      Portfolio
                    </a>
                  </div>
                  <p>
                    <strong>Availability:</strong>{" "}
                    {userToDisplay.availability || "N/A"}
                  </p>
                </div>

                {userProjects.length > 0 && (
                  <>
                    <div className={styles.separator} />
                    <h2 className={styles.title}>Posted Projects</h2>
                    <div className={styles.projectsGrid}>
                      {userProjects.map((p) => (
                        <ProjectCard key={p._id} project={p} />
                      ))}
                    </div>
                  </>
                )}

                {developerReviews.length > 0 && (
                  <>
                    <div className={styles.separator} />
                    <h2 className={styles.title}>Reviews</h2>
                    <div className={styles.reviewsGrid}>
                      {developerReviews.map((r) => (
                        <ReviewCard key={r._id} review={r} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};
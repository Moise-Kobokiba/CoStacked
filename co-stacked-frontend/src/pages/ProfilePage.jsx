// src/pages/ProfilePage.jsx

import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styles from "./ProfilePage.module.css";
import API from "../api/axios";

// Import Redux Actions
import { fetchUsers, recordProfileView } from "../features/users/usersSlice";
import { fetchProjects } from "../features/projects/projectsSlice";
import { fetchReviewsForUser } from "../features/reviews/reviewsSlice";
import { fetchReceivedInterests } from "../features/interests/interestsSlice";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  removeOrCancelConnection,
} from "../features/connections/connectionsSlice";

// Import All UI Components
import { Card } from "../components/shared/Card";
import { Tag } from "../components/shared/Tag";
import { ProjectCard } from "../components/shared/ProjectCard";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { ProfileEditor } from "../components/profile/ProfileEditor";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { AvatarUploadModal } from "../components/profile/AvatarUploadModal";
import { LeaveReviewModal } from "../components/reviews/LeaveReviewModal";
import { ProfileBoostModal } from "../components/billing/ProfileBoostModal";
import { MapPin, Link as LinkIcon } from "lucide-react";

const LoadingSpinner = () => (
  <div className={styles.loader}>Loading profile...</div>
);

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
  const navigate = useNavigate();

  // State for UI and Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isBoostModalOpen, setBoostModalOpen] = useState(false);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("loading");
  const [connectionCount, setConnectionCount] = useState(0);

  // State from Redux
  const { actionStatus: connectionActionStatus } = useSelector(
    (state) => state.connections || {}
  );
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const { items: allUsers, status: usersStatus } = useSelector(
    (state) => state.users || {}
  );
  const { items: allProjects, status: projectsStatus } = useSelector(
    (state) => state.projects || {}
  );
  const { reviewsByUser, status: reviewsStatus } = useSelector(
    (state) => state.reviews || {}
  );
  const { receivedItems: founderConnections } = useSelector(
    (state) => state.interests || {}
  );

  const userToDisplay = userId
    ? allUsers.find((u) => u._id === userId)
    : loggedInUser;
  const isOwnProfile =
    userToDisplay && loggedInUser && userToDisplay._id === loggedInUser._id;

  // Handlers for connection actions, wrapped in useCallback
  const connectionHandlers = {
    send: useCallback(() => {
      if (!userToDisplay) return;
      dispatch(sendConnectionRequest(userToDisplay._id))
        .unwrap()
        .then(() => setConnectionStatus("pending_sent"));
    }, [dispatch, userToDisplay]),
    accept: useCallback(() => {
      if (!userToDisplay) return;
      dispatch(acceptConnectionRequest(userToDisplay._id))
        .unwrap()
        .then(() => setConnectionStatus("connected"));
    }, [dispatch, userToDisplay]),
    decline: useCallback(() => {
      if (!userToDisplay) return;
      dispatch(removeOrCancelConnection(userToDisplay._id))
        .unwrap()
        .then(() => setConnectionStatus("not_connected"));
    }, [dispatch, userToDisplay]),
    cancel: useCallback(() => {
      if (!userToDisplay) return;
      dispatch(removeOrCancelConnection(userToDisplay._id))
        .unwrap()
        .then(() => setConnectionStatus("not_connected"));
    }, [dispatch, userToDisplay]),
    remove: useCallback(() => {
      if (
        !userToDisplay ||
        !window.confirm("Are you sure you want to remove this connection?")
      )
        return;
      dispatch(removeOrCancelConnection(userToDisplay._id))
        .unwrap()
        .then(() => setConnectionStatus("not_connected"));
    }, [dispatch, userToDisplay]),
  };

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
    if (userToDisplay) {
      // Fetch connection count for the displayed user
      API.get(`/connections/count/${userToDisplay._id}`)
        .then((res) => setConnectionCount(res.data.count))
        .catch((err) => console.error("Error fetching connection count:", err));
    }

    if (!isOwnProfile && loggedInUser && userToDisplay) {
      setConnectionStatus("loading");
      API.get(`/connections/status/${userToDisplay._id}`)
        .then((response) => setConnectionStatus(response.data.status))
        .catch(() => setConnectionStatus("not_connected"));
    }
  }, [isOwnProfile, loggedInUser, userToDisplay]);

  useEffect(() => {
    if (userId && loggedInUser && userId !== loggedInUser._id) {
      dispatch(recordProfileView(userId));
    }
  }, [userId, loggedInUser, dispatch]);

  const handleMessage = async () => {
    if (!userToDisplay) return;
    try {
      const { data } = await API.post("/messages/access", { userId: userToDisplay._id });
      navigate('/messages', { state: { conversationId: data._id } });
    } catch (error) {
      console.error("Error accessing chat:", error);
    }
  };

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
  const canLeaveReview =
    !isOwnProfile &&
    loggedInUser?.role === "founder" &&
    userToDisplay.role === "developer"; // This logic needs to be more advanced for real reviews

  return (
    <>
      <ProfileBoostModal
        user={userToDisplay}
        open={isBoostModalOpen}
        onClose={() => setBoostModalOpen(false)}
      />
      <LeaveReviewModal
        developer={userToDisplay}
        reviewableProjects={[]}
        open={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
      <AvatarUploadModal
        open={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />

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
                connectionStatus={connectionStatus}
                connectionHandlers={connectionHandlers}
                isConnectionLoading={connectionActionStatus === "loading"}
                onMessage={handleMessage}
                connectionCount={connectionCount}
              />

              <div className={styles.content}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>About Me:</h3>
                  <p>{userToDisplay.bio || "No bio provided."}</p>
                </div>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Skills:</h3>
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
                    <a
                      href={userToDisplay.portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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

// src/pages/ProfilePage.jsx

import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
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

  // State for UI and Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isBoostModalOpen, setBoostModalOpen] = useState(false);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("loading");

  // Messaging State
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");

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

  // Fetch chat access when connected
  useEffect(() => {
    if (connectionStatus === "connected" && userToDisplay && !isOwnProfile) {
      const accessChat = async () => {
        try {
          const { data } = await API.post("/messages/access", { userId: userToDisplay._id });
          setActiveChat(data);
        } catch (error) {
          console.error("Error accessing chat:", error);
        }
      };
      accessChat();
    }
  }, [connectionStatus, userToDisplay, isOwnProfile]);

  // Fetch messages for active chat
  useEffect(() => {
    if (activeChat) {
      const fetchMessages = async () => {
        try {
          const { data } = await API.get(`/messages/${activeChat._id}`);
          setMessages(data);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };
      fetchMessages();
    }
  }, [activeChat]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChat) return;

    try {
      const { data } = await API.post(`/messages/${activeChat._id}`, { content: newMessageText });
      setMessages((prev) => [...prev, data]);
      setNewMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
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

                {/* --- Messaing UI Section --- */}
                {!isOwnProfile && connectionStatus === "connected" && (
                  <>
                    <div className={styles.separator} />
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>
                        Message {userToDisplay.name.split(" ")[0]}
                      </h3>
                      
                      <div className={styles.chatContainer}>
                        {activeChat ? (
                          <>
                            <div className={styles.messagesList}>
                              {messages.length > 0 ? (
                                messages.map((msg) => (
                                  <div
                                    key={msg._id}
                                    className={`${styles.messageBubble} ${
                                      msg.sender._id === loggedInUser._id
                                        ? styles.sent
                                        : styles.received
                                    }`}
                                  >
                                    {msg.content}
                                    <span className={styles.messageTime}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted text-sm text-center py-4">No messages yet. Say hi!</p>
                              )}
                            </div>
                            <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
                              <input
                                type="text"
                                className={styles.chatInput}
                                placeholder="Type a message..."
                                value={newMessageText}
                                onChange={(e) => setNewMessageText(e.target.value)}
                              />
                              <button 
                                type="submit" 
                                className={styles.sendButton}
                                disabled={!newMessageText.trim()}
                              >
                                Send
                              </button>
                            </form>
                          </>
                        ) : (
                          <div className="text-center py-4">Loading chat...</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
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

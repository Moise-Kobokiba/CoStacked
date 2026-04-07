// src/pages/ProfilePage.jsx

import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styles from "./ProfilePage.module.css";

// Import Redux Actions
import { fetchUsers, recordProfileView } from "../features/users/usersSlice";
import { fetchProjects } from "../features/projects/projectsSlice";
import { fetchReviewsForUser } from "../features/reviews/reviewsSlice";
import { fetchReceivedInterests } from "../features/interests/interestsSlice";
import { 
  sendConnectionRequest, 
  acceptConnectionRequest, 
  removeOrCancelConnection, 
  fetchConnections, 
  fetchPendingRequests, 
  fetchConnectionCount 
} from "../features/connections/connectionsSlice";

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
import { 
  MapPin, Link as LinkIcon, X, ArrowLeft, 
  Globe, Github, Linkedin, Briefcase, Rocket, Laptop,
  Quote
} from "lucide-react";

const LoadingSpinner = () => (
  <div className={styles.loader}>
    <Card className={styles.card}>Loading profile...</Card>
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatPeriod = (start, end, isCurrent) => {
  const startStr = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  const endStr = isCurrent ? 'Present' : (end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
  return `${startStr} — ${endStr}`;
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
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  // State from Redux
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const { items: allUsers, status: usersStatus } = useSelector((state) => state.users);
  const { items: allProjects, status: projectsStatus } = useSelector((state) => state.projects);
  const { reviewsByUser, status: reviewsStatus } = useSelector((state) => state.reviews);
  const { receivedItems: founderConnections } = useSelector((state) => state.interests);
  const { connections, pendingRequests, actionStatus, connectionCounts } = useSelector((state) => state.connections);

  const userToDisplay = userId ? allUsers.find((u) => u._id === userId) : loggedInUser;
  const isOwnProfile = userToDisplay && loggedInUser && userToDisplay._id === loggedInUser._id;

  // Connection status helpers
  const getConnectionStatus = () => {
    if (!loggedInUser || !userToDisplay || isOwnProfile) return null;
    if (connections?.some(conn => conn._id === userToDisplay._id)) return 'connected';
    if (pendingRequests?.some(req => req.recipient?._id === userToDisplay._id)) return 'pending_sent';
    if (pendingRequests?.some(req => req.requester?._id === userToDisplay._id)) return 'pending_received';
    return 'not_connected';
  };

  const connectionStatus = getConnectionStatus();
  const isConnectionLoading = actionStatus === 'loading';

  const handleShare = useCallback(async () => {
    if (!userToDisplay) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${userToDisplay.name} on CoStacked`, url });
      } catch (err) { console.error(err); }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      } catch (err) { console.error(err); }
    }
  }, [userToDisplay]);

  // Connection handlers
  const connectionHandlers = {
    send: () => userToDisplay?._id && dispatch(sendConnectionRequest(userToDisplay._id)),
    cancel: () => userToDisplay?._id && dispatch(removeOrCancelConnection(userToDisplay._id)),
    remove: () => userToDisplay?._id && dispatch(removeOrCancelConnection(userToDisplay._id)),
    accept: () => userToDisplay?._id && dispatch(acceptConnectionRequest(userToDisplay._id)),
    decline: () => userToDisplay?._id && dispatch(removeOrCancelConnection(userToDisplay._id)),
  };

  const handleMessage = () => userToDisplay?._id && navigate(`/messages/${userToDisplay._id}`);

  // Data fetching
  useEffect(() => {
    if (usersStatus === "idle") dispatch(fetchUsers());
    if (projectsStatus === "idle") dispatch(fetchProjects());
    if (userToDisplay?._id) dispatch(fetchReviewsForUser(userToDisplay._id));
    if (loggedInUser && !isOwnProfile) {
      dispatch(fetchConnections());
      dispatch(fetchPendingRequests());
    }
    if (userToDisplay?._id && !connectionCounts[userToDisplay._id]) {
      dispatch(fetchConnectionCount(userToDisplay._id));
    }
  }, [userToDisplay?._id, usersStatus, projectsStatus, loggedInUser, isOwnProfile, dispatch, connectionCounts]);

  useEffect(() => {
    if (userId && loggedInUser && userId !== loggedInUser._id) {
      dispatch(recordProfileView(userId));
    }
  }, [userId, loggedInUser, dispatch]);

  if (usersStatus === "loading" || !userToDisplay) return <div className={styles.pageContainer}><LoadingSpinner /></div>;

  const developerReviews = reviewsByUser[userToDisplay._id] || [];
  const userProjects = userToDisplay.role === "founder" ? allProjects.filter((p) => p.founderId === userToDisplay._id) : [];
  const averageRating = developerReviews.length > 0 ? developerReviews.reduce((acc, r) => acc + r.rating, 0) / developerReviews.length : 0;
  
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

  const experience = userToDisplay.experience || [];
  const education = userToDisplay.education || [];

  return (
    <>
      <ProfileBoostModal user={userToDisplay} open={isBoostModalOpen} onClose={() => setBoostModalOpen(false)} />
      <LeaveReviewModal developer={userToDisplay} reviewableProjects={reviewableProjects} open={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} />
      <AvatarUploadModal open={isAvatarModalOpen} onClose={() => setAvatarModalOpen(false)} />

      {/* Image Viewer Modal */}
      {isImageViewerOpen && userToDisplay.avatarUrl && (
        <div className={styles.imageViewerOverlay} onClick={() => setImageViewerOpen(false)}>
          <div className={styles.imageViewerContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.imageViewerClose} onClick={() => setImageViewerOpen(false)}><X size={32} /></button>
            <img src={userToDisplay.avatarUrl} alt={userToDisplay.name} className={styles.imageViewerImage} />
          </div>
        </div>
      )}

      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          {userId && (
            <button className={styles.backButton} onClick={() => navigate('/users')}>
              <ArrowLeft size={18} />
              Back to Talent
            </button>
          )}

          {isEditing && isOwnProfile ? (
            <ProfileEditor user={userToDisplay} onSave={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
          ) : (
            <>
              {isOwnProfile && userToDisplay.isBoosted && new Date(userToDisplay.boostExpiresAt) > new Date() && (
                <div className={styles.boostBanner}>Your profile is boosted until {formatDate(userToDisplay.boostExpiresAt)}.</div>
              )}

              <ProfileHeader
                user={userToDisplay}
                isOwnProfile={isOwnProfile}
                onEdit={() => setIsEditing(true)}
                onBoost={() => setBoostModalOpen(true)}
                onReview={() => setReviewModalOpen(true)}
                canLeaveReview={canLeaveReview}
                onAvatarClick={() => setAvatarModalOpen(true)}
                onAvatarView={() => setImageViewerOpen(true)}
                onShare={handleShare}
                copySuccess={copySuccess}
                connectionStatus={connectionStatus}
                connectionHandlers={connectionHandlers}
                isConnectionLoading={isConnectionLoading}
                onMessage={handleMessage}
              />

              <div className={styles.layoutGrid}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Online Presence</h3>
                    <div className={styles.linksList}>
                      <a href={userToDisplay.portfolioLink || "#"} target="_blank" className={styles.linkItem}>
                        <div className={styles.linkInfo}>
                          <div className={styles.linkIconBox}><Globe size={18} /></div>
                          <span className={styles.linkText}>Portfolio</span>
                        </div>
                        <ArrowLeft size={14} className={styles.externalIcon} style={{ transform: 'rotate(135deg)' }} />
                      </a>
                      <a href={userToDisplay.socials?.linkedin || "#"} target="_blank" className={styles.linkItem}>
                        <div className={styles.linkInfo}>
                          <div className={styles.linkIconBox}><Linkedin size={18} /></div>
                          <span className={styles.linkText}>LinkedIn</span>
                        </div>
                        <ArrowLeft size={14} className={styles.externalIcon} style={{ transform: 'rotate(135deg)' }} />
                      </a>
                      <a href={userToDisplay.socials?.github || "#"} target="_blank" className={styles.linkItem}>
                        <div className={styles.linkInfo}>
                          <div className={styles.linkIconBox}><Github size={18} /></div>
                          <span className={styles.linkText}>GitHub</span>
                        </div>
                        <ArrowLeft size={14} className={styles.externalIcon} style={{ transform: 'rotate(135deg)' }} />
                      </a>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Education</h3>
                    <div className={styles.educationList}>
                      {education.length > 0 ? education.map((edu, idx) => (
                        <div key={idx} className={styles.eduItem}>
                          <div className={styles.eduDot}></div>
                          <p className={styles.eduDegree}>{edu.degree}</p>
                          <p className={styles.eduSchool}>{edu.school}</p>
                          <p className={styles.eduDate}>{edu.startDate} — {edu.endDate}</p>
                        </div>
                      )) : (
                        <div className={styles.emptyStateContainer}>
                          <p className={styles.emptyStateText}>No education history added.</p>
                          {isOwnProfile && <button className={styles.emptyStateBtn} onClick={() => setIsEditing(true)}>Add Education</button>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.statsGrid}>
                      <div className={styles.statBox}>
                        <p className={styles.statValue}>12</p>
                        <p className={styles.statLabel}>Projects</p>
                      </div>
                      <div className={styles.statBox}>
                        <p className={styles.statValue}>{developerReviews.length || 8}</p>
                        <p className={styles.statLabel}>Endorsements</p>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>About Me</h2>
                    <p className={styles.bioText}>{userToDisplay.bio || "Passionate builder looking for the next big challenge."}</p>
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Experience</h2>
                    <div className={styles.experienceList}>
                      {experience.length > 0 ? experience.map((exp, idx) => (
                        <div key={idx} className={styles.expItem}>
                          <div className={`${styles.expIconBox} ${idx > 0 ? styles.expIconBoxSecondary : ''}`}>
                            {exp.icon === 'rocket_launch' ? <Rocket size={24} /> : <Laptop size={24} />}
                          </div>
                          <div className={styles.expContent}>
                            <div className={styles.expHeader}>
                              <h4 className={styles.expTitle}>{exp.title}</h4>
                              <span className={styles.expPeriod}>{formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}</span>
                            </div>
                            <p className={styles.expCompany}>{exp.company} • {exp.employmentType}</p>
                            <p className={styles.bioText} style={{ fontSize: '0.875rem' }}>{exp.description}</p>
                          </div>
                        </div>
                      )) : (
                        <div className={styles.emptyStateContainer}>
                          <p className={styles.emptyStateText}>No professional experience added yet.</p>
                          {isOwnProfile && <button className={styles.emptyStateBtn} onClick={() => setIsEditing(true)}>Add Experience</button>}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Skills & Expertise</h2>
                    <div className={styles.skillGroup}>
                      <h4 className={styles.skillGroupLabel}>Core Technical</h4>
                      <div className={styles.skillsWrap}>
                        {(userToDisplay.skills?.length > 0 ? userToDisplay.skills : ['TypeScript', 'React.js', 'Node.js', 'Next.js', 'Tailwind CSS', 'GraphQL']).map(skill => (
                          <span key={skill} className={styles.skillTagPrimary}>{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.skillGroup}>
                      <h4 className={styles.skillGroupLabel}>Startup & Soft Skills</h4>
                      <div className={styles.skillsWrap}>
                        {['Product Strategy', 'Agile Leadership', 'Rapid Prototyping'].map(skill => (
                          <span key={skill} className={styles.skillTagSecondary}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Endorsements</h2>
                      <button className={styles.requestBtn}>Request Endorsement</button>
                    </div>
                    <div className={styles.endorsementsGrid}>
                      {developerReviews.length > 0 ? developerReviews.map(review => (
                        <div key={review._id} className={styles.endorsementCard}>
                          <Quote className={styles.quoteIcon} size={32} />
                          <p className={styles.endorsementText}>"{review.comment}"</p>
                          <div className={styles.endorserInfo}>
                             <div className={styles.endorserAvatar}>
                                <img src={review.reviewerId?.avatarUrl || "https://ui-avatars.com/api/?name=" + review.reviewerId?.name} alt={review.reviewerId?.name} />
                             </div>
                             <div>
                                <p className={styles.endorserName}>{review.reviewerId?.name}</p>
                                <p className={styles.endorserRole}>{review.reviewerId?.role || 'Co-founder'}</p>
                             </div>
                          </div>
                        </div>
                      )) : (
                        <>
                          <div className={styles.endorsementCard}>
                            <Quote className={styles.quoteIcon} size={32} />
                            <p className={styles.endorsementText}>"Nicko is an exceptional developer... His ability to pivot and adapt in a fast-paced environment is exactly what any co-founder needs."</p>
                            <div className={styles.endorserInfo}>
                              <div className={styles.endorserAvatar}><img src="https://i.pravatar.cc/150?u=alex" alt="Alex" /></div>
                              <div>
                                <p className={styles.endorserName}>Alex Rivera</p>
                                <p className={styles.endorserRole}>CTO, Nexus Ventures</p>
                              </div>
                            </div>
                          </div>
                          <div className={styles.endorsementCard}>
                            <Quote className={styles.quoteIcon} size={32} />
                            <p className={styles.endorsementText}>"Working with Nicko was a breeze. He's technically proficient but also a great communicator."</p>
                            <div className={styles.endorserInfo}>
                              <div className={styles.endorserAvatar}><img src="https://i.pravatar.cc/150?u=sarah" alt="Sarah" /></div>
                              <div>
                                <p className={styles.endorserName}>Sarah Chen</p>
                                <p className={styles.endorserRole}>Product Manager, Creative Labs</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
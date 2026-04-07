// src/pages/DashboardPage.jsx

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchReceivedInterests, fetchSentInterests } from '../features/interests/interestsSlice';
import { fetchMyProjects } from '../features/projects/projectsSlice';
import { fetchReviewsForUser } from '../features/reviews/reviewsSlice';
import { fetchPendingRequests } from '../features/connections/connectionsSlice'; // 1. Import action for pending requests
import styles from './DashboardPage.module.css';

// Import our specialized dashboard components
import { FounderDashboard } from '../components/dashboard/FounderDashboard';
import { DeveloperDashboard } from '../components/dashboard/DeveloperDashboard';
import { ProfileCompletionModal } from '../components/profile/ProfileCompletionModal';

/**
 * The DashboardPage is a "smart" container component that fetches all necessary
 * data for the logged-in user and passes it to the appropriate sub-component.
 */
export const DashboardPage = () => {
  const dispatch = useDispatch();

  // === SELECT ALL NECESSARY DATA FROM THE REDUX STORE ===
  const { user: currentUser } = useSelector((state) => state.auth);
  // Provide default empty objects to prevent crashes on initial render
  const { receivedItems = [], sentItems = [] } = useSelector(state => state.interests || {});
  const { myItems: userProjects = [] } = useSelector(state => state.projects || {});
  const { reviewsByUser = {} } = useSelector(state => state.reviews || {});
  const { pendingRequests = [] } = useSelector(state => state.connections || {}); // 2. Get pending connections

  // This effect runs when the user is available and dispatches all data-fetching actions.
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'founder') {
        dispatch(fetchReceivedInterests());
        dispatch(fetchMyProjects());
        // A founder also needs to know about their pending connection requests
        dispatch(fetchPendingRequests()); 
      } 
      else if (currentUser.role === 'developer') {
        dispatch(fetchSentInterests());
        dispatch(fetchReviewsForUser(currentUser._id));
        // A developer also needs to know about their pending connection requests
        dispatch(fetchPendingRequests()); 
      }
    }
  }, [currentUser, dispatch]);
  
  // Show a loading state while the user object is being authenticated.
  if (!currentUser) {
    return <div className={styles.pageContainer}><h2 className={styles.title}>Loading Dashboard...</h2></div>;
  }
  
  // Derive the specific reviews for the current user
  const developerReviews = reviewsByUser[currentUser._id] || [];
  
  return (
    <div className={styles.pageContainer}>
      {/* This switcher logic cleanly separates the UI for each role */}
      {currentUser.role === 'founder' ? (
        <FounderDashboard
          currentUser={currentUser}
          interests={receivedItems} // These are project interests
          userProjects={userProjects}
          pendingConnections={pendingRequests} // 4. Pass down pending requests to FounderDashboard
        />
      ) : (
        <DeveloperDashboard
          currentUser={currentUser}
          sentItems={sentItems} // These are project interests
          developerReviews={developerReviews}
          pendingConnections={pendingRequests} // 4. Pass down pending requests to DeveloperDashboard
        />
      )}

      {/* Profile Completion Modal for Existing Users */}
      <ProfileCompletionModal user={currentUser} />
    </div>
  );
};
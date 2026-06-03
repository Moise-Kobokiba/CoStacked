// src/pages/MyNetworkPage.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConnections } from '../features/connections/connectionsSlice';
import { UserCard } from '../components/shared/UserCard'; // Reuse the existing UserCard
import styles from './MyNetworkPage.module.css';

const LoadingSpinner = () => <div className={styles.message}>Loading your network...</div>;
const EmptyState = () => <div className={styles.message}>You haven't made any connections yet. Build your network by connecting with other users on their profiles.</div>;
const ErrorState = ({ error }) => <div className={styles.error}>Error: {error}</div>;

export const MyNetworkPage = () => {
  const dispatch = useDispatch();

  // Get the connections data and status from the Redux store, providing a default empty object.
  const { connections, status, error } = useSelector(state => state.connections || {});

  // Fetch the connections when the component first mounts.
  // createAsyncThunk prevents re-fetching if a request is already in flight.
  useEffect(() => {
    dispatch(fetchConnections());
  }, [dispatch]);

  let content;
  
  // 1. Show a loading spinner if the initial fetch is happening or in progress.
  if (status === 'loading' || status === 'idle') {
    content = <LoadingSpinner />;
  } 
  // 2. Show an error message if the fetch failed.
  else if (status === 'failed') {
    content = <ErrorState error={error} />;
  } 
  // 3. Only once the fetch has succeeded, decide what to render.
  else if (status === 'succeeded') {
    content = connections.length > 0 ? (
      <div className={styles.grid}>
        {connections.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>
    ) : (
      // If the fetch was successful but the array is empty, show the empty state message.
      <EmptyState />
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Network</h1>
        {/* Only show the connection count after the data has successfully loaded */}
        {status === 'succeeded' && (
          <p className={styles.subtitle}>
            You have {connections.length} {connections.length === 1 ? 'connection' : 'connections'}.
          </p>
        )}
      </header>
      
      <main>
        {content}
      </main>
    </div>
  );
};
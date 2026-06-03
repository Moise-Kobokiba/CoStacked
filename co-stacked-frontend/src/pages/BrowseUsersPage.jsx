// src/pages/BrowseUsersPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../features/users/usersSlice';
import styles from './BrowseUsersPage.module.css';

import { UserCard } from '../components/shared/UserCard';
import { Carousel } from '../components/shared/Carousel'; // 1. Import the new Carousel component
import { CombinedSearchInput } from '../components/shared/CombinedSearchInput';

const LoadingSpinner = () => <div className={styles.loader}>Loading talent...</div>;
const ErrorDisplay = ({ error }) => <p className={styles.error}>Error: {error}</p>;

export const BrowseUsersPage = () => {
  const dispatch = useDispatch();
  
  const { items: allUsers, status, error } = useSelector((state) => state.users);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [dispatch, status]);
  
  // Memoized calculation to sort and filter the user list
  const sortedAndFilteredUsers = useMemo(() => {
    if (!Array.isArray(allUsers)) return [];

    const now = new Date();

    return [...allUsers]
      .sort((a, b) => {
        const aIsBoosted = a.isBoosted && new Date(a.boostExpiresAt) > now;
        const bIsBoosted = b.isBoosted && new Date(b.boostExpiresAt) > now;

        if (aIsBoosted && !bIsBoosted) return -1;
        if (!aIsBoosted && bIsBoosted) return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .filter(user => {
        const searchLower = searchQuery.toLowerCase();
        const locationLower = locationQuery.toLowerCase();
        
        const matchesSearch = 
          user.name?.toLowerCase().includes(searchLower) ||
          user.role?.toLowerCase().includes(searchLower) ||
          (Array.isArray(user.skills) && user.skills.some(skill => skill.toLowerCase().includes(searchLower)));

        const matchesLocation = user.location ? user.location.toLowerCase().includes(locationLower) : true;
        
        return matchesSearch && matchesLocation;
      });
  }, [allUsers, searchQuery, locationQuery]);

  const now = new Date();
  const featuredUsers = sortedAndFilteredUsers.filter(user => user.isBoosted && new Date(user.boostExpiresAt) > now);
  const latestUsers = sortedAndFilteredUsers.filter(user => !user.isBoosted || new Date(user.boostExpiresAt) <= now);

  let content;

  if (status === 'loading' || status === 'idle') {
    content = <LoadingSpinner />;
  } else if (status === 'succeeded') {
    content = (
      <>
        {/* --- Section 1: Featured Talent --- */}
        {featuredUsers.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>Featured Talent</h2>
            {/* --- 2. REPLACE the div with the Carousel component --- */}
            <Carousel>
              {featuredUsers.map((user) => <UserCard key={user._id} user={user} />)}
            </Carousel>
          </section>
        )}

        {/* --- Section 2: Latest Profiles --- */}
        {latestUsers.length > 0 && (
          <section className={styles.latestSection}>
            <h2 className={styles.sectionTitle}>Latest Profiles</h2>
            <div className={styles.grid}>
              {latestUsers.map((user) => <UserCard key={user._id} user={user} />)}
            </div>
          </section>
        )}
        
        {/* --- Empty State Message --- */}
        {sortedAndFilteredUsers.length === 0 && (
          <p className={styles.noResults}>No talent found matching your criteria.</p>
        )}
      </>
    );
  } else if (status === 'failed') {
    content = <ErrorDisplay error={error} />;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Find Talent</h1>
        <CombinedSearchInput
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          locationValue={locationQuery}
          onLocationChange={(e) => setLocationQuery(e.target.value)}
          searchPlaceholder="Search by name, role, or skill..."
          locationPlaceholder="e.g., Cape Town, WC"
        />
      </header>

      <main className={styles.mainContent}>
        {content}
      </main>
    </div>
  );
};
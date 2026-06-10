/**
 * Shared presence utility used across UserCard, ProfileHeader,
 * MyNetwork, Browse Talent, Messages, and Connections.
 *
 * Returns a normalised label + type so every consumer stays consistent.
 */

export const getPresenceStatus = (user) => {
  // --- Online check (field may be named isOnline or isOnline) ---
  if (user?.isOnline) {
    return {
      label: 'Active Now',
      type: 'online',
    };
  }

  // --- No timestamp at all → treat as plain offline ---
  if (!user?.lastActiveAt && !user?.lastSeen) {
    return {
      label: 'Offline',
      type: 'offline',
    };
  }

  // --- Calculate hours since last activity ---
  const referenceTime = user.lastActiveAt || user.lastSeen;
  const hours =
    (Date.now() - new Date(referenceTime).getTime()) / (1000 * 60 * 60);

  if (hours < 24) {
    return {
      label: 'Active Today',
      type: 'today',
    };
  }

  if (hours < 48) {
    return {
      label: 'Active Yesterday',
      type: 'yesterday',
    };
  }

  const days = Math.floor(hours / 24);
  return {
    label: `Last seen ${days} day${days !== 1 ? 's' : ''} ago`,
    type: 'offline',
  };
};

/**
 * Returns the appropriate CSS class name for a presence indicator dot.
 */
export const getPresenceDotClass = (type) => {
  switch (type) {
    case 'online':
      return 'presenceDotOnline';
    case 'today':
      return 'presenceDotToday';
    case 'yesterday':
      return 'presenceDotYesterday';
    default:
      return 'presenceDotOffline';
  }
};

/**
 * Returns the appropriate CSS class name for a presence badge/pill.
 */
export const getPresencePillClass = (type) => {
  switch (type) {
    case 'online':
      return 'presencePillOnline';
    case 'today':
      return 'presencePillToday';
    case 'yesterday':
      return 'presencePillYesterday';
    default:
      return 'presencePillOffline';
  }
};
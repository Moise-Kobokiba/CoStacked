// Centralized validation thresholds and rules for Validation Board
module.exports = {
  VALIDATION: {
    // Minimum backend validation score required to convert an idea to a project
    MIN_CONVERSION_SCORE: 60,
    // Upvote count at which an idea is considered "highly validated" for UI messaging
    HIGHLY_VALIDATED_UPVOTE_THRESHOLD: 80,
    // Days after which downvote-dominant ideas are considered weak
    WEAK_VALIDATION_DAYS: 3,
    // Percentage threshold of downvotes to consider validation weak
    WEAK_VALIDATION_DOWNVOTE_PERCENT: 50,
  },
};

import Review from './reviewModel.js';

/**
 * Add a new review to a report
 * @param {Object} reviewData - Review data object
 * @param {string} reviewData.report - Report ID
 * @param {string} reviewData.author - User ID who wrote the review
 * @param {string} reviewData.comment - Review comment
 * @param {boolean} reviewData.upvote - Whether the review is an upvote
 * @returns {Promise<Object>} Created review object
 */
export async function addReview(reviewData) {
  try {
    const review = new Review(reviewData);
    const savedReview = await review.save();
    
    // Populate author information
    const populatedReview = await Review.findById(savedReview._id)
      .populate('author', 'username')
      .exec();
    
    return populatedReview;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - user already reviewed this report
      throw new Error('You have already reviewed this report');
    }
    throw error;
  }
}

/**
 * Get all reviews for a specific report
 * @param {string} reportId - Report ID
 * @returns {Promise<Array>} Array of review objects with populated author data
 */
export async function getReviewsForReport(reportId) {
  try {
    const reviews = await Review.find({ report: reportId })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .exec();
    
    return reviews;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a review if the user is the author
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID attempting to delete
 * @returns {Promise<boolean>} True if deleted, false if not found or not author
 */
export async function deleteReviewByAuthor(reviewId, userId) {
  try {
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return false;
    }
    
    // Check if user is the author
    if (review.author.toString() !== userId) {
      return false;
    }
    
    await Review.findByIdAndDelete(reviewId);
    return true;
  } catch (error) {
    throw error;
  }
} 
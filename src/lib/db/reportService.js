import Report from './reportModel.js';

/**
 * Create a new report
 * @param {Object} reportData - Report data object
 * @param {string} reportData.title - Report title
 * @param {string} reportData.description - Report description
 * @param {string} reportData.category - Report category (garbage, waterlogging, other)
 * @param {Object} reportData.location - Location object with lat and lng
 * @param {string} reportData.imageUrl - Image URL
 * @param {string} reportData.createdBy - User ID who created the report
 * @returns {Promise<Object>} Created report object
 */
export async function createReport(reportData) {
  try {
    const report = new Report(reportData);
    const savedReport = await report.save();
    return savedReport;
  } catch (error) {
    throw error;
  }
}

/**
 * Get report by ID with populated user data
 * @param {string} reportId - Report ID
 * @returns {Promise<Object|null>} Report object with populated user or null if not found
 */
export async function getReportById(reportId) {
  try {
    const report = await Report.findById(reportId)
      .populate('createdBy', 'username email')
      .exec();
    return report;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete report if the user is the owner
 * @param {string} reportId - Report ID
 * @param {string} userId - User ID attempting to delete
 * @returns {Promise<boolean>} True if deleted, false if not found or not owner
 */
export async function deleteReportIfOwner(reportId, userId) {
  try {
    const report = await Report.findById(reportId);
    
    if (!report) {
      return false;
    }
    
    // Check if user is the owner
    if (report.createdBy.toString() !== userId) {
      return false;
    }
    
    await Report.findByIdAndDelete(reportId);
    return true;
  } catch (error) {
    throw error;
  }
} 
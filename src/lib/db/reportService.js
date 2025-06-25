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
 * Get all reports with pagination and sorting
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Number of reports per page
 * @param {string} [options.category] - Filter by category
 * @param {boolean} [options.resolved] - Filter by resolved status
 * @returns {Promise<Object>} Object containing reports and pagination info
 */
export async function getAllReports(options = {}) {
  try {
    const { page = 1, limit = 20, category, resolved } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (resolved !== undefined) query.resolved = resolved;

    // Execute query with pagination
    const reports = await Report.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title category location imageUrl resolved createdAt _id')
      .exec();

    // Get total count for pagination
    const total = await Report.countDocuments(query);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get report by ID with populated user data
 * @param {string} reportId - Report ID
 * @param {boolean} [includeReviews=false] - Whether to include reviews
 * @returns {Promise<Object|null>} Report object with populated user or null if not found
 */
export async function getReportById(reportId, includeReviews = false) {
  try {
    let query = Report.findById(reportId)
      .populate('createdBy', 'username email');

    if (includeReviews) {
      query = query.populate({
        path: 'reviews',
        populate: {
          path: 'author',
          select: 'username'
        }
      });
    }

    const report = await query.exec();
    return report;
  } catch (error) {
    throw error;
  }
}

/**
 * Update report by ID
 * @param {string} reportId - Report ID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.title] - New title
 * @param {string} [updateData.description] - New description
 * @param {string} [updateData.category] - New category
 * @param {Object} [updateData.location] - New location
 * @param {Array} [updateData.newImages] - New images to add
 * @param {Array} [updateData.imagesToDelete] - Image public IDs to delete
 * @returns {Promise<Object|null>} Updated report object or null if not found
 */
export async function updateReport(reportId, updateData) {
  try {
    const { newImages, imagesToDelete, ...otherUpdates } = updateData;
    
    // Start with basic updates
    const updateFields = {};
    
    if (otherUpdates.title !== undefined) {
      updateFields.title = otherUpdates.title.trim();
    }
    if (otherUpdates.description !== undefined) {
      updateFields.description = otherUpdates.description.trim();
    }
    if (otherUpdates.category !== undefined) {
      updateFields.category = otherUpdates.category;
    }
    if (otherUpdates.location !== undefined) {
      updateFields.location = otherUpdates.location;
    }

    // Get current report to handle image updates
    const currentReport = await Report.findById(reportId);
    if (!currentReport) {
      return null;
    }

    // Handle image deletions
    if (imagesToDelete && imagesToDelete.length > 0) {
      const currentImages = currentReport.images || [];
      const filteredImages = currentImages.filter(img => 
        !imagesToDelete.includes(img.publicId)
      );
      updateFields.images = filteredImages;
      
      // Update main imageUrl if the deleted image was the main one
      if (currentReport.imageUrl && imagesToDelete.some(id => 
        currentImages.find(img => img.publicId === id)?.url === currentReport.imageUrl
      )) {
        updateFields.imageUrl = filteredImages[0]?.url || '';
      }
    }

    // Handle new images
    if (newImages && newImages.length > 0) {
      const currentImages = updateFields.images || currentReport.images || [];
      updateFields.images = [...currentImages, ...newImages];
      
      // Set main imageUrl if none exists
      if (!updateFields.imageUrl && !currentReport.imageUrl) {
        updateFields.imageUrl = newImages[0]?.url || '';
      }
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    return updatedReport;
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
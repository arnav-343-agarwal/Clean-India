import { NextResponse } from 'next/server';
import { connectToDatabase, getReportById, updateReport, deleteReportIfOwner } from '@/lib/db';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { geocodeAddress } from '@/lib/geocode';

/**
 * GET /api/report/[id]
 * Get a specific report by ID
 */
export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectToDatabase();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeReviews = searchParams.get('includeReviews') === 'true';

    // Validate report ID
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Get report with optional reviews
    const report = await getReportById(id, includeReviews);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Format response
    const formattedReport = {
      _id: report._id,
      title: report.title,
      description: report.description,
      category: report.category,
      location: report.location,
      imageUrl: report.imageUrl,
      images: report.images || [],
      resolved: report.resolved,
      resolvedAt: report.resolvedAt,
      resolvedBy: report.resolvedBy,
      createdAt: report.createdAt,
      createdBy: {
        _id: report.createdBy._id,
        username: report.createdBy.username,
        email: report.createdBy.email
      }
    };

    // Include reviews if requested
    if (includeReviews && report.reviews) {
      formattedReport.reviews = report.reviews.map(review => ({
        _id: review._id,
        comment: review.comment,
        upvote: review.upvote,
        createdAt: review.createdAt,
        author: {
          _id: review.author._id,
          username: review.author.username
        }
      }));
    }

    return NextResponse.json({
      success: true,
      report: formattedReport
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/report/[id]
 * Update a specific report by ID
 */
export async function PATCH(request, { params }) {
  try {
    // Connect to database
    await connectToDatabase();

    const { id } = params;

    // Validate report ID
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, category, location, address, newImages, imagesToDelete } = body;

    // Get user ID from request (replace with actual authentication)
    const userId = request.headers.get('user-id') || 'placeholder-user-id';
    
    if (userId === 'placeholder-user-id') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current report to check ownership
    const currentReport = await getReportById(id);
    
    if (!currentReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (currentReport.createdBy._id.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only edit your own reports' },
        { status: 403 }
      );
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['garbage', 'waterlogging', 'other'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category. Must be one of: garbage, waterlogging, other' },
          { status: 400 }
        );
      }
    }

    let finalLocation = location;

    // If address is provided, geocode it
    if (address && !location) {
      try {
        const coords = await geocodeAddress(address);
        finalLocation = coords;
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to geocode address: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Handle image deletions first
    if (imagesToDelete && imagesToDelete.length > 0) {
      for (const publicId of imagesToDelete) {
        try {
          await deleteImage(publicId);
        } catch (error) {
          console.error(`Failed to delete image ${publicId}:`, error);
          // Continue with other deletions even if one fails
        }
      }
    }

    // Handle new image uploads
    let uploadedNewImages = [];
    if (newImages && newImages.length > 0) {
      for (const image of newImages) {
        try {
          const uploadResult = await uploadImage(image);
          uploadedNewImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
          });
        } catch (error) {
          // If image upload fails, clean up any previously uploaded images
          for (const uploadedImage of uploadedNewImages) {
            try {
              await deleteImage(uploadedImage.publicId);
            } catch (cleanupError) {
              console.error('Failed to cleanup image:', cleanupError);
            }
          }
          
          return NextResponse.json(
            { error: `Failed to upload image: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (finalLocation !== undefined) updateData.location = finalLocation;
    if (imagesToDelete !== undefined) updateData.imagesToDelete = imagesToDelete;
    if (uploadedNewImages.length > 0) updateData.newImages = uploadedNewImages;

    // Update the report
    const updatedReport = await updateReport(id, updateData);

    if (!updatedReport) {
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    // Format response
    const formattedReport = {
      _id: updatedReport._id,
      title: updatedReport.title,
      description: updatedReport.description,
      category: updatedReport.category,
      location: updatedReport.location,
      imageUrl: updatedReport.imageUrl,
      images: updatedReport.images || [],
      resolved: updatedReport.resolved,
      resolvedAt: updatedReport.resolvedAt,
      resolvedBy: updatedReport.resolvedBy,
      createdAt: updatedReport.createdAt,
      createdBy: {
        _id: updatedReport.createdBy._id,
        username: updatedReport.createdBy.username,
        email: updatedReport.createdBy.email
      }
    };

    return NextResponse.json({
      success: true,
      report: formattedReport
    });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/report/[id]
 * Delete a specific report by ID
 */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    // Replace with your actual authentication logic
    const userId = request.headers.get('user-id') || 'placeholder-user-id';
    if (userId === 'placeholder-user-id') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (report.createdBy._id.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only delete your own reports' }, { status: 403 });
    }

    // Delete all images from Cloudinary
    if (report.images && report.images.length > 0) {
      for (const img of report.images) {
        try { await deleteImage(img.publicId); } catch (e) { /* ignore */ }
      }
    } else if (report.imageUrl && report.images?.length === 0) {
      // fallback: try to delete main image if images array is empty
      try { await deleteImage(report.imageUrl); } catch (e) { /* ignore */ }
    }

    // Delete the report
    const deleted = await deleteReportIfOwner(id, userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
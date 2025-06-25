import { NextResponse } from 'next/server';
import { connectToDatabase, createReport, getAllReports } from '@/lib/db';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { geocodeAddress } from '@/lib/geocode';

/**
 * POST /api/report
 * Create a new report
 */
export async function POST(request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { title, description, category, location, address, newImages } = body;

    // Validate required fields
    if (!title || !description || !category || !newImages || (!location && !address)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, images, and location/address' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['garbage', 'waterlogging', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: garbage, waterlogging, other' },
        { status: 400 }
      );
    }

    // Get user ID from request (you'll need to implement authentication middleware)
    // For now, we'll use a placeholder - replace with actual user authentication
    let userId = request.headers.get('user-id') || 'placeholder-user-id';
    // Bypass authentication for local testing
    if (userId === 'placeholder-user-id') {
      userId = '000000000000000000000001'; // Use a dummy ObjectId for local testing
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

    // Upload images to Cloudinary
    const uploadedImages = [];
    
    for (const image of newImages) {
      try {
        const uploadResult = await uploadImage(image);
        uploadedImages.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        });
      } catch (error) {
        // If image upload fails, clean up any previously uploaded images
        for (const uploadedImage of uploadedImages) {
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

    // Create report data
    const reportData = {
      title: title.trim(),
      description: description.trim(),
      category,
      location: finalLocation,
      imageUrl: uploadedImages[0]?.url || '', // Use first image as main image
      images: uploadedImages, // Store all images with their public IDs
      createdBy: userId
    };

    // Save report to database
    const savedReport = await createReport(reportData);

    return NextResponse.json({
      success: true,
      report: {
        _id: savedReport._id,
        title: savedReport.title,
        category: savedReport.category,
        location: savedReport.location,
        imageUrl: savedReport.imageUrl,
        createdAt: savedReport.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/report
 * Get all reports with pagination and filtering
 */
export async function GET(request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const category = searchParams.get('category');
    const resolved = searchParams.get('resolved');

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build options object
    const options = { page, limit };
    if (category) options.category = category;
    if (resolved !== null) options.resolved = resolved === 'true';

    // Get reports
    const result = await getAllReports(options);

    // Format response
    const formattedReports = result.reports.map(report => ({
      _id: report._id,
      title: report.title,
      category: report.category,
      location: report.location,
      thumbnail: report.imageUrl,
      status: report.resolved ? 'resolved' : 'pending',
      createdAt: report.createdAt,
      createdBy: report.createdBy?.username || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
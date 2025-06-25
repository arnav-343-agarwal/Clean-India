import { NextResponse } from 'next/server';
import { connectToDatabase, getReportById, updateReport } from '@/lib/db';

/**
 * PATCH /api/report/[id]/resolve
 * Mark a report as resolved (admin only)
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    // Replace with your actual authentication logic
    const isAdmin = request.headers.get('is-admin') === 'true';
    const adminEmail = request.headers.get('user-email') || '';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updateData = {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: adminEmail
    };
    const updatedReport = await updateReport(id, updateData);
    if (!updatedReport) {
      return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: {
      _id: updatedReport._id,
      resolved: updatedReport.resolved,
      resolvedAt: updatedReport.resolvedAt,
      resolvedBy: updatedReport.resolvedBy
    }});
  } catch (error) {
    console.error('Error resolving report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            enabled: true,
            privacyCompliant: true,
            dataRetentionDays: 30,
            personalDataCollected: false,
          },
        });

      case 'summary':
        // In a real implementation, this would aggregate analytics data
        // For now, return a mock summary
        return NextResponse.json({
          success: true,
          data: {
            totalSessions: 0,
            totalCommands: 0,
            topCommands: [],
            topFiles: [],
            conversionRate: 0,
            averageSessionDuration: 0,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'track':
        // In a real implementation, this would store analytics events
        // For privacy compliance, we don't actually store anything server-side
        console.log('Analytics event tracked (client-side only):', data?.type);
        return NextResponse.json({ success: true, message: 'Event tracked' });

      case 'consent':
        // Handle consent changes
        const { consent } = data;
        console.log('Analytics consent updated:', consent);
        return NextResponse.json({ success: true, message: 'Consent updated' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

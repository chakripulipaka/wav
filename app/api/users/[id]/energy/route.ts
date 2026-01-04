import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify the user is authenticated and is modifying their own energy
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, reason } = body;

    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get current user profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_energy')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentEnergy = (profile as any).total_energy as number;

    // Calculate new energy (prevent going below 0)
    const newEnergy = Math.max(0, currentEnergy + amount);

    // Update the user's energy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        total_energy: newEnergy,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating energy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update energy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      previousEnergy: currentEnergy,
      newEnergy: newEnergy,
      change: amount,
      reason: reason || 'blackjack'
    });
  } catch (error) {
    console.error('Update energy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current energy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const supabase = getSupabaseAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('total_energy')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({
      energy: (profile as any).total_energy as number
    });
  } catch (error) {
    console.error('Get energy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

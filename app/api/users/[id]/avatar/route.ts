import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserById, uploadAvatar, deleteAvatar, updateUserAvatar } from '@/lib/supabase';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify authentication
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only update their own avatar
    if (authUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get current user (to check for existing avatar)
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old avatar if exists
    if (currentUser.avatar_url) {
      await deleteAvatar(currentUser.avatar_url);
    }

    // Upload new avatar
    const avatarUrl = await uploadAvatar(userId, buffer, file.name, file.type);

    if (!avatarUrl) {
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Update user's avatar_url in database
    const updatedUser = await updateUserAvatar(userId, avatarUrl);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Return updated user without password_hash
    const { password_hash: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      message: 'Avatar updated successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

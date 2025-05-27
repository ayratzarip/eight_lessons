import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get detailed user information from database
    const userEmail = session.user.email;
    
    // If no email in session, return error
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
    }
    
    // Find user with related accounts, sessions, and progress
    const userData = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: true,
        sessions: true,
        progress: true
      }
    });
    
    // If user not found in database, return session data only
    if (!userData) {
      return NextResponse.json({
        ...session.user,
        accounts: [],
        sessions: [],
        progress: []
      });
    }
    
    // Return the user with their accounts, sessions, and progress
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
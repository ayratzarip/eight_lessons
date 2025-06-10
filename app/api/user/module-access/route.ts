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
    
    // Get user email
    const userEmail = session.user.email;
    
    // If no email in session, return error
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
    }
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get all modules the user has access to
    const moduleAccess = await prisma.moduleAccess.findMany({
      where: {
        userId: user.id
      },
      include: {
        module: true
      }
    });
    
    // Get all modules the user has purchased
    const modulePurchases = await prisma.modulePurchase.findMany({
      where: {
        userId: user.id
      },
      include: {
        module: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      userId: user.id,
      moduleAccess,
      modulePurchases
    });
  } catch (error) {
    console.error('Error fetching user module access:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
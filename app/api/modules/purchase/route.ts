import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
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
    
    // Parse request body
    const { moduleId, price, paymentId } = await request.json();
    
    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }
    
    if (!price) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 });
    }
    
    // Find the module to verify it exists
    const moduleData = await prisma.module.findUnique({
      where: { id: moduleId }
    });
    
    if (!moduleData) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Check if user already has access to this module
    const existingAccess = await prisma.moduleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId: user.id,
          moduleId: moduleId
        }
      }
    });
    
    const existingPurchase = await prisma.modulePurchase.findFirst({
      where: {
        userId: user.id,
        moduleId: moduleId
      }
    });
    
    if (existingAccess || existingPurchase) {
      return NextResponse.json(
        { error: 'User already has access to this module' },
        { status: 400 }
      );
    }
    
    // Create purchase record
    const purchase = await prisma.modulePurchase.create({
      data: {
        userId: user.id,
        moduleId: moduleId,
        price: price,
        paymentId: paymentId
      }
    });
    
    // Also create module access record (automatically granted through purchase)
    const access = await prisma.moduleAccess.create({
      data: {
        userId: user.id,
        moduleId: moduleId,
        grantedByAdmin: false // This access was granted through purchase
      }
    });
    
    return NextResponse.json({
      message: 'Module purchased successfully',
      purchase,
      access
    });
  } catch (error) {
    console.error('Error purchasing module:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
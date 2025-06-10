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
    
    // TODO: Add admin check here
    // For now, any authenticated user can grant access
    // In production, you should check if the user has admin privileges
    
    // Parse request body
    const { userId, moduleId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify module exists
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
          userId: userId,
          moduleId: moduleId
        }
      }
    });
    
    if (existingAccess) {
      return NextResponse.json(
        { error: 'User already has access to this module' },
        { status: 400 }
      );
    }
    
    // Create module access record
    const access = await prisma.moduleAccess.create({
      data: {
        userId: userId,
        moduleId: moduleId,
        grantedByAdmin: true
      }
    });
    
    return NextResponse.json({
      message: 'Module access granted successfully',
      access
    });
  } catch (error) {
    console.error('Error granting module access:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // TODO: Add admin check here
    
    // Parse request body
    const { userId, moduleId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }
    
    // Remove module access
    const deletedAccess = await prisma.moduleAccess.deleteMany({
      where: {
        userId: userId,
        moduleId: moduleId
      }
    });
    
    if (deletedAccess.count === 0) {
      return NextResponse.json(
        { error: 'No access found to remove' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Module access removed successfully'
    });
  } catch (error) {
    console.error('Error removing module access:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
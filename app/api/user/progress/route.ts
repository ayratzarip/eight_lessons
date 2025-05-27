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
    const { lessonId } = await request.json();
    
    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }
    
    // Find the lesson to verify it exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true }
    });
    
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    
    // Check if user has access to this lesson
    
    // Get all modules ordered by position
    const modules = await prisma.module.findMany({
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    });
    
    // Get user's progress
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: user.id }
    });
    
    // Find the current module index
    const currentModuleIndex = modules.findIndex(m => m.id === lesson.moduleId);
    const currentModule = modules[currentModuleIndex];
    
    // Check if previous module's last lesson is completed
    let previousModuleCompleted = currentModuleIndex === 0; // First module is always accessible
    
    if (!previousModuleCompleted && currentModuleIndex > 0) {
      const previousModule = modules[currentModuleIndex - 1];
      if (previousModule.lessons.length > 0) {
        // Get the last lesson of the previous module (highest order)
        const lastLesson = previousModule.lessons.reduce((prev, current) => 
          prev.order > current.order ? prev : current
        );
        
        // Check if this last lesson is completed
        previousModuleCompleted = userProgress.some(progress => 
          progress.lessonId === lastLesson.id && progress.completed
        );
      } else {
        // If previous module has no lessons, consider it completed
        previousModuleCompleted = true;
      }
    }
    
    // If this lesson is in a module that's not accessible yet, return error
    if (!previousModuleCompleted) {
      return NextResponse.json(
        { error: 'Cannot complete this lesson - complete the previous module first' },
        { status: 403 }
      );
    }
    
    // Check if all previous lessons in this module are completed
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === lessonId);
    
    if (currentLessonIndex > 0) {
      // Check if all previous lessons in this module are completed
      const previousLessonsInModule = currentModule.lessons.slice(0, currentLessonIndex);
      
      // Check if these lessons are completed
      const allPreviousLessonsCompleted = previousLessonsInModule.every(prevLesson => 
        userProgress.some(progress => 
          progress.lessonId === prevLesson.id && progress.completed
        )
      );
      
      if (!allPreviousLessonsCompleted) {
        return NextResponse.json(
          { error: 'Cannot complete this lesson - complete previous lessons in this module first' },
          { status: 403 }
        );
      }
    }
    
    // Create or update progress record
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        completed: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        completed: true
      }
    });
    
    return NextResponse.json({
      message: 'Lesson marked as completed',
      progress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET handler to fetch a specific lesson
export async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json(
      { error: 'Lesson ID is required' },
      { status: 400 }
    );
  }
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access this content.' },
        { status: 401 }
      );
    }
    
    const lessonId = id;

    // Fetch the lesson and include its related module
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId
      },
      include: {
        module: true
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if the user is authorized to access this lesson
    if (session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (user) {
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
        
        // Check if previous module has its last lesson completed
        let previousModulesCompleted = currentModuleIndex === 0; // First module is always accessible
        
        if (!previousModulesCompleted && currentModuleIndex > 0) {
          const previousModule = modules[currentModuleIndex - 1];
          if (previousModule.lessons.length > 0) {
            // Get the last lesson of the previous module (highest order)
            const lastLesson = previousModule.lessons.reduce((prev, current) => 
              prev.order > current.order ? prev : current
            );
            
            // Check if this last lesson is completed
            previousModulesCompleted = userProgress.some(progress => 
              progress.lessonId === lastLesson.id && progress.completed
            );
          } else {
            // If previous module has no lessons, consider it completed
            previousModulesCompleted = true;
          }
        }

        // Find the current lesson index within its module
        const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === lessonId);
        
        // First lesson in first module is always accessible
        if (currentModuleIndex === 0 && currentLessonIndex === 0) {
          return NextResponse.json({
            ...lesson,
            isAccessible: true,
            isCompleted: userProgress.some(p => p.lessonId === lessonId && p.completed)
          });
        }
        
        // If module is not accessible, none of its lessons are accessible
        if (!previousModulesCompleted) {
          return NextResponse.json(
            { error: 'You need to complete the previous module before accessing this lesson.' },
            { status: 403 }
          );
        }
        
        // For accessible modules, check if previous lessons in this module are completed
        const previousLessonsInModuleCompleted = currentModule.lessons
          .slice(0, currentLessonIndex)
          .every(prevLesson => 
            userProgress.some(progress => 
              progress.lessonId === prevLesson.id && progress.completed
            )
          );
        
        // In an accessible module, a lesson is accessible if it's the first or if all previous lessons are completed
        const isAccessible = currentLessonIndex === 0 || previousLessonsInModuleCompleted;
        
        if (!isAccessible) {
          return NextResponse.json(
            { error: 'You need to complete previous lessons first to access this lesson.' },
            { status: 403 }
          );
        }
        
        // Add completed status to the response
        return NextResponse.json({
          ...lesson,
          isAccessible: true,
          isCompleted: userProgress.some(p => p.lessonId === lessonId && p.completed)
        });
      }
    }

    // Default response if we couldn't determine accessibility
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}
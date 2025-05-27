import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET handler to fetch all modules with their lessons and user progress
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    let userId = null;
    
    // If user is authenticated, get their ID
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      if (user) {
        userId = user.id;
      }
    }
    
    // Fetch all modules ordered by position
    const modules = await prisma.module.findMany({
      include: {
        lessons: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });
    
    // If the user is authenticated, fetch their progress
    let userProgress: { userId: string, lessonId: string, completed: boolean }[] = [];
    if (userId) {
      userProgress = await prisma.userProgress.findMany({
        where: {
          userId: userId
        }
      });
    }
    
    // Map the modules to include accessibility info
    const modulesWithAccess = modules.map((module, moduleIndex) => {
      // First module is always accessible
      let isModuleAccessible = moduleIndex === 0;
      
      // For subsequent modules, check if the last lesson of the previous module is completed
      if (!isModuleAccessible && moduleIndex > 0) {
        const previousModule = modules[moduleIndex - 1];
        if (previousModule.lessons.length > 0) {
          // Get the last lesson of the previous module (highest order)
          const lastLesson = previousModule.lessons.reduce((prev, current) => 
            prev.order > current.order ? prev : current
          );
          
          // Check if this last lesson is completed
          isModuleAccessible = userProgress.some(progress => 
            progress.lessonId === lastLesson.id && progress.completed
          );
        } else {
          // If the previous module has no lessons, make this module accessible
          isModuleAccessible = true;
        }
      }
      
      // Map lessons to include accessibility info
      const lessonsWithAccess = module.lessons.map((lesson, lessonIndex) => {
        const isFirstInModule = lessonIndex === 0;
        
        // If the module isn't accessible, none of its lessons are accessible
        if (!isModuleAccessible) {
          return {
            ...lesson,
            isAccessible: false,
            isCompleted: userProgress.some(progress => 
              progress.lessonId === lesson.id && progress.completed
            )
          };
        }
        
        // For accessible modules, check if previous lessons in this module are completed
        const previousLessonsCompleted = module.lessons
          .slice(0, lessonIndex)
          .every(prevLesson => 
            userProgress.some(progress => 
              progress.lessonId === prevLesson.id && progress.completed
            )
          );
        
        // Lesson is accessible if it's the first in the module or if all previous lessons are completed
        const isAccessible = isFirstInModule || previousLessonsCompleted;
        
        // Check if this lesson is completed
        const isCompleted = userProgress.some(progress => 
          progress.lessonId === lesson.id && progress.completed
        );
        
        return {
          ...lesson,
          isAccessible,
          isCompleted
        };
      });
      
      return {
        ...module,
        isAccessible: isModuleAccessible,
        lessons: lessonsWithAccess
      };
    });
    
    return NextResponse.json(modulesWithAccess);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
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
    
    // If the user is authenticated, fetch their progress and module access
    let userProgress: { userId: string, lessonId: string, completed: boolean }[] = [];
    let userModuleAccess: { moduleId: string }[] = [];
    let userModulePurchases: { moduleId: string }[] = [];
    
    if (userId) {
      userProgress = await prisma.userProgress.findMany({
        where: {
          userId: userId
        }
      });
      
      // Get modules the user has explicit access to
      userModuleAccess = await prisma.moduleAccess.findMany({
        where: {
          userId: userId
        },
        select: {
          moduleId: true
        }
      });
      
      // Get modules the user has purchased
      userModulePurchases = await prisma.modulePurchase.findMany({
        where: {
          userId: userId
        },
        select: {
          moduleId: true
        }
      });
    }
    
    // Map the modules to include accessibility info
    const modulesWithAccess = modules.map((module, moduleIndex) => {
      // Check module accessibility based on new system
      let isModuleAccessible = false;
      let accessReason = '';
      
      // Check if module is free (price = 0)
      const isFreeModule = module.price === 0 || module.price === null;
      
      if (isFreeModule) {
        isModuleAccessible = true;
        accessReason = 'free';
      } else {
        // Check if user has purchased the module
        const hasPurchased = userModulePurchases.some(purchase => purchase.moduleId === module.id);
        
        // Check if user has been granted access by admin
        const hasAdminAccess = userModuleAccess.some(access => access.moduleId === module.id);
        
        if (hasPurchased) {
          isModuleAccessible = true;
          accessReason = 'purchased';
        } else if (hasAdminAccess) {
          isModuleAccessible = true;
          accessReason = 'admin_granted';
        } else {
          isModuleAccessible = false;
          accessReason = 'locked';
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
        accessReason: accessReason,
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
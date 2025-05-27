import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET handler to fetch a specific module with its lessons
export async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json(
      { error: 'Module ID is required' },
      { status: 400 }
    );
  }
  try {
    const moduleId = id;

    // Fetch the module and include its related lessons
    const module = await prisma.module.findUnique({
      where: {
        id: moduleId
      },
      include: {
        lessons: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}
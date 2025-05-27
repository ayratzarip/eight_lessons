import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST handler to validate quiz answers
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access this content.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { quizId, answers } = body;

    // Validate request body
    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Fetch the quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Process each answer and provide feedback
    const results = [];
    let allCorrect = true;

    for (const answer of answers) {
      const { questionId, selectedOptionIds } = answer;
      
      // Find the question
      const question = quiz.questions.find(q => q.id === questionId);
      if (!question) {
        return NextResponse.json(
          { error: `Question with ID ${questionId} not found` },
          { status: 400 }
        );
      }

      // Get all selected options
      const selectedOptions = [];
      for (const optionId of selectedOptionIds) {
        const option = question.options.find(o => o.id === optionId);
        if (!option) {
          return NextResponse.json(
            { error: `Option with ID ${optionId} not found` },
            { status: 400 }
          );
        }
        selectedOptions.push(option);
      }

      // Check if all correct options are selected and no incorrect options are selected
      const allCorrectOptionsSelected = question.options
        .filter(o => o.isCorrect)
        .every(correctOption => 
          selectedOptionIds.includes(correctOption.id)
        );
      
      const noIncorrectOptionsSelected = selectedOptions
        .every(option => option.isCorrect);
      
      const isQuestionCorrect = allCorrectOptionsSelected && noIncorrectOptionsSelected;
      
      if (!isQuestionCorrect) {
        allCorrect = false;
      }

      // Get all correct options for feedback
      const correctOptions = question.options.filter(o => o.isCorrect);

      // Add feedback for this question
      results.push({
        questionId,
        question: question.question,
        selectedOptionIds,
        selectedOptions: selectedOptions.map(o => ({
          id: o.id,
          text: o.optionText,
          isCorrect: o.isCorrect
        })),
        isCorrect: isQuestionCorrect,
        feedback: isQuestionCorrect 
          ? (selectedOptions[0]?.correctComment || 'Правильно!') 
          : (selectedOptions[0]?.incorrectComment || 'Неправильно. Выберите все правильные варианты.'),
        correctOptions: isQuestionCorrect ? null : correctOptions.map(o => ({
          id: o.id,
          text: o.optionText
        }))
      });
    }

    return NextResponse.json({
      success: true,
      allCorrect,
      results
    });
  } catch (error) {
    console.error('Error validating quiz answers:', error);
    return NextResponse.json(
      { error: 'Failed to validate answers' },
      { status: 500 }
    );
  }
}
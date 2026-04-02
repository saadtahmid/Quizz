import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;

  if (!session || session.user.role !== "STUDENT") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Fetch all existing attempts
    const existingAttempts = await prisma.attempt.findMany({
      where: {
        quizId: id,
        studentId: session.user.id
      },
      include: {
        answers: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: id,
        isPublished: true,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          },
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return new NextResponse("Not Found or Not Published", { status: 404 });
    }

    // If the student already attempted, we return the past attempts (including correct answers)
    if (existingAttempts.length > 0) {
      const reviewQuiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        questions: quiz.questions, // Unsanitized: includes correct answers!
        attempts: existingAttempts
      };
      return NextResponse.json(reviewQuiz);
    }

    // If NOT attempted, strip sensitive information like `isCorrect` from options before sending to client!
    const sanitizedQuestions = quiz.questions.map(q => {
      // Basic algorithmic security: Randomize option order
      const shuffledOptions = q.options
        .map(o => ({
          id: o.id,
          text: o.text,
          mathEnabled: o.mathEnabled
        }))
        .sort(() => Math.random() - 0.5);

      return {
        id: q.id,
        type: q.type,
        content: q.content,
        points: q.points,
        mathEnabled: q.mathEnabled,
        options: shuffledOptions
      };
    });

    // Basic algorithmic security: Randomize question order
    const shuffledQuestions = sanitizedQuestions.sort(() => Math.random() - 0.5);

    const sanitizedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      questions: shuffledQuestions,
      attempts: []
    };

    return NextResponse.json(sanitizedQuiz);
  } catch (error) {
    console.error("[STUDENT_QUIZ_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

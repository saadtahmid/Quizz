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

    // Strip sensitive information like `isCorrect` from options before sending to client!
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
      questions: shuffledQuestions
    };

    return NextResponse.json(sanitizedQuiz);
  } catch (error) {
    console.error("[STUDENT_QUIZ_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

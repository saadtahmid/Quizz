import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: id, instructorId: session.user.id },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!originalQuiz) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const newQuiz = await prisma.quiz.create({
      data: {
        title: `${originalQuiz.title} (Clone)`,
        description: originalQuiz.description,
        isPublished: false,
        instructorId: session.user.id,
        questions: {
          create: originalQuiz.questions.map((q) => ({
            content: q.content,
            type: q.type,
            points: q.points,
            mathEnabled: q.mathEnabled,
            order: q.order,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                mathEnabled: o.mathEnabled
              }))
            }
          }))
        }
      }
    });

    return NextResponse.json({ id: newQuiz.id });
  } catch (error) {
    console.error("[QUIZ_CLONE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
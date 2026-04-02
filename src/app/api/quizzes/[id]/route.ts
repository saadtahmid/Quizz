import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: id,
        instructorId: session.user.id,
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
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, isPublished, questions } = body;

    // Verify ownership and check if already published
    const quizOwner = await prisma.quiz.findUnique({
      where: { id: id, instructorId: session.user.id }
    });

    if (!quizOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (quizOwner.isPublished) {
      return new NextResponse("Quiz is published and immutable. Please clone it to make changes.", { status: 400 });
    }

    // Use a transaction to delete existing questions and re-insert them
    // Note: In a production app with live attempts, you shouldn't delete questions.
    // For this prototype/MVP, wiping and recreating is the cleanest way to handle complex nested updates.
    await prisma.$transaction(async (tx) => {
      // Delete old questions
      await tx.question.deleteMany({
        where: { quizId: id }
      });

      // Update quiz and insert new questions
      await tx.quiz.update({
        where: { id: id },
        data: {
          title,
          description,
          isPublished,
          questions: {
            create: questions.map((q: any, index: number) => ({
              content: q.content || "",
              type: q.type,
              points: q.points || 1,
              mathEnabled: q.mathEnabled || false,
              order: index,
              options: {
                create: (q.options || []).map((o: any) => ({
                  text: o.text || "",
                  isCorrect: o.isCorrect || false,
                  mathEnabled: o.mathEnabled || false
                }))
              }
            }))
          }
        }
      });
    });

    return new NextResponse("Updated", { status: 200 });
  } catch (error) {
    console.error("[QUIZ_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const quizOwner = await prisma.quiz.findUnique({
      where: { id: id, instructorId: session.user.id }
    });

    if (!quizOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.quiz.delete({
      where: { id: id }
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

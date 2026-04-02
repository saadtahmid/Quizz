import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "INSTRUCTOR") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { instructorId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[QUIZZES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "INSTRUCTOR") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { title, description } = await req.json();

    if (!title) {
      return new NextResponse("Missing title", { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        instructorId: session.user.id,
      }
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZZES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

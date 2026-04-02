import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  const { attemptId } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Read optional scores from the manual grading UI
    // Example: { scores: { "answer-id-1": 10, "answer-id-2": 5 } }
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore empty body
    }
    const scores = body?.scores || {};

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          include: { question: true }
        }
      }
    });

    if (!attempt) return new NextResponse("Attempt not found", { status: 404 });
    if (attempt.status === "GRADED") return new NextResponse("Already graded", { status: 400 });

    let additionalScore = 0;

    // Process manually provided text question scores
    for (const answer of attempt.answers) {
      if (answer.question.type === "TEXT") {
        const providedScore = scores[answer.id];
        
        if (typeof providedScore === "number") {
          await prisma.answer.update({
            where: { id: answer.id },
            data: {
              isCorrect: providedScore > 0 && providedScore === answer.question.points,
              manualScore: providedScore,
              aiFeedback: null // clear out any old AI feedback just in case
            }
          });
          additionalScore += providedScore;
        } else if (answer.manualScore !== null) {
          // Carry over any existing score if not updated
          additionalScore += answer.manualScore;
        }
      }
    }

    // Calculate final score
    const mcqScore = attempt.answers
      .filter((a) => a.question.type === "MCQ")
      .reduce((acc, a) => acc + (a.manualScore || 0), 0);

    const finalScore = mcqScore + additionalScore;

    const updatedAttempt = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score: finalScore,
        status: "GRADED"
      }
    });

    return NextResponse.json({ success: true, newScore: finalScore });
  } catch (error) {
    console.error("[INSTRUCTOR_ATTEMPT_GRADE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
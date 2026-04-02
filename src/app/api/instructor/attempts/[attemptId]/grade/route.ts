import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { autoGradeTextAnswer } from "@/lib/ai-grader";

export async function POST(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  const { attemptId } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
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

    // Loop through all text questions that have not been scored yet
    for (const answer of attempt.answers) {
      if (answer.question.type === "TEXT" && answer.manualScore === null) {
        const aiResult = await autoGradeTextAnswer(
          answer.question.content,
          answer.textAnswer || "",
          answer.question.points
        );

        console.log(`[AUTO_GRADE] Attempt ${attemptId}, Question ${answer.question.id}:`, aiResult);

        await prisma.answer.update({
          where: { id: answer.id },
          data: {
            isCorrect: aiResult.isCorrect,
            manualScore: aiResult.score,
            aiFeedback: aiResult.feedback
          }
        });

        additionalScore += aiResult.score;
      }
    }

    // Update the attempt's total score and mark it as completely graded
    const finalScore = (attempt.score || 0) + additionalScore;

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
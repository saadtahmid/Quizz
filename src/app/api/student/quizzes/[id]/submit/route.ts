import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;

  if (!session || session.user.role !== "STUDENT") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { answers, proctorEvents } = await req.json();

    // Find the quiz to validate the answers against
    const quiz = await prisma.quiz.findUnique({
      where: { id: id },
      include: {
        questions: {
          include: { options: true }
        }
      }
    });

    if (!quiz) return new NextResponse("Quiz not found", { status: 404 });

    // Calculate score for MCQ only, TEXT is pending evaluation
    let totalScore = 0;
    const answerRecords = [];

    for (const q of quiz.questions) {
      const studentAnswer = answers[q.id];
      let isCorrect = false;
      let pointsAwarded = 0;

      if (q.type === "MCQ") {
        const correctOption = q.options.find(o => o.isCorrect);
        if (correctOption && correctOption.id === studentAnswer) {
          isCorrect = true;
          pointsAwarded = q.points;
        }
        answerRecords.push({
          questionId: q.id,
          selectedOptionId: studentAnswer || null,
          textAnswer: null,
          isCorrect,
          manualScore: pointsAwarded
        });
        totalScore += pointsAwarded;
      } else {
        // TEXT answer, auto-grade is delayed until instructor initiates it
        answerRecords.push({
          questionId: q.id,
          selectedOptionId: null,
          textAnswer: studentAnswer || "",
          isCorrect: null,
          manualScore: null,
          aiFeedback: null
        });
      }
    }

    // Save Attempt and Answers and Proctor Logs
    const attempt = await prisma.attempt.create({
      data: {
        quizId: id,
        studentId: session.user.id,
        score: totalScore,
        status: "SUBMITTED",
        endTime: new Date(),
        answers: {
          create: answerRecords
        },
        proctorLogs: {
          create: (proctorEvents || []).map((event: any) => ({
            eventType: event.type,
            timestamp: new Date(event.timestamp),
            details: event.details
          }))
        }
      }
    });

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error) {
    console.error("[STUDENT_QUIZ_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/instructor/attempts/[attemptId]/transcript
//
// Produces a machine-readable JSON transcript of a student's submission,
// covering only TEXT questions (MCQs are auto-graded elsewhere). The
// transcript is meant to be generated *before* grading: each entry lists the
// question, the student's answer, and the marks allotted (the points the
// question is worth) so an instructor has a structured worksheet to grade
// against. Served as a file download.
export async function GET(
  _req: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = await auth();
  const { attemptId } = await context.params;

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        quiz: {
          include: {
            questions: {
              where: { type: "TEXT" },
              orderBy: { order: "asc" },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) return new NextResponse("Attempt not found", { status: 404 });

    // Access control: instructors may only export their own quizzes' attempts.
    if (session.user.role === "INSTRUCTOR" && attempt.quiz.instructorId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const answersByQuestion = new Map(
      attempt.answers.map((a) => [a.questionId, a])
    );

    const transcript = {
      attemptId: attempt.id,
      quizTitle: attempt.quiz.title,
      student: {
        name: attempt.student.name ?? null,
        email: attempt.student.email,
      },
      submittedAt: attempt.endTime ? attempt.endTime.toISOString() : null,
      generatedAt: new Date().toISOString(),
      totalAllottedMarks: attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0),
      // Instructions for whatever LLM grades this transcript. The portal can
      // import the evaluation produced in this exact shape (see the "Import
      // Evaluation" action on the attempt review page).
      gradingInstructions:
        "Grade each question below. Return ONLY valid JSON matching evaluationFormat. " +
        "For each question, set awardedMarks to a number between 0 and allottedMarks, " +
        "and write feedback that explains the intended/expected answer and what the " +
        "student got right or wrong. Do not change questionId values.",
      evaluationFormat: {
        attemptId: attempt.id,
        evaluations: [
          {
            questionId: "<questionId from below>",
            awardedMarks: 0,
            feedback: "<explanation of the intended answer and the student's response>",
          },
        ],
      },
      questions: attempt.quiz.questions.map((q, idx) => ({
        questionId: q.id,
        number: idx + 1,
        question: q.content,
        answer: answersByQuestion.get(q.id)?.textAnswer ?? null,
        allottedMarks: q.points,
      })),
    };

    const filename = `transcript-${attempt.id}.json`;

    return new NextResponse(JSON.stringify(transcript, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[INSTRUCTOR_ATTEMPT_TRANSCRIPT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

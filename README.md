 # STEM Quiz Platform

A highly customizable, self-hosted assessment platform designed specifically for STEM education. This application provides an instructor dashboard for crafting complex technical questions and a secure student portal with built-in exam integrity features.

## 🚀 Key Features

### 👨‍🏫 Instructor Dashboard
* **Question Bank Management:** Create, edit, and categorize questions by topic and difficulty.
* **CSV Bulk Question Upload:** Quickly import large sets of questions (both MCQ and Text) via CSV files. A template guide is available in `public/sample.csv`.
* **Dual Question Formats:** Support for Multiple Choice Questions (MCQs) and Direct Text (open-ended) answers.
* **STEM-Ready Rendering:** Native support for LaTeX mathematical notation (via KaTeX/MathJax) in both questions and answer choices.
* **Analytics & Grading:** Centralized hub to review student performance and override auto-graded scores.
* **Transcript-Based AI Grading:** Export a structured JSON transcript of a student's text answers, grade it with any LLM of your choice, then import the evaluation to auto-fill marks and per-question feedback (see below).

### 🎓 Student Portal & Exam Integrity
* **Client-Side Proctoring:** Utilizes the Page Visibility API to detect and log tab-switching or window-blur events.
* **Algorithmic Security:** Dynamic question shuffling and randomized MCQ option orders to mitigate answer sharing.
* **Focus Mode:** Disables context menus, text selection, and common copy/paste keyboard shortcuts during an active assessment.

### 🤖 AI-Assisted Grading
* **Transcript Round-Trip (Provider-Agnostic):** The portal never calls an LLM itself. Instead, instructors export a self-describing transcript, grade it with whatever model they prefer, and import the result — keeping the platform free of API costs and hard AI dependencies.
* **Local AI Auto-Grading (Optional Module):** For a fully self-hosted setup, direct text answers can be routed to a local LLM (e.g. Ollama or vLLM) for "first-pass" grading, ensuring student data privacy and zero API costs. GPU-accelerated on Ubuntu with NVIDIA drivers.

---

## 📝 Transcript-Based Grading Workflow

Text (open-ended) answers require manual marking. To speed this up, the platform provides a structured export/import loop so you can grade with any LLM **without** wiring an AI provider into the app. (MCQs are auto-graded and excluded from this flow.)

From an attempt's review page (`/instructor/quizzes/[id]/attempts/[attemptId]`):

1. **Get Transcript** — Downloads `transcript-<attemptId>.json` containing only the TEXT questions, each with its `questionId`, the question content, the student's answer, and the `allottedMarks` (max points). The file is self-describing: it embeds `gradingInstructions` and an `evaluationFormat` example so any LLM knows exactly what to produce.

2. **Grade with your LLM** — Paste the transcript into the model of your choice. Ask it to return JSON matching the embedded `evaluationFormat`:
   ```json
   {
     "attemptId": "<attemptId>",
     "evaluations": [
       { "questionId": "<id>", "awardedMarks": 8, "feedback": "Explains the intended answer and what the student got right/wrong." }
     ]
   }
   ```

3. **Import Evaluation** — Upload the LLM's JSON. The portal matches each entry back by `questionId`, clamps `awardedMarks` to the question's maximum, and pre-fills both the **score** and **feedback** fields.

4. **Review & Finalize** — Marks and feedback remain fully editable. Nothing is committed until you click **Finalize Grade**, which persists the scores and per-question feedback and computes the final attempt score. Feedback is shown to instructors in the graded view.

---

## 📊 CSV Question Upload Format

Instructors can bulk import questions into a quiz using a CSV file. A template is provided at `public/sample.csv`. The expected columns are:

* `type`: The question format (`MCQ` or `TEXT`).
* `content`: The main text of the question.
* `points`: Point value assigned to the question (e.g., `1`, `5`).
* `mathEnabled`: Set to `true` or `false` to toggle LaTeX parsing.
* `option1_text` to `option10_text`: Text for multiple-choice options. Leave blank for `TEXT` questions.
* `option1_correct` to `option10_correct`: Boolean (`true` or `false`) to indicate if the corresponding option is a correct answer. Supports multiple correct options per question.

---

## 🛠️ Architecture & Tech Stack

This project is built using a modern full-stack web architecture with a focus on performance, type safety, and great developer experience:

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database & ORM:** [Prisma ORM](https://www.prisma.io/) with a PostgreSQL database
* **Authentication:** [NextAuth.js v5 (Auth.js)](https://authjs.dev/) for secure user/instructor login
* **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/) alongside [shadcn/ui](https://ui.shadcn.com/) components
* **STEM Formatting:** `react-markdown`, `remark-math`, and `rehype-katex` for parsing and rendering complex LaTeX mathematical notations safely.
* **Client-Side CSV Parsing:** `papaparse` for fast browser-side ingestion of question banks.
* **AI Evaluation (Optional):** Vercel AI SDK integrating with local models (e.g., Ollama) for text answer auto-grading.

---

## 💻 Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Git](https://git-scm.com/)
* A running [PostgreSQL](https://www.postgresql.org/) database
* *For AI Auto-grading only:* Ubuntu environment with NVIDIA drivers configured for local GPU inference (e.g., RTX 5060 Ti or better) running an Ollama instance.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saadtahmid/Quizz.git
   cd Quizz
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory. 
   ```env
   # Database connection string
   DATABASE_URL="postgresql://root:password@localhost:5432/quiz_db?schema=public"

   # NextAuth Secret
   AUTH_SECRET="your-super-secret-key-here"
   AUTH_TRUST_HOST=true
   ```

4. **Initialize the Database:**
   Apply Prisma schema to create the required tables in your database:
   ```bash
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.


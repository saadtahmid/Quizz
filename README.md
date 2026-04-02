 # STEM Quiz Platform

A highly customizable, self-hosted assessment platform designed specifically for STEM education. This application provides an instructor dashboard for crafting complex technical questions and a secure student portal with built-in exam integrity features.

## 🚀 Key Features

### 👨‍🏫 Instructor Dashboard
* **Question Bank Management:** Create, edit, and categorize questions by topic and difficulty.
* **CSV Bulk Question Upload:** Quickly import large sets of questions (both MCQ and Text) via CSV files. A template guide is available in `public/sample.csv`.
* **Dual Question Formats:** Support for Multiple Choice Questions (MCQs) and Direct Text (open-ended) answers.
* **STEM-Ready Rendering:** Native support for LaTeX mathematical notation (via KaTeX/MathJax) in both questions and answer choices.
* **Analytics & Grading:** Centralized hub to review student performance and override auto-graded scores.

### 🎓 Student Portal & Exam Integrity
* **Client-Side Proctoring:** Utilizes the Page Visibility API to detect and log tab-switching or window-blur events.
* **Algorithmic Security:** Dynamic question shuffling and randomized MCQ option orders to mitigate answer sharing.
* **Focus Mode:** Disables context menus, text selection, and common copy/paste keyboard shortcuts during an active assessment.

### 🤖 Local AI Auto-Grading (Optional Module)
* **Semantic Analysis:** Routes direct text answers to a local LLM for "first-pass" grading against a predefined rubric.
* **GPU Accelerated:** Optimized to run locally on Ubuntu using frameworks like Ollama or vLLM to ensure student data privacy and zero API costs.

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

*(Note: Update this section based on your specific framework choices)*



---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* Git
* *For AI Auto-grading only:* Ubuntu environment with NVIDIA drivers configured for local GPU inference (e.g., RTX 5060 Ti or better).


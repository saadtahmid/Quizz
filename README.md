 # STEM Quiz Platform

A highly customizable, self-hosted assessment platform designed specifically for STEM education. This application provides an instructor dashboard for crafting complex technical questions and a secure student portal with built-in exam integrity features.

## 🚀 Key Features

### 👨‍🏫 Instructor Dashboard
* **Question Bank Management:** Create, edit, and categorize questions by topic and difficulty.
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

## 🛠️ Architecture & Tech Stack

*(Note: Update this section based on your specific framework choices)*



---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* Git
* *For AI Auto-grading only:* Ubuntu environment with NVIDIA drivers configured for local GPU inference (e.g., RTX 5060 Ti or better).


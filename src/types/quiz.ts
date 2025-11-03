// src/types/quiz.ts
export interface QuizOption {
  [key: string]: string;
}

export interface CaseStudyItem {
  caseStudyId: string;
  caseStudyText: string;
}

export interface QuizItem {
  id: string | number;
  topic?: string;
  question: string;
  options: QuizOption;
  correctAnswer: string[];
  explanation?: any;
  conditions?: string[];
  caseStudyId?: string; // This ID will be used as a key in Course.caseStudies
  imageUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  quizItems: QuizItem[];
  topics: string[];
  // Object map for case studies
  caseStudies: { [caseStudyId: string]: CaseStudyItem };
}

// Used for saving in-progress state
export interface SavedQuizState {
    currentIndex: number;
    userAnswers: (string | string[] | any)[]; // Store arrays for Set answers when saving
    startTime: number | null;
    questionIds: (string | number)[]; // Store the order of questions
    courseId: string;
    topicId: string | null;
    checkedAnswers?: boolean[]; // Track checked state for multi-select
}

// For storing individual answer results
export interface AnswerResult {
  questionId: string | number;
  userAnswer: string | string[] | Set<string> | null; // Can be Set in memory
  correctAnswer: string[];
  isCorrect: boolean;
  options: QuizOption;
}

// For storing overall quiz attempt results
export interface QuizResults {
  score: number;
  totalQuestions: number;
  answers: AnswerResult[]; // Detailed results for review
  duration: number;
  questionIds: (string | number)[]; // Keep track of questions in this attempt
  courseId: string;
  topicId: string | null;
  timestamp: number; // Numeric timestamp for completion
  percentage?: number; // Calculated percentage
}

// For displaying last completed attempt info
export interface LastCompletedAttempt {
    score: number;
    totalQuestions: number;
    percentage: number;
    timestamp: number; // Use numeric timestamp for easier sorting
}

// To uniquely identify a quiz configuration
export interface QuizConfig {
    courseId: string;
    topicId: string | null;
    type: 'full' | 'topic'; // Type might be useful
}
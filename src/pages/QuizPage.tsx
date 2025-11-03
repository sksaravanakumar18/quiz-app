// src/pages/QuizPage.tsx
import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom'; // Added Navigate
import Quiz from '../components/Quiz'; // CORRECTED: Import the Quiz component
import { QuizConfig, QuizResults } from '../types/quiz';

// Props expected from App.tsx for navigation control
interface QuizPageProps {
    onQuizCompleteForNav: (results: QuizResults) => void;
    onQuizExitForNav: () => void;
}

const QuizPage: React.FC<QuizPageProps> = ({
    onQuizCompleteForNav, // Handler to call when quiz is finished
    onQuizExitForNav,     // Handler to call when user navigates back
}) => {
  // Get courseId and topicParam from URL
  const { courseId, topicParam } = useParams<{ courseId: string; topicParam: string }>();

  // Derive topicId from topicParam ('full' means null topicId)
  const topicId = topicParam === 'full' ? null : topicParam ?? null;

  // Memoize the quiz configuration based on URL parameters
  const quizConfig = useMemo((): QuizConfig | null => {
    if (!courseId) {
        console.error("QuizPage: courseId is missing from URL parameters.");
        return null; // Handle case where courseId might be missing
    }
    return {
      courseId,
      topicId,
      type: topicId ? 'topic' : 'full',
    };
  }, [courseId, topicId]);

  // If configuration is invalid (missing courseId), redirect or show error
  if (!quizConfig) {
    // Option 1: Redirect back home (often preferred)
    return <Navigate to="/" replace />;

    // Option 2: Show an error message
    // return (
    //   <div className="p-6 text-red-600 text-center">
    //     Error: Invalid quiz URL or missing course ID. Cannot start quiz.
    //     {/* Optionally add a Link back home */}
    //   </div>
    // );
  }

  // Render the Quiz component, passing the derived config and navigation handlers
  return (
      <Quiz // CORRECTED: Render the Quiz component
          quizConfig={quizConfig} // Pass the config object
          onComplete={onQuizCompleteForNav} // Pass the completion handler for navigation
          onBack={onQuizExitForNav}       // Pass the back navigation handler
      />
  );
};

export default QuizPage;
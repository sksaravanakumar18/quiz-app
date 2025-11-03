// src/pages/HomePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuizSelection from '../components/QuizSelection';
import { getCourses } from '../data/quizData';
import { SavedQuizState, LastCompletedAttempt, QuizConfig } from '../types/quiz';

interface HomePageProps {
    inProgressQuizzes: { [key: string]: SavedQuizState };
    completedQuizHistory: { [key: string]: LastCompletedAttempt };
    getQuizStateKey: (config: QuizConfig | null) => string | null; // Allow null config
    refreshQuizStates: () => void; // Add this prop
}

const HomePage: React.FC<HomePageProps> = ({
    inProgressQuizzes,
    completedQuizHistory,
    getQuizStateKey,
    refreshQuizStates // Receive the refresh function
}) => {
  const navigate = useNavigate();
  const courses = getCourses();

  const handleSelectQuiz = (courseId: string, topicId: string | null) => {
    const topicParam = topicId ?? 'full';
    console.log(`Navigating to quiz: /quiz/${courseId}/${topicParam}`);
    navigate(`/quiz/${courseId}/${topicParam}`);
  };

  return (
    <QuizSelection
      courses={courses}
      onSelectQuiz={handleSelectQuiz}
      inProgressQuizzes={inProgressQuizzes}
      completedQuizHistory={completedQuizHistory}
      getQuizStateKey={getQuizStateKey}
      onRefreshStates={refreshQuizStates} // Pass it to QuizSelection
      passThreshold={80}
    />
  );
};

export default HomePage;
// src/components/QuizSelection.tsx
import React, { useState, useMemo, useEffect } from 'react';
import Button from './ui/Button';
import CompletionBadge from './ui/CompletionBadge';
import { Course, SavedQuizState, LastCompletedAttempt, QuizConfig } from '../types/quiz';
import './QuizSelection.css';


interface QuizSelectionProps {
  courses: Course[];
  onSelectQuiz: (courseId: string, topicId: string | null) => void;
  inProgressQuizzes: { [key: string]: SavedQuizState };
  completedQuizHistory: { [key: string]: LastCompletedAttempt };
  getQuizStateKey: (config: QuizConfig) => string | null;
  onRefreshStates: () => void; // Prop for refreshing state from parent
  passThreshold?: number;
}

const QuizSelection: React.FC<QuizSelectionProps> = ({
  courses,
  onSelectQuiz,
  inProgressQuizzes = {},
  completedQuizHistory = {},
  getQuizStateKey,
  onRefreshStates, // Receive the refresh handler
  passThreshold = 80,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
        try {
            const savedId = localStorage.getItem('selectedCourseId_v2'); // Use versioned key
            if (savedId && courses.find(c => c.id === savedId)) {
                return savedId;
            }
        } catch (error) {
            console.error("Failed to read selected course ID from localStorage:", error);
        }
    }
    return courses.length > 0 ? courses[0].id : null; // Default to first course or null
  });

  // Call onRefreshStates once when the component mounts to ensure initial state is fresh
  useEffect(() => {
    console.log("QuizSelection mounted, calling onRefreshStates.");
    onRefreshStates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once on mount


  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find(c => c.id === selectedCourseId);
  }, [selectedCourseId, courses]);

  const topicCounts = useMemo(() => {
    if (!selectedCourse?.quizItems) return {};
    const counts: { [topic: string]: number } = {};
    selectedCourse.quizItems.forEach(item => {
        if (item && item.topic) {
            counts[item.topic] = (counts[item.topic] || 0) + 1;
        }
    });
    return counts;
  }, [selectedCourse]);

  const totalQuestionsInCourse = useMemo(() => {
    return selectedCourse?.quizItems?.length ?? 0;
  }, [selectedCourse]);

  const courseTopics = useMemo(() => {
    if (!selectedCourse) return [];
    const topicsFromItems = [...new Set(selectedCourse.quizItems?.map(q => q.topic).filter(Boolean) || [])];
    const definedTopics = Array.isArray(selectedCourse.topics) ? selectedCourse.topics : [];
    return [...new Set([...definedTopics, ...topicsFromItems])].sort() as string[];
  }, [selectedCourse]);


  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem('selectedCourseId_v2', courseId);
        } catch (error) {
            console.error("Failed to save selected course ID to localStorage:", error);
        }
    }
  };

  const handleStartQuiz = (topicId: string | null) => {
    if (selectedCourseId) {
      onSelectQuiz(selectedCourseId, topicId);
    }
  };
  const handleBackToCourses = () => {
    setSelectedCourseId(null);
     if (typeof window !== "undefined") {
        try {
            localStorage.removeItem('selectedCourseId_v2');
        } catch (error) {
            console.error("Failed to remove selected course ID from localStorage:", error);
        }
    }
  };

  // Use the passed handler instead of full page reload
  const handleRefreshButtonClick = () => {
    console.log("Refresh button clicked, calling onRefreshStates.");
    onRefreshStates();
  };

  // Course Selection View
  if (!selectedCourseId || !selectedCourse) {
     return (
         <div className="quiz-selection-container max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-center mb-6">Select a Course</h2>
            <div className="mb-4 text-right">
                 <Button onClick={handleRefreshButtonClick} variant="outline" size="sm">Refresh States</Button>
            </div>
            <ul className="space-y-3">
            {courses.map((course) => (
                <li key={course.id} className="selection-item justify-between items-center p-4 border bg-white rounded-md shadow-sm flex">
                    <span className="selection-item-label font-medium text-slate-700 flex-grow">{course.title}</span>
                    <Button onClick={() => handleSelectCourse(course.id)}>Select</Button>
                </li>
            ))}
            {courses.length === 0 && <li className="text-center text-slate-500">No courses available.</li>}
            </ul>
        </div>
     );
  }

  // Topic/Full Quiz Selection View
  const fullQuizConfig: QuizConfig = { courseId: selectedCourseId, topicId: null, type: 'full' };
  const fullQuizKey = getQuizStateKey(fullQuizConfig);
  const fullQuizInProgress = fullQuizKey ? inProgressQuizzes[fullQuizKey] : null;
  const fullQuizLastCompletion = fullQuizKey ? completedQuizHistory[fullQuizKey] : null;

  return (
    <div className="quiz-selection-container max-w-3xl mx-auto p-4">
       <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold mb-1">{selectedCourse.title}</h2>
                <Button onClick={handleBackToCourses} variant="link" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                    Change Course
                </Button> &nbsp;
                <Button onClick={handleRefreshButtonClick} variant="outline" size="sm">Refresh States</Button>
            </div>
      </div>


      {/* Full Quiz Item */}
      <div className="selection-item justify-between items-center p-4 border bg-white rounded-md shadow-sm mb-4 flex flex-wrap gap-y-2">
        <span className="selection-item-label font-medium text-slate-700 flex-grow basis-full sm:basis-auto mb-2 sm:mb-0">
          Full Quiz ({totalQuestionsInCourse} Questions)
        </span>
        <div className="selection-item-actions flex items-center gap-2 flex-wrap justify-end basis-full sm:basis-auto">
          {fullQuizInProgress ? (
            <span className="progress-indicator text-xs font-semibold text-amber-600 mr-2 whitespace-nowrap">
              (In Progress - Q# {fullQuizInProgress.currentIndex + 1})
            </span>
          ) : fullQuizLastCompletion ? (
            <div className="flex items-center">
              <span className="progress-indicator text-xs font-semibold mr-1 whitespace-nowrap">
                (Last: {fullQuizLastCompletion.score}/{fullQuizLastCompletion.totalQuestions})
              </span>
              {typeof fullQuizLastCompletion.percentage === 'number' &&
                <CompletionBadge percentage={fullQuizLastCompletion.percentage} threshold={passThreshold} />
              }
            </div>
          ) : null}
          {/* Button Logic */}
          {fullQuizInProgress ? (
            <Button onClick={() => handleStartQuiz(null)} size="sm">Resume</Button>
          ) : fullQuizLastCompletion ? (
            <Button onClick={() => handleStartQuiz(null)} size="sm" variant='secondary'>Retake</Button>
          ) : (
            <Button onClick={() => handleStartQuiz(null)} size="sm">Start</Button>
          )}
        </div>
      </div>

      {/* Topics List */}
      {courseTopics.length > 0 && (
        <>
            <h3 className="text-lg font-semibold text-center my-4">Or Select a Topic:</h3>
            <ul className="topic-list space-y-3">
            {courseTopics.map((topic) => {
                if (!topic) return null;

                const topicConfig: QuizConfig = { courseId: selectedCourseId!, topicId: topic, type: 'topic' };
                const quizKey = getQuizStateKey(topicConfig);
                const questionCount = topicCounts[topic] || 0;
                const topicInProgress = quizKey ? inProgressQuizzes[quizKey] : null;
                const topicLastCompletion = quizKey ? completedQuizHistory[quizKey] : null;

                if (questionCount === 0) return null;

                return (
                    <li key={topic} className="selection-item justify-between items-center p-4 border bg-white rounded-md shadow-sm flex flex-wrap gap-y-2">
                    <span className="selection-item-label font-medium text-slate-700 flex-grow basis-full sm:basis-auto mb-2 sm:mb-0">
                        {topic} ({questionCount} Questions)
                    </span>
                    <div className="selection-item-actions flex items-center gap-2 flex-wrap justify-end basis-full sm:basis-auto">
                        {topicInProgress ? (
                        <span className="progress-indicator text-xs font-semibold text-amber-600 mr-2 whitespace-nowrap">
                            (In Progress - Q# {topicInProgress.currentIndex + 1})  
                        </span>
                        ) : topicLastCompletion ? (
                        <div className="flex items-center">
                            <span className="progress-indicator text-xs font-semibold mr-1 whitespace-nowrap">
                            (Last: {topicLastCompletion.score}/{topicLastCompletion.totalQuestions})
                            </span>
                            {typeof topicLastCompletion.percentage === 'number' &&
                            <CompletionBadge percentage={topicLastCompletion.percentage} threshold={passThreshold} />
                            }
                        </div>
                        ) : null}
                        {topicInProgress ? (
                        <Button onClick={() => handleStartQuiz(topic)} size="sm">Resume</Button>
                        ) : topicLastCompletion ? (
                        <Button onClick={() => handleStartQuiz(topic)} size="sm" variant='secondary'>Retake</Button>
                        ) : (
                        <Button onClick={() => handleStartQuiz(topic)} size="sm">Start</Button>
                        )}
                    </div>
                    </li>
                );
            })}
            </ul>
        </>
      )}
      {courseTopics.length === 0 && (
         <p className="text-center text-slate-500 mt-4">No specific topics found for this course.</p>
      )}
    </div>
  );
};

export default QuizSelection;
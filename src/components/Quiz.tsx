// src/components/Quiz.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuizConfig, QuizItem, AnswerResult, QuizResults, SavedQuizState } from '../types/quiz';
import { useQuizStateManagement } from '../hooks/useQuizStateManagement'; // Import hook
import { getQuizItems, getCourseById, getQuestionById } from '../data/quizData';
import Question from './Question';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import './Quiz.css';

interface QuizProps {
  quizConfig: QuizConfig; // Receive config object
  onComplete: (results: QuizResults) => void; // Callback for completion (triggers navigation in App)
  onBack: () => void; // Callback for going back (triggers navigation in App)
}

const Quiz: React.FC<QuizProps> = ({
  quizConfig,
  onComplete,
  onBack,
}) => {
  const { courseId, topicId } = quizConfig;
  // Use the state management hook internally now
  const { saveQuizState, loadQuizState, getQuizStateKey } = useQuizStateManagement();

  const [currentQuestions, setCurrentQuestions] = useState<QuizItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | Set<string> | null)[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showFeedbackForSingleChoice, setShowFeedbackForSingleChoice] = useState(false);
  const [answerStatuses, setAnswerStatuses] = useState<( 'correct' | 'incorrect' | null)[]>([]);
  const [checkedAnswers, setCheckedAnswers] = useState<boolean[]>([]); // Tracks if a multi-select question has been checked
  const [isLoaded, setIsLoaded] = useState(false); // Flag to indicate if state is loaded/initialized

  // Memoize course data fetching
  const course = useMemo(() => getCourseById(courseId), [courseId]);
  // Memoize the key calculation
  const quizKey = useMemo(() => getQuizStateKey(quizConfig), [quizConfig, getQuizStateKey]);

  // Load existing state or initialize new quiz
  useEffect(() => {
    console.log(`Quiz effect running. Key: ${quizKey}, CourseID: ${courseId}, TopicID: ${topicId}`);
    if (!quizKey || !courseId) {
      console.warn("Quiz effect: quizKey or courseId is missing, cannot load/initialize.");
      setIsLoaded(true); // Mark as loaded to prevent loops
      setCurrentQuestions([]); // Ensure it's empty
      return;
    }

    const savedState = loadQuizState(quizConfig);
    if (savedState && Array.isArray(savedState.questionIds) && savedState.questionIds.length > 0) {
      console.log("Loading saved state:", savedState);

      // Fetch the actual question data based on saved IDs
      const loadedQuestions = savedState.questionIds
        .map(id => getQuestionById(courseId, id))
        .filter(q => q !== undefined) as QuizItem[];

      // Validate loaded state against current questions (important if data changes)
      if (loadedQuestions.length !== savedState.questionIds.length) {
         console.warn("Mismatch between saved question IDs and available questions. Resetting quiz.");
         // Could trigger a reset here instead of continuing with potentially bad state
         // For now, we proceed but log the warning.
      }

       // Restore answers, converting arrays back to Sets for multi-select
      const answersWithSets = savedState.userAnswers.map((ans, index): string | Set<string> | null => {
          const question = loadedQuestions[index]; // Use already filtered/validated questions
          if (!question) return null; // Should not happen if filtering worked
          const isMulti = isMultiSelect(question.correctAnswer || []);
          if (isMulti && Array.isArray(ans)) {
            return new Set(ans);
          }
          return ans as string | null; // Cast single answers or keep null
      });

      // Ensure checkedAnswers array exists and has the correct length, default to false
      const loadedCheckedAnswers = (savedState.checkedAnswers && savedState.checkedAnswers.length === loadedQuestions.length)
          ? savedState.checkedAnswers
          : Array(loadedQuestions.length).fill(false);

      // Restore Answer Statuses based on loaded answers (only for single-choice initially)
      const loadedStatuses = answersWithSets.map((userAns, idx) => {
          const question = loadedQuestions[idx];
          if (!question) return null;
          const isMulti = isMultiSelect(question.correctAnswer || []);
          if (isMulti || userAns === null) return null; // Status for multi only set after checking
          return (question.correctAnswer || []).includes(userAns as string) ? 'correct' : 'incorrect';
      });

      setCurrentQuestions(loadedQuestions);
      // Bounds check for index
      setCurrentQuestionIndex(savedState.currentIndex < loadedQuestions.length ? savedState.currentIndex : 0);
      setUserAnswers(answersWithSets);
      setStartTime(savedState.startTime ?? Date.now()); // Use saved time or start now if null
      setCheckedAnswers(loadedCheckedAnswers);
      setAnswerStatuses(loadedStatuses);
      // Determine if feedback should be shown for the loaded question index
      const loadedIndex = savedState.currentIndex < loadedQuestions.length ? savedState.currentIndex : 0;
      setShowFeedbackForSingleChoice(
          loadedIndex < loadedStatuses.length && // Check bounds
          loadedStatuses[loadedIndex] !== null && // Status is set (meaning it was single choice and answered)
          loadedIndex < loadedQuestions.length && // Check bounds again
          !isMultiSelect(loadedQuestions[loadedIndex]?.correctAnswer || []) // Ensure it's single choice
      );

    } else {
      // Initialize new quiz state
      console.log("Initializing new quiz state...");
      const questions = getQuizItems(courseId, topicId);
      const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());

      // REMOVED THE LIMIT - Use all shuffled questions
      const questionsToUse = shuffledQuestions;

      setCurrentQuestions(questionsToUse);
      const numQuestions = questionsToUse.length;
      setUserAnswers(Array(numQuestions).fill(null));
      setAnswerStatuses(Array(numQuestions).fill(null));
      setCheckedAnswers(Array(numQuestions).fill(false));
      setCurrentQuestionIndex(0);
      setStartTime(Date.now());
      setShowFeedbackForSingleChoice(false);
    }
    setIsLoaded(true); // Mark state as loaded/initialized

  }, [quizConfig, courseId, topicId, loadQuizState, getQuizStateKey]); // Dependencies


  // Save state whenever answers or index change, *after* initial load
  useEffect(() => {
    // Prevent saving before initialization or if quiz is empty/not ready
    if (!isLoaded || !quizKey || startTime === null || currentQuestions.length === 0) {
        // console.log("Save effect skipped: Not loaded, no key, no start time, or no questions.");
        return;
    }

    // Convert Set answers to Array for localStorage compatibility
    const answersForStorage = userAnswers.map(ans => ans instanceof Set ? Array.from(ans) : ans);

    const stateToSave: SavedQuizState = {
      currentIndex: currentQuestionIndex,
      userAnswers: answersForStorage, // Save the array version
      startTime,
      questionIds: currentQuestions.map(q => q.id),
      courseId: courseId, // Include config in saved state for validation on load
      topicId: topicId,
      checkedAnswers: checkedAnswers // Save checked state
    };
    console.log(`Save effect: Saving state for key ${quizKey}`); // Log before saving
    saveQuizState(quizConfig, stateToSave);

  }, [userAnswers, currentQuestionIndex, currentQuestions, startTime, quizKey, saveQuizState, quizConfig, isLoaded, checkedAnswers, courseId, topicId]); // Include all relevant state


  const isMultiSelect = (correctAnswers: string[] = []): boolean => Array.isArray(correctAnswers) && correctAnswers.length > 1;

  const handleAnswer = useCallback((questionIndex: number, selectedValue: string | Set<string>) => {
    if (!isLoaded) return; // Prevent updates before state is loaded
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = selectedValue;
      return newAnswers;
    });

    const currentQData = currentQuestions[questionIndex];
    if (currentQData && !isMultiSelect(currentQData.correctAnswer || [])) {
      const correct = (currentQData.correctAnswer || []).includes(selectedValue as string);
      setAnswerStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[questionIndex] = correct ? 'correct' : 'incorrect';
        return newStatuses;
      });
      setShowFeedbackForSingleChoice(true);
    } else {
        // Reset status & checked state for multi-choice if answer changes before checking
        setAnswerStatuses(prev => {
            const newStatuses = [...prev];
            newStatuses[questionIndex] = null;
            return newStatuses;
        });
        setCheckedAnswers(prev => {
            const newChecked = [...prev];
            newChecked[questionIndex] = false; // Allow re-checking if answer changes
            return newChecked;
        });
        setShowFeedbackForSingleChoice(false); // Ensure single-choice feedback is hidden
    }
  }, [currentQuestions, isLoaded]);

  const handleCheckMultiAnswer = useCallback((questionIndex: number) => {
    if (!isLoaded) return;
    const currentQData = currentQuestions[questionIndex];
    const userAnswerForQuestion = userAnswers[questionIndex];
    let isCorrectFlag = false;

    if (currentQData && userAnswerForQuestion instanceof Set) {
        const correctAnswers = currentQData.correctAnswer || [];
        isCorrectFlag = correctAnswers.length === userAnswerForQuestion.size &&
                        correctAnswers.every(ca => userAnswerForQuestion.has(ca));
    }

    setAnswerStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[questionIndex] = isCorrectFlag ? 'correct' : 'incorrect';
        return newStatuses;
    });

    setCheckedAnswers(prev => {
        const newChecked = [...prev];
        newChecked[questionIndex] = true;
        return newChecked;
    });
    setShowFeedbackForSingleChoice(false); // Ensure single-choice feedback is hidden
  }, [currentQuestions, userAnswers, isLoaded]);


  const nextQuestion = () => {
    setShowFeedbackForSingleChoice(false); // Hide feedback when moving next
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
       // Check if the next question is single choice and already answered (e.g., resuming)
       const nextQ = currentQuestions[nextIndex];
       const nextStatus = answerStatuses[nextIndex];
       if(nextQ && !isMultiSelect(nextQ.correctAnswer || []) && nextStatus !== null) {
            setShowFeedbackForSingleChoice(true);
       }
    }
  };

  const prevQuestion = () => {
    setShowFeedbackForSingleChoice(false); // Hide feedback when moving back
    const prevIndex = currentQuestionIndex - 1;
    if (prevIndex >= 0) {
        setCurrentQuestionIndex(prevIndex);
         // Check if the previous question is single choice and already answered
        const prevQ = currentQuestions[prevIndex];
        const prevStatus = answerStatuses[prevIndex];
        if(prevQ && !isMultiSelect(prevQ.correctAnswer || []) && prevStatus !== null) {
            setShowFeedbackForSingleChoice(true);
        }
    }
  };

  const finishQuiz = () => {
    if (startTime === null || currentQuestions.length === 0 || !isLoaded) return;
    const endTime = Date.now();
    const durationInSeconds = Math.round((endTime - startTime) / 1000);
    let score = 0;
    const answerDetails: AnswerResult[] = currentQuestions.map((q, index) => {
      let isCorrectFlag = false;
      const userAnswerForQuestion = userAnswers[index];
      const options = q.options || {};
      const correctAnswers = q.correctAnswer || [];

      // Final calculation of correctness
      if (isMultiSelect(correctAnswers)) {
        if (userAnswerForQuestion instanceof Set) {
          isCorrectFlag = correctAnswers.length === userAnswerForQuestion.size &&
                      correctAnswers.every(ca => userAnswerForQuestion.has(ca));
        }
      } else {
        // Handle null/undefined userAnswerForQuestion gracefully
        isCorrectFlag = correctAnswers.includes(userAnswerForQuestion as string ?? '');
      }
      if (isCorrectFlag) score++;

      return {
        questionId: q.id,
        userAnswer: userAnswerForQuestion, // Pass Set or string or null
        correctAnswer: correctAnswers,
        isCorrect: isCorrectFlag,
        options: options
      };
    });

     // Clear the in-progress state *before* calling onComplete to navigate away
     if (quizKey) {
        saveQuizState(quizConfig, null);
     }

    onComplete({ // Call the handler passed from App.tsx
      score,
      totalQuestions: currentQuestions.length,
      answers: answerDetails,
      duration: durationInSeconds,
      questionIds: currentQuestions.map(q => q.id),
      courseId: courseId,
      topicId: topicId,
      timestamp: Date.now(),
      percentage: currentQuestions.length > 0 ? (score / currentQuestions.length) * 100 : 0
    });
  };

  const currentQuestionData = currentQuestions[currentQuestionIndex];

  // Improved loading/error state
  if (!isLoaded) {
      return <div className="text-center p-8">Loading quiz state...</div>;
  }
  if (currentQuestions.length === 0) {
     return (
        <div className="text-center p-8">
            <p className="mb-4">No questions available for this selection.</p>
            <Button onClick={onBack} variant="secondary">Back to Selection</Button>
        </div>
     );
  }
  if (!currentQuestionData) {
       // This might happen briefly or if index calculation is off
       console.error("Error: currentQuestionData is undefined at index", currentQuestionIndex);
       return (
           <div className="text-center p-8">
               <p className="mb-4 text-red-600">Error loading current question.</p>
               <Button onClick={onBack} variant="secondary">Back to Selection</Button>
           </div>
       );
   }


  const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;

  return (
    <div className="quiz-container max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-lg border border-slate-200">
        <div className="quiz-header mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-center text-slate-800 mb-3">
                {course?.title || 'Quiz'} {topicId ? `(${topicId})` : ''}
            </h2>
            <ProgressBar progress={progress} />
        </div>

      {currentQuestionData && (
        <Question
          key={currentQuestionData.id || currentQuestionIndex} // Use question ID if available
          questionData={currentQuestionData}
          onAnswer={handleAnswer}
          onCheckAnswer={isMultiSelect(currentQuestionData.correctAnswer || []) ? handleCheckMultiAnswer : undefined}
          userAnswer={userAnswers[currentQuestionIndex]}
          showFeedback={showFeedbackForSingleChoice}
          isChecked={checkedAnswers[currentQuestionIndex] || false}
          answerStatus={answerStatuses[currentQuestionIndex] || null}
          questionIndex={currentQuestionIndex}
          totalQuestionsInQuiz={currentQuestions.length}
          courseId={courseId} // Pass courseId down to Question
        />
      )}

      <div className="navigation-buttons mt-8 flex justify-between items-center">
        <Button onClick={prevQuestion} disabled={currentQuestionIndex === 0} variant="secondary">
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          {/* Question {currentQuestionIndex + 1} of {currentQuestions.length} */}
        </span>
        {currentQuestionIndex < currentQuestions.length - 1 ? (
          <Button
            onClick={nextQuestion}
            // Disable Next button logic:
            // - If single choice: disable if no answer OR feedback not shown yet
            // - If multi choice: disable if not checked yet
            disabled={
                (!isMultiSelect(currentQuestionData?.correctAnswer || []) && userAnswers[currentQuestionIndex] === null) ||
                (!isMultiSelect(currentQuestionData?.correctAnswer || []) && !showFeedbackForSingleChoice) ||
                (isMultiSelect(currentQuestionData?.correctAnswer || []) && !checkedAnswers[currentQuestionIndex])
            }
            variant="primary"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={finishQuiz}
            // Disable Finish button logic (same as Next for the last question)
             disabled={
                (!isMultiSelect(currentQuestionData?.correctAnswer || []) && userAnswers[currentQuestionIndex] === null) ||
                (!isMultiSelect(currentQuestionData?.correctAnswer || []) && !showFeedbackForSingleChoice) ||
                (isMultiSelect(currentQuestionData?.correctAnswer || []) && !checkedAnswers[currentQuestionIndex])
            }
            variant="success"
          >
            Finish Quiz
          </Button>
        )}
      </div>
       <div className="mt-6 text-center">
            <Button onClick={onBack} variant="outline" size="sm"> {/* Use onBack prop */}
                Quit Quiz
            </Button>
        </div>
    </div>
  );
};

export default Quiz;
// src/components/Question.tsx
import React, { useState, useEffect } from 'react';
import { QuizItem, CaseStudyItem } from '../types/quiz';
import Button from './ui/Button';
import { getCaseStudyById } from '../data/quizData';
import './Question.css';

interface QuestionProps {
  questionData: QuizItem;
  onAnswer: (questionIndex: number, value: string | Set<string>) => void;
  onCheckAnswer?: (questionIndex: number) => void; // Optional for multi-select
  userAnswer: string | Set<string> | any;
  showFeedback: boolean;
  isChecked: boolean;
  answerStatus: 'correct' | 'incorrect' | null;
  questionIndex: number;
  totalQuestionsInQuiz: number;
  courseId: string; // Prop needed to fetch case study correctly
}

// Helper functions
const isMultipleCorrect = (correctAnswers: string[] = []): boolean =>
  Array.isArray(correctAnswers) && correctAnswers.length > 1;
const isCorrectOption = (optionKey: string, correctAnswers: string[] = []): boolean =>
  Array.isArray(correctAnswers) && correctAnswers.includes(optionKey);

const Question: React.FC<QuestionProps> = ({
  questionData,
  onAnswer,
  onCheckAnswer,
  userAnswer,
  showFeedback,
  isChecked,
  answerStatus,
  questionIndex,
  totalQuestionsInQuiz,
  courseId, // Receive courseId
}) => {
  const {
    question: questionText,
    options = {},
    correctAnswer = [],
    explanation,
    topic,
    id,
    conditions,
    caseStudyId // Get caseStudyId from questionData
  } = questionData ?? {}; // Destructure safely

  const [caseStudyDetails, setCaseStudyDetails] = useState<CaseStudyItem | undefined>(undefined);
  const multipleCorrect = isMultipleCorrect(correctAnswer);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCaseAndConditions, setShowCaseAndConditions] = useState(false);

  // Fetch case study details when caseStudyId or courseId changes
  useEffect(() => {
    if (caseStudyId && courseId) {
      const study = getCaseStudyById(courseId, caseStudyId);
      setCaseStudyDetails(study);
    } else {
      setCaseStudyDetails(undefined);
    }
  }, [caseStudyId, courseId]);


  // Determine if feedback should be actively displayed for options/container
  const displayFeedbackActive = (showFeedback && !multipleCorrect) || isChecked;

  // Reset explanation when moving off a question where feedback was shown
  useEffect(() => {
    if (!displayFeedbackActive) {
      setShowExplanation(false);
    }
  }, [displayFeedbackActive]);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent changing answer if feedback is already shown (either immediate or after check)
    if (displayFeedbackActive) return;

    const { value, checked, type } = event.target;

    if (type === 'checkbox') { // Always handle checkboxes via Sets
      const currentSet = userAnswer instanceof Set ? userAnswer : new Set<string>();
      const newAnswers = new Set(currentSet);
      if (checked) {
        newAnswers.add(value);
      } else {
        newAnswers.delete(value);
      }
      onAnswer(questionIndex, newAnswers);
    } else { // Radio button
      onAnswer(questionIndex, value);
    }
  };

  const handleCheckButtonClick = () => {
    if (onCheckAnswer) {
      onCheckAnswer(questionIndex);
    }
  };

  // Function to render question text preserving line breaks and handling code blocks
  const renderFormattedText = (text: string | undefined | null): React.ReactNode => {
    if (!text) return null;
    // Split by markdown-style code blocks first
    const codeBlockRegex = /(```[\s\S]*?```)/g; // Capture the delimiters
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
        // Check if the part is a code block (captured group)
        if (part.startsWith('```') && part.endsWith('```')) {
            // Extract content inside ```, remove leading/trailing whitespace
            const codeContent = part.substring(3, part.length - 3).trim();
            return (
                <pre key={`code-${index}`} className="my-3 p-3 bg-gray-100 border rounded overflow-x-auto">
                    <code className="text-sm font-mono">{codeContent}</code>
                </pre>
            );
        } else {
            // Regular text part, preserve line breaks using CSS
            return (
                <span key={`text-${index}`} style={{ whiteSpace: 'pre-line' }}>
                    {part}
                </span>
            );
        }
    });
};


  return (
    <div
      className={`question-container bg-white shadow-md rounded-lg p-5 mb-6 border-t-4 ${
        displayFeedbackActive && answerStatus === 'correct' ? 'border-green-500' : ''
      } ${
        displayFeedbackActive && answerStatus === 'incorrect' ? 'border-red-500' : ''
      } ${!displayFeedbackActive ? 'border-slate-200' : ''}`} // Adjusted default border
      data-question-id={id}
    >
      <div className="flex justify-end mb-3"> {/* Moved button to top right */}
        {caseStudyId && (
          <button
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            onClick={() => setShowCaseAndConditions(prev => !prev)}
          >
            {showCaseAndConditions ? "Hide Details" : "View Case Study"}
          </button>
        )}
         {/* Can add a similar button for conditions if needed */}
      </div>
      {showCaseAndConditions && caseStudyDetails && caseStudyDetails.caseStudyText && (
        <div className="context-box question-context mb-4 p-3 bg-slate-50 border rounded text-sm text-slate-700 animate-fadeIn"> {/* Added animation */}
          <strong>Case Study:</strong>
          {/* Use dangerouslySetInnerHTML only for HTML content like <br>, <strong> */}
          <div dangerouslySetInnerHTML={{ __html: caseStudyDetails.caseStudyText }}></div>
        </div>
      )}

      {showCaseAndConditions && conditions && conditions.length > 0 && (
        <div className="question-conditions mb-4 p-3 bg-slate-50 border rounded text-sm animate-fadeIn"> {/* Added animation */}
          <strong className="text-slate-800">Conditions:</strong>
          <ul className="list-disc list-inside mt-1 text-slate-700">
            {conditions.map((cond, index) => <li key={index}>{cond}</li>)}
          </ul>
        </div>
      )}

      <h4 className="question-title text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-2 border-b">
        {`Question ${questionIndex + 1} / ${totalQuestionsInQuiz} | Topic: ${topic || 'General'}`}
      </h4>
      {/* Use the formatting function for the question text */}
      <div className="question-text text-slate-800 leading-relaxed">
          {renderFormattedText(questionText)}
      </div>

      {multipleCorrect && !displayFeedbackActive && <p className="select-all-notice text-sm italic text-slate-500 my-3">(Select all that apply)</p>}

      <div className="options-container mt-4 space-y-3">
        {Object.entries(options).map(([key, value]) => {
          const isSelected = multipleCorrect
            ? userAnswer instanceof Set && userAnswer.has(key)
            : userAnswer === key;

          let optionClass = "option-label block border rounded-md p-3 cursor-pointer transition duration-150 ease-in-out ";
          let feedbackIcon = null;
          const isThisCorrect = isCorrectOption(key, correctAnswer);

          // Base styling
           optionClass += 'border-slate-300 bg-white '; // Start with base

           // Hover effect only when feedback is not active
           if (!displayFeedbackActive) {
                optionClass += 'hover:bg-slate-50 hover:border-slate-400 ';
           }

          // Feedback styling (overrides hover)
          if (displayFeedbackActive) {
            optionClass += 'cursor-default '; // Indicate non-interactivity
            if (isSelected && isThisCorrect) {
              optionClass += " border-green-500 bg-green-50 ring-1 ring-green-500";
              feedbackIcon = <span className="feedback-icon correct text-green-600 font-bold ml-auto pl-2"> ✔ Correct</span>;
            } else if (isSelected && !isThisCorrect) {
              optionClass += " border-red-500 bg-red-50 ring-1 ring-red-500";
              feedbackIcon = <span className="feedback-icon incorrect text-red-600 font-bold ml-auto pl-2"> ✘ Incorrect</span>;
            } else if (!isSelected && isThisCorrect) {
              // Indicate the correct answer(s) if the user missed them or answered incorrectly
              optionClass += "border-green-500 border-dashed bg-green-50";
            } else {
                 // Default for non-selected, non-correct options during feedback
                 optionClass += "border-slate-300 opacity-60";
            }
          }


          return (
            <div key={key} className={optionClass}>
              <label className="flex items-center cursor-pointer w-full"> {/* Use flex for icon alignment */}
                <input
                  type={multipleCorrect ? 'checkbox' : 'radio'}
                  name={`question_${id || questionIndex}`}
                  value={key}
                  checked={isSelected || false}
                  onChange={handleOptionChange}
                  disabled={displayFeedbackActive} // Disable after feedback/check
                  className={`form-${multipleCorrect ? 'checkbox' : 'radio'} ${displayFeedbackActive ? 'cursor-default opacity-70' : 'cursor-pointer'} text-emerald-600 border-gray-300 rounded focus:ring-emerald-500`}
                />
                <span className={`option-key font-semibold mx-2 ${displayFeedbackActive ? 'opacity-70' : ''}`}>{key})</span>
                {/* Render option value preserving line breaks */}
                <span className={`option-value flex-grow ${displayFeedbackActive ? 'opacity-70' : ''}`} style={{ whiteSpace: 'pre-line' }}>{value}</span>
                {feedbackIcon}
              </label>
            </div>
          );
        })}
        {!Object.keys(options).length && <p className="text-red-600">Error: No options found for this question.</p>}
      </div>

        {/* Check Answer Button for Multi-Select */}
      {multipleCorrect && !isChecked && onCheckAnswer && (
          <div className="mt-4 text-right">
            <Button
                variant="primary"
                onClick={handleCheckButtonClick}
                disabled={!(userAnswer instanceof Set && userAnswer.size > 0)} // Disable if nothing selected
            >
                Check Answer
            </Button>
         </div>
      )}


      {/* Explanation Section */}
      {displayFeedbackActive && (
        (typeof explanation === 'string' && explanation.trim().length > 0) ||
        (typeof explanation === 'object' && explanation !== null && (explanation['correct']|| explanation['incorrect']))
      ) && (
        <div className="mt-4   pt-3">
          <Button variant="link" size="sm" onClick={() => setShowExplanation(!showExplanation)} className="text-blue-600 hover:text-blue-800">
            {showExplanation ? 'Hide' : 'Show'} Explanation ▼
          </Button>
          {showExplanation && (
            <div className="explanation-text mt-2 p-4 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 leading-normal animate-fadeIn">
                {correctAnswer.length > 0 &&
                    <p className="mb-2"><strong>Correct Answer(s): {correctAnswer.join(", ")}</strong></p>
                }
                {/* Render explanation preserving line breaks */}
                {typeof explanation === 'object' && explanation !== null ? (
                  <div>
                    {explanation["correct"] && (
                      <div style={{ whiteSpace: 'pre-line', marginBottom: '0.5em' }}>
                        <strong>Explanation (Correct):</strong> <i>{explanation["correct"]}</i>
                      </div>
                    )}
                    {explanation['incorrect'] && typeof explanation['incorrect'] === 'object' && (
                      <div>
                        <strong>Incorrect Options:</strong>
                        <ul style={{ marginTop: '0.25em' }}>
                          {Object.entries(explanation['incorrect']).map(([key, value]) => (
                            <li key={key}><b>{key}:</b> <i>{String(value)}</i></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-line' }}><i>{explanation}</i></div>
                )}
            </div>
          )}
        </div>
      )}

      
      
    </div>
  );
};

export default Question;
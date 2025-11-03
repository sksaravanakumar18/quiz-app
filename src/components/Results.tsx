// src/components/Results.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Button from './ui/Button';
import { QuizResults, CaseStudyItem } from '../types/quiz'; // QuizItem removed
import { getCourseById, getQuestionById, getCaseStudyById } from '../data/quizData';
import './Results.css';

const ResultChart: React.FC<{ score: number; totalQuestions: number }> = ({ score, totalQuestions }) => {
     const correct = score;
     const incorrect = totalQuestions - score;
     const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100) : 0;
     return (
        <div className="result-chart-placeholder my-6 p-4 border rounded bg-slate-50 text-center">
        <h4 className="text-lg font-semibold mb-2">Score Breakdown</h4>
        <div className="flex justify-around items-center text-sm mb-2">
            <span>Correct: <span className="font-bold text-green-600">{correct}</span> </span>
            <span>Incorrect: <span className="font-bold text-red-600">{incorrect}</span></span>
        </div>
         {/* Basic SVG Bar */}
         <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-2">
             <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
         </div>
         <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
        </div>
     );
};


interface ResultsProps {
  results: QuizResults;
  onRetry: () => void; // Function to go back to selection/home
}

const Results: React.FC<ResultsProps> = ({ results, onRetry }) => {
  // Read history for display, but adding happens in App.tsx via addResultToHistory
  const [allStoredResults] = useLocalStorage<QuizResults[]>('quizResults', []);
  const [caseStudyDetailsMap, setCaseStudyDetailsMap] = useState<Record<string, CaseStudyItem | undefined>>({});

  const {
      score,
      totalQuestions,
      answers,
      duration,
      questionIds = [],
      courseId,
      topicId,
      // timestamp // Not directly needed for display logic here
  } = results;

  const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100) : 0;

  const courseData = useMemo(() => getCourseById(courseId), [courseId]);
  const topic = topicId;

  // Filter past results for the same quiz config
  const filteredPastResults = useMemo(() => {
    return allStoredResults
      .filter(res => res.courseId === courseId && res.topicId === topicId)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort newest first
  }, [allStoredResults, courseId, topicId]);


  // Fetch case study details for all questions in the current result set
  useEffect(() => {
    const fetchDetails = () => { // No need for async here
      const details: Record<string, CaseStudyItem | undefined> = {};
      if (questionIds && courseId) {
        for (const qId of questionIds) {
          const question = getQuestionById(courseId, qId);
          if (question?.caseStudyId && !details[question.caseStudyId]) {
            const study = getCaseStudyById(courseId, question.caseStudyId);
            if (study) {
              details[question.caseStudyId] = study;
            }
          }
        }
      }
      setCaseStudyDetailsMap(details);
    };
    fetchDetails();
  }, [questionIds, courseId]); // Dependencies are correct


  const renderQuestionTextForResult = (text: string = "") => {
    if (!text) return '';
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <pre key={index} className="my-2 p-2 bg-gray-100 border rounded overflow-x-auto text-xs"><code>{part.trim()}</code></pre>;
      } else {
         // Render text preserving line breaks using CSS white-space
         return <span key={index} style={{ whiteSpace: 'pre-line' }}>{part}</span>;
      }
    });
  };

   const formatAnswerDisplay = (answerData: string | string[] | Set<string> | null, options: { [key: string]: string } | undefined ): string => {
        if (answerData === null || answerData === undefined) return 'Not Answered';
        if (!options || Object.keys(options).length === 0) return 'Options Missing/Invalid';

        let keys: string[];
        if (answerData instanceof Set) {
            keys = Array.from(answerData);
        } else {
            keys = Array.isArray(answerData) ? answerData : [answerData];
        }

        if (keys.length === 0) return 'Not Answered';
        keys.sort(); // Sort for consistent display order
        return keys.map(key => {
            const valueText = options[key] ? `: ${options[key]}` : ' (Option text missing)';
            return `${key}${valueText}`;
        }).join('; ');
   }

  return (
    <div className="results-container max-w-4xl mx-auto p-4 md:p-6">
       <div className="text-right mb-4">
         <Button onClick={onRetry} variant="secondary">Select New Quiz</Button>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">
          Quiz Results {courseData?.title ? `for ${courseData.title}` : (courseId ? `for Course ${courseId}`: '')} {topic ? `(${topic})` : '(Full Quiz)'}
      </h2>
       <div className="text-center">
         <p className="results-summary text-xl my-3">
           You scored <strong>{score}</strong> out of <strong>{totalQuestions}</strong> ({percentage.toFixed(1)}%)
         </p>
         <p className="results-duration text-sm text-slate-500 mb-5">Duration: {duration} seconds</p>
      </div>
      <ResultChart score={score} totalQuestions={totalQuestions} />


      <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2">Detailed Results:</h3>
      <ul className="detailed-results-list space-y-6">
        {questionIds && questionIds.length > 0 ? (
          questionIds.map((qId, resultIndex) => {
            const question = getQuestionById(courseId, qId);
            const resultInfo = answers[resultIndex]; // Get the specific answer result
            const caseStudy = question?.caseStudyId ? caseStudyDetailsMap[question.caseStudyId] : undefined;


            if (!question || !resultInfo) {
              console.error(`Could not find question or result for ID/Index: ${qId} at resultIndex ${resultIndex}`);
              return <li key={`error-${qId}-${resultIndex}`} className="result-item error p-4 border border-red-300 bg-red-50 rounded">Error displaying details for question {qId}</li>;
            }

            // Destructure from resultInfo for clarity
            const { userAnswer, correctAnswer, isCorrect } = resultInfo;

            return (
                <li key={`${qId}-${resultIndex}`} className={`result-item border rounded-lg p-4 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   {question.caseStudyId && caseStudy && caseStudy.caseStudyText && (
                    <div className="context-box question-context mb-3 p-2 bg-slate-100 border border-slate-200 rounded text-xs">
                      <strong>Case Study:</strong>
                      <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: caseStudy.caseStudyText.replace(/(\r\n\r\n|\n\n)/g, '<br/><br/>').replace(/(\r\n|\n)/g, '<br/>') }}></div>
                    </div>
                  )}
                  {question.conditions && question.conditions.length > 0 && (
                  <div className="question-conditions mb-3 p-2 bg-slate-100 border border-slate-200 rounded text-xs">
                    <strong>Conditions:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">{question.conditions.map((c, i)=><li key={i}>{c}</li>)}</ul>
                  </div>
                  )}
                <div className="result-question-title mb-2">
                  <strong className="text-base font-semibold">Q{resultIndex + 1} ({question?.topic || 'N/A'}):</strong>
                </div>
                <div className="result-question-text text-sm mb-3 text-slate-700">
                  {renderQuestionTextForResult(question?.question)}
                </div>
                  {/* Use resultInfo.options directly */}
                  {resultInfo.options && Object.keys(resultInfo.options).length > 0 && (
                  <div className="result-answers mt-2 pl-3 border-l-2 border-slate-300">
                  <p className={`user-answer text-sm mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    Your answer: {formatAnswerDisplay(userAnswer, resultInfo.options)}
                    {isCorrect ? <span className="feedback-icon correct ml-2">✔</span> : <span className="feedback-icon incorrect ml-2">✘</span>}
                  </p>
                    {!isCorrect && (
                      <p className="correct-answer text-sm font-medium text-green-800">
                        Correct answer(s): {formatAnswerDisplay(correctAnswer, resultInfo.options)}
                      </p>
                    )}
                  </div>
                )}
                  {/* Explanation rendering for new structure */}
                  {question.explanation && (
                  <div className="explanation-text mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <strong>Explanation:</strong>
                    {isCorrect && typeof question.explanation === 'object' && 'correct' in question.explanation ? (
                    <span> <i>{question.explanation['correct']}</i></span>
                    ) : !isCorrect && typeof question.explanation === 'object' && 'incorrect' in question.explanation ? (
                    <>
                      {typeof userAnswer === 'string' && question.explanation['incorrect'][userAnswer] && (
                      <span> <i>{question.explanation['incorrect'][userAnswer]}</i></span>
                      )}
                      {Array.isArray(userAnswer) && userAnswer.map((ans, idx) =>
                      question.explanation['incorrect'][ans] ? (
                        <div key={idx}><i>{question.explanation['incorrect'][ans]}</i></div>
                      ) : null
                      )}
                      {/* fallback if no specific explanation */}
                      {!(
                      (typeof userAnswer === 'string' && question.explanation['incorrect'][userAnswer]) ||
                      (Array.isArray(userAnswer) && userAnswer.some(ans => question.explanation['incorrect'][ans]))
                      ) && question.explanation['correct'] && (
                      <span> <i>{question.explanation['correct']}</i></span>
                      )}
                    </>
                    ) : (
                    // fallback for old string explanation or missing structure
                    <span> <i>{typeof question.explanation === 'string' ? question.explanation : ''}</i></span>
                    )}
                  </div>
                  )}
                </li>
            );
          })
        ) : (
          <li>No questions were answered in this session.</li>
        )}
      </ul>

      <hr className="my-8" />
      <h3 className="text-lg font-semibold mb-3">
         Past Results for {courseData?.title ?? (courseId || 'Unknown Course')} {topic ? `(${topic})` : '(Full Quiz)'} (Last {filteredPastResults.length}):
      </h3>
      <ul className="past-results-list list-none p-4 border rounded bg-slate-50 max-h-60 overflow-y-auto">
        {filteredPastResults.length > 0 ? (
          filteredPastResults.map((res, i) => (
                 <li key={i} className="text-sm py-1  border-slate-200 last:border-b-0">
                     {new Date(res.timestamp || 0).toLocaleString()} -
                     Score: {res.score}/{res.totalQuestions}
                     {typeof res.percentage === 'number' ? ` (${res.percentage.toFixed(0)}%)` : ''} -
                     Duration: {res.duration}s
                 </li>
          ))
        ) : (
            <li className="text-slate-500 italic">No past results found for this specific quiz configuration.</li>
        )}
       </ul>
    </div>
  );
}

export default Results;
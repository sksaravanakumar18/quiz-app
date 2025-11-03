// src/App.tsx
import { useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';
import MainLayout from './components/layout/MainLayout';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useQuizStateManagement } from './hooks/useQuizStateManagement';
import { QuizResults, LastCompletedAttempt, QuizConfig } from './types/quiz';

// App Component defined outside the main function if useNavigate is used inside
function AppContent() {
    const appTitle = "GCP Certification Quiz Hub";
    const navigate = useNavigate(); // Use hook here

    // Get state management functions from the hook
    const {
        inProgressQuizzes,
        // saveQuizState and loadQuizState are now primarily internal to Quiz via the hook
        getQuizStateKey,
        clearAllQuizStates,
        refreshInProgressStates // Function to trigger state reload from storage
    } = useQuizStateManagement();

    // Get results history state
    const [resultsHistory, setResultsHistory] = useLocalStorage<QuizResults[]>('quizResults', []);

    // Memoized calculation for displaying last completed attempts on HomePage
    const completedQuizHistory = useMemo<{ [key: string]: LastCompletedAttempt }>(() => {
       console.log("--- Recalculating completedQuizHistory map ---");
       const historyMap: { [key: string]: LastCompletedAttempt } = {};
       if (!resultsHistory || !Array.isArray(resultsHistory) || resultsHistory.length === 0) {
           console.log("No results history found or invalid format.");
           return {};
       }
       resultsHistory.forEach((result, index) => {
           let resultTimestampNumber: number | null = null;
           // Ensure timestamp is numeric
           if (typeof result.timestamp === 'string') {
               const parsedDate = new Date(result.timestamp);
               if (!isNaN(parsedDate.getTime())) resultTimestampNumber = parsedDate.getTime();
           } else if (typeof result.timestamp === 'number' && !isNaN(result.timestamp)) {
               resultTimestampNumber = result.timestamp;
           }

           // Validate required fields in the result object
           if (!result || typeof result.courseId !== 'string' || resultTimestampNumber === null || typeof result.score !== 'number' || typeof result.totalQuestions !== 'number') {
               console.warn(`Skipping invalid result at index ${index}:`, result);
               return;
           }

           // Construct config and key
           const config: QuizConfig = { courseId: result.courseId, topicId: result.topicId, type: result.topicId ? 'topic' : 'full' };
           const key = getQuizStateKey(config);

           if (key) {
               // Calculate percentage safely
               const percentage = result.percentage ?? (result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0);

               // Get existing entry and its timestamp
               const existingEntry = historyMap[key];
               const existingTimestampNumber = existingEntry?.timestamp; // Already a number

               // Update map only if the current result is newer
               if (existingTimestampNumber === undefined || resultTimestampNumber > existingTimestampNumber) {
                   historyMap[key] = {
                       score: result.score,
                       totalQuestions: result.totalQuestions,
                       percentage: percentage,
                       timestamp: resultTimestampNumber // Store numeric timestamp
                   };
               }
           } else {
               console.warn(`Could not generate key for result at index ${index}:`, result);
           }
       });
       console.log("--- Finished processing. Final completedQuizHistory map:", JSON.stringify(historyMap));
       return historyMap;
    }, [resultsHistory, getQuizStateKey]); // Dependency includes getQuizStateKey

    // Handler for ResultsPage to add a new result to the history
     const handleAddResult = useCallback((newResult: QuizResults) => {
        console.log("Adding result to history (received from ResultsPage):", newResult);
         setResultsHistory(prevHistory => {
            // Ensure timestamp is numeric before adding
            const resultToAdd = { ...newResult, timestamp: typeof newResult.timestamp === 'number' ? newResult.timestamp : Date.now() };
            // Prevent duplicates based on timestamp just in case
            const otherResults = prevHistory.filter(r => r.timestamp !== resultToAdd.timestamp);
            // Add new result, sort by timestamp, keep the last N results
            const updatedResults = [...otherResults, resultToAdd].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
            return updatedResults.slice(-50); // Example: Keep last 50 results
        });
    }, [setResultsHistory]); // Dependency on the setter function

    // Handler for when Quiz completes and needs navigation
     const handleQuizCompleteForNav = useCallback((results: QuizResults) => {
        console.log("Quiz complete, preparing to navigate to results page.");
        // Quiz component now clears its own state before calling this
        const topicParam = results.topicId ?? 'full';
        // Navigate to results page, passing results object in state
        navigate(`/results/${results.courseId}/${topicParam}`, { state: { results } });
    }, [navigate]); // Dependency on navigate

     // Handler for when Quiz is exited manually (e.g., user clicks 'Back')
     const handleQuizExitForNav = useCallback(() => {
         console.log("Quiz exited manually, navigating home.");
         // The Quiz component's internal useEffect should have saved the state
         navigate('/');
     }, [navigate]); // Dependency on navigate

    return (
        <MainLayout appTitle={appTitle}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <HomePage
                            inProgressQuizzes={inProgressQuizzes}
                            completedQuizHistory={completedQuizHistory}
                            getQuizStateKey={getQuizStateKey}
                            refreshQuizStates={refreshInProgressStates} // Pass refresh function
                        />
                    }
                />
                <Route
                    path="/quiz/:courseId/:topicParam"
                    element={
                        <QuizPage
                            // Pass the navigation handlers
                            onQuizCompleteForNav={handleQuizCompleteForNav}
                            onQuizExitForNav={handleQuizExitForNav}
                        />
                    }
                />
                <Route
                    path="/results/:courseId/:topicParam"
                    element={
                        <ResultsPage
                            addResultToHistory={handleAddResult}
                            // getQuizStateKey={getQuizStateKey} // Likely not needed by ResultsPage
                            onNavigateHome={() => navigate('/')} // Pass function to go home
                        />
                    }
                />
                <Route
                    path="/settings"
                    element={<SettingsPage clearAllQuizStates={clearAllQuizStates} />}
                />
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MainLayout>
    );
}

// Main App component rendering the Router
function App() {
    return (
        <Router basename="/quiz-app">
            <AppContent />
        </Router>
    );
}

export default App;
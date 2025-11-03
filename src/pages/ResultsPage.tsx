// src/pages/ResultsPage.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Results from '../components/Results'; // Import the Results component
import { QuizResults } from '../types/quiz'; // Import types
import Button from '../components/ui/Button';

// Define props expected from App.tsx
interface ResultsPageProps {
    addResultToHistory: (newResult: QuizResults) => void;
    onNavigateHome: () => void; // Function to navigate back home/selection
}

const ResultsPage: React.FC<ResultsPageProps> = ({
    addResultToHistory,
    onNavigateHome
}) => {
  const location = useLocation();

  // Get results from navigation state passed by QuizPage/App.tsx
  const results = location.state?.results as QuizResults | undefined;

  // Add results to history when the component mounts with valid results
  useEffect(() => {
      if (results && typeof results.timestamp === 'number') {
         console.log("ResultsPage mounted, adding result to history:", results);
         addResultToHistory(results);
      } else if (results) {
          console.error("Results object missing valid timestamp, cannot add to history:", results);
      } else {
          console.log("ResultsPage mounted without results state.");
      }
  // Run once when component mounts with results or addResultToHistory changes identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]); // Re-run if results object identity changes (e.g., navigating back and forth)

  if (!results) {
    // Handle case where user lands here without results state (e.g., direct navigation, refresh)
    return (
        <div className="text-center p-10">
            <h2 className="text-xl text-red-600 mb-4">No quiz results found to display.</h2>
            <p className="text-sm text-slate-500 mb-6">Please complete a quiz first.</p>
            {/* Use the passed navigation function */}
            <Button onClick={onNavigateHome}>Go to Quiz Selection</Button>
        </div>
    );
  }

  // Pass only the props DEFINED by the Results component's interface
  return (
      <Results
          results={results}           // The actual results object
          onRetry={onNavigateHome}    // Pass the navigation function for the 'retry/new quiz' button
      />
  );
};

export default ResultsPage;
import React from 'react';
import Button from '../components/ui/Button'; 
interface SettingsPageProps {
    clearAllQuizStates: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ clearAllQuizStates }) => { 
    const handleClearData = () => {
        if (window.confirm("Are you sure you want to clear all saved quiz progress and results? This cannot be undone.")) {
            clearAllQuizStates();
             alert("All quiz data cleared.");
            // Optional: Navigate home or refresh
            // window.location.href = '/';
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10  bg-white rounded-md  p-10">
            <h2 className="text-2xl font-semibold  text-center">Settings</h2>
            <div className="text-center">
                <Button variant="danger" onClick={handleClearData}>
                    Clear All Saved Progress & Results
                </Button>
                 <p className="text-xs text-gray-500 mt-2">
                     This will remove all in-progress quizzes and past results history from this browser.
                 </p>
            </div>
        </div>
    );
};

export default SettingsPage;
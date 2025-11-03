// src/hooks/useQuizStateManagement.ts
import { useState, useEffect, useCallback } from 'react';
import { SavedQuizState, QuizConfig } from '../types/quiz';
import { getCourses, getQuestionById } from '../data/quizData'; // Import getQuestionById

const QUIZ_STATE_PREFIX = 'quizState_';

// Helper function remains standalone or can be part of the hook
const getQuizStateKey = (config: QuizConfig | null): string | null => {
    if (!config || !config.courseId) return null;
    const topicPart = config.topicId === null ? 'full' : config.topicId;
    // Sanitize topicPart to be safe for localStorage keys
    const safeTopicPart = topicPart.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${QUIZ_STATE_PREFIX}${config.courseId}_${safeTopicPart}`;
}

export const useQuizStateManagement = () => {
    const [inProgressQuizzes, setInProgressQuizzes] = useState<{ [key: string]: SavedQuizState }>({});

    // Function to load all states from localStorage
    const loadAllStatesFromStorage = useCallback(() => {
        if (typeof window === "undefined") return {}; // Guard
        console.log("Reloading all in-progress states from localStorage...");
        const loadedStates: { [key: string]: SavedQuizState } = {};
        const courses = getCourses();
        courses.forEach(course => {
            // Load state for the full course quiz
            const fullKey = getQuizStateKey({ courseId: course.id, topicId: null, type: 'full' });
            if (fullKey) {
                try {
                    const savedFull = localStorage.getItem(fullKey);
                    if (savedFull) {
                         const parsed = JSON.parse(savedFull);
                         // Add validation to ensure it's a valid SavedQuizState structure
                         if (parsed && typeof parsed.currentIndex === 'number' && Array.isArray(parsed.userAnswers)) {
                            loadedStates[fullKey] = parsed;
                         } else {
                             console.warn(`Invalid state structure found for key ${fullKey}, removing.`);
                             localStorage.removeItem(fullKey);
                         }
                    }
                } catch (e) { console.error(`Error parsing ${fullKey}`, e); localStorage.removeItem(fullKey); }
            }
            // Load state for each topic quiz
            (course.topics || []).forEach(topic => {
                if (!topic) return;
                const topicKey = getQuizStateKey({ courseId: course.id, topicId: topic, type: 'topic' });
                if (topicKey) {
                     try {
                        const savedTopic = localStorage.getItem(topicKey);
                        if (savedTopic) {
                            const parsed = JSON.parse(savedTopic);
                            if (parsed && typeof parsed.currentIndex === 'number' && Array.isArray(parsed.userAnswers)) {
                                loadedStates[topicKey] = parsed;
                            } else {
                                console.warn(`Invalid state structure found for key ${topicKey}, removing.`);
                                localStorage.removeItem(topicKey);
                            }
                        }
                     } catch (e) { console.error(`Error parsing ${topicKey}`, e); localStorage.removeItem(topicKey); }
                }
            });
        });
        console.log("Finished reloading states:", loadedStates);
        return loadedStates;
    }, []); // No dependencies needed as getCourses() and getQuizStateKey are stable

    // Load initial state only once on hook mount
    useEffect(() => {
        setInProgressQuizzes(loadAllStatesFromStorage());
    }, [loadAllStatesFromStorage]);

    // Function to save or clear state for a specific quiz config
    const saveQuizState = useCallback((config: QuizConfig, state: SavedQuizState | null) => {
        const key = getQuizStateKey(config);
        if (!key || typeof window === "undefined") return;

        if (state === null) {
            // Clear state
            localStorage.removeItem(key);
            setInProgressQuizzes(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });
            console.log(`Cleared state for ${key}`);
        } else {
            // Save state
            // Convert Set to Array for storage
            const answersForStorage = state.userAnswers.map(ans => ans instanceof Set ? Array.from(ans) : ans);
            const stateToSave: SavedQuizState = {
                 ...state,
                 userAnswers: answersForStorage, // Store the array version
                 courseId: config.courseId,
                 topicId: config.topicId
            };
            localStorage.setItem(key, JSON.stringify(stateToSave));
            // Update the in-memory state (keeping Sets if they were Sets)
            setInProgressQuizzes(prev => ({ ...prev, [key]: state })); // Store original state with Sets in memory
            console.log(`Saved state for ${key}:`, stateToSave); // Log what's saved
        }
    }, []);

    // Function to load state for a specific quiz config
    const loadQuizState = useCallback((config: QuizConfig): SavedQuizState | null => {
        const key = getQuizStateKey(config);
        if (!key || typeof window === "undefined") return null;

        const serializedState = localStorage.getItem(key);
        if (serializedState === null) {
            console.log(`No saved state found for key ${key}`);
            return null;
        }

        try {
            const parsed: SavedQuizState = JSON.parse(serializedState); // Parse as SavedQuizState

            // Validate core properties
            if (parsed && typeof parsed.currentIndex === 'number' && Array.isArray(parsed.userAnswers) && Array.isArray(parsed.questionIds) && parsed.questionIds.length === parsed.userAnswers.length) {
                 // Convert stored arrays back to Sets for multi-choice answers
                 const userAnswersWithSets = parsed.userAnswers.map((ans, index): string | Set<string> | null => {
                     // Check if questionIds and index are valid
                     if (!parsed.questionIds || index >= parsed.questionIds.length) {
                         console.warn(`Index ${index} out of bounds for questionIds in saved state for key ${key}`);
                         return null;
                     }
                     const question = getQuestionById(config.courseId, parsed.questionIds[index]);
                     const correctAnswers = question?.correctAnswer ?? [];
                     const isMulti = Array.isArray(correctAnswers) && correctAnswers.length > 1;

                     // Convert back to Set ONLY if it's a multi-answer question AND the stored value is an array
                     if (isMulti && Array.isArray(ans)) {
                         return new Set(ans);
                     }
                     // Otherwise, return as string or null
                     return typeof ans === 'string' ? ans : null;
                 });

                 // Ensure checkedAnswers array exists and has the correct length
                 const checkedAnswersArray = parsed.checkedAnswers && parsed.checkedAnswers.length === parsed.questionIds.length
                     ? parsed.checkedAnswers
                     : Array(parsed.questionIds.length).fill(false);


                 const loadedState: SavedQuizState = {
                     ...parsed,
                     userAnswers: userAnswersWithSets, // Use the potentially converted array/Set
                     checkedAnswers: checkedAnswersArray // Use validated/initialized checkedAnswers
                 };
                 console.log(`Loaded state for key ${key}:`, loadedState);
                 return loadedState;
            }
            throw new Error(`Invalid state structure for key ${key}`);
        } catch (error) {
            console.error(`Error loading or parsing quiz state for ${key}:`, error);
            localStorage.removeItem(key); // Remove corrupted state
            return null;
        }
    }, [getQuizStateKey]); // Include dependency


    const clearAllQuizStates = useCallback(() => {
         if (typeof window === "undefined") return;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(QUIZ_STATE_PREFIX)) localStorage.removeItem(key);
        });
        // Optionally clear results history too if desired
        localStorage.removeItem('quizResults');
        setInProgressQuizzes({}); // Reset in-memory state
        console.log("Cleared all in-progress quiz states.");
    }, []);

    // --- Expose the reload function ---
    const refreshInProgressStates = useCallback(() => {
        setInProgressQuizzes(loadAllStatesFromStorage());
    }, [loadAllStatesFromStorage]);

    return {
        inProgressQuizzes,
        saveQuizState,
        loadQuizState,
        clearAllQuizStates,
        getQuizStateKey, // Expose helper if needed externally
        refreshInProgressStates
    };
};
// src/data/quizData.ts
import { CaseStudyItem, Course, QuizItem } from '../types/quiz';

// Use import.meta.glob to find all JSON files matching the pattern in the data directory.
// eager: true loads all modules upfront, simplifying synchronous access later.
const courseModules = import.meta.glob('./*-data.json', { eager: true });

const processCourseData = (id: string, data: any): Course | null => {
    if (!data || typeof data !== 'object') {
        console.error(`Invalid data structure for course ID derived as '${id}'. Expected an object. Skipping.`);
        return null;
    }

    // Validate quizItems structure
    if (!Array.isArray(data.quizItems)) {
        console.warn(`'quizItems' is not an array or is missing for course ID '${id}'. Assuming no questions.`);
        data.quizItems = []; // Default to empty array if missing or invalid
    }

    // Ensure caseStudies is an object map and its items are valid
    const caseStudyObjectMap: { [key: string]: CaseStudyItem } = {};
    if (data.caseStudies && typeof data.caseStudies === 'object' && data.caseStudies !== null) {
        for (const key in data.caseStudies) {
            if (Object.prototype.hasOwnProperty.call(data.caseStudies, key)) {
                const cs = data.caseStudies[key];
                // Basic validation for each case study item
                if (cs && typeof cs.caseStudyId === 'string' && typeof cs.caseStudyText === 'string' && cs.caseStudyId === key) {
                    caseStudyObjectMap[key] = {
                        caseStudyId: cs.caseStudyId,
                        caseStudyText: cs.caseStudyText,
                    };
                } else {
                    console.warn(`Invalid or mismatched case study item structure for key '${key}' in course ID '${id}'. Skipping this case study. Expected caseStudyId to match key.`);
                }
            }
        }
    } else {
        console.warn(`'caseStudies' is not a valid object or is missing/null for course ID '${id}'. Defaulting to empty object.`);
        // caseStudyObjectMap remains {}
    }


    const quizItems = (data.quizItems as QuizItem[]).map((item, index) => ({
        ...item,
        id: item.id ?? `${id}-q${index}` // Assign fallback ID if original id is missing
    }));


    const topics = [...new Set(quizItems.map(item => item.topic).filter(topic => topic != null))] as string[];
    topics.sort();


    const derivedTitle = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // e.g., gcp-ace -> Gcp Ace

    return {
        id: id,
        title: data.quizTitle || derivedTitle, // Use JSON title or derived one
        quizItems: quizItems,
        topics: topics,
        caseStudies: caseStudyObjectMap // Assigning the validated object map
    };
};

let loadedCourses: Course[] | null = null; // Cache the loaded courses

const loadCourses = (): Course[] => {
    if (loadedCourses) {
        return loadedCourses; // Return cached version
    }

    const courses: Course[] = [];
    for (const path in courseModules) {
        const match = path.match(/\.\/(.*?)-data\.json$/);
        const courseId = match ? match[1] : path; // Use filename part or full path as fallback ID

        const moduleData = (courseModules[path] as any)?.default;

        if (moduleData) {
             const processedCourse = processCourseData(courseId, moduleData);
             if (processedCourse) {
                 courses.push(processedCourse);
             }
        } else {
             console.warn(`Could not load data from module: ${path}`);
        }
    }
    courses.sort((a, b) => a.title.localeCompare(b.title));
    loadedCourses = courses; // Cache the result
    return loadedCourses;
};


export const getCourses = (): Course[] => {
    return loadCourses();
};

export const getCourseById = (id: string | undefined): Course | undefined => {
    if (!id) return undefined;
    const courses = loadCourses();
    return courses.find(course => course.id === id);
};

export const getTopicsForCourse = (courseId: string): string[] => {
    const course = getCourseById(courseId);
    if (!course || !Array.isArray(course.topics)) return [];
    return course.topics;
}

export const getQuizItems = (courseId: string, topicId: string | null): QuizItem[] => {
    const course = getCourseById(courseId);
    if (!course || !Array.isArray(course.quizItems)) return [];

    if (topicId) {
        return course.quizItems.filter(item => item.topic === topicId);
    } else {
        return course.quizItems;
    }
};

export const getQuestionById = (courseId: string | undefined, questionId: string | number): QuizItem | undefined => {
     if (!courseId) return undefined;
     const course = getCourseById(courseId);
     if (!course || !Array.isArray(course.quizItems)) return undefined;
     // Robust comparison for ID, as it can be number or string
     return course.quizItems.find(item => String(item.id) === String(questionId));
}

export const getCaseStudyById = (courseId: string | undefined, caseStudyId: string | undefined): CaseStudyItem | undefined => {
    if (!courseId || !caseStudyId) return undefined;
    const course = getCourseById(courseId);

    // Ensure course and course.caseStudies exist and caseStudies is an object
    if (!course || typeof course.caseStudies !== 'object' || course.caseStudies === null) {
        return undefined;
    }
    // Accessing property on an object map
    return course.caseStudies[caseStudyId];
}
export interface Street {
    id: string;
    name: string;
    geometry: number[][][]; // array of line strings or whatever the GeoJSON structure is
    properties?: Record<string, any>;
}

export interface QuizQuestion {
    correctId: string;
    distractorIds: string[];
}

export interface QuizPlan {
    date: string;
    questions: QuizQuestion[];
}

export interface QuizResult {
    street: Street;
    userAnswer: string;
    status: 'correct' | 'failed';
    time: number;
    points: number;
    hintsUsed: number;
}

export type GameState =
    | 'register'
    | 'intro'
    | 'playing'
    | 'summary';

export type Feedback =
    | 'none'
    | 'correct'
    | 'incorrect'
    | 'transitioning';

export interface GameStateObject {
    username: string | null;
    realName: string | null;
    gameState: GameState;
    quizStreets: Street[];
    currentQuestionIndex: number;
    questionStartTime: number | null;
    score: number;
    correct: number;
    questions: Street[];
    options: Street[];
    quizResults: QuizResult[];
    feedback: Feedback;
    selectedStreet: Street | null;
    hintsRevealedCount: number;
    hintStreets: Street[];
    autoAdvance: boolean;
    registerMode: 'signin' | 'signup';
    streak: number;
    profileLoaded: boolean;
    plannedQuestions: QuizQuestion[] | null;
}

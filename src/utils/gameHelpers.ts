import { QuizPlan, QuizQuestion, Street } from '../types/game';
import {
  getTodaySeed,
  selectDailyStreets,
  selectDistractors,
  shuffleOptions,
} from './dailyChallenge';
import { logger } from './logger';

import { GAME_LOGIC } from '../config/constants';

export const generateOptionsList = (
  target: Street,
  allStreets: Street[],
  questionIndex: number
): Street[] => {
  const todaySeed = getTodaySeed();
  const questionSeed = todaySeed + questionIndex * GAME_LOGIC.QUESTION_SEED_MULTIPLIER;
  const distractors = selectDistractors(allStreets, target, questionSeed);
  const opts = [target, ...distractors];
  return shuffleOptions(opts, questionSeed + GAME_LOGIC.SHUFFLE_SEED_OFFSET);
};

export interface GameSetupResult {
  quizStreets: Street[];
  initialOptions: Street[];
  plannedQuestions: QuizQuestion[] | null;
}

export const calculateGameSetup = (
  validStreets: Street[],
  quizPlan?: { quizzes: QuizPlan[] }
): GameSetupResult | null => {
  if (validStreets.length === 0) {
    logger.error('No valid streets found!');
    return null;
  }

  const todaySeed = getTodaySeed();
  const todayStr = new Date().toISOString().split('T')[0];
  const plannedQuiz = quizPlan?.quizzes?.find((q: QuizPlan) => q.date === todayStr);

  let selected: Street[] | undefined;
  let initialOptions: Street[] | undefined;

  if (plannedQuiz && plannedQuiz.questions?.length > 0) {
    const streetMap = new Map(validStreets.map(s => [s.id, s]));
    selected = plannedQuiz.questions
      .map((q: QuizQuestion) => streetMap.get(q.correctId))
      .filter(Boolean) as Street[];

    if (selected.length > 0) {
      const firstQ = plannedQuiz.questions[0];
      const firstStreet = selected[0];
      if (firstQ && firstStreet) {
        const correctStreet = streetMap.get(firstQ.correctId);
        const distractorStreets = firstQ.distractorIds
          .map((id: string) => streetMap.get(id))
          .filter(Boolean) as Street[];

        if (correctStreet && distractorStreets.length >= GAME_LOGIC.DISTRACTORS_COUNT) {
          const opts = [correctStreet, ...distractorStreets.slice(0, GAME_LOGIC.DISTRACTORS_COUNT)];
          initialOptions = shuffleOptions(opts, todaySeed + GAME_LOGIC.SHUFFLE_SEED_OFFSET);
        } else {
          initialOptions = generateOptionsList(firstStreet, validStreets, 0);
        }
      }
    }
  }

  if (!selected || selected.length === 0) {
    selected = selectDailyStreets(validStreets, todaySeed);
    const firstSelected = selected[0];
    initialOptions = firstSelected ? generateOptionsList(firstSelected, validStreets, 0) : [];
  }

  return {
    quizStreets: selected,
    initialOptions: initialOptions || [],
    plannedQuestions: plannedQuiz?.questions || null,
  };
};

import { QuizPlan, QuizQuestion, Street } from '../../types/game';
import { logger } from '../logger';
import {
  getTodaySeed,
  selectDailyStreets,
  selectDistractors,
  shuffleOptions,
} from './dailyChallenge';

import { GAME_LOGIC } from '../../config/constants';

/**
 * Generate a list of street options (target + distractors)
 * @param target - The correct street
 * @param allStreets - All available streets
 * @param questionIndex - The index of the question
 * @returns Shuffled array of options
 */
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

/**
 * Calculate the setup for a game including quiz mode logic
 * @param validStreets - The list of valid streets for today
 * @param quizPlan - Optional quiz plan data
 * @returns Game setup object or null if failed
 */
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
      const firstQ = plannedQuiz.questions[0]!;
      const correctStreet = streetMap.get(firstQ.correctId);
      const distractorStreets = firstQ.distractorIds
        .map((id: string) => streetMap.get(id))
        .filter(Boolean) as Street[];

      if (correctStreet && distractorStreets.length >= GAME_LOGIC.DISTRACTORS_COUNT) {
        const opts = [correctStreet, ...distractorStreets.slice(0, GAME_LOGIC.DISTRACTORS_COUNT)];
        initialOptions = shuffleOptions(opts, todaySeed + GAME_LOGIC.SHUFFLE_SEED_OFFSET);
      } else {
        initialOptions = generateOptionsList(selected[0]!, validStreets, 0);
      }
    }
  }

  if (!selected || selected.length === 0) {
    selected = selectDailyStreets(validStreets, todaySeed);
    initialOptions = selected.length > 0 ? generateOptionsList(selected[0]!, validStreets, 0) : [];
  }

  return {
    quizStreets: selected,
    initialOptions: initialOptions || [],
    plannedQuestions: plannedQuiz?.questions || null,
  };
};

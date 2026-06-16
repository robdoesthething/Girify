import { describe, expect, it } from 'vitest';
import { QuizResult, Street } from '../../types/game';
import { GameAction, gameReducer, GameState, initialState } from '../gameReducer';

describe('gameReducer', () => {
  const mockStreet: Street = {
    id: 's1',
    name: 'Test Street',
    geometry: [[[0, 0]]],
  };
  const mockOptions = [
    mockStreet,
    {
      id: 's2',
      name: 'Other Street',
      geometry: [[[0, 0]]],
    },
  ];

  it('handle SET_USERNAME', () => {
    const action: GameAction = { type: 'SET_USERNAME', payload: 'newuser' };
    const newState = gameReducer(initialState, action);
    expect(newState.username).toBe('newuser');
  });

  it('handle START_GAME', () => {
    const action: GameAction = {
      type: 'START_GAME',
      payload: {
        quizStreets: [mockStreet],
        initialOptions: mockOptions,
      },
    };
    const newState = gameReducer(initialState, action);
    expect(newState.gameState).toBe('playing');
    expect(newState.quizStreets).toEqual([mockStreet]);
    expect(newState.options).toEqual(mockOptions);
    expect(newState.score).toBe(0);
    expect(newState.isInputLocked).toBe(true);
  });

  it('handle START_GAME with practiceMode and sessionSeed', () => {
    const action: GameAction = {
      type: 'START_GAME',
      payload: {
        quizStreets: [mockStreet],
        initialOptions: mockOptions,
        practiceMode: true,
        sessionSeed: 1750000000000,
      },
    };
    const newState = gameReducer(initialState, action);
    expect(newState.practiceMode).toBe(true);
    expect(newState.sessionSeed).toBe(1750000000000);
  });

  it('handle START_GAME without practiceMode defaults to false/null', () => {
    const action: GameAction = {
      type: 'START_GAME',
      payload: { quizStreets: [mockStreet], initialOptions: mockOptions },
    };
    const newState = gameReducer(initialState, action);
    expect(newState.practiceMode).toBe(false);
    expect(newState.sessionSeed).toBeNull();
  });

  it('handle NEXT_QUESTION with appendStreets grows quizStreets and does not finish', () => {
    const startState: GameState = {
      ...initialState,
      practiceMode: true,
      sessionSeed: 123,
      currentQuestionIndex: 0,
      quizStreets: [mockStreet], // length 1 — would normally finish on advance
    };
    const action: GameAction = {
      type: 'NEXT_QUESTION',
      payload: { options: mockOptions, appendStreets: [mockStreet] },
    };
    const newState = gameReducer(startState, action);
    expect(newState.gameState).not.toBe('summary');
    expect(newState.currentQuestionIndex).toBe(1);
    expect(newState.quizStreets).toHaveLength(2);
  });

  it('handle NEXT_QUESTION (Finish Game) still finishes when practiceMode is false', () => {
    const startState: GameState = {
      ...initialState,
      practiceMode: false,
      currentQuestionIndex: 0,
      quizStreets: [mockStreet],
    };
    const action: GameAction = {
      type: 'NEXT_QUESTION',
      payload: {},
    };
    const newState = gameReducer(startState, action);
    expect(newState.gameState).toBe('summary');
  });

  it('handle UNLOCK_INPUT', () => {
    // Should set input locked to false and start timer
    const action: GameAction = { type: 'UNLOCK_INPUT' };
    const newState = gameReducer(initialState, action);
    expect(newState.isInputLocked).toBe(false);
    expect(newState.questionStartTime).toBeDefined();
  });

  it('handle SELECT_ANSWER', () => {
    const action: GameAction = { type: 'SELECT_ANSWER', payload: mockStreet };
    const newState = gameReducer(initialState, action);
    expect(newState.selectedAnswer).toEqual(mockStreet);
    expect(newState.feedback).toBe('selected');
  });

  it('handle ANSWER_SUBMITTED (Correct)', () => {
    const startState: GameState = {
      ...initialState,
      score: 0,
      correct: 0,
    };
    const result: QuizResult = {
      street: mockStreet,
      userAnswer: 'Test Street',
      status: 'correct',
      time: 5,
      points: 1000,
      hintsUsed: 0,
    };
    const action: GameAction = {
      type: 'ANSWER_SUBMITTED',
      payload: { result, points: 1000, selectedStreet: mockStreet },
    };
    const newState = gameReducer(startState, action);
    expect(newState.score).toBe(1000);
    expect(newState.correct).toBe(1);
    expect(newState.feedback).toBe('transitioning');
    expect(newState.quizResults).toHaveLength(1);
  });

  it('handle NEXT_QUESTION (Advance)', () => {
    const startState: GameState = {
      ...initialState,
      currentQuestionIndex: 0,
      quizStreets: [mockStreet, mockStreet], // 2 streets
    };
    const action: GameAction = {
      type: 'NEXT_QUESTION',
      payload: { options: mockOptions },
    };
    const newState = gameReducer(startState, action);
    expect(newState.currentQuestionIndex).toBe(1);
    expect(newState.feedback).toBe('idle');
    expect(newState.isInputLocked).toBe(true);
    expect(newState.options).toEqual(mockOptions);
  });

  it('handle NEXT_QUESTION (Finish Game)', () => {
    const startState: GameState = {
      ...initialState,
      currentQuestionIndex: 0,
      quizStreets: [mockStreet], // Only 1 street
    };
    // 0 + 1 = 1. Length is 1. So 1 >= 1 is true.
    const action: GameAction = {
      type: 'NEXT_QUESTION',
      payload: { options: [] },
    };
    const newState = gameReducer(startState, action);
    expect(newState.gameState).toBe('summary');
    expect(newState.feedback).toBe('idle');
  });
});

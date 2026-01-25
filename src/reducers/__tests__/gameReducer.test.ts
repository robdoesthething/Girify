import { describe, expect, it } from 'vitest';
import { QuizResult, Street } from '../../types/game';
import { GameAction, gameReducer, GameState, initialState } from '../gameReducer';

describe('gameReducer', () => {
  const mockStreet: Street = {
    id: 's1',
    name: 'Test Street',
    geometry: [[[0, 0]]],
    district: 'Test District',
    osmid: '1',
    length: 100,
  };
  const mockOptions = [
    mockStreet,
    {
      id: 's2',
      name: 'Other Street',
      geometry: [[[0, 0]]],
      district: 'Test District',
      osmid: '2',
      length: 100,
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

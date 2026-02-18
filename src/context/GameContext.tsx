import { createContext, FC, ReactNode, useContext } from 'react';
import { GameStateObject, Street } from '../types/game';

export interface GameAction {
  type: string;
  payload?: string | number | boolean | Street | Street[] | Record<string, unknown> | null;
}

export interface GameHandlers {
  handleSelectAnswer: (street: Street) => void;
  handleNext: () => void;
  processAnswer: (street: Street) => void;
  setupGame: (freshName?: string) => void;
  handleRegister: (name: string) => void;
  hasPlayedToday: () => boolean;
}

export interface GameContextType {
  state: GameStateObject;
  dispatch: React.Dispatch<GameAction>;
  currentStreet: Street | null;
  handlers: GameHandlers;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
  value: GameContextType;
}

export const GameProvider: FC<GameProviderProps> = ({ children, value }) => {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export default GameContext;

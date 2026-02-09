import { createContext, useContext, ReactNode } from 'react';
import { useDiagramGeneration, DiagramGenerationState } from '../hooks/useDiagramGeneration';

interface DiagramContextType {
  state: DiagramGenerationState;
  generateDiagram: (
    prompt: string,
    type: string,
    domain: string,
    userId: string,
    projectId?: string,
    dataInfo?: any
  ) => Promise<void>;
  reset: () => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export function DiagramProvider({ children }: { children: ReactNode }) {
  const { state, generateDiagram, reset } = useDiagramGeneration();

  return (
    <DiagramContext.Provider value={{ state, generateDiagram, reset }}>
      {children}
    </DiagramContext.Provider>
  );
}

export function useDiagram() {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within a DiagramProvider');
  }
  return context;
}

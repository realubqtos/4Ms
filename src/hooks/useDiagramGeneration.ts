import { useState, useCallback } from 'react';

export interface DiagramGenerationState {
  isGenerating: boolean;
  currentStage: string;
  message: string;
  iteration: number;
  imageData: string | null;
  error: string | null;
  figureId: string | null;
}

export interface GenerationEvent {
  type: string;
  data: any;
}

export function useDiagramGeneration() {
  const [state, setState] = useState<DiagramGenerationState>({
    isGenerating: false,
    currentStage: '',
    message: '',
    iteration: 0,
    imageData: null,
    error: null,
    figureId: null,
  });

  const generateDiagram = useCallback(
    async (
      prompt: string,
      type: string,
      domain: string,
      userId: string,
      projectId?: string,
      dataInfo?: any
    ) => {
      setState({
        isGenerating: true,
        currentStage: 'init',
        message: 'Starting generation...',
        iteration: 0,
        imageData: null,
        error: null,
        figureId: null,
      });

      try {
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${apiUrl}/api/figures/generate-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            type,
            domain,
            user_id: userId,
            project_id: projectId,
            data_info: dataInfo,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to start generation');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const event: GenerationEvent = JSON.parse(jsonStr);

                if (event.type === 'status') {
                  setState((prev) => ({
                    ...prev,
                    currentStage: event.data.stage || '',
                    message: event.data.message || '',
                    iteration: event.data.iteration || prev.iteration,
                  }));
                } else if (event.type === 'image_preview') {
                  setState((prev) => ({
                    ...prev,
                    imageData: event.data.image_data,
                    iteration: event.data.iteration || prev.iteration,
                  }));
                } else if (event.type === 'complete') {
                  setState((prev) => ({
                    ...prev,
                    isGenerating: false,
                    imageData: event.data.data.image_data || prev.imageData,
                    figureId: event.data.figure_id,
                    message: 'Complete!',
                  }));
                } else if (event.type === 'error') {
                  setState((prev) => ({
                    ...prev,
                    isGenerating: false,
                    error: event.data.message,
                  }));
                }
              } catch (e) {
                console.error('Failed to parse SSE event:', e);
              }
            }
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      currentStage: '',
      message: '',
      iteration: 0,
      imageData: null,
      error: null,
      figureId: null,
    });
  }, []);

  return {
    state,
    generateDiagram,
    reset,
  };
}

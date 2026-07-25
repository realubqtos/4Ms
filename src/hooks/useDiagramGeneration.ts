import { useState, useCallback } from 'react';

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
  calibration_notes?: string;
}

export interface VerificationReport {
  checks: VerificationCheck[];
  verdict: string;
  iteration_count: number;
}

export interface FormDecision {
  match_result: 'FULL' | 'PARTIAL' | 'NONE' | 'REFUSE';
  families: string[];
  construction_rule?: string | null;
  license?: string;
  rationale?: string;
  unsupported_route?: { needed_rule: string; explanation: string } | null;
}

export interface DiagramGenerationState {
  isGenerating: boolean;
  currentStage: string;
  message: string;
  iteration: number;
  imageData: string | null;
  error: string | null;
  figureId: string | null;
  // Verified-mode (Vizualizer) additions — null/false on the classic pipeline
  verified: boolean;
  formDecision: FormDecision | null;
  verificationReport: VerificationReport | null;
  scopeOfValidity: string | null;
  refused: boolean;
}

export interface GenerationEvent {
  type: string;
  data: any;
}

const initialState: DiagramGenerationState = {
  isGenerating: false,
  currentStage: '',
  message: '',
  iteration: 0,
  imageData: null,
  error: null,
  figureId: null,
  verified: false,
  formDecision: null,
  verificationReport: null,
  scopeOfValidity: null,
  refused: false,
};

export function useDiagramGeneration() {
  const [state, setState] = useState<DiagramGenerationState>(initialState);

  const generateDiagram = useCallback(
    async (
      prompt: string,
      type: string,
      domain: string,
      userId: string,
      projectId?: string,
      dataInfo?: any,
      verified: boolean = false
    ) => {
      setState({
        ...initialState,
        isGenerating: true,
        currentStage: 'init',
        message: 'Starting generation...',
        verified,
      });

      try {
        const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
        const endpoint = verified
          ? `${apiUrl}/api/figures/generate-verified-stream`
          : `${apiUrl}/api/figures/generate-stream`;
        const response = await fetch(endpoint, {
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
                } else if (event.type === 'form_decision') {
                  setState((prev) => ({
                    ...prev,
                    formDecision: event.data.decision || null,
                  }));
                } else if (event.type === 'verification_report') {
                  setState((prev) => ({
                    ...prev,
                    verificationReport: event.data.report || null,
                    scopeOfValidity: event.data.scope_of_validity || null,
                  }));
                } else if (event.type === 'image_preview') {
                  setState((prev) => ({
                    ...prev,
                    imageData: event.data.image_data,
                    iteration: event.data.iteration || prev.iteration,
                  }));
                } else if (event.type === 'complete') {
                  const payload = event.data.data || {};
                  setState((prev) => ({
                    ...prev,
                    isGenerating: false,
                    imageData: payload.image_data || prev.imageData,
                    figureId: event.data.figure_id,
                    refused: payload.refused === true,
                    verificationReport:
                      payload.verification_report || prev.verificationReport,
                    formDecision: payload.decision || prev.formDecision,
                    message: payload.refused
                      ? 'Claim cannot be faithfully visualized with supported forms — see the decision rationale.'
                      : 'Complete!',
                  }));
                } else if (event.type === 'error') {
                  setState((prev) => ({
                    ...prev,
                    isGenerating: false,
                    error: event.data.message,
                  }));
                }
                // 'skeleton' and 'agent_complete' events are informational for
                // now; a future increment surfaces the skeleton for editing.
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
    setState(initialState);
  }, []);

  return {
    state,
    generateDiagram,
    reset,
  };
}

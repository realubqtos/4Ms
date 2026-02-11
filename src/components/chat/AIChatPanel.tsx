import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Paperclip, Send, ChevronRight, X } from '../ui/icons';
import { useDiagram } from '../../providers/DiagramProvider';
import { useAuth } from '../../providers/AuthProvider';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AIChatPanel({ isOpen, onToggle }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateDiagram, state: diagramState } = useDiagram();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!diagramState.isGenerating && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        if (diagramState.error) {
          setMessages(prev => [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: `Error: ${diagramState.error}`
            }
          ]);
        } else if (diagramState.imageData) {
          setMessages(prev => [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: 'Diagram generated successfully! You can view it in the canvas.'
            }
          ]);
        }
      }
    }
  }, [diagramState.isGenerating, diagramState.error, diagramState.imageData]);

  const handleSend = async () => {
    if (!input.trim() || diagramState.isGenerating || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const prompt = input;
    setInput('');

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Generating diagram...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    const type = detectDiagramType(prompt);
    const domain = detectDomain(prompt);

    try {
      await generateDiagram(prompt, type, domain, user.id);
    } catch (error) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]);
    }
  };

  const detectDiagramType = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('molecular') || lower.includes('molecule') || lower.includes('compound')) return 'molecular';
    if (lower.includes('force') || lower.includes('motion') || lower.includes('physics')) return 'physics';
    if (lower.includes('neural') || lower.includes('network') || lower.includes('architecture')) return 'neural_network';
    if (lower.includes('plot') || lower.includes('graph') || lower.includes('chart')) return 'statistical';
    return 'diagram';
  };

  const detectDomain = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('chemistry') || lower.includes('chemical') || lower.includes('molecular')) return 'chemistry';
    if (lower.includes('physics') || lower.includes('force') || lower.includes('motion')) return 'physics';
    if (lower.includes('biology') || lower.includes('cell') || lower.includes('DNA')) return 'biology';
    if (lower.includes('neural') || lower.includes('machine learning') || lower.includes('AI')) return 'machine_learning';
    if (lower.includes('math') || lower.includes('equation') || lower.includes('calculus')) return 'mathematics';
    return 'general';
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const message: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded file: ${file.name}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    }
  };

  const panelStyle = isMobile
    ? { width: '100%', height: 'calc(100vh - 57px)', borderLeft: 'none' }
    : { width: '360px', height: 'calc(100vh - 96px)', borderLeft: '1px solid var(--border)' };

  const panelTop = isMobile ? 'top-[57px]' : 'top-[96px]';

  return (
    <>
      <div
        className={`fixed right-0 ${panelTop} transition-transform duration-300 ease-in-out z-40 glass glass-shadow-lg ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={panelStyle}
      >
        <div className="flex flex-col h-full">
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--accent-1)',
                  color: '#FFFFFF'
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI Assistant
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Generate visualizations
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-opacity-80 transition-all"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Close AI panel"
            >
              {isMobile ? (
                <X size={20} style={{ color: 'var(--text-primary)' }} />
              ) : (
                <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center glass glass-shadow"
                >
                  <MessageSquare size={24} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Start a conversation
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Upload a file or describe the visualization you want to create
                </p>
                <div className="mt-4 space-y-2">
                  <button
                    className="w-full text-left px-3 py-2 rounded-md text-xs transition-all glass glass-shadow glass-hover"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onClick={() => setInput('Create a molecular diagram of caffeine')}
                  >
                    Create a molecular diagram of caffeine
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 rounded-md text-xs transition-all glass glass-shadow glass-hover"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onClick={() => setInput('Generate a force diagram for projectile motion')}
                  >
                    Generate a force diagram for projectile motion
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 rounded-md text-xs transition-all glass glass-shadow glass-hover"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onClick={() => setInput('Visualize a neural network architecture')}
                  >
                    Visualize a neural network architecture
                  </button>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                    message.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm glass glass-shadow'
                  }`}
                  style={
                    message.role === 'user'
                      ? {
                          backgroundColor: 'var(--accent-1)',
                          color: '#FFFFFF'
                        }
                      : {
                          color: 'var(--text-primary)'
                        }
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {diagramState.isGenerating && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2 rounded-lg rounded-bl-sm flex items-center gap-2 glass glass-shadow"
                >
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {diagramState.message}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            className="p-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.tex,.md,.csv,.json,.png,.jpg,.jpeg"
              />
              <button
                onClick={handleFileUpload}
                className="p-2 rounded-md transition-all flex-shrink-0 glass glass-shadow glass-hover"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                aria-label="Upload file"
              >
                <Paperclip size={20} style={{ color: 'var(--text-primary)' }} />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your visualization..."
                  className="flex-1 px-3 py-2 rounded-md text-sm outline-none transition-all glass glass-shadow"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-1)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || diagramState.isGenerating}
                  className="p-2 rounded-md transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed glass-shadow"
                  style={{
                    backgroundColor: 'var(--accent-1)',
                    color: '#FFFFFF'
                  }}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 bottom-8 p-3 rounded-l-lg shadow-lg transition-all z-40 glass-shadow-xl"
          style={{
            backgroundColor: 'var(--accent-1)',
            color: '#FFFFFF'
          }}
          aria-label="Open AI panel"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <span className="text-sm font-medium">AI</span>
          </div>
        </button>
      )}
    </>
  );
}

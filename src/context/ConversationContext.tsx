/**
 * 对话上下文
 * 管理当前对话的状态和操作
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Conversation, ConversationRequest } from '../types';
import { apiService } from '../services/apiService';

interface ConversationContextType {
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  startNewConversation: (request: ConversationRequest) => Promise<void>;
  clearConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startNewConversation = async (request: ConversationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const conversation = await apiService.startConversation(request);
      setCurrentConversation(conversation);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('启动对话时发生未知错误'));
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setCurrentConversation(null);
    setError(null);
  };

  const value = {
    currentConversation,
    isLoading,
    error,
    startNewConversation,
    clearConversation
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
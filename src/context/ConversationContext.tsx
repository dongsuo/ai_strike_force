/**
 * 对话上下文
 * 管理当前对话的状态和操作，支持多轮对话
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Conversation, ConversationRequest, ContinueConversationRequest, Message } from '../types';
import { apiService } from '../services/apiService';

interface ConversationContextType {
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  startNewConversation: (request: ConversationRequest) => Promise<void>;
  continueConversation: (question: string) => Promise<void>;
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

  const continueConversation = async (question: string) => {
    if (!currentConversation) {
      setError(new Error('没有活跃的对话'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 先更新本地状态，添加用户消息
      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: 'user',
        content: question,
        timestamp: Date.now()
      };

      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
        isComplete: false // 开始新一轮
      };
      
      setCurrentConversation(updatedConversation);

      // 发送请求继续对话
      const continueRequest: ContinueConversationRequest = {
        conversationId: currentConversation.id,
        question
      };

      const updatedConversationFromApi = await apiService.continueConversation(continueRequest, updatedConversation);
      setCurrentConversation(updatedConversationFromApi);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('继续对话时发生未知错误'));
      console.error('Error continuing conversation:', err);
      
      // 恢复对话状态
      if (currentConversation) {
        setCurrentConversation({
          ...currentConversation,
          isComplete: true
        });
      }
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
    continueConversation,
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
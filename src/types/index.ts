/**
 * 类型定义
 * 定义应用中使用的各种类型和接口
 */

// OpenRouter API响应类型
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    tokenizer?: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// AI模型定义（用于内部状态管理）
export interface Model {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
}

// OpenRouter Chat消息
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// OpenRouter Chat请求
export interface OpenRouterChatRequest {
  model: string;
  messages: ChatMessage[];
}

// OpenRouter Chat响应
export interface OpenRouterChatResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
}

// 消息类型 - 用于IM风格界面
export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  modelId?: string; // 对于AI消息，标识发送消息的模型
  content: string;
  timestamp: number;
  isDiscussion?: boolean; // 是否是模型间讨论消息
  isSummary?: boolean; // 是否是总结消息
}

// 模型响应
export interface ModelResponse {
  modelId: string;
  content: string;
}

// 对话轮次
export interface ConversationRound {
  roundNumber: number;
  userQuestion?: string; // 用户问题，第一轮有
  discussionPrompt?: string; // 讨论提示，后续轮次有
  responses: ModelResponse[];
  summary?: string; // 如果是最后一轮，会有总结
}

// 对话请求
export interface ConversationRequest {
  question: string;
  modelIds: string[];
}

// 继续对话请求
export interface ContinueConversationRequest {
  conversationId: string;
  question: string;
}

// 完整对话
export interface Conversation {
  id: string;
  modelIds: string[];
  models: Model[];
  messages: Message[]; // IM风格界面的消息列表
  rounds: ConversationRound[];
  currentRound: number; // 当前进行到第几轮
  maxRounds: number; // 最大轮次，默认为3
  isComplete: boolean; // 当前对话是否已完成
  summary?: string; // 最终总结
}

// 对话历史记录
export interface ConversationHistory {
  id: string;
  question: string;
  summary: string;
  createdAt: string;
}
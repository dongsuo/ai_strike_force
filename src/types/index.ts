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
  // 由于我们自己计算free_models，不再需要这些字段
  // all_models: OpenRouterModel[];
  // free_models: OpenRouterModel[];
  // free_models_count: number;
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

// 模型响应
export interface ModelResponse {
  modelId: string;
  content: string;
}

// 对话轮次
export interface ConversationRound {
  roundNumber: number;
  responses: ModelResponse[];
}

// 对话请求
export interface ConversationRequest {
  question: string;
  modelIds: string[];
}

// 完整对话
export interface Conversation {
  id: string;
  question: string;
  models: Model[];
  rounds: ConversationRound[];
  finalSummary?: string;
}

// 对话历史记录
export interface ConversationHistory {
  id: string;
  question: string;
  summary: string;
  createdAt: string;
}
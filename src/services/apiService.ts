/**
 * API服务
 * 处理与OpenRouter API的通信
 */

import axios from 'axios';
import { 
  Model, 
  ConversationRequest, 
  Conversation, 
  ConversationHistory,
  OpenRouterModelsResponse,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  ChatMessage
} from '../types';

// 创建axios实例 - 使用我们的服务端代理
const api = axios.create({
  baseURL: `${process.env.AIPA_API_DOMAIN}/api`, // 使用环境变量作为域名前缀
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json',
  }
});

// OpenRouter API服务
export const apiService = {
  // 获取可用模型列表
  async getModels(): Promise<Model[]> {
    try {
      console.log('正在获取模型列表...');
      
      const response = await api.get<any>('/free/models');
      console.log('模型列表响应:', response.data);
      
      // 增强错误处理和数据解析逻辑
      if (!response.data) {
        throw new Error('服务端返回空数据');
      }
      
      // 处理直接返回模型数组的情况
      let allModels = [];
      let freeModels = [];
      
      if (Array.isArray(response.data)) {
        // 如果响应直接是数组，假设所有模型都可用
        allModels = response.data;
        freeModels = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // 处理 OpenRouter 原始格式 {data: [...]}
        allModels = response.data.data;
        freeModels = response.data.data;
      } else {
        // 处理服务端可能添加的包装格式 {all_models, free_models}
        allModels = response.data.all_models || [];
        freeModels = response.data.free_models || [];
      }
      
      if (allModels.length === 0) {
        throw new Error('没有找到可用的模型');
      }
      
      // 将OpenRouter模型映射到我们的Model格式
      const freeModelIds = new Set(freeModels.map(model => model.id));
      return allModels.map(model => ({
        id: model.id || '',
        name: model.name || '未命名模型',
        description: model.description || `${model.name || '未命名'} 模型`,
        isFree: freeModelIds.has(model.id)
      }));
    } catch (error) {
      console.error('Error fetching models:', error);
      
      // 增强错误上报
      if (process.env.NODE_ENV === 'development' && typeof aipaDevRuntime !== 'undefined') {
        aipaDevRuntime.reportApiError({
          url: '/api/free/models',
          method: 'GET',
          body: null,
        }, error instanceof Error ? error.message : '未知错误');
      }
      
      throw new Error('无法获取模型列表，请确认网络连接和API配置');
    }
  },

  // 创建单个模型的聊天请求
  async createChatCompletion(modelId: string, messages: ChatMessage[]): Promise<string> {
    try {
      const request: OpenRouterChatRequest = {
        model: modelId,
        messages: messages
      };
      
      const response = await api.post<OpenRouterChatResponse>('/chat/completions', request);
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(`Error getting response from model ${modelId}:`, error);
      throw new Error(`从模型 ${modelId} 获取响应失败`);
    }
  },

  // 开始新的对话
  async startConversation(request: ConversationRequest): Promise<Conversation> {
    try {
      const { question, modelIds } = request;
      
      // 获取模型信息
      const allModels = await this.getModels();
      const selectedModels = allModels.filter(model => modelIds.includes(model.id));
      
      // 创建对话ID
      const conversationId = `conv-${Date.now()}`;
      
      // 第一轮：每个模型直接回答问题
      const basePrompt: ChatMessage = {
        role: 'user',
        content: `You are an expert AI model participating in a collaborative discussion to answer the user's question: "${question}". Provide your answer clearly and concisely. Your response will be shared with other models for further discussion.`
      };
      
      const round1Responses = await Promise.all(
        modelIds.map(async (modelId) => {
          const content = await this.createChatCompletion(modelId, [basePrompt]);
          return { modelId, content };
        })
      );
      
      // 第二轮：每个模型查看其他模型的回答并提供更新的答案
      const round1Summary = round1Responses
        .map(response => `- ${selectedModels.find(m => m.id === response.modelId)?.name || response.modelId}: ${response.content}`)
        .join('\n\n');
        
      const round2Prompt: ChatMessage = {
        role: 'user',
        content: `You are continuing a collaborative discussion to answer: "${question}". Here are the previous responses:\n\n${round1Summary}\n\nReview the responses and provide your answer. If you agree with a previous response, state so and explain why. If you disagree, provide an alternative answer with reasoning.`
      };
      
      const round2Responses = await Promise.all(
        modelIds.map(async (modelId) => {
          const content = await this.createChatCompletion(modelId, [round2Prompt]);
          return { modelId, content };
        })
      );

      // 总结：由第一个模型生成最终答案
      const round2Summary = round2Responses
        .map(response => `- ${selectedModels.find(m => m.id === response.modelId)?.name || response.modelId}: ${response.content}`)
        .join('\n\n');
        
      const summaryPrompt: ChatMessage = {
        role: 'user',
        content: `You are the first model in a collaborative discussion to answer: "${question}". Here are all responses from up to 2 rounds:\n\nRound 1:\n${round1Summary}\n\nRound 2:\n${round2Summary}\n\nSummarize the discussion, identify the most agreed-upon answer, and provide a clear, concise final response to the user.`
      };
      
      const finalSummary = await this.createChatCompletion(modelIds[0], [summaryPrompt]);
      
      // 构建完整对话
      const conversation: Conversation = {
        id: conversationId,
        question,
        models: selectedModels,
        rounds: [
          {
            roundNumber: 1,
            responses: round1Responses
          },
          {
            roundNumber: 2,
            responses: round2Responses
          }
        ],
        finalSummary
      };
      
      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw new Error('创建对话失败');
    }
  },

  async getHistory(): Promise<ConversationHistory[]> {
    try {
      // 为MVP使用模拟数据，在实际应用中应连接到后端API
      return new Promise(resolve => {
        setTimeout(() => {
          const mockHistory: ConversationHistory[] = [
            { id: 'hist-1', question: '人工智能如何改变医疗行业？', summary: '人工智能在医疗行业有多方面应用，包括疾病诊断、药物研发、医疗影像分析等。AI可以提高诊断准确率，加速新药开发，并为医生提供决策支持。', createdAt: '2023-05-15T08:30:00Z' },
            { id: 'hist-2', question: '量子计算的未来发展方向是什么？', summary: '量子计算未来将专注于提高量子比特稳定性、发展实用算法、扩展计算规模。到2030年有望实现商业化量子优势，影响密码学、材料科学和药物发现等领域。', createdAt: '2023-05-14T14:45:00Z' },
            { id: 'hist-3', question: '气候变化对全球农业有何影响？', summary: '气候变化导致极端天气增加、生长季节变化、病虫害分布改变，影响作物产量。适应策略包括开发抗旱品种、改进灌溉技术和实施精准农业。', createdAt: '2023-05-12T11:20:00Z' },
          ];
          resolve(mockHistory);
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      throw new Error('无法获取历史记录');
    }
  }
};
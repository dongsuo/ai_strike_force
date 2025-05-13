/**
 * API服务
 * 处理与OpenRouter API的直接通信，支持多轮对话和模型协商
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
  ChatMessage,
  Message,
  ContinueConversationRequest,
  ModelResponse,
} from '../types';

// 创建axios实例 - 直接访问OpenRouter负载均衡器
const api = axios.create({
  baseURL: 'https://openrouter-load-balancer.dongsuo.workers.dev',
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 辅助函数：创建唯一ID
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

      // 新格式处理：处理 {free_models: string[]} 格式
      let modelIds: string[] = [];

      if (
        response.data.free_models &&
        Array.isArray(response.data.free_models)
      ) {
        // 新格式：{free_models: string[]}
        modelIds = response.data.free_models;
      } else if (Array.isArray(response.data)) {
        // 如果响应直接是数组
        modelIds = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // 处理 OpenRouter 原始格式 {data: [...]}
        modelIds = response.data.data.map((model) => model.id);
      } else {
        // 兜底处理，尝试提取任何可能的模型ID数组
        const possibleArrays = Object.values(response.data).find((val) =>
          Array.isArray(val)
        );
        if (possibleArrays) {
          modelIds = Array.isArray(possibleArrays[0])
            ? possibleArrays
            : typeof possibleArrays[0] === 'string'
            ? possibleArrays
            : possibleArrays.map((m) => m.id || m);
        }
      }

      if (modelIds.length === 0) {
        throw new Error('没有找到可用的模型');
      }

      // 将模型ID转换为Model对象
      return modelIds.map((modelId) => {
        // 移除":free"后缀
        const cleanId = modelId.replace(/:free$/, '');

        // 从ID中提取名称（假设格式为 vendor/model-name 或类似）
        const nameParts = cleanId.split('/');
        const modelName =
          nameParts.length > 1
            ? nameParts[1]
                .replace(/-/g, ' ')
                .replace(/(\d+(\.\d+)?)([a-z])/g, '$1 $3')
            : cleanId;

        // 首字母大写处理
        const formattedName = modelName
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          id: cleanId, // 保存没有:free后缀的ID用于API调用
          name: formattedName,
          description: `${
            nameParts[0] || '未知提供商'
          } 提供的 ${formattedName} 模型`,
          isFree: true,
        };
      });
    } catch (error) {
      console.error('Error fetching models:', error);

      // 增强错误上报
      if (
        process.env.NODE_ENV === 'development' &&
        typeof aipaDevRuntime !== 'undefined'
      ) {
        aipaDevRuntime.reportApiError(
          {
            url: 'https://openrouter-load-balancer.dongsuo.workers.dev/free/models',
            method: 'GET',
            body: null,
          },
          error instanceof Error ? error.message : '未知错误'
        );
      }

      throw new Error('无法获取模型列表，请确认网络连接和API配置');
    }
  },

  // 创建单个模型的聊天请求
  async createChatCompletion(
    modelId: string,
    messages: ChatMessage[]
  ): Promise<string> {
    try {
      const request: OpenRouterChatRequest = {
        model: modelId,
        messages: messages,
      };

      const response = await api.post<OpenRouterChatResponse>(
        '/chat/completions',
        request
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(`Error getting response from model ${modelId}:`, error);

      // 增强错误上报
      if (
        process.env.NODE_ENV === 'development' &&
        typeof aipaDevRuntime !== 'undefined'
      ) {
        aipaDevRuntime.reportApiError(
          {
            url: 'https://openrouter-load-balancer.dongsuo.workers.dev/chat/completions',
            method: 'POST',
            body: { model: modelId },
          },
          error instanceof Error ? error.message : '未知错误'
        );
      }

      throw new Error(`从模型 ${modelId} 获取响应失败`);
    }
  },

  // 开始新的对话 - 实现多轮协商机制
  async startConversation(request: ConversationRequest): Promise<Conversation> {
    try {
      const { question, modelIds } = request;

      // 获取模型信息
      const allModels = await this.getModels();
      const selectedModels = allModels.filter((model) =>
        modelIds.includes(model.id)
      );

      // 创建对话ID
      const conversationId = generateId('conv');

      // 初始提问
      const initialPrompt: ChatMessage[] = [
        {
          role: 'system',
          content:
            '你是一个有用的AI助手，请直接回答用户的问题，不需要添加任何前缀。',
        },
        {
          role: 'user',
          content: question,
        },
      ];

      // 创建初始消息数组，开始是用户消息
      const messages: Message[] = [
        {
          id: generateId('msg'),
          sender: 'user',
          content: question,
          timestamp: Date.now(),
        },
      ];

      // 获取每个模型的初始回答
      const initialResponses: ModelResponse[] = [];
      for (const modelId of modelIds) {
        const content = await this.createChatCompletion(modelId, initialPrompt);

        // 添加模型回复到消息数组
        messages.push({
          id: generateId('msg'),
          sender: 'assistant',
          modelId,
          content,
          timestamp: Date.now(),
        });

        initialResponses.push({ modelId, content });
      }

      // 构建对话结构 - 第一轮
      const conversation: Conversation = {
        id: conversationId,
        modelIds,
        models: selectedModels,
        messages,
        rounds: [
          {
            roundNumber: 1,
            userQuestion: question,
            responses: initialResponses,
          },
        ],
        currentRound: 1,
        maxRounds: 3, // 默认最多3轮
        isComplete: false, // 第一轮完成后还需要继续讨论
      };

      // 如果只有1轮，直接进行讨论和总结
      return this.proceedToNextRound(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw new Error('创建对话失败');
    }
  },

  // 进行下一轮讨论
  async proceedToNextRound(conversation: Conversation): Promise<Conversation> {
    try {
      const { currentRound, maxRounds, modelIds, rounds, messages } =
        conversation;

      // 检查是否已经达到最大轮次或需要提前结束
      if (currentRound >= maxRounds) {
        // 达到最大轮次，生成最终总结
        return await this.generateFinalSummary(conversation);
      }

      // 获取当前轮次的所有回答
      const currentRoundResponses = rounds[currentRound - 1].responses;

      // 生成讨论提示
      const discussionPrompt = `以下是几个AI助手对问题的回答，请你仔细阅读这些回答，并提出你对其他回答的看法，指出他们的优点和不足，以及你认为哪个回答最好，为什么。如果你基本同意所有回答，可以直接说"我同意以上回答"。\n\n${currentRoundResponses
        .map(
          (response, index) => `模型${index + 1}的回答：\n${response.content}\n`
        )
        .join('\n')}`;

      // 创建下一轮的讨论消息数组
      const newRoundNumber = currentRound + 1;
      const discussionResponses: ModelResponse[] = [];
      const newMessages: Message[] = [];

      // 添加系统消息表明这是一轮新的讨论
      newMessages.push({
        id: generateId('msg'),
        sender: 'assistant',
        content: `==== 第${newRoundNumber}轮讨论 ====`,
        timestamp: Date.now(),
        isDiscussion: true,
      });

      // 获取每个模型对其他回答的评论
      for (const modelId of modelIds) {
        // 构建讨论提示的聊天历史
        const discussionHistory: ChatMessage[] = [
          {
            role: 'system',
            content: '你是一个有用的AI助手，现在正在与其他AI助手讨论一个问题。',
          },
          {
            role: 'user',
            content: discussionPrompt,
          },
        ];

        // 获取模型的讨论回复
        const content = await this.createChatCompletion(
          modelId,
          discussionHistory
        );

        // 检查回复中是否包含"同意"字样，判断是否达成共识
        const hasConsensus =
          content.includes('同意') &&
          !content.includes('不同意') &&
          !content.includes('不赞同');

        // 添加模型回复到消息数组
        newMessages.push({
          id: generateId('msg'),
          sender: 'assistant',
          modelId,
          content,
          timestamp: Date.now(),
          isDiscussion: true,
        });

        discussionResponses.push({ modelId, content });

        // 如果所有模型都同意，可以提前结束讨论
        if (hasConsensus) {
          console.log('模型已达成共识，提前结束讨论');
          // 达成共识，可以直接进行总结
          const updatedConversation: Conversation = {
            ...conversation,
            messages: [...messages, ...newMessages],
            rounds: [
              ...rounds,
              {
                roundNumber: newRoundNumber,
                discussionPrompt,
                responses: discussionResponses,
              },
            ],
            currentRound: newRoundNumber,
          };

          // 直接生成最终总结
          return await this.generateFinalSummary(updatedConversation);
        }
      }

      // 更新对话状态
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...messages, ...newMessages],
        rounds: [
          ...rounds,
          {
            roundNumber: newRoundNumber,
            discussionPrompt,
            responses: discussionResponses,
          },
        ],
        currentRound: newRoundNumber,
      };

      // 递归调用以继续到下一轮
      return await this.proceedToNextRound(updatedConversation);
    } catch (error) {
      console.error('Error proceeding to next round:', error);
      throw new Error('进行下一轮讨论失败');
    }
  },

  // 生成最终总结
  async generateFinalSummary(
    conversation: Conversation
  ): Promise<Conversation> {
    try {
      const { modelIds, rounds, messages } = conversation;

      // 使用第一个模型来生成总结
      const summarizerModelId = modelIds[0];

      // 构建总结提示
      const allResponses = rounds.flatMap((round) => round.responses);
      const summaryPrompt = `现在请你作为主持人，根据所有AI助手的讨论，给出一个最终的总结回答。你的回答应该包含各种观点，并尽可能全面地回答原始问题。\n\n原始问题: ${
        rounds[0].userQuestion
      }\n\n${allResponses
        .map(
          (response, index) =>
            `模型${response.modelId.split('/').pop() || index + 1}的回答：\n${
              response.content
            }\n`
        )
        .join('\n')}`;

      // 构建总结的聊天历史
      const summaryHistory: ChatMessage[] = [
        {
          role: 'system',
          content:
            '你是一个公正的总结者，负责整合多个AI助手的观点，提供一个全面的最终答案。',
        },
        {
          role: 'user',
          content: summaryPrompt,
        },
      ];

      // 获取总结
      const summaryContent = await this.createChatCompletion(
        summarizerModelId,
        summaryHistory
      );

      // 添加总结消息
      const summaryMessage: Message = {
        id: generateId('msg'),
        sender: 'assistant',
        modelId: summarizerModelId,
        content: summaryContent,
        timestamp: Date.now(),
        isSummary: true,
      };

      // 添加系统消息表明这是最终总结
      const finalMessages = [
        ...messages,
        {
          id: generateId('msg'),
          sender: 'assistant',
          content: '==== 最终总结 ====',
          timestamp: Date.now(),
          isDiscussion: true,
        },
        summaryMessage,
      ];

      // 更新对话状态
      const completedConversation: Conversation = {
        ...conversation,
        messages: finalMessages,
        summary: summaryContent,
        isComplete: true,
      };

      return completedConversation;
    } catch (error) {
      console.error('Error generating final summary:', error);
      throw new Error('生成最终总结失败');
    }
  },

  // 继续现有对话 - 支持追问
  async continueConversation(
    request: ContinueConversationRequest,
    currentConversation: Conversation
  ): Promise<Conversation> {
    try {
      const { question } = request;
      const { modelIds, models, messages, rounds, summary } =
        currentConversation;

      // 创建用户新追问消息
      const userMessage: Message = {
        id: generateId('msg'),
        sender: 'user',
        content: question,
        timestamp: Date.now(),
      };

      // 更新消息列表
      const updatedMessages = [...messages, userMessage];

      // 构建追问的聊天历史 - 包含原始对话和总结
      const buildChatHistoryForModel = (modelId: string) => {
        const chatHistory: ChatMessage[] = [
          {
            role: 'system',
            content:
              '你是一个有用的AI助手，正在回答用户的追问。请参考之前的讨论和总结。',
          },
        ];

        // 添加原始问题
        chatHistory.push({
          role: 'user',
          content: rounds[0].userQuestion || '',
        });

        // 添加该模型对原始问题的回答
        const initialResponse = rounds[0].responses.find(
          (r) => r.modelId === modelId
        );
        if (initialResponse) {
          chatHistory.push({
            role: 'assistant',
            content: initialResponse.content,
          });
        }

        // 添加最终总结
        if (summary) {
          chatHistory.push({
            role: 'system',
            content: `之前讨论的总结: ${summary}`,
          });
        }

        // 添加新问题
        chatHistory.push({
          role: 'user',
          content: question,
        });

        return chatHistory;
      };

      // 获取每个模型的回答
      const followUpResponses: ModelResponse[] = [];
      const followUpMessages: Message[] = [];

      for (const modelId of modelIds) {
        const chatHistory = buildChatHistoryForModel(modelId);
        const content = await this.createChatCompletion(modelId, chatHistory);

        followUpResponses.push({ modelId, content });

        // 添加模型回复到消息数组
        followUpMessages.push({
          id: generateId('msg'),
          sender: 'assistant',
          modelId,
          content,
          timestamp: Date.now(),
        });
      }

      // 创建新的对话轮次
      const newRoundNumber = rounds.length + 1;

      // 更新对话
      const updatedConversation: Conversation = {
        ...currentConversation,
        messages: [...updatedMessages, ...followUpMessages],
        rounds: [
          ...rounds,
          {
            roundNumber: newRoundNumber,
            userQuestion: question,
            responses: followUpResponses,
          },
        ],
        currentRound: 1, // 重置为第一轮
        isComplete: false,
      };

      // 继续进行讨论和总结流程
      return this.proceedToNextRound(updatedConversation);
    } catch (error) {
      console.error('Error continuing conversation:', error);
      throw new Error('继续对话失败');
    }
  },

  async getHistory(): Promise<ConversationHistory[]> {
    // ... 保留现有代码 ...
    return [];
  },
};

/**
 * 对话展示组件
 * 显示多个AI模型的对话协商过程和最终结果
 */

import React from 'react';
import { Card, CardBody, CardHeader, CardFooter, Divider, Progress, Chip, Button } from '@nextui-org/react';
import { RefreshIcon } from './icons';
import { useConversation } from '../context/ConversationContext';
import { ModelResponse } from '../types';

export const ConversationDisplay: React.FC = () => {
  const { currentConversation, isLoading } = useConversation();

  if (!currentConversation && !isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg">
        <CardBody className="text-center py-8">
          <p className="text-lg text-default-500">
            请输入问题并选择模型来开始一次新的对话
          </p>
        </CardBody>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg">
        <CardHeader className="pb-0 pt-4 px-6 flex flex-col items-start">
          <h4 className="text-xl font-bold">AI 模型协商中...</h4>
          <p className="text-small text-default-500 mt-1">
            {currentConversation?.question || '处理您的问题中'}
          </p>
        </CardHeader>
        <CardBody className="py-4">
          <Progress
            isIndeterminate
            aria-label="加载中"
            className="my-4"
            color="primary"
          />
          <p className="text-center text-default-500">
            AI StrikeForce 正在协商最佳答案，请稍候...
          </p>
        </CardBody>
      </Card>
    );
  }

  if (!currentConversation) return null;

  const { question, rounds, finalSummary, models } = currentConversation;
  const currentRound = rounds.length;
  const progressValue = Math.min((currentRound / 3) * 100, 100);
  
  const getModelNameById = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg">
      <CardHeader className="pb-0 pt-4 px-6 flex flex-col items-start">
        <h4 className="text-xl font-bold">对话协商结果</h4>
        <p className="text-small text-default-500 mt-1">{question}</p>
      </CardHeader>
      <CardBody className="py-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">协商进度: 第 {currentRound} 轮 (最多3轮)</span>
            <span className="text-sm">{finalSummary ? '已完成' : '进行中'}</span>
          </div>
          <Progress
            value={progressValue}
            color="primary"
            aria-label="协商进度"
            className="h-2"
            size="sm"
          />
        </div>

        {/* 显示每一轮的对话 */}
        {rounds.map((round, roundIndex) => (
          <div key={`round-${roundIndex}`} className="mb-6">
            <div className="flex items-center mb-2">
              <Chip color="primary" variant="flat" className="mr-2">轮次 {roundIndex + 1}</Chip>
            </div>
            
            <div className="space-y-4">
              {round.responses.map((response, responseIndex) => (
                <Card key={`response-${roundIndex}-${responseIndex}`} variant="flat" className="shadow-sm">
                  <CardHeader className="py-2 px-4 bg-default-100">
                    <span className="font-medium">{getModelNameById(response.modelId)}</span>
                  </CardHeader>
                  <CardBody className="py-3 px-4">
                    <p className="whitespace-pre-line">{response.content}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* 显示最终总结 */}
        {finalSummary && (
          <>
            <Divider className="my-4" />
            <div className="mt-4">
              <h5 className="text-lg font-bold mb-2">最终总结</h5>
              <Card variant="flat" className="bg-primary-50 shadow-sm">
                <CardBody className="py-4 px-4">
                  <p className="whitespace-pre-line">{finalSummary}</p>
                </CardBody>
                <CardFooter className="text-small text-default-400 justify-end">
                  由 {getModelNameById(rounds[0].responses[0].modelId)} 总结
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </CardBody>
      <CardFooter className="justify-end">
        <Button 
          variant="light" 
          startContent={<RefreshIcon />}
          onPress={() => window.location.reload()}
          className="mr-2"
        >
          新的对话
        </Button>
      </CardFooter>
    </Card>
  );
};
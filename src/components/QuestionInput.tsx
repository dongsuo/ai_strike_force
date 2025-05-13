/**
 * 问题输入组件
 * 用于用户输入问题并发起新的对话或继续对话
 */

import React, { useState, useEffect } from 'react';
import { Textarea, Button, Card, CardBody, CardFooter } from '@nextui-org/react';
import { ModelSelector } from './ModelSelector';
import { useConversation } from '../context/ConversationContext';

interface QuestionInputProps {
  onSubmit: () => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentConversation, isLoading, startNewConversation, continueConversation } = useConversation();
  
  // 当有活跃对话且已完成时，显示追问模式
  const isFollowUpMode = currentConversation && currentConversation.isComplete;
  
  // 组件挂载时，如果有现有对话，使用其模型选择
  useEffect(() => {
    if (currentConversation?.modelIds) {
      setSelectedModelIds(currentConversation.modelIds);
    }
  }, [currentConversation]);

  const handleSubmit = async () => {
    if (!question.trim() || isSubmitting) {
      return;
    }
    
    // 在追问模式下需要模型已选择
    if (!isFollowUpMode && selectedModelIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isFollowUpMode) {
        // 继续现有对话
        await continueConversation(question.trim());
      } else {
        // 开始新对话
        await startNewConversation({
          question: question.trim(),
          modelIds: selectedModelIds,
        });
      }
      setQuestion('');
      onSubmit();
    } catch (error) {
      console.error('Error handling question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModelSelectionChange = (modelIds: string[]) => {
    setSelectedModelIds(modelIds);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-3xl mx-auto">
      <Card className="w-full shadow-2xl rounded-2xl border border-default-100 bg-gradient-to-br from-white to-default-50">
        <CardBody className="gap-5 px-6 py-6">
          <Textarea
            label={isFollowUpMode ? "追问" : "输入您的问题"}
            placeholder={isFollowUpMode 
              ? "输入您的追问或深入探讨的内容..." 
              : "例如：分析人工智能对未来就业市场的影响..."}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            minRows={3}
            maxRows={6}
            className="w-full text-base"
            classNames={{
              inputWrapper: "bg-white shadow-md border-2 border-default-200 focus-within:border-primary-400 rounded-2xl transition-all duration-200 data-[hover=true]:border-primary-200",
              label: "font-medium text-default-600 mb-2",
              input: "placeholder:text-default-300 text-default-700"
            }}
          />
          <ModelSelector 
            onSelectionChange={handleModelSelectionChange}
            initialSelection={selectedModelIds}
          />
        </CardBody>
        <CardFooter className="flex justify-end px-6 pb-6 pt-0 bg-gradient-to-t from-default-50 to-white rounded-b-2xl">
          <Button
            isLoading={isSubmitting || isLoading}
            isDisabled={!question.trim() || (!isFollowUpMode && selectedModelIds.length === 0)}
            className="px-8 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold text-white text-base rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
            radius="lg"
            size="lg"
            onClick={handleSubmit}
          >
            {isSubmitting || isLoading 
              ? "处理中..." 
              : isFollowUpMode 
                ? "发送追问" 
                : "发起对话"
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
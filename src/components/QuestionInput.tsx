/**
 * 问题输入组件
 * 用于用户输入问题并发起新的对话
 */

import React, { useState } from 'react';
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
  const { startNewConversation } = useConversation();

  const handleSubmit = async () => {
    if (!question.trim() || selectedModelIds.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await startNewConversation({
        question: question.trim(),
        modelIds: selectedModelIds,
      });
      setQuestion('');
      onSubmit();
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModelSelectionChange = (modelIds: string[]) => {
    setSelectedModelIds(modelIds);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      <Card className="w-full shadow-lg">
        <CardBody className="gap-4">
          <Textarea
            label="输入您的问题"
            placeholder="例如：分析人工智能对未来就业市场的影响..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            minRows={3}
            maxRows={6}
            className="w-full"
          />
          <div className="mt-2">
            <ModelSelector onSelectionChange={handleModelSelectionChange} maxModels={4} />
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!question.trim() || selectedModelIds.length === 0}
          >
            {isSubmitting ? "处理中..." : "发起对话"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
/**
 * 对话展示组件
 * 使用IM风格界面显示对话内容，包括多轮协商和总结
 */

import React, { useRef, useEffect } from 'react';
import { Card, CardBody, Spinner, Avatar, Tooltip, Chip } from '@nextui-org/react';
import { useConversation } from '../context/ConversationContext';
import { Message } from './Message';

export const ConversationDisplay: React.FC = () => {
  const { currentConversation, isLoading } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 消息列表自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  if (!currentConversation && !isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 shadow-xl rounded-xl bg-gradient-to-b from-white to-default-50 border border-default-200">
        <CardBody className="text-center py-12">
          <p className="text-xl font-medium text-default-700 mb-2">
            开始新的多模型协作对话
          </p>
          <p className="text-default-500 max-w-md mx-auto">
            请输入问题并选择AI模型来开始一次新的对话，最多可选择4个模型进行协作解答
          </p>
        </CardBody>
      </Card>
    );
  }

  if (isLoading && (!currentConversation || currentConversation.messages.length === 0)) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 shadow-xl rounded-xl bg-gradient-to-b from-white to-default-50 border border-default-200">
        <CardBody className="flex flex-col items-center justify-center py-12">
          <Spinner
            label="正在准备对话..."
            color="primary"
            labelColor="primary"
            classNames={{
              wrapper: "w-16 h-16",
              circle1: "border-4",
              circle2: "border-4",
              label: "text-md font-medium mt-4"
            }}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 shadow-xl flex flex-col h-[700px] rounded-xl border border-default-200 overflow-hidden bg-gradient-to-br from-white to-default-50">
      <CardBody className="py-4 px-4 flex flex-col flex-grow overflow-hidden">
        {/* 对话标题和当前状态 */}
        <div className="border-b pb-3 mb-4 flex-shrink-0 bg-gradient-to-r from-default-50 to-white -mx-4 px-4 rounded-t-xl">
          <h4 className="text-xl font-bold text-center bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">AI 多模型协作</h4>
          {currentConversation && (
            <div className="flex justify-center mt-2">
              <Chip
                size="sm"
                color={currentConversation.isComplete ? "success" : "primary"}
                variant="flat"
                classNames={{
                  base: `${currentConversation.isComplete
                    ? 'bg-gradient-to-r from-success-50 to-success-100 border border-success-200'
                    : 'bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200'} 
                    shadow-sm`
                }}
                radius="lg"
              >
                {currentConversation.isComplete
                  ? "已完成"
                  : `第 ${currentConversation.currentRound}/${currentConversation.maxRounds} 轮讨论中`}
              </Chip>
            </div>
          )}
        </div>

        {/* 参与者列表 */}
        {currentConversation && currentConversation.models.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 justify-center flex-shrink-0 bg-default-50 py-2 rounded-xl border border-default-100">
            <span className="text-sm text-default-500 mr-2 my-auto">参与模型：</span>
            {currentConversation.models.map((model, index) => (
              <Tooltip key={model.id} content={model.name} placement="bottom">
                <Avatar
                  className={`bg-gradient-to-br from-primary-${100 + index * 100} to-secondary-${100 + index * 100} text-white shadow-sm border border-default-200`}
                  name={model.name.charAt(0)}
                  size="sm"
                  radius="full"
                />
              </Tooltip>
            ))}
          </div>
        )}

        {/* 消息列表 - 使用flex-grow和overflow-y-auto确保正确滚动 */}
        <div
          ref={messagesContainerRef}
          className="space-y-3 overflow-y-auto flex-grow flex flex-col p-2"
          style={{ overflowY: 'auto', height: '100%' }}
        >
          <div className="px-3 py-1 text-center">
            <div className="text-xs text-default-400 bg-default-50 inline-block px-3 py-1 rounded-full border border-default-100">
              对话开始
            </div>
          </div>

          {currentConversation?.messages.map(message => (
            <Message
              key={message.id}
              message={message}
              models={currentConversation.models}
            />
          ))}

          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex justify-center py-4 flex-shrink-0">
              <div className="bg-default-50 border border-default-100 px-5 py-3 rounded-xl shadow-sm flex items-center">
                <Spinner size="sm" color="primary" />
                <span className="ml-2 text-sm">AI思考中...</span>
              </div>
            </div>
          )}

          {/* 用于自动滚动的引用元素 */}
          <div ref={messagesEndRef} />
        </div>
      </CardBody>
    </Card>
  );
};
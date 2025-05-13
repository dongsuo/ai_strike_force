/**
 * 消息组件
 * 在聊天界面显示单条消息，包括用户消息、AI回答、讨论和总结
 */

import React from 'react';
import { Card, CardBody, CardFooter, Avatar, Chip } from '@nextui-org/react';
import { Message as MessageType, Model } from '../types';

interface MessageProps {
  message: MessageType;
  models: Model[];
}

export const Message: React.FC<MessageProps> = ({ message, models }) => {
  const isUser = message.sender === 'user';
  const isSystemMessage = message.isDiscussion && !message.modelId;
  
  // 查找模型信息
  const model = message.modelId ? models.find(m => m.id === message.modelId) : null;
  const modelName = model ? model.name : '系统';
  
  // 格式化时间
  const formattedTime = new Date(message.timestamp).toLocaleTimeString();
  
  // 为不同类型的消息设置不同的样式
  let cardClasses = '';
  let avatarBg = '';
  let headerContent = null;
  
  if (isUser) {
    cardClasses = 'bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 shadow-md';
    avatarBg = 'bg-primary-600';
  } else if (isSystemMessage) {
    cardClasses = 'bg-gradient-to-b from-default-50 to-default-100 border border-default-200 mx-auto backdrop-blur-sm';
  } else if (message.isSummary) {
    cardClasses = 'bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-200 shadow-lg';
    avatarBg = 'bg-gradient-to-br from-success-500 to-success-600';
    headerContent = (
      <div className="flex items-center mb-2">
        <Chip color="success" variant="flat" size="sm" className="mr-2 shadow-md font-medium">
          总结
        </Chip>
        <span className="text-sm font-semibold text-success-700">{modelName} 的总结</span>
      </div>
    );
  } else if (message.isDiscussion) {
    cardClasses = 'bg-gradient-to-br from-secondary-50 to-secondary-100 border-2 border-secondary-200 shadow-md';
    avatarBg = 'bg-gradient-to-br from-secondary-500 to-secondary-600';
    headerContent = (
      <div className="flex items-center mb-2">
        <Chip color="secondary" variant="flat" size="sm" className="mr-2 shadow-md font-medium">
          讨论
        </Chip>
        <span className="text-sm font-semibold text-secondary-700">{modelName}</span>
      </div>
    );
  } else {
    cardClasses = 'bg-gradient-to-br from-white to-default-50 border-2 border-default-200 shadow-md';
    avatarBg = 'bg-gradient-to-br from-default-500 to-default-600';
    headerContent = (
      <div className="flex items-center mb-2">
        <Avatar 
          name={modelName.charAt(0)} 
          size="sm" 
          className={`mr-2 ${avatarBg} text-white shadow-md`}
        />
        <span className="text-sm font-semibold text-default-700">{modelName}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex w-full ${
      isUser 
        ? 'justify-end' 
        : isSystemMessage 
          ? 'justify-center' 
          : 'justify-start'
    } mb-4`}>
      <Card 
        className={`${
          isSystemMessage ? 'max-w-[70%]' : 'max-w-[80%]'
        } ${cardClasses} ${isUser ? 'rounded-tr-sm' : !isSystemMessage ? 'rounded-tl-sm' : ''} rounded-2xl`}
        radius="xl"
      >
        <CardBody className="py-3 px-4">
          {!isUser && !isSystemMessage && headerContent}
          <div className="whitespace-pre-line text-sm">{message.content}</div>
        </CardBody>
        {!isSystemMessage && (
          <CardFooter className="p-1 px-3 justify-end border-t border-default-100">
            <span className="text-tiny text-default-400">{formattedTime}</span>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
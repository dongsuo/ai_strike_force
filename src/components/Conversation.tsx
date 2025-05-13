/**
 * 对话组件
 * 显示整个对话，包括多轮问答
 */

import React, { useRef, useEffect } from 'react';
import { useConversation } from '../context/ConversationContext';
import { Message } from './Message';

export const Conversation: React.FC = () => {
  const { currentConversation } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);
  
  if (!currentConversation) {
    return null;
  }
  
  const { messages, models, rounds } = currentConversation;
  
  // 根据消息找到它所属的轮次
  const getMessageRound = (messageIndex: number): number => {
    let userMessageCount = 0;
    
    for (let i = 0; i <= messageIndex; i++) {
      if (messages[i].sender === 'user') {
        userMessageCount++;
      }
    }
    
    return userMessageCount;
  };
  
  // 查找特定轮次的最佳回答ID
  const getBestResponseId = (roundNumber: number): string | undefined => {
    const round = rounds.find(r => r.roundNumber === roundNumber);
    return round?.bestResponseId;
  };
  
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto px-4 py-2">
      {messages.map((message, index) => {
        const roundNumber = getMessageRound(index);
        const bestResponseId = getBestResponseId(roundNumber);
        
        return (
          <Message 
            key={message.id} 
            message={message} 
            models={models}
            roundNumber={roundNumber}
            // 仅为AI回答显示投票按钮
            showVoteButton={message.sender === 'assistant' && currentConversation.isComplete}
            bestResponseId={bestResponseId}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
import React from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ConversationProvider } from './context/ConversationContext';
import { ConversationDisplay } from './components/ConversationDisplay';
import { QuestionInput } from './components/QuestionInput';

export default function App() {
  return (
    <NextUIProvider>
      <ConversationProvider>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
          <header className="container mx-auto max-w-3xl mb-6 text-center px-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI 群聊协商系统
            </h1>
            <p className="text-default-500 mt-2">
              让多个AI模型一起帮你解答问题，支持持续对话
            </p>
          </header>
          
          <main className="container mx-auto space-y-6 pb-20 px-0">
            <ConversationDisplay />
            <QuestionInput onSubmit={() => {}} />
          </main>
        </div>
      </ConversationProvider>
    </NextUIProvider>
  );
}
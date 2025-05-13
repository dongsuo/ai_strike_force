import React from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ConversationProvider } from './context/ConversationContext';
import { ConversationDisplay } from './components/ConversationDisplay';
import { QuestionInput } from './components/QuestionInput';

export default function App() {
  return (
    <NextUIProvider>
      <ConversationProvider>
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-100 flex flex-col items-center justify-start py-8 px-2">
          <header className="w-full max-w-3xl mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-600 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
              AI 群聊协商系统
            </h1>
            <p className="text-default-400 mt-3 text-lg font-medium">
              让多个AI模型一起帮你解答问题，支持持续对话
            </p>
          </header>
          <main className="w-full max-w-3xl flex flex-col gap-8 flex-grow">
            <ConversationDisplay />
            <QuestionInput onSubmit={() => {}} />
          </main>
        </div>
      </ConversationProvider>
    </NextUIProvider>
  );
}
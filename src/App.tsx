/**
 * 应用主组件
 * 整合所有组件，构建完整应用界面
 */

import React, { useState } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ConversationProvider } from './context/ConversationContext';
import { QuestionInput } from './components/QuestionInput';
import { ConversationDisplay } from './components/ConversationDisplay';
import { HistoryList } from './components/HistoryList';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  return (
    <NextUIProvider>
      <ConversationProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI StrikeForce
              </h1>
              <p className="text-default-600 mt-2">
                多AI模型协作对话系统 - 让多个AI模型共同回答您的问题
              </p>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/3 flex flex-col gap-4">
                <QuestionInput onSubmit={() => setActiveTab('new')} />
                <ConversationDisplay />
              </div>

              <div className="w-full md:w-1/3">
                <HistoryList />
              </div>
            </div>
          </div>
        </div>
      </ConversationProvider>
    </NextUIProvider>
  );
};

export default App;
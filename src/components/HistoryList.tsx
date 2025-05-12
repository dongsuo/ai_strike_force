/**
 * 历史记录列表组件
 * 展示用户历史对话记录
 */

import React from 'react';
import { Card, CardBody, CardHeader, Divider, Chip } from '@nextui-org/react';
import { useHistory } from '../hooks/useHistory';
import { HistoryIcon } from './icons';

export const HistoryList: React.FC = () => {
  const { history, isLoading, error } = useHistory();

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardBody className="text-center py-4">
          <p>加载历史记录中...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-md">
        <CardBody className="text-center py-4 text-danger">
          <p>加载历史记录失败: {error.message}</p>
        </CardBody>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="w-full shadow-md">
        <CardBody className="text-center py-6">
          <HistoryIcon />
          <p className="mt-2">暂无历史对话记录</p>
        </CardBody>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-bold">历史对话</h3>
        <Chip color="primary" variant="flat">{history.length}条记录</Chip>
      </CardHeader>
      <Divider />
      <CardBody className="px-2 py-0">
        {history.map((item, index) => (
          <div key={item.id} className="py-3 px-2 hover:bg-default-100 cursor-pointer rounded">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium">{item.question}</p>
                <p className="text-sm text-default-500 mt-1 line-clamp-2">{item.summary}</p>
              </div>
              <div className="text-xs text-default-400 whitespace-nowrap ml-2">
                {formatDate(item.createdAt)}
              </div>
            </div>
            {index < history.length - 1 && <Divider className="mt-3" />}
          </div>
        ))}
      </CardBody>
    </Card>
  );
};
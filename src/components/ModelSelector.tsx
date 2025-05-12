/**
 * 模型选择器组件
 * 用于选择参与对话的AI模型
 */

import React, { useState, useEffect, useRef } from 'react';
import { Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Spinner } from '@nextui-org/react';
import { ChevronDownIcon } from './icons';
import { useModels } from '../hooks/useModels';

interface ModelSelectorProps {
  onSelectionChange: (modelIds: string[]) => void;
  maxModels: number;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelectionChange, maxModels }) => {
  const { models, isLoading, error, refetch } = useModels();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
  const [retrying, setRetrying] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const initialSelectionDone = useRef(false);

  useEffect(() => {
    // 仅在初始加载模型时应用默认选择，而不是每次selectedKeys为空时
    if (models && models.length > 0 && !initialSelectionDone.current) {
      const defaultModels = models.slice(0, Math.min(4, models.length));
      const defaultModelIds = new Set(defaultModels.map(m => m.id));
      setSelectedKeys(defaultModelIds);
      onSelectionChange(Array.from(defaultModelIds));
      initialSelectionDone.current = true;
    }
  }, [models, onSelectionChange]);

  // 直接处理模型选择，不再依赖DropdownMenu的内置选择管理
  const handleModelToggle = (modelId: string) => {
    const newSelectedKeys = new Set(selectedKeys);
    
    if (newSelectedKeys.has(modelId)) {
      // 删除模型，取消选择
      newSelectedKeys.delete(modelId);
    } else {
      // 如果已达到最大选择数量
      if (newSelectedKeys.size >= maxModels) {
        setShowLimitMessage(true);
        setTimeout(() => setShowLimitMessage(false), 3000);
        return; // 不允许超过最大选择数量
      }
      // 添加模型，设置选择
      newSelectedKeys.add(modelId);
    }
    
    setSelectedKeys(newSelectedKeys);
    onSelectionChange(Array.from(newSelectedKeys));
    setShowLimitMessage(false);
  };
  
  const handleRetry = async () => {
    // 强制重新获取模型
    setRetrying(true);
    try {
      await refetch();
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading || retrying) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span>加载可用模型中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 text-danger bg-danger-50 p-3 rounded-lg">
        <div className="font-semibold">模型加载失败</div>
        <div className="text-sm">{error.message || '无法连接到API服务，请检查网络连接'}</div>
        <div className="text-xs mt-1">API请求路径: /models</div>
        <Button 
          color="primary" 
          size="sm" 
          onClick={handleRetry}
          className="mt-2"
        >
          重新获取模型
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">选择参与对话的模型 (最多 {maxModels} 个)</label>
      {showLimitMessage && (
        <div className="text-warning text-sm bg-warning-50 p-2 rounded-md mb-1">
          已达到最大选择数量({maxModels}个)，请先取消选择其他模型
        </div>
      )}
      <Dropdown>
        <DropdownTrigger>
          <Button 
            variant="bordered" 
            endContent={<ChevronDownIcon />}
            className="justify-between"
          >
            已选择 {selectedKeys.size} 个模型
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="选择参与对话的模型"
          className="max-h-[300px] overflow-y-auto"
          closeOnSelect={false}
        >
          {(models || []).map((model) => {
            const isSelected = selectedKeys.has(model.id);
            return (
              <DropdownItem 
                key={model.id} 
                textValue={model.name}
                onClick={(e) => {
                  e.preventDefault();
                  handleModelToggle(model.id);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{model.name}</span>
                  <div className="flex items-center gap-2">
                    {model.isFree && (
                      <Chip size="sm" color="success" variant="flat">免费</Chip>
                    )}
                    {isSelected && (
                      <span className="text-primary">✓</span>
                    )}
                  </div>
                </div>
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
      <div className="flex flex-wrap gap-1 mt-2">
        {Array.from(selectedKeys).map(key => {
          const model = models?.find(m => m.id === key);
          return model ? (
            <Chip 
              key={key} 
              color="primary" 
              variant="flat" 
              className="mr-1"
              onClose={() => handleModelToggle(key)}
              closeable
            >
              {model.name}
            </Chip>
          ) : null;
        })}
      </div>
    </div>
  );
};
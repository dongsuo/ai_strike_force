/**
 * 模型选择器组件
 * 允许用户在下拉框内搜索并选择要在对话中使用的AI模型
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Chip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
} from '@nextui-org/react';
import { ChevronDownIcon, SearchIcon } from './icons';
import { useModels } from '../hooks/useModels';
import { Model } from '../types';

interface ModelSelectorProps {
  onSelectionChange: (modelIds: string[]) => void;
  maxModels?: number;
  initialSelection?: string[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  onSelectionChange,
  maxModels = 4,
  initialSelection = []
}) => {
  const { models, isLoading, error } = useModels();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(initialSelection));
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 当选择变化时通知父组件
  useEffect(() => {
    onSelectionChange(Array.from(selectedKeys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys]);

  // 处理单个模型的选择
  const handleSelectionChange = (modelId: string, isSelected: boolean) => {
    setSelectedKeys(prev => {
      const newSelection = new Set(prev);

      if (isSelected) {
        // 检查是否达到最大选择数
        if (newSelection.size >= maxModels) {
          return prev; // 已达上限，不添加
        }
        newSelection.add(modelId);
      } else {
        newSelection.delete(modelId);
      }

      return newSelection;
    });
  };

  // 根据搜索过滤模型
  const filteredModels = useMemo(() => {
    if (!models) return [];
    if (!searchQuery.trim()) return models;

    return models.filter(model =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [models, searchQuery]);

  const sortedFilteredModels = useMemo(() => {
    return [...filteredModels].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [filteredModels]);

  // 获取已选模型的显示文本
  const getSelectedModelsText = () => {
    if (!models) return "选择AI模型";

    const selectedModels = models.filter(model => selectedKeys.has(model.id));

    if (selectedModels.length === 0) {
      return "选择AI模型";
    }

    if (selectedModels.length === 1) {
      return selectedModels[0].name;
    }

    return `已选择 ${selectedModels.length} 个模型`;
  };

  if (error) {
    return <div className="text-danger">无法加载模型列表</div>;
  }

  return (
    <div className="w-full">
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom"
        showArrow={true}
        offset={10}
        classNames={{
          content: "p-0 border border-default-200 bg-gradient-to-b from-white to-default-50 shadow-xl rounded-xl"
        }}
      >
        <PopoverTrigger>
          <Button
            variant="flat"
            endContent={<span className="text-primary-500 ml-1 group-hover:rotate-180 transition-transform duration-200"><ChevronDownIcon /></span>}
            isLoading={isLoading}
            className="w-full justify-between bg-white border border-default-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 shadow-sm group py-2 font-medium text-default-700"
            radius="lg"
            size="md"
          >
            <span className="flex items-center text-sm">
              {selectedKeys.size > 0 ? (
                <span className="bg-primary-50 text-primary-600 text-xs font-medium rounded-md px-1.5 py-0.5 inline-flex items-center mr-1.5 border border-primary-200">
                  {selectedKeys.size}
                </span>
              ) : null}
              <span className={selectedKeys.size > 0 ? "text-primary-600" : "text-default-500"}>
                {getSelectedModelsText()}
              </span>
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0 overflow-hidden bg-white">
          {/* 搜索区域 - 简化样式并与列表对齐 */}
          <div className="w-[300px] sticky top-0 z-10 bg-white border-b border-default-200 px-1 pt-1 pb-2">
            <Input
              placeholder="搜索模型..."
              size="sm"
              startContent={<SearchIcon size={16} className="text-default-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              classNames={{
                inputWrapper: "w-full rounded-lg outline-none focus:outline-none focus-within:outline-none focus-within:ring-0 h-9",
                input: "outline-none focus:outline-none focus:ring-0"
              }}
              clearable
              autoFocus
            />
            {selectedKeys.size >= maxModels && (
              <div className="text-xs text-warning mt-2 mx-2 px-2 py-1 bg-warning-50 rounded-lg border border-warning-200 flex items-center">
                <span className="i-lucide-alert-circle mr-1 text-warning" />
                已达到最大选择数量 ({maxModels})
              </div>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto py-2 bg-white">
            {sortedFilteredModels.length > 0 ? (
              sortedFilteredModels.map((model) => {
                const isSelected = selectedKeys.has(model.id);
                const isDisabled = !isSelected && selectedKeys.size >= maxModels;

                return (
                  <div
                    key={model.id}
                    className={`px-3 py-2.5 cursor-pointer transition-all flex items-center gap-2 mx-1 my-0.5 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' :
                      isSelected ? 'bg-primary-50 border-primary-100 border' :
                        'hover:bg-default-100'
                      }`}
                    onClick={() => {
                      if (!isDisabled) {
                        handleSelectionChange(model.id, !isSelected);
                      }
                    }}
                  >
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? 'bg-primary-500 border border-primary-600' : 'border border-default-300 bg-white'}`}
                      >
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0 flex-1">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-xs text-default-500">{model.description}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-default-400">
                <div className="mx-auto w-8 h-8 mb-2 rounded-full bg-default-100 flex items-center justify-center">
                  <span className="i-lucide-search text-lg text-default-400" />
                </div>
                没有找到匹配的模型
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 显示已选模型 */}
      {selectedKeys.size > 0 && models && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Array.from(selectedKeys).map(modelId => {
            const model = models.find(m => m.id === modelId);
            return model ? (
              <Chip
                key={modelId}
                onClose={() => handleSelectionChange(modelId, false)}
                variant="flat"
                size="sm"
                color="primary"
                classNames={{
                  base: "bg-gradient-to-r from-primary-50 to-default-50 border border-primary-100 rounded-lg",
                  content: "font-medium",
                }}
                radius="lg"
              >
                {model.name}
              </Chip>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
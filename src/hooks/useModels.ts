/**
 * 模型数据获取Hook
 * 从API获取可用的AI模型列表
 */

import useSWR from 'swr';
import { apiService } from '../services/apiService';
import { Model } from '../types';

export const useModels = () => {
  const { data, error, isLoading, mutate } = useSWR<Model[]>(
    'models',
    async () => {
      try {
        return await apiService.getModels();
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // 上报API错误（仅开发环境）
        if (process.env.NODE_ENV === 'development' && typeof aipaDevRuntime !== 'undefined') {
          aipaDevRuntime.reportApiError({
            url: '/api/free/models',
            method: 'GET',
          }, error.message || 'Unknown error fetching models');
        }
        throw error;
      }
    },
    { 
      revalidateOnFocus: false,
      revalidateIfStale: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // 最多重试3次
        if (retryCount >= 3) return;
        
        // 5秒后重试
        setTimeout(() => revalidate({ retryCount }), 5000);
      }
    }
  );

  return {
    models: data,
    isLoading,
    error,
    refetch: mutate
  };
};
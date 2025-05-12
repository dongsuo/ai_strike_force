/**
 * 历史记录获取Hook
 * 从API获取用户的历史对话记录
 */

import useSWR from 'swr';
import { apiService } from '../services/apiService';
import { ConversationHistory } from '../types';

export const useHistory = () => {
  const { data, error, isLoading, mutate } = useSWR<ConversationHistory[]>(
    'history',
    () => apiService.getHistory(),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 10000 // 10秒内不重复请求
    }
  );

  return {
    history: data,
    isLoading,
    error,
    refreshHistory: mutate
  };
};
/**
 * 投票按钮组件
 * 允许用户为AI回答投票
 */

import React from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { ThumbsUpIcon, CheckIcon } from './icons';

interface VoteButtonProps {
  modelId: string;
  roundNumber: number;
  isBest: boolean;
  onVote: (modelId: string, roundNumber: number) => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ 
  modelId, 
  roundNumber, 
  isBest, 
  onVote 
}) => {
  return (
    <Tooltip content={isBest ? "已选为最佳回答" : "选为最佳回答"}>
      <Button
        isIconOnly
        size="sm"
        variant={isBest ? "solid" : "light"}
        color={isBest ? "success" : "default"}
        onPress={() => onVote(modelId, roundNumber)}
        className="ml-auto"
        aria-label="Vote for this answer"
      >
        {isBest ? <CheckIcon /> : <ThumbsUpIcon />}
      </Button>
    </Tooltip>
  );
};
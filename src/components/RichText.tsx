/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface RichTextProps {
  text: string;
  isReciteMode: boolean;
  revealedIndices: Set<number>;
  onWordClick: (index: number) => void;
  startIndex: number; // The sequence start index of masked words in this line
}

export const RichText: React.FC<RichTextProps> = ({
  text,
  isReciteMode,
  revealedIndices,
  onWordClick,
  startIndex,
}) => {
  // Split by our custom tags: {{keyword}}, [r]rose[/r], [b]blue[/b], [strong]bold[/strong]
  const regex = /(\{\{[^}]+\}\}|\[r\].*?\[\/r\]|\[b\].*?\[\/b\]|\[strong\].*?\[\/strong\])/g;
  const parts = text.split(regex);

  let currentMaskIndex = startIndex;
  const renderedElements: React.ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (!part) return;

    if (part.startsWith('{{') && part.endsWith('}}')) {
      const content = part.slice(2, -2);
      const maskIdx = currentMaskIndex;
      currentMaskIndex++;

      const isMasked = isReciteMode && !revealedIndices.has(maskIdx);

      renderedElements.push(
        <span
          key={`mask-${idx}-${maskIdx}`}
          id={`mask-${maskIdx}`}
          onClick={(e) => {
            if (isReciteMode) {
              e.stopPropagation();
              onWordClick(maskIdx);
            }
          }}
          className={`glassy-pill ${
            isMasked
              ? 'masked'
              : 'revealed'
          }`}
          title={isReciteMode ? (isMasked ? '点击显示关键词' : '点击隐藏关键词') : undefined}
        >
          {content}
        </span>
      );
    } else if (part.startsWith('[r]') && part.endsWith('[/r]')) {
      const content = part.slice(3, -4);
      renderedElements.push(
        <span key={`red-${idx}`} className="text-rose-600 font-semibold">
          {content}
        </span>
      );
    } else if (part.startsWith('[b]') && part.endsWith('[/b]')) {
      const content = part.slice(3, -4);
      renderedElements.push(
        <span key={`blue-${idx}`} className="text-sky-600 font-semibold bg-sky-50 px-1 rounded">
          {content}
        </span>
      );
    } else if (part.startsWith('[strong]') && part.endsWith('[/strong]')) {
      const content = part.slice(8, -9);
      renderedElements.push(
        <strong key={`bold-${idx}`} className="font-bold text-slate-800">
          {content}
        </strong>
      );
    } else {
      renderedElements.push(<span key={`text-${idx}`}>{part}</span>);
    }
  });

  return <span className="leading-relaxed text-slate-700">{renderedElements}</span>;
};

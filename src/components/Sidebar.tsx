/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Star, GraduationCap, CheckCircle } from 'lucide-react';
import { Chapter } from '../types';

interface SidebarProps {
  chapters: Chapter[];
  activeChapterId: string | 'starred';
  onSelectChapter: (id: string | 'starred') => void;
  starredCount: number;
  rememberedIds: Set<string>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  starredCount,
  rememberedIds,
}) => {
  // Helper to count how many questions are mastered in a chapter
  const getChapterMastery = (chapter: Chapter) => {
    const masteredInCh = chapter.questions.filter((q) => rememberedIds.has(q.id)).length;
    return {
      mastered: masteredInCh,
      total: chapter.questions.length,
      percentage: Math.round((masteredInCh / chapter.questions.length) * 100),
    };
  };

  return (
    <aside className="w-full lg:w-80 glass-panel border-b lg:border-b-0 lg:border-r border-white/40 flex flex-col shrink-0 z-10">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/20 bg-gradient-to-br from-rose-500/10 to-amber-500/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white shadow-lg shadow-rose-900/10">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-tight">
              马克思主义基本原理
            </h1>
            <p className="text-xs font-semibold text-rose-600/90 mt-0.5">
              复习提纲 · 核心要点背诵工具
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {/* Special Nav: Starred Items */}
        <button
          onClick={() => onSelectChapter('starred')}
          className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left border transition-all duration-300 ${
            activeChapterId === 'starred'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
              : 'border-white/40 bg-amber-50/20 text-amber-900 hover:bg-amber-50/40 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${activeChapterId === 'starred' ? 'bg-amber-600/30' : 'bg-amber-100/70'}`}>
              <Star className="h-4 w-4 fill-current" />
            </div>
            <div>
              <span className="font-bold text-sm block">重点收藏夹</span>
              <span className={`text-[10px] ${activeChapterId === 'starred' ? 'text-amber-100/95' : 'text-slate-500'}`}>
                随时复习标记的重难点
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            activeChapterId === 'starred' ? 'bg-amber-600/50 text-white' : 'bg-amber-100/80 text-amber-900'
          }`}>
            {starredCount}
          </span>
        </button>

        <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          章节目录
        </div>

        {/* Chapter buttons */}
        {chapters.map((ch, idx) => {
          const isActive = activeChapterId === ch.id;
          const mastery = getChapterMastery(ch);
          const isFullMastery = mastery.mastered === mastery.total;

          return (
            <button
              key={ch.id}
              onClick={() => onSelectChapter(ch.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-brand-700 to-brand-800 text-white border-brand-800 shadow-lg shadow-rose-900/15'
                  : 'border-white/30 text-slate-700 bg-white/20 hover:bg-white/50 hover:border-white/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-lg font-bold text-xs ${
                  isActive
                    ? 'bg-brand-800/80 text-white'
                    : isFullMastery
                    ? 'bg-emerald-100/80 text-emerald-950'
                    : 'bg-white/40 text-slate-600'
                }`}>
                  {isFullMastery ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm block truncate">{ch.title}</span>
                  <span className={`text-[11px] block truncate ${isActive ? 'text-rose-100/95' : 'text-slate-500'}`}>
                    {ch.subtitle}
                  </span>
                </div>
              </div>
              
              <div className="text-right shrink-0 ml-2">
                <span className={`text-[10px] font-medium block ${isActive ? 'text-rose-100/90' : 'text-slate-400'}`}>
                  掌握
                </span>
                <span className={`text-xs font-bold ${
                  isActive
                    ? 'text-white'
                    : isFullMastery
                    ? 'text-emerald-700'
                    : 'text-slate-700'
                }`}>
                  {mastery.mastered}/{mastery.total}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/20 bg-white/10 text-center backdrop-blur-sm">
        <p className="text-[10px] text-slate-500 font-medium leading-normal">
          依据《马克思主义基本原理》复习提纲制作
        </p>
        <p className="text-[9px] text-slate-400 mt-0.5">
          点击遮罩部分即可显示/隐藏核心词
        </p>
      </div>
    </aside>
  );
};

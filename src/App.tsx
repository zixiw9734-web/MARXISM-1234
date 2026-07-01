/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Menu, X, Search, Sparkles, AlertTriangle, Eye, EyeOff, Trash2, CheckCircle2 } from 'lucide-react';
import { CHAPTERS } from './data';
import { Sidebar } from './components/Sidebar';
import { ContentCard } from './components/ContentCard';
import { Question } from './types';

export default function App() {
  // Sidebar open state (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active navigation: chapter ID, or 'starred'
  const [activeChapterId, setActiveChapterId] = useState<string | 'starred'>('intro');

  // Interactive modes
  const [isReciteMode, setIsReciteMode] = useState(true); // Default to on for memorization tool!
  const [filterType, setFilterType] = useState<'all' | 'key' | 'general'>('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchGlobal, setIsSearchGlobal] = useState(true); // Search entire book by default!

  // User persistence state
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [rememberedIds, setRememberedIds] = useState<Set<string>>(new Set());

  // Load persistence data from localStorage
  useEffect(() => {
    try {
      const storedStars = localStorage.getItem('mayuan_starred_ids');
      const storedRemembered = localStorage.getItem('mayuan_remembered_ids');
      
      if (storedStars) {
        setStarredIds(new Set<string>(JSON.parse(storedStars) as string[]));
      }
      if (storedRemembered) {
        setRememberedIds(new Set<string>(JSON.parse(storedRemembered) as string[]));
      }
    } catch (e) {
      console.error('Failed to load user progress', e);
    }
  }, []);

  // Save persistence data to localStorage
  const saveStars = (newStars: Set<string>) => {
    setStarredIds(newStars);
    localStorage.setItem('mayuan_starred_ids', JSON.stringify(Array.from(newStars)));
  };

  const saveRemembered = (newRemembered: Set<string>) => {
    setRememberedIds(newRemembered);
    localStorage.setItem('mayuan_remembered_ids', JSON.stringify(Array.from(newRemembered)));
  };

  // Toggle handlers
  const handleToggleStar = (id: string) => {
    const next = new Set<string>(starredIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    saveStars(next);
  };

  const handleToggleRemembered = (id: string) => {
    const next = new Set<string>(rememberedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    saveRemembered(next);
  };

  // Reset all progress
  const handleResetProgress = () => {
    if (window.confirm('您确定要重置所有记忆与收藏进度吗？此操作无法撤销。')) {
      saveStars(new Set());
      saveRemembered(new Set());
    }
  };

  // Toggle active chapter & auto close mobile sidebar
  const handleSelectChapter = (id: string | 'starred') => {
    setActiveChapterId(id);
    setIsSidebarOpen(false);
  };

  // Find active chapter object
  const activeChapter = useMemo(() => {
    return CHAPTERS.find((ch) => ch.id === activeChapterId);
  }, [activeChapterId]);

  // Total questions count in entire book
  const totalQuestionsCount = useMemo(() => {
    return CHAPTERS.reduce((acc, ch) => acc + ch.questions.length, 0);
  }, []);

  // Filtered & Searched Content Logic
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. If global search is active and has query, search everything
    if (query && isSearchGlobal) {
      return CHAPTERS.map((ch) => {
        const matches = ch.questions.filter((q) => {
          // Match criteria
          const matchTitle = q.title.toLowerCase().includes(query);
          const matchNum = q.number === query;
          const matchPage = q.pages.toLowerCase().includes(query);
          const matchAnswer = q.answers.some((ans) => ans.toLowerCase().includes(query));
          
          if (!(matchTitle || matchNum || matchPage || matchAnswer)) return false;

          // Apply tag filter in search result too
          if (filterType === 'key') return q.isKey;
          if (filterType === 'general') return !q.isKey;
          return true;
        });

        return {
          ...ch,
          questions: matches,
        };
      }).filter((ch) => ch.questions.length > 0);
    }

    // 2. Otherwise, filter by the active view (current chapter or starred folder)
    let questionsSource: Question[] = [];
    let currentChapterTitle = '';

    if (activeChapterId === 'starred') {
      // Gather all starred questions across all chapters
      CHAPTERS.forEach((ch) => {
        ch.questions.forEach((q) => {
          if (starredIds.has(q.id)) {
            questionsSource.push(q);
          }
        });
      });
      currentChapterTitle = '重点收藏夹';
    } else if (activeChapter) {
      questionsSource = activeChapter.questions;
      currentChapterTitle = activeChapter.title;
    }

    // Apply Filter Tab: All vs Key vs General
    let filtered = questionsSource.filter((q) => {
      if (filterType === 'key') return q.isKey;
      if (filterType === 'general') return !q.isKey;
      return true;
    });

    // Apply Local Search Query (if any)
    if (query) {
      filtered = filtered.filter((q) => {
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchNum = q.number === query;
        const matchPage = q.pages.toLowerCase().includes(query);
        const matchAnswer = q.answers.some((ans) => ans.toLowerCase().includes(query));
        return matchTitle || matchNum || matchPage || matchAnswer;
      });
    }

    return [
      {
        id: activeChapterId,
        title: currentChapterTitle,
        subtitle: activeChapter ? activeChapter.subtitle : '我的难点收藏',
        questions: filtered,
      }
    ].filter((ch) => ch.questions.length > 0);

  }, [activeChapterId, activeChapter, filterType, searchQuery, isSearchGlobal, starredIds]);

  // Overall mastery calculation
  const overallStats = useMemo(() => {
    const total = totalQuestionsCount;
    const mastered = rememberedIds.size;
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { mastered, total, percentage };
  }, [rememberedIds, totalQuestionsCount]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#fafafc] text-slate-800">
      
      {/* Background Liquid Blobs for Apple Glassmorphism Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-250/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200/25 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob-2" />
        <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-red-100/20 mix-blend-multiply filter blur-[100px] opacity-60 animate-blob-3" />
        <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] rounded-full bg-orange-100/15 mix-blend-multiply filter blur-[90px] opacity-50 animate-blob-1" />
      </div>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container (Responsive Slider) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static flex h-full transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          chapters={CHAPTERS}
          activeChapterId={activeChapterId}
          onSelectChapter={handleSelectChapter}
          starredCount={starredIds.size}
          rememberedIds={rememberedIds}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden z-10 glass-view">
        
        {/* Top Header Controls */}
        <header className="bg-white/40 backdrop-blur-md border-b border-white/20 px-4 py-3 md:px-6 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-white/60 text-slate-600 lg:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Context Header */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-800">
                  {activeChapterId === 'starred' ? '我的收藏夹' : activeChapter?.title || '马原复习'}
                </h2>
                <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-slate-300" />
                <p className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                  {activeChapterId === 'starred' ? '全部收藏的重要背诵词' : activeChapter?.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Master Toggle For Recite Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-500">
              背诵模式 (隐藏关键词)
            </span>
            <button
              onClick={() => setIsReciteMode(!isReciteMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none ${
                isReciteMode ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-slate-300/60'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                  isReciteMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </header>

        {/* Filters and Statistics Dashboard Bar */}
        <section className="bg-white/30 backdrop-blur-md px-4 py-3 md:px-6 border-b border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          
          {/* Importance filter tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white/45 text-slate-600 hover:bg-white/85 border border-white/50'
              }`}
            >
              全部内容
            </button>
            <button
              onClick={() => setFilterType('key')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 ${
                filterType === 'key'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10'
                  : 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 border border-rose-500/20'
              }`}
            >
              I类 重点
            </button>
            <button
              onClick={() => setFilterType('general')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 ${
                filterType === 'general'
                  ? 'bg-slate-600 text-white shadow-md'
                  : 'bg-white/45 text-slate-600 hover:bg-white/85 border border-white/50'
              }`}
            >
              II类 理解
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 max-w-md w-full md:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSearchGlobal ? "全局搜索提纲..." : "在当前章节内搜索..."}
                className="w-full pl-9 pr-8 py-1.5 text-xs md:text-sm bg-white/40 backdrop-blur-sm hover:bg-white/60 focus:bg-white rounded-xl border border-white/40 focus:border-rose-400/80 focus:outline-none focus:ring-1 focus:ring-rose-400/80 transition-all placeholder-slate-400 text-slate-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {/* Global vs Local Search Toggle */}
            <button
              onClick={() => setIsSearchGlobal(!isSearchGlobal)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                isSearchGlobal
                  ? 'bg-rose-500/10 text-rose-700 border-rose-500/25 hover:bg-rose-500/20 shadow-sm'
                  : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white/70'
              }`}
              title={isSearchGlobal ? "当前为：全局搜索所有章节" : "当前为：仅搜索当前章节"}
            >
              {isSearchGlobal ? "全局" : "局域"}
            </button>
          </div>

        </section>

        {/* Global Progress Bar Panel */}
        <section className="bg-white/20 backdrop-blur-md px-4 py-2.5 md:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-white/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-slate-700 font-semibold">
              背诵总进度：
              <strong className="text-emerald-700 font-extrabold">{overallStats.mastered}</strong> /{' '}
              {overallStats.total} 题 ({overallStats.percentage}%)
            </span>
            <div className="w-24 sm:w-32 bg-white/40 h-2 rounded-full overflow-hidden inline-block align-middle ml-1 border border-white/30 shadow-inner">
              <div
                style={{ width: `${overallStats.percentage}%` }}
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetProgress}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 bg-white/30 hover:bg-white/80 px-2.5 py-1.5 rounded-xl border border-white/40 shadow-sm transition-all active:scale-95"
              title="清除所有本地做题进度"
            >
              <Trash2 className="h-3 w-3" />
              清空进度
            </button>
          </div>
        </section>

        {/* Content Render Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
          
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <div key={section.id} className="space-y-4">
                {/* Section title (especially useful for multi-chapter search results) */}
                {(isSearchGlobal && searchQuery.trim() !== '') && (
                  <div className="flex items-center gap-2 pt-2 pb-1 border-b border-slate-200">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                      {section.title}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {section.subtitle}
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  {section.questions.map((question) => (
                    <ContentCard
                      key={question.id}
                      question={question}
                      chapterTitle={section.title}
                      isReciteMode={isReciteMode}
                      isStarred={starredIds.has(question.id)}
                      isRemembered={rememberedIds.has(question.id)}
                      onToggleStar={handleToggleStar}
                      onToggleRemembered={handleToggleRemembered}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* Elegant Empty State */
            <div className="h-80 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto mt-12">
              <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">未找到相关内容</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {activeChapterId === 'starred'
                  ? '您还没有收藏任何题目。点击题目卡片右上角的星星图标即可将难点或错题添加到此处。'
                  : '当前筛选或搜索条件下未匹配到内容，请重试或清空搜索词。'}
              </p>
              {(searchQuery || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  清除所有筛选条件
                </button>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}

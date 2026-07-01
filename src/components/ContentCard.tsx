/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Star, CheckCircle, Eye, EyeOff, BookOpen, HelpCircle, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { Question } from '../types';
import { RichText } from './RichText';

interface ContentCardProps {
  question: Question;
  chapterTitle: string;
  isReciteMode: boolean;
  isStarred: boolean;
  isRemembered: boolean;
  onToggleStar: (id: string) => void;
  onToggleRemembered: (id: string) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  question,
  chapterTitle,
  isReciteMode,
  isStarred,
  isRemembered,
  onToggleStar,
  onToggleRemembered,
}) => {
  // Track which masked words are clicked to be revealed
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());

  // Synchronously calculate mask counts for each line of answer
  const maskCounts = useMemo(() => {
    return question.answers.map(ans => {
      const matches = ans.match(/\{\{[^}]+\}\}/g);
      return matches ? matches.length : 0;
    });
  }, [question.answers]);

  // Total masks is the sum of maskCounts
  const totalMasks = useMemo(() => {
    return maskCounts.reduce((sum, count) => sum + count, 0);
  }, [maskCounts]);

  // Calculate start index for each line
  const lineStartIndices = useMemo(() => {
    const indices: number[] = [];
    let offset = 0;
    maskCounts.forEach((count) => {
      indices.push(offset);
      offset += count;
    });
    return indices;
  }, [maskCounts]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load and unload local voice recording when mounting or switching questions
  useEffect(() => {
    const savedAudio = localStorage.getItem(`audio_record_${question.id}`);
    if (savedAudio) {
      setAudioUrl(savedAudio);
    } else {
      setAudioUrl(null);
    }
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsRecording(false);
      setIsPlaying(false);
    };
  }, [question.id]);

  const startRecording = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64 to save to localStorage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          try {
            localStorage.setItem(`audio_record_${question.id}`, base64data);
            setAudioUrl(base64data);
          } catch (e) {
            console.error('Failed to save audio to localStorage', e);
            const objectUrl = URL.createObjectURL(audioBlob);
            setAudioUrl(objectUrl);
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('无法开启麦克风，请检查麦克风权限。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
    }

    audioRef.current.onended = () => {
      setIsPlaying(false);
    };

    audioRef.current.onerror = () => {
      setIsPlaying(false);
      alert('播放音频失败，请重新录制。');
    };

    setIsPlaying(true);
    audioRef.current.play().catch(err => {
      console.error('Playback error:', err);
      setIsPlaying(false);
    });
  };

  const deleteAudio = () => {
    if (confirm('确定要删除这条录音吗？')) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      localStorage.removeItem(`audio_record_${question.id}`);
      setAudioUrl(null);
      setIsPlaying(false);
    }
  };

  // Reset revealed state when Recite Mode is toggled off or question changes
  useEffect(() => {
    setRevealedIndices(new Set());
  }, [isReciteMode, question.id]);

  const handleWordClick = (index: number) => {
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleRevealAll = () => {
    const allIndices = Array.from({ length: totalMasks }, (_, i) => i);
    setRevealedIndices(new Set(allIndices));
  };

  const handleHideAll = () => {
    setRevealedIndices(new Set());
  };

  // Render Category Badge
  const getCategoryBadge = () => {
    const isKey = question.isKey;
    if (isKey) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400">
          I类 重点
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-600/10">
          II类 理解
        </span>
      );
    }
  };

  return (
    <div
      id={`card-${question.id}`}
      className={`relative rounded-2xl glass-card p-5 md:p-6 ${
        isRemembered
          ? 'border-emerald-500/20 bg-emerald-50/10 opacity-80'
          : question.isKey
          ? 'border-rose-300/60 border-l-[5px] border-l-rose-500'
          : 'border-slate-300/40 border-l-[5px] border-l-slate-400'
      }`}
    >
      {/* Card Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          {getCategoryBadge()}
          <span className="text-xs text-slate-400 font-medium">
            {chapterTitle} · {question.pages}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Custom Voice Recorder & Playback Cluster */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-2 px-3.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 animate-pulse flex items-center gap-1.5 transition-all active:scale-95"
              title="点击停止录音并保存"
            >
              <Square className="h-3.5 w-3.5 text-rose-600 fill-rose-600/10" />
              <span className="text-xs font-bold text-rose-600">正在录音...</span>
            </button>
          ) : !audioUrl ? (
            <button
              onClick={startRecording}
              className="p-2 px-3 rounded-xl bg-white/40 border border-white/30 text-slate-500 hover:text-rose-600 hover:bg-rose-500/5 hover:border-rose-500/20 flex items-center gap-1.5 transition-all active:scale-95"
              title="开始录制自己背诵/朗读的录音"
            >
              <Mic className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-600">录音自测</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-white/40 border border-white/30 rounded-xl p-0.5 shadow-sm">
              {/* Play/Pause Button */}
              <button
                onClick={playAudio}
                className={`p-1.5 px-2.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${
                  isPlaying
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'hover:bg-white/60 text-emerald-600'
                }`}
                title={isPlaying ? '暂停播放' : '播放我的录音自测'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-emerald-600/10" />
                    <span className="text-xs font-bold">播放中</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-emerald-600/10" />
                    <span className="text-xs font-bold">听录音</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="h-4 w-[1px] bg-slate-300/40 mx-0.5" />

              {/* Re-record Button */}
              <button
                onClick={startRecording}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500 hover:text-rose-600 transition-all active:scale-95"
                title="重新录音自测"
              >
                <Mic className="h-3.5 w-3.5" />
              </button>

              {/* Delete Button */}
              <button
                onClick={deleteAudio}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all active:scale-95"
                title="删除录音"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Star Button */}
          <button
            onClick={() => onToggleStar(question.id)}
            className={`p-2 rounded-xl transition-all active:scale-95 border ${
              isStarred 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-sm' 
                : 'bg-white/40 border-white/30 text-slate-400 hover:text-slate-600 hover:bg-white/80 hover:border-white/60'
            }`}
            title={isStarred ? '取消收藏' : '添加收藏'}
          >
            <Star className="h-4 w-4" fill={isStarred ? 'currentColor' : 'none'} />
          </button>

          {/* Mastered / Remembered Toggle */}
          <button
            onClick={() => onToggleRemembered(question.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
              isRemembered
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm'
                : 'bg-white/40 border-white/30 text-slate-500 hover:text-slate-700 hover:bg-white/80 hover:border-white/60'
            }`}
            title={isRemembered ? '设为未掌握' : '设为已掌握'}
          >
            <CheckCircle className={`h-3.5 w-3.5 ${isRemembered ? 'fill-emerald-600/20' : ''}`} />
            <span>{isRemembered ? '已掌握' : '标记掌握'}</span>
          </button>
        </div>
      </div>

      {/* Question Title */}
      <div className="flex items-start gap-2.5 mb-4">
        <HelpCircle className={`h-5 w-5 mt-0.5 shrink-0 ${question.isKey ? 'text-rose-500' : 'text-slate-400'}`} />
        <h3 className="text-base md:text-lg font-bold text-slate-800 leading-snug">
          {question.number}. {question.title}
        </h3>
      </div>

      {/* Answers / Solutions */}
      <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100/60">
        {question.answers.map((answer, lineIdx) => {
          const lineStartIndex = lineStartIndices[lineIdx] ?? 0;
          
          return (
            <div key={`ans-line-${lineIdx}`} className="text-sm md:text-base text-slate-700 flex items-start gap-1">
              <RichText
                text={answer}
                isReciteMode={isReciteMode}
                revealedIndices={revealedIndices}
                onWordClick={handleWordClick}
                startIndex={lineStartIndex}
              />
            </div>
          );
        })}
      </div>

      {/* Recite Mode Tooling on Card Footer */}
      {isReciteMode && totalMasks > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            <span>
              背诵进度：已默写{' '}
              <strong className="text-amber-600 font-bold">{revealedIndices.size}</strong> /{' '}
              {totalMasks} 个核心词
            </span>
          </div>

          <div className="flex items-center gap-2">
            {revealedIndices.size < totalMasks ? (
              <button
                onClick={handleRevealAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                全部揭示
              </button>
            ) : (
              <button
                onClick={handleHideAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
              >
                <EyeOff className="h-3.5 w-3.5" />
                全部遮盖
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

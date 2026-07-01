/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string; // Unique ID, e.g. "q1", "q2"
  number: string; // Display number, e.g. "1", "20", "26"
  title: string; // The question text, e.g. "什么是马克思主义基本原理？"
  pages: string; // Page range, e.g. "p.3-4"
  category: '重点' | '理解' | '新增' | '常考'; // Categorization
  isKey: boolean; // Whether it is Category I Focus (I类 重点)
  answers: string[]; // List of structured points, supports tags like {{word}}, [r]red[/r], [b]blue[/b], [strong]strong[/strong]
  notes?: string; // Additional context (e.g. "姐姐说/胆姐说" tips)
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  questions: Question[];
}

export interface UserStats {
  starredQuestions: string[]; // List of question IDs that the user starred
  rememberedQuestions: string[]; // List of question IDs marked as "easy/remembered"
}

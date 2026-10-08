
export type EmotionBundleName = 'Love' | 'Joy' | 'Surprise' | 'Anger' | 'Sadness' | 'Fear';

export interface Emotion {
  name: string;
  bundleName: EmotionBundleName;
}

export interface EmotionEntry {
  id: string;
  timestamp: number;
  selectedEmotions: Emotion[];
  cause: string;
  regulation: string | null;
  isSample?: boolean;
}

export interface EmotionBundle {
  name: EmotionBundleName;
  color: string;
  textColor: string;
  emotions: string[];
}

export interface MoodTrigger {
  id: string;
  type: 'positive' | 'negative';
  title: string;
  category: string;
  description: string;
  associatedEmotions: EmotionBundleName[];
  occurrences: number;
  sampleQuotes: string[];
  impactLevel: 'high' | 'medium' | 'low';
}

export interface MoodRemedy {
  id: string;
  title: string;
  moodCategory: EmotionBundleName;
  targetEmotions: string[];
  description: string;
  sourceType: 'user_proven' | 'ai_recommended';
  evidenceExcerpt?: string;
  actionSteps: string[];
  estimatedMinutes?: number;
  effectivenessNotes: string;
}

export interface AIEmotionalReport {
  summary: string;
  primaryPositiveTriggers: MoodTrigger[];
  primaryNegativeTriggers: MoodTrigger[];
  remediesByCategory: {
    category: EmotionBundleName;
    remedies: MoodRemedy[];
  }[];
  stabilizationHighlights: {
    title: string;
    description: string;
    moodCategory: EmotionBundleName;
    userMention: string;
  }[];
  aiRecommendations: string[];
  analyzedEntriesCount: number;
  lastAnalyzed: number;
}

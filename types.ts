
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
}

export interface EmotionBundle {
  name: EmotionBundleName;
  color: string;
  textColor: string;
  emotions: string[];
}
import { EmotionEntry } from './types';

export const SAMPLE_ENTRY_IDS = new Set([
  'sample-entry-1',
  'sample-entry-1b',
  'sample-entry-2',
  'sample-entry-3',
  'sample-entry-4',
  'sample-entry-5',
]);

export const isSampleEntry = (entry: { id: string; isSample?: boolean }): boolean => {
  return Boolean(entry.isSample || entry.id.startsWith('sample-') || SAMPLE_ENTRY_IDS.has(entry.id));
};

export const SAMPLE_ENTRIES: EmotionEntry[] = [
  {
    id: 'sample-entry-1',
    isSample: true,
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    selectedEmotions: [
      { name: 'Frustration', bundleName: 'Anger' },
      { name: 'Annoyance', bundleName: 'Anger' },
    ],
    cause: 'Unexpected deadline moved forward at work, felt unheard during a project sync.',
    regulation: 'Taking a 15-minute walk in the park helped me cool down, breathe fresh air, and stop ruminating.',
  },
  {
    id: 'sample-entry-1b',
    isSample: true,
    timestamp: Date.now() - 2.5 * 24 * 60 * 60 * 1000,
    selectedEmotions: [
      { name: 'Irritation', bundleName: 'Anger' },
    ],
    cause: 'Aggressive email from a vendor making unreasonable demands.',
    regulation: 'Stepped away from the screen, drank a tall glass of ice water slowly, and splashed cold water on face and wrists before responding calmly.',
  },
  {
    id: 'sample-entry-2',
    isSample: true,
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    selectedEmotions: [
      { name: 'Anxiety', bundleName: 'Fear' },
      { name: 'Unease', bundleName: 'Fear' },
    ],
    cause: 'Felt overwhelmed before a public presentation and feared stumbling over words.',
    regulation: 'Stepped away into a quiet hallway, did 4-7-8 deep belly breathing, and drank cold water to ground my nervous system.',
  },
  {
    id: 'sample-entry-3',
    isSample: true,
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    selectedEmotions: [
      { name: 'Contentment', bundleName: 'Joy' },
      { name: 'Relief', bundleName: 'Joy' },
    ],
    cause: 'Finished the tough project on time and had a slow morning coffee while reading.',
    regulation: 'Took a moment to savor the quiet achievement and texted my partner to share the relief.',
  },
  {
    id: 'sample-entry-4',
    isSample: true,
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    selectedEmotions: [
      { name: 'Melancholy', bundleName: 'Sadness' },
      { name: 'Regret', bundleName: 'Sadness' },
    ],
    cause: 'Felt isolated after long hours indoors working alone without social connection.',
    regulation: 'Called my best friend for a 10-minute catch-up and stepped onto the balcony for warm evening sunlight.',
  },
  {
    id: 'sample-entry-5',
    isSample: true,
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    selectedEmotions: [
      { name: 'Affection', bundleName: 'Love' },
      { name: 'Tenderness', bundleName: 'Love' },
    ],
    cause: 'Cooked a warm homemade dinner together with family and shared funny stories.',
    regulation: 'Expressed appreciation out loud and put away mobile devices during the meal.',
  },
];

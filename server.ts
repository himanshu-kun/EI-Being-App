import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { EmotionEntry, AIEmotionalReport, MoodTrigger, MoodRemedy, EmotionBundleName } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Fallback rule-based analysis if API key is not configured or in case of transient LLM error
function generateFallbackAnalysis(entries: EmotionEntry[]): AIEmotionalReport {
  const positiveBundles: EmotionBundleName[] = ['Joy', 'Love'];
  const negativeBundles: EmotionBundleName[] = ['Anger', 'Fear', 'Sadness'];

  const positiveCauses: { text: string; emotions: EmotionBundleName[]; date: string }[] = [];
  const negativeCauses: { text: string; emotions: EmotionBundleName[]; date: string }[] = [];
  const recordedRegulations: { text: string; bundles: EmotionBundleName[]; date: string }[] = [];

  entries.forEach((entry) => {
    const bundles = Array.from(new Set(entry.selectedEmotions.map((e) => e.bundleName)));
    const dateStr = new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const hasPos = bundles.some((b) => positiveBundles.includes(b));
    const hasNeg = bundles.some((b) => negativeBundles.includes(b));

    if (hasPos && entry.cause) {
      positiveCauses.push({ text: entry.cause, emotions: bundles.filter((b) => positiveBundles.includes(b)), date: dateStr });
    }
    if (hasNeg && entry.cause) {
      negativeCauses.push({ text: entry.cause, emotions: bundles.filter((b) => negativeBundles.includes(b)), date: dateStr });
    }
    if (entry.regulation && entry.regulation.trim().length > 0) {
      recordedRegulations.push({ text: entry.regulation, bundles, date: dateStr });
    }
  });

  const primaryPositiveTriggers: MoodTrigger[] = positiveCauses.slice(0, 4).map((c, idx) => ({
    id: `pos-${idx}`,
    type: 'positive',
    title: c.text.length > 40 ? c.text.slice(0, 37) + '...' : c.text,
    category: 'Activities & Social',
    description: `Engaging in this activity consistently elevated feelings of ${c.emotions.join(', ')}.`,
    associatedEmotions: c.emotions,
    occurrences: 1,
    sampleQuotes: [c.text],
    impactLevel: 'high',
  }));

  const primaryNegativeTriggers: MoodTrigger[] = negativeCauses.slice(0, 4).map((c, idx) => ({
    id: `neg-${idx}`,
    type: 'negative',
    title: c.text.length > 40 ? c.text.slice(0, 37) + '...' : c.text,
    category: 'Stressors & Friction',
    description: `Identified as a stressor triggering ${c.emotions.join(', ')}.`,
    associatedEmotions: c.emotions,
    occurrences: 1,
    sampleQuotes: [c.text],
    impactLevel: 'high',
  }));

  // Build remedies from user logs
  const remediesByCategory: AIEmotionalReport['remediesByCategory'] = [
    { category: 'Anger', remedies: [] },
    { category: 'Fear', remedies: [] },
    { category: 'Sadness', remedies: [] },
    { category: 'Surprise', remedies: [] },
    { category: 'Joy', remedies: [] },
    { category: 'Love', remedies: [] },
  ];

  recordedRegulations.forEach((reg, idx) => {
    const targetCategory = reg.bundles[0] || 'Anger';
    const catGroup = remediesByCategory.find((c) => c.category === targetCategory);
    if (catGroup) {
      catGroup.remedies.push({
        id: `proven-${idx}`,
        title: reg.text.length > 45 ? reg.text.slice(0, 42) + '...' : reg.text,
        moodCategory: targetCategory,
        targetEmotions: reg.bundles,
        description: `Strategy you recorded during reflection: "${reg.text}".`,
        sourceType: 'user_proven',
        evidenceExcerpt: `Recorded on ${reg.date}: "${reg.text}"`,
        actionSteps: [
          'Pause and acknowledge the rising intensity.',
          `Practice your self-stated strategy: "${reg.text}".`,
          'Check back in with yourself after 10-15 minutes.',
        ],
        estimatedMinutes: 10,
        effectivenessNotes: 'Proven effective in your personal journal reflections.',
      });
    }
  });

  // Ensure default complementary remedies if none logged yet
  const defaultTactics: Record<EmotionBundleName, { title: string; steps: string[]; desc: string }> = {
    Anger: {
      title: 'Cooling Walk & Grounding Pause',
      steps: ['Step outside or change rooms immediately', 'Walk at an easy pace for 10 minutes', 'Focus on 5 physical textures around you'],
      desc: 'Physical displacement discharges fight-or-flight tension and helps lower cortisol.',
    },
    Fear: {
      title: '4-7-8 Breathing & Grounding Anchor',
      steps: ['Inhale quietly through the nose for 4 seconds', 'Hold gently for 7 seconds', 'Exhale completely with a whoosh for 8 seconds', 'Repeat 4 cycles'],
      desc: 'Vagal nerve stimulation interrupts spiral thoughts and anchors the parasympathetic system.',
    },
    Sadness: {
      title: 'Compassionate Reset & Gentle Sunlight',
      steps: ['Wrap up in warmth or step into sunlight', 'Sip warm tea or water slowly', 'Allow the sadness without self-judgment for 5 minutes'],
      desc: 'Warmth and sensory comfort signal safety and validation to the nervous system.',
    },
    Surprise: {
      title: 'Orientation Pause',
      steps: ['Plant both feet firmly on the floor', 'Take 3 steady breaths to absorb unexpected news', 'Write down one immediate next priority'],
      desc: 'Reduces cognitive discombobulation and restores executive focus.',
    },
    Joy: {
      title: 'Savoring & Gratitude Amplification',
      steps: ['Take 60 seconds to vividly name 3 details of this moment', 'Share or text appreciation to someone involved', 'Journal the feeling'],
      desc: 'Neuroplastic savoring deepens positive memory encoding.',
    },
    Love: {
      title: 'Connection Reflection',
      steps: ['Send a brief heartfelt note or warm smile', 'Notice where warmth rests in your chest', 'Express honest gratitude'],
      desc: 'Strengthens relational bonds and oxytocin response.',
    },
  };

  remediesByCategory.forEach((cat) => {
    if (cat.remedies.length === 0) {
      const def = defaultTactics[cat.category];
      cat.remedies.push({
        id: `ai-${cat.category.toLowerCase()}`,
        title: def.title,
        moodCategory: cat.category,
        targetEmotions: [cat.category],
        description: def.desc,
        sourceType: 'ai_recommended',
        actionSteps: def.steps,
        estimatedMinutes: 10,
        effectivenessNotes: 'Evidence-based cognitive and somatic regulation technique.',
      });
    }
  });

  return {
    summary: `Analyzed ${entries.length} reflections. You show high emotional sensitivity with clear opportunities to lean on your proven coping patterns.`,
    primaryPositiveTriggers,
    primaryNegativeTriggers,
    remediesByCategory,
    stabilizationHighlights: recordedRegulations.slice(0, 3).map((r) => ({
      title: r.text.slice(0, 35),
      description: `Personal regulation noted: "${r.text}"`,
      moodCategory: r.bundles[0] || 'Anger',
      userMention: r.text,
    })),
    aiRecommendations: [
      'Bookmark your proven calming strategies (like walks and pauses) so you can access them before emotions peak.',
      'Notice the earliest physical cues of frustration or worry to intervene earlier in the cycle.',
      'Continue logging both the triggers and what helped you recover to refine your personal stabilization playbook.',
    ],
    analyzedEntriesCount: entries.length,
    lastAnalyzed: Date.now(),
  };
}

// POST /api/analyze-emotions
app.post('/api/analyze-emotions', async (req: Request, res: Response) => {
  try {
    const { entries } = req.body as { entries: EmotionEntry[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one emotion entry to analyze.' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Using rule-based emotional analysis fallback.');
      return res.json(generateFallbackAnalysis(entries));
    }

    // Format the entries for the prompt with rich context
    const formattedEntries = entries.map((e, index) => {
      const date = new Date(e.timestamp).toISOString();
      const emotions = e.selectedEmotions.map((em) => `${em.name} (${em.bundleName})`).join(', ');
      return `[Entry #${index + 1}]
Date: ${date}
Selected Emotions: ${emotions || 'None specified'}
Reported Situation / Cause: "${e.cause || 'No cause logged'}"
User's Regulation / What helped or intended response: "${e.regulation || 'None recorded'}"`;
    }).join('\n\n');

    const prompt = `You are an expert Emotional Intelligence & Mental Well-being Analyst.
Analyze the user's logged emotional entries below to discover:
1. Positive Triggers: specific environments, interactions, habits, activities, or achievements that spark positive emotions (Joy, Love, optimism, peace).
2. Negative Triggers: specific stressors, interpersonal frictions, work pressures, physical states, or cognitive patterns that cause challenging emotions (Anger, Fear, Sadness, overwhelm, anxiety).
3. PERSONALIZED REMEDIES & STABILIZING STRATEGIES:
   - Pay CRITICAL attention to what the user noted in their "regulation" or "cause" notes that helped them cool down, ground themselves, or regain balance (for example: if they mentioned "walking in the park helped me", "taking a deep breath", "talking to mom", "putting my phone away", or stepping away).
   - If the user mentioned a strategy that helped them stabilize from a mood, mark it with sourceType: "user_proven", quote their exact words in evidenceExcerpt, assign it to the matching mood category (Anger, Fear, Sadness, Surprise, Joy, Love), and break it down into actionable steps.
   - For mood categories where the user hasn't yet logged an explicit remedy, provide a tailored, highly practical, somatic/cognitive remedy (sourceType: "ai_recommended") aligned with their specific trigger patterns.
   - Summarize key stabilization highlights and empathetic emotional insights.

Entries to analyze:
${formattedEntries}

Provide the analysis as a strict JSON object following this exact schema:
{
  "summary": "Warm, empathetic 2-3 sentence overview of their emotional patterns and coping strengths",
  "primaryPositiveTriggers": [
    {
      "id": "string",
      "type": "positive",
      "title": "Short title, e.g. Nature Walks & Outdoor Movement",
      "category": "e.g. Physical Wellness, Social Connection, Creative Work",
      "description": "Insightful explanation of why and how this sparks positive mood",
      "associatedEmotions": ["Joy", "Love"],
      "occurrences": 1,
      "sampleQuotes": ["excerpt quote from user"],
      "impactLevel": "high"
    }
  ],
  "primaryNegativeTriggers": [
    {
      "id": "string",
      "type": "negative",
      "title": "Short title, e.g. Sudden Work Deadlines or Conflict",
      "category": "e.g. Work Stress, Relationship Friction, Fatigue",
      "description": "Insightful explanation of what triggers this distress",
      "associatedEmotions": ["Anger", "Fear", "Sadness"],
      "occurrences": 1,
      "sampleQuotes": ["excerpt quote from user"],
      "impactLevel": "high"
    }
  ],
  "remediesByCategory": [
    {
      "category": "Anger",
      "remedies": [
        {
          "id": "string",
          "title": "Clear actionable title, e.g. Walking in the Park & Fresh Air Break",
          "moodCategory": "Anger",
          "targetEmotions": ["Frustration", "Annoyance"],
          "description": "Why and how this helps de-escalate this specific mood",
          "sourceType": "user_proven",
          "evidenceExcerpt": "In your entry on Oct 5 you wrote: 'walking in park helped cool down'",
          "actionSteps": ["Step 1", "Step 2", "Step 3"],
          "estimatedMinutes": 15,
          "effectivenessNotes": "Why this specifically succeeds for this user"
        }
      ]
    },
    {
      "category": "Fear",
      "remedies": []
    },
    {
      "category": "Sadness",
      "remedies": []
    },
    {
      "category": "Surprise",
      "remedies": []
    },
    {
      "category": "Joy",
      "remedies": []
    },
    {
      "category": "Love",
      "remedies": []
    }
  ],
  "stabilizationHighlights": [
    {
      "title": "e.g. Walking in nature restores calm",
      "description": "Brief highlight of a user-tested remedy",
      "moodCategory": "Anger",
      "userMention": "Exact phrase user used"
    }
  ],
  "aiRecommendations": [
    "Practical recommendation 1",
    "Practical recommendation 2",
    "Practical recommendation 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Empty response received from Gemini API');
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (parseError) {
      console.warn('Failed to parse raw Gemini JSON. Extracting substring...', parseError);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON response from Gemini');
      }
    }

    const report: AIEmotionalReport = {
      summary: parsedResult.summary || 'Analysis completed successfully.',
      primaryPositiveTriggers: parsedResult.primaryPositiveTriggers || [],
      primaryNegativeTriggers: parsedResult.primaryNegativeTriggers || [],
      remediesByCategory: parsedResult.remediesByCategory || [],
      stabilizationHighlights: parsedResult.stabilizationHighlights || [],
      aiRecommendations: parsedResult.aiRecommendations || [],
      analyzedEntriesCount: entries.length,
      lastAnalyzed: Date.now(),
    };

    return res.json(report);
  } catch (error: any) {
    console.error('Error during emotion analysis:', error);
    // Graceful fallback to rule-based analysis so user is never stranded
    const { entries } = req.body as { entries: EmotionEntry[] };
    if (entries && Array.isArray(entries) && entries.length > 0) {
      return res.json(generateFallbackAnalysis(entries));
    }
    return res.status(500).json({ error: error?.message || 'Failed to analyze emotions' });
  }
});

// Helper for generating immediate grounding & customer-friendly explanation for a mood
function generateFallbackRemedySuggestion(
  bundle: EmotionBundleName,
  relevantPastRemedies: string[]
) {
  const hasProven = relevantPastRemedies.length > 0;
  const defaults: Record<string, { title: string; steps: string[]; desc: string; minutes: number }> = {
    Anger: {
      title: 'Cooling Park Walk & Physical Reset',
      desc: 'Physical movement de-escalates adrenaline and gives your nervous system space away from the friction point.',
      steps: [
        'Step away from immediate screens, people, or work demands for at least 5 minutes.',
        'Drink a glass of cold water slowly and splash cool water on your face or wrists.',
        'Take a 10-15 minute walk outside (or in a quiet hallway), focusing on your footsteps and breathing steadily.',
      ],
      minutes: 10,
    },
    Fear: {
      title: '4-7-8 Breathing & 5-4-3-2-1 Sensory Grounding',
      desc: 'Stimulates the parasympathetic vagal nerve response to stop racing thoughts and physiological panic.',
      steps: [
        'Place one hand on your belly and un-clench your jaw and shoulders.',
        'Inhale through the nose for 4 seconds, hold gently for 7 seconds, and exhale completely with a whoosh for 8 seconds (repeat 3 cycles).',
        'Look around and name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 positive thought.',
      ],
      minutes: 5,
    },
    Sadness: {
      title: 'Compassionate Warmth & Connection Check-in',
      desc: 'Gentle sensory comfort signals emotional safety to the body, easing heavy feelings of isolation or dejection.',
      steps: [
        'Wrap yourself in a warm blanket, step into sunlight, or hold a warm mug of tea.',
        'Place a hand over your chest and silently say: "This hurts right now, but I am safe and it is okay to feel this."',
        'Send a quick note to a supportive friend, or put on soft ambient music for 10 minutes without pressure to be productive.',
      ],
      minutes: 10,
    },
  };

  const defaultTactic = defaults[bundle] || defaults.Anger;

  return {
    title: hasProven ? `Personal Proven Remedy for ${bundle}` : defaultTactic.title,
    sourceType: hasProven ? 'user_proven' : 'ai_recommended',
    hasProvenRemedy: hasProven,
    pastMentionExcerpt: hasProven ? relevantPastRemedies[0] : null,
    suggestion: hasProven
      ? `In your past reflections, you logged that: "${relevantPastRemedies[0]}". Taking a moment right now to repeat that action has previously helped you regain your balance.`
      : defaultTactic.desc,
    actionSteps: hasProven
      ? [
          'Pause your current tasks for a few minutes.',
          `Follow your tested strategy: "${relevantPastRemedies[0]}"`,
          'Check back in with your body after 10-15 minutes.',
        ]
      : defaultTactic.steps,
    estimatedMinutes: defaultTactic.minutes,
    userGuidance: hasProven
      ? 'This strategy comes directly from what worked in your past reflections.'
      : `You haven't logged a personal remedy for ${bundle} in your reflections yet. To teach the AI your personal remedy, log a reflection and note what helped you (e.g. "walking in the park helped me cool down").`,
  };
}

// POST /api/suggest-remedy
// Instant personalized rescue suggestion for a current feeling or situation
app.post('/api/suggest-remedy', async (req: Request, res: Response) => {
  const { currentEmotions = [], cause = '', pastEntries = [] } = req.body as {
    currentEmotions: { name: string; bundleName: EmotionBundleName }[];
    cause?: string;
    pastEntries?: EmotionEntry[];
  };

  const primaryBundle: EmotionBundleName = (currentEmotions[0]?.bundleName as EmotionBundleName) || 'Anger';

  // Check if past entries had any relevant regulation
  const relevantPastRemedies: string[] = [];
  if (pastEntries && Array.isArray(pastEntries)) {
    const targetBundles = currentEmotions.map((e) => e.bundleName);
    pastEntries.forEach((entry) => {
      if (entry.regulation && entry.regulation.trim().length > 0) {
        const match = entry.selectedEmotions.some((e) => targetBundles.includes(e.bundleName));
        if (match) {
          relevantPastRemedies.push(entry.regulation.trim());
        }
      }
    });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.json(generateFallbackRemedySuggestion(primaryBundle, relevantPastRemedies));
  }

  try {
    const prompt = `You are a compassionate in-the-moment emotional regulation assistant.
The user is currently experiencing:
Emotions: ${currentEmotions.map((e) => `${e.name} (${e.bundleName})`).join(', ') || primaryBundle}
Context / Situation: "${cause || 'Distressing feelings'}"

User's Past Recorded Coping History:
${relevantPastRemedies.length > 0 ? relevantPastRemedies.map(r => `User previously logged: "${r}"`).join('\n') : 'No past logged remedies for this specific emotion yet.'}

Provide a supportive, immediate stabilization plan.
If the user previously logged a remedy that helped them (like walking in the park, deep breathing, music, talking to a friend), PRIORITIZE AND CITE THAT PROVEN REMEDY with sourceType "user_proven".
If no past remedy was logged, provide a grounded, practical 3-step coping action with sourceType "ai_recommended".

Provide response as strict JSON:
{
  "title": "Clear action-focused title",
  "sourceType": "user_proven",
  "hasProvenRemedy": true,
  "pastMentionExcerpt": "Exact quote from past remedy if found, otherwise null",
  "suggestion": "Warm, encouraging 2-sentence grounding guidance",
  "actionSteps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"],
  "estimatedMinutes": 5,
  "userGuidance": "Brief explanation for the user on whether this is from their past reflection or a recommended technique"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const rawText = response.text;
    let parsed: any = null;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed || !parsed.title) {
      throw new Error('Invalid JSON from Gemini');
    }

    // Ensure hasProvenRemedy reflects reality
    parsed.hasProvenRemedy = relevantPastRemedies.length > 0;
    if (relevantPastRemedies.length > 0 && !parsed.pastMentionExcerpt) {
      parsed.pastMentionExcerpt = relevantPastRemedies[0];
      parsed.sourceType = 'user_proven';
    }

    return res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini call in suggest-remedy encountered an issue, serving robust stabilization plan:', error?.message);
    return res.json(generateFallbackRemedySuggestion(primaryBundle, relevantPastRemedies));
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

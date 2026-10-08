import React, { useState, useMemo } from 'react';
import { EmotionEntry, EmotionBundleName } from '../types';
import { EMOTION_BUNDLES } from '../constants';

type TimePeriod = '24h' | '7d' | '30d' | 'all';

const VALENCE_SCORES: Record<EmotionBundleName, number> = {
    Joy: 1.0,
    Love: 0.8,
    Surprise: 0.2,
    Fear: -0.6,
    Sadness: -0.8,
    Anger: -1.0,
};

// --- Helper Functions for Volatility ---

const getStartOfDay = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
};

const getStartOfHour = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setMinutes(0, 0, 0);
    return date.getTime();
};


const calculateStandardDeviation = (arr: number[]): number => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

// --- Main Insights Component ---

interface InsightsPageProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onViewAiAnalysis?: () => void;
}

const InsightsPage: React.FC<InsightsPageProps> = ({ entries, onBack, onViewAiAnalysis }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');

  const { filteredEntries, periodDuration } = useMemo(() => {
    const now = Date.now();
    if (timePeriod === 'all') {
        const oldestEntry = entries.reduce((oldest, entry) => (entry.timestamp < oldest ? entry.timestamp : oldest), now);
        return { filteredEntries: entries, periodDuration: now - oldestEntry };
    }

    let duration;
    switch (timePeriod) {
        case '24h': duration = 24 * 60 * 60 * 1000; break;
        case '7d': duration = 7 * 24 * 60 * 60 * 1000; break;
        case '30d': duration = 30 * 24 * 60 * 60 * 1000; break;
        default: duration = 0;
    }
    const cutoff = now - duration;
    const filtered = entries.filter(entry => entry.timestamp >= cutoff);
    return { filteredEntries: filtered, periodDuration: duration };
  }, [entries, timePeriod]);
  
  const frequencyData = useMemo(() => {
    if (filteredEntries.length === 0) return [];

    const emotionCounts = EMOTION_BUNDLES.reduce((acc, bundle) => {
      acc[bundle.name] = 0;
      return acc;
    }, {} as Record<EmotionBundleName, number>);

    filteredEntries.forEach(entry => {
      const bundlesInEntry = new Set(entry.selectedEmotions.map(e => e.bundleName));
      bundlesInEntry.forEach(bundleName => {
        if (bundleName in emotionCounts) {
          emotionCounts[bundleName]++;
        }
      });
    });

    return EMOTION_BUNDLES.map(bundle => ({
      name: bundle.name,
      value: emotionCounts[bundle.name],
      color: bundle.color,
      textColor: bundle.textColor,
    })).filter(item => item.value > 0);
  }, [filteredEntries]);
  
  const totalCount = useMemo(() => frequencyData.reduce((sum, item) => sum + item.value, 0), [frequencyData]);

  const volatilityData = useMemo(() => {
    if (filteredEntries.length < 1 || timePeriod === 'all') {
        return null;
    }
    
    const scoresMap = new Map<number, number[]>();
    const getAggregationUnit = timePeriod === '24h' ? getStartOfHour : getStartOfDay;
    
    filteredEntries.forEach(entry => {
        const timeKey = getAggregationUnit(entry.timestamp);
        const entryValence = entry.selectedEmotions.reduce((sum, emotion) => sum + VALENCE_SCORES[emotion.bundleName], 0) / entry.selectedEmotions.length;
        if (!scoresMap.has(timeKey)) {
            scoresMap.set(timeKey, []);
        }
        scoresMap.get(timeKey)!.push(entryValence);
    });
    
    const moodScores = Array.from(scoresMap.values()).map(valences => {
        const avgValence = valences.reduce((sum, v) => sum + v, 0) / valences.length;
        return ((avgValence + 1) / 2) * 9 + 1; // Normalize from [-1, 1] to [1, 10]
    });
    
    if (moodScores.length < 2) {
        return { currentVolatility: undefined, message: `Add entries in at least two different ${timePeriod === '24h' ? 'hours' : 'days'} for this period to calculate volatility.` };
    }

    const currentVolatility = calculateStandardDeviation(moodScores);

    // --- Historical calculation ---
    const now = Date.now();
    const currentPeriodStart = now - periodDuration;
    const historicalEntries = entries.filter(e => e.timestamp < currentPeriodStart);
    let avgHistoricalVolatility = null;
    let historicalTimeUnitCount = 0;
    const historicalTimeUnit = timePeriod === '24h' ? 'hour' : 'day';

    if (historicalEntries.length > 0) {
        const historicalScoresMap = new Map<number, number[]>();
        const getStartOfHistoricalTimeUnit = timePeriod === '24h' ? getStartOfHour : getStartOfDay;

        historicalEntries.forEach(entry => {
            const timeKey = getStartOfHistoricalTimeUnit(entry.timestamp);
            const entryValence = entry.selectedEmotions.reduce((sum, emotion) => sum + VALENCE_SCORES[emotion.bundleName], 0) / entry.selectedEmotions.length;
            if(!historicalScoresMap.has(timeKey)) historicalScoresMap.set(timeKey, []);
            historicalScoresMap.get(timeKey)!.push(entryValence);
        });

        historicalTimeUnitCount = historicalScoresMap.size;

        if (historicalScoresMap.size > 1) {
            const historicalMoodScores = Array.from(historicalScoresMap.values()).map(valences => {
                const avgValence = valences.reduce((sum, v) => sum + v, 0) / valences.length;
                return ((avgValence + 1) / 2) * 9 + 1;
            });
            avgHistoricalVolatility = calculateStandardDeviation(historicalMoodScores);
        }
    }
    
    let comparison = null;
    if (avgHistoricalVolatility !== null) {
      let percentageChange;

      if (avgHistoricalVolatility > 0) {
        percentageChange = ((currentVolatility - avgHistoricalVolatility) / avgHistoricalVolatility) * 100;
      } else {
        // Historical volatility was 0 (perfectly stable).
        // If current is > 0, it's an infinite increase. We'll cap it for display.
        // If current is also 0, there is no change.
        percentageChange = currentVolatility > 0 ? 999 : 0;
      }

      comparison = {
        percentage: Math.round(percentageChange),
        isMoreVolatile: currentVolatility > avgHistoricalVolatility,
      };
    }
    
    return {
        currentVolatility,
        avgHistoricalVolatility,
        comparison,
        message: null,
        historicalTimeUnitCount,
        historicalTimeUnit
    }

  }, [filteredEntries, entries, timePeriod, periodDuration]);


  const ControlButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
  }> = ({ onClick, isActive, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );

  const renderCounters = () => {
    if (frequencyData.length === 0) {
        return (
          <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <p>No entries found for this period. Start logging to see your insights!</p>
          </div>
        );
    }
    
    return (
        <div className="w-full space-y-4 pt-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Emotion Frequency</h3>
            {frequencyData
                .sort((a, b) => b.value - a.value) // Sort descending
                .map((item, index) => {
                    const percentage = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
                    return (
                        <div key={item.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms`}}>
                            <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold text-lg ${item.textColor}`}>{item.name}</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.value} {item.value === 1 ? 'entry' : 'entries'}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                                    <div 
                                    className={`${item.color} h-3 rounded-full transition-all duration-1000`}
                                    style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
  };

  const renderVolatilityCard = () => {
      if (timePeriod === 'all' || filteredEntries.length === 0) return null;

      const renderCardContent = () => {
        if (volatilityData?.message) {
            return (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    {volatilityData.message}
                </p>
            );
        }

        if (!volatilityData || volatilityData.currentVolatility === undefined) return null;

        const { currentVolatility, comparison, avgHistoricalVolatility } = volatilityData;
        
        if (comparison) {
            const historicalVolatility = avgHistoricalVolatility ?? 0;
            const maxValue = Math.max(currentVolatility, historicalVolatility, 1);
            const chartMaxHeight = 120; // in pixels
            const currentBarHeight = (currentVolatility / maxValue) * chartMaxHeight;
            const historicalBarHeight = (historicalVolatility / maxValue) * chartMaxHeight;

            return (
                 <div>
                    <div className="text-center mb-4">
                        <p className={`text-2xl font-bold ${comparison.isMoreVolatile ? 'text-orange-500' : 'text-green-500'}`}>
                            {Math.abs(comparison.percentage)}% {comparison.isMoreVolatile ? 'more volatile' : 'less volatile'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            than your historical average.
                        </p>
                    </div>
                    
                    <div className="flex justify-around items-end h-[150px] gap-4 px-4 my-2">
                        <div className="flex flex-col items-center w-1/3 text-center">
                            <p className="font-bold text-indigo-600 dark:text-indigo-400">{currentVolatility.toFixed(2)}</p>
                            <div className="w-full flex-grow flex items-end justify-center">
                                <div 
                                    className="w-10 bg-indigo-500 rounded-t-md transition-all duration-500" 
                                    style={{ height: `${currentBarHeight}px` }}
                                    title={`Current Volatility: ${currentVolatility.toFixed(2)}`}
                                ></div>
                            </div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Current</p>
                        </div>
                        
                        <div className="flex flex-col items-center w-1/3 text-center">
                             <p className="font-bold text-gray-600 dark:text-gray-300">{historicalVolatility.toFixed(2)}</p>
                             <div className="w-full flex-grow flex items-end justify-center">
                                <div 
                                    className="w-10 bg-gray-400 dark:bg-gray-600 rounded-t-md transition-all duration-500" 
                                    style={{ height: `${historicalBarHeight}px` }}
                                    title={`Historical Volatility: ${historicalVolatility.toFixed(2)}`}
                                ></div>
                            </div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Historical</p>
                        </div>
                    </div>

                    <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        This period was emotionally {comparison.isMoreVolatile ? 'more varied' : 'more stable'} than usual.
                    </p>
                </div>
            );
        }

        return (
            <div className='text-center'>
                <div className="flex items-baseline justify-center gap-2">
                    <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{currentVolatility!.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Volatility</p>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {(() => {
                      const { historicalTimeUnitCount = 0, historicalTimeUnit = 'day' } = volatilityData;
                      const pluralUnit = historicalTimeUnit + 's';
                      if (historicalTimeUnitCount === 0) {
                          return `Log entries on at least 2 separate ${pluralUnit} before this period to see a comparison.`;
                      }
                      if (historicalTimeUnitCount === 1) {
                          return `You have entries on 1 past ${historicalTimeUnit}. Add an entry on 1 more separate ${historicalTimeUnit} before this period to compare.`;
                      }
                      return "Keep logging to unlock deeper insights!";
                  })()}
                </p>
            </div>
        );
      };
      
      return (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Mood Volatility</h3>
            <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                {renderCardContent()}
            </div>
        </div>
      );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Emotional Insights</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Frequency and volatility metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {onViewAiAnalysis && (
            <button
              onClick={onViewAiAnalysis}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-1.5 shadow-xs"
            >
              <span>✨ AI Triggers & Remedies</span>
            </button>
          )}
          <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm">
            Back
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
        <ControlButton onClick={() => setTimePeriod('24h')} isActive={timePeriod === '24h'}>Past 24h</ControlButton>
        <ControlButton onClick={() => setTimePeriod('7d')} isActive={timePeriod === '7d'}>Past 7 Days</ControlButton>
        <ControlButton onClick={() => setTimePeriod('30d')} isActive={timePeriod === '30d'}>Past Month</ControlButton>
        <ControlButton onClick={() => setTimePeriod('all')} isActive={timePeriod === 'all'}>All Time</ControlButton>
      </div>

      <div>
        {renderCounters()}
        {renderVolatilityCard()}
      </div>
    </div>
  );
};

export default InsightsPage;
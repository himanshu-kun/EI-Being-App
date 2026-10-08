import React, { useState, useEffect, useMemo } from 'react';
import HomePage from './components/HomePage';
import NewEntryFlow from './components/NewEntryFlow';
import InsightsPage from './components/InsightsPage';
import ViewEntryPage from './components/ViewEntryPage';
import AiAnalysisPage from './components/AiAnalysisPage';
import RecoveryModal, { EntrySnapshot, scanStorageForOrphanedEntries } from './components/RecoveryModal';
import { EmotionEntry } from './types';
import { SAMPLE_ENTRIES, isSampleEntry } from './sampleData';

type View = 'home' | 'entry-flow' | 'insights' | 'view-entry' | 'ai-analysis';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [userEntries, setUserEntries] = useState<EmotionEntry[]>([]);
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(true);
  const [editingEntry, setEditingEntry] = useState<EmotionEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<EmotionEntry | null>(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);

  // Helper to record a safety snapshot for undo / recovery
  const recordSnapshot = (entriesToRecord: EmotionEntry[], sampleIncluded: boolean, reason: string) => {
    try {
      const raw = localStorage.getItem('emotionEntries_snapshots');
      const existing: EntrySnapshot[] = raw ? JSON.parse(raw) : [];
      const newSnapshot: EntrySnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        reason,
        userEntriesCount: entriesToRecord.length,
        userEntries: entriesToRecord,
        sampleIncluded,
      };
      // Keep up to 30 snapshots, deduplicating very close timestamps
      const updated = [newSnapshot, ...existing.filter(s => Math.abs(s.timestamp - newSnapshot.timestamp) > 800)].slice(0, 30);
      localStorage.setItem('emotionEntries_snapshots', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to record snapshot', err);
    }
  };

  useEffect(() => {
    try {
      // 1. Check userEmotionEntries first
      const storedUser = localStorage.getItem('userEmotionEntries');
      // 2. Check legacy emotionEntries
      const storedLegacy = localStorage.getItem('emotionEntries');
      
      let loadedUserEntries: EmotionEntry[] = [];

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (Array.isArray(parsed)) {
          loadedUserEntries = parsed.filter(e => !isSampleEntry(e));
        }
      } else if (storedLegacy) {
        const parsed = JSON.parse(storedLegacy);
        if (Array.isArray(parsed)) {
          // Any non-sample entries in legacy storage are preserved as user entries
          const userOnly = parsed.filter(e => !isSampleEntry(e));
          if (userOnly.length > 0) {
            loadedUserEntries = userOnly;
            localStorage.setItem('userEmotionEntries', JSON.stringify(userOnly));
          }
        }
      }

      // 3. Scan browser storage for any orphaned user entries from previous sessions
      const orphaned = scanStorageForOrphanedEntries(loadedUserEntries);
      if (orphaned.length > 0) {
        const existingIds = new Set(loadedUserEntries.map(e => e.id));
        const toRecover = orphaned.filter(o => !existingIds.has(o.id));
        if (toRecover.length > 0) {
          loadedUserEntries = [...loadedUserEntries, ...toRecover];
          localStorage.setItem('userEmotionEntries', JSON.stringify(loadedUserEntries));
        }
      }

      setUserEntries(loadedUserEntries);

      // 4. Sample set preference
      const storedSamplePref = localStorage.getItem('includeSampleData');
      let sampleActive: boolean;
      if (storedSamplePref !== null) {
        sampleActive = storedSamplePref === 'true';
      } else {
        // If user already has personal entries, default sample toggle to false.
        // If 0 entries, default to true so they immediately see sample reflections in action.
        sampleActive = loadedUserEntries.length === 0;
        localStorage.setItem('includeSampleData', String(sampleActive));
      }
      setIncludeSampleData(sampleActive);

      // Save initial snapshot
      recordSnapshot(loadedUserEntries, sampleActive, 'App initialized');
    } catch (error) {
      console.error("Failed to load entries from localStorage", error);
    }
  }, []);

  // Save user entries safely (never touching or erasing them with sample data)
  const saveUserEntries = (updatedUserEntries: EmotionEntry[], sampleActive: boolean = includeSampleData) => {
    try {
      setUserEntries(updatedUserEntries);
      localStorage.setItem('userEmotionEntries', JSON.stringify(updatedUserEntries));
      // Keep legacy emotionEntries synchronized with the active combined set
      const combined = sampleActive ? [...updatedUserEntries, ...SAMPLE_ENTRIES] : updatedUserEntries;
      localStorage.setItem('emotionEntries', JSON.stringify(combined));
    } catch (error) {
      console.error("Failed to save entries to localStorage", error);
    }
  };

  // Toggle sample entries on or off without touching user entries
  const handleToggleSampleData = (enabled?: boolean) => {
    const nextVal = typeof enabled === 'boolean' ? enabled : !includeSampleData;
    setIncludeSampleData(nextVal);
    localStorage.setItem('includeSampleData', String(nextVal));

    // Synchronize legacy storage key with updated combined list
    const combined = nextVal ? [...userEntries, ...SAMPLE_ENTRIES] : userEntries;
    localStorage.setItem('emotionEntries', JSON.stringify(combined));

    recordSnapshot(userEntries, nextVal, nextVal ? 'Enabled demo sample set' : 'Removed demo sample set');
  };

  const handleSaveEntry = (entryToSave: EmotionEntry) => {
    const isSample = isSampleEntry(entryToSave);
    const cleanEntry: EmotionEntry = {
      ...entryToSave,
      id: isSample ? `user-${Date.now()}` : entryToSave.id,
      isSample: false,
    };

    const isEditing = userEntries.some(e => e.id === cleanEntry.id);
    const updatedUserEntries = isEditing
      ? userEntries.map(entry => (entry.id === cleanEntry.id ? cleanEntry : entry))
      : [cleanEntry, ...userEntries];

    saveUserEntries(updatedUserEntries);
    recordSnapshot(updatedUserEntries, includeSampleData, isEditing ? 'Edited personal reflection' : 'Logged new reflection');
    setCurrentView('home');
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (isSampleEntry({ id: entryId })) {
      // If user deletes a sample entry, toggle off sample set
      handleToggleSampleData(false);
      return;
    }
    const updatedUserEntries = userEntries.filter(e => e.id !== entryId);
    saveUserEntries(updatedUserEntries);
    recordSnapshot(updatedUserEntries, includeSampleData, 'Deleted reflection entry');
  };

  const handleRestoreEntries = (recovered: EmotionEntry[]) => {
    const existingIds = new Set(userEntries.map(e => e.id));
    const toAdd = recovered.filter(r => !existingIds.has(r.id) && !isSampleEntry(r));
    if (toAdd.length === 0) return;

    const merged = [...toAdd, ...userEntries];
    saveUserEntries(merged);
    recordSnapshot(merged, includeSampleData, `Restored ${toAdd.length} previous entries`);
  };

  const handleRestoreSnapshot = (snapshot: EntrySnapshot) => {
    saveUserEntries(snapshot.userEntries, snapshot.sampleIncluded);
    setIncludeSampleData(snapshot.sampleIncluded);
    localStorage.setItem('includeSampleData', String(snapshot.sampleIncluded));
    recordSnapshot(snapshot.userEntries, snapshot.sampleIncluded, `Restored snapshot from ${new Date(snapshot.timestamp).toLocaleTimeString()}`);
  };

  const handleStartNewEntry = () => {
    setEditingEntry(null);
    setCurrentView('entry-flow');
  };

  const handleStartEdit = (entry: EmotionEntry) => {
    setEditingEntry(entry);
    setCurrentView('entry-flow');
  };

  const handleStartView = (entry: EmotionEntry) => {
    setViewingEntry(entry);
    setCurrentView('view-entry');
  };

  const handleViewInsights = () => {
    setCurrentView('insights');
  };

  const handleViewAiAnalysis = () => {
    setCurrentView('ai-analysis');
  };

  const handleCancelFlow = () => {
    setCurrentView('home');
    setEditingEntry(null);
  };

  const handleBackFromView = () => {
    setCurrentView('home');
    setViewingEntry(null);
  };

  // Active combined entries based on the sample toggle
  const activeEntries = useMemo(() => {
    return includeSampleData ? [...userEntries, ...SAMPLE_ENTRIES] : userEntries;
  }, [userEntries, includeSampleData]);

  const renderView = () => {
    switch (currentView) {
      case 'entry-flow':
        return (
          <NewEntryFlow 
            onSave={handleSaveEntry} 
            onCancel={handleCancelFlow} 
            existingEntry={editingEntry}
            pastEntries={activeEntries}
          />
        );
      case 'insights':
        return (
          <InsightsPage 
            entries={activeEntries} 
            onBack={() => setCurrentView('home')} 
            onViewAiAnalysis={handleViewAiAnalysis}
          />
        );
      case 'ai-analysis':
        return (
          <AiAnalysisPage
            entries={activeEntries}
            onBack={() => setCurrentView('home')}
            onNavigateToNewEntry={handleStartNewEntry}
            includeSampleData={includeSampleData}
            onToggleSampleData={handleToggleSampleData}
            userEntriesCount={userEntries.length}
          />
        );
      case 'view-entry':
        return viewingEntry && <ViewEntryPage entry={viewingEntry} onBack={handleBackFromView} />;
      case 'home':
      default:
        return (
          <HomePage
            onAddNewEntry={handleStartNewEntry}
            onViewInsights={handleViewInsights}
            onViewAiAnalysis={handleViewAiAnalysis}
            entries={activeEntries}
            userEntriesCount={userEntries.length}
            includeSampleData={includeSampleData}
            onToggleSampleData={handleToggleSampleData}
            onEdit={handleStartEdit}
            onView={handleStartView}
            onDelete={handleDeleteEntry}
            onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>

      {/* Entry History & Data Recovery Modal */}
      <RecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        currentUserEntries={userEntries}
        includeSampleData={includeSampleData}
        onRestoreEntries={handleRestoreEntries}
        onRestoreSnapshot={handleRestoreSnapshot}
      />
    </div>
  );
};

export default App;

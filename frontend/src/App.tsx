import { useState } from 'react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { Leaf, Mail, PenTool, Settings, X, Globe, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import Roster from './components/Roster';
import Manage from './components/Manage';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'manage'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const { t, language, setLanguage, theme, setTheme } = useSettings();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E7F5E9] via-[#D0E8D5] to-[#E0F2F1] flex flex-col items-center overflow-x-hidden">
      {/* Centered Glass Navigation */}
      <nav className="relative z-50 glass-nav mt-8 w-11/12 max-w-4xl rounded-2xl p-2 mb-8 flex justify-between items-center px-4">
        <div className="text-botanical-text font-bold flex items-center gap-2">
          <Leaf className="text-botanical-accent1" /> {t('nav.title')}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-botanical-accent1 text-white shadow-md' : 'text-botanical-text hover:bg-black/5'}`}>
            <Leaf size={18} /> {t('nav.dashboard')}
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab === 'roster' ? 'bg-botanical-accent1 text-white shadow-md' : 'text-botanical-text hover:bg-black/5'}`}>
            <Mail size={18} /> {t('nav.roster')}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${activeTab === 'manage' ? 'bg-botanical-accent1 text-white shadow-md' : 'text-botanical-text hover:bg-black/5'}`}>
            <PenTool size={18} /> {t('nav.manage')}
          </button>

          <div className="w-px h-6 bg-botanical-text/20 self-center mx-1"></div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition text-botanical-text hover:bg-black/5 hover:text-botanical-accent1"
            title={t('nav.settings')}>
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-11/12 max-w-4xl flex-grow mb-16 relative">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'roster' && <Roster />}
        {activeTab === 'manage' && <Manage />}
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-botanical-text"><X size={20} /></button>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-8 text-botanical-text"><Settings className="text-botanical-accent1" /> {t('settings.title')}</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-sm opacity-80 mb-3"><Globe size={16} /> {t('settings.lang')}</h3>
                  <div className="flex bg-white/40 rounded-lg p-1">
                    <button onClick={() => setLanguage('zh')} className={`flex-1 py-2 text-center text-sm font-bold rounded-md transition ${language === 'zh' ? 'bg-botanical-accent1 text-white shadow' : 'hover:bg-white/50'}`}>中文</button>
                    <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-center text-sm font-bold rounded-md transition ${language === 'en' ? 'bg-botanical-accent1 text-white shadow' : 'hover:bg-white/50'}`}>English</button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-sm opacity-80 mb-3"><Palette size={16} /> {t('settings.theme')}</h3>
                  <div className="flex bg-white/40 rounded-lg p-1">
                    <button onClick={() => setTheme('botanical')} className={`flex-1 py-2 text-center text-sm font-bold rounded-md transition ${theme === 'botanical' ? 'bg-botanical-accent2 text-white shadow' : 'hover:bg-white/50'}`}>{t('settings.theme_botanical')}</button>
                    <button onClick={() => setTheme('dark_forest')} className={`flex-1 py-2 text-center text-sm font-bold rounded-md transition ${theme === 'dark_forest' ? 'bg-botanical-accent2 text-white shadow' : 'hover:bg-white/50'}`}>{t('settings.theme_dark')}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}

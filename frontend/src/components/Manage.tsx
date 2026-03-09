import { useState, useEffect } from 'react';
import { getContacts, type Person } from '../api';
import axios from 'axios';
import { useSettings } from '../contexts/SettingsContext';
import { Star } from 'lucide-react';

export default function Manage() {
    const [activeTab, setActiveTab] = useState<'add' | 'log'>('add');
    const [people, setPeople] = useState<Person[]>([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { t } = useSettings();

    // Add Form State
    const [name, setName] = useState('');
    const [groupName, setGroupName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [archiveMode, setArchiveMode] = useState(false);
    const [affection, setAffection] = useState(50);
    const [preferences, setPreferences] = useState('');
    const [similarities, setSimilarities] = useState('');

    // Log Form State
    const [selectedPerson, setSelectedPerson] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [quality, setQuality] = useState(3);
    const [rawText, setRawText] = useState('');

    useEffect(() => {
        getContacts().then(p => {
            setPeople(p);
            if (p.length > 0) setSelectedPerson(p[0].id.toString());
        });
    }, []);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            await axios.post('http://localhost:8000/api/contacts', {
                name,
                group_name: groupName || null,
                birthday: birthday || null,
                base_interval: 30,
                archive_mode: archiveMode,
                affection_score: affection,
                tags: null,
                preferences: preferences || null,
                similarities_and_differences: similarities || null
            });
            setMessage({ type: 'success', text: `✅ 成功记录 / Created: ${name}` });
            setName('');
            setPreferences('');
            setSimilarities('');
            getContacts().then(setPeople);
        } catch (err) {
            setMessage({ type: 'error', text: 'Error Occurred' });
        }
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawText.trim() || !selectedPerson) return;

        try {
            await axios.post(`http://localhost:8000/api/interactions?person_id=${selectedPerson}`, {
                date: logDate,
                quality_score: quality,
                raw_text: rawText,
                tags: null
            });
            setMessage({ type: 'success', text: '✅ 互动成功保存 / Log Saved' });
            setRawText('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Error Occurred' });
        }
    };

    return (
        <div className="glass-card w-full max-w-4xl mx-auto p-6 overflow-hidden">

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg font-bold border ${message.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex border-b border-botanical-text/10 mb-6">
                <button
                    onClick={() => setActiveTab('add')}
                    className={`flex-1 text-center py-3 font-bold transition-all ${activeTab === 'add' ? 'border-b-2 border-botanical-accent1 text-botanical-accent1' : 'opacity-60 hover:opacity-100'}`}>
                    {t('manage.add_tab')}
                </button>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`flex-1 text-center py-3 font-bold transition-all ${activeTab === 'log' ? 'border-b-2 border-botanical-accent1 text-botanical-accent1' : 'opacity-60 hover:opacity-100'}`}>
                    {t('manage.log_tab')}
                </button>
            </div>

            {activeTab === 'add' ? (
                <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('manage.name')}</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('manage.group')}</label>
                            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('roster.birthday')}</label>
                            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input type="checkbox" id="archive" checked={archiveMode} onChange={e => setArchiveMode(e.target.checked)} className="w-4 h-4 text-botanical-accent1" />
                            <label htmlFor="archive" className="text-sm font-semibold">{t('manage.archive')}</label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('manage.affection')} ({affection})</label>
                            <input type="range" min="0" max="100" value={affection} onChange={e => setAffection(Number(e.target.value))} className="w-full accent-botanical-accent1" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('roster.preferences')}</label>
                            <textarea value={preferences} onChange={e => setPreferences(e.target.value)} rows={3} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('roster.similarities')}</label>
                            <textarea value={similarities} onChange={e => setSimilarities(e.target.value)} rows={3} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                        </div>
                    </div>
                    <div className="md:col-span-2 text-right mt-4">
                        <button type="submit" className="bg-botanical-accent1 hover:bg-green-800 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shrink-0">
                            {t('manage.submit_add')}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleLogSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1">{t('manage.select')}</label>
                            <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1">
                                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold mb-1">{t('manage.date')}</label>
                                <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold mb-1">{t('manage.log_quality')}</label>
                                <div className="flex gap-1 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setQuality(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={24}
                                                className={`transition-colors ${star <= quality ? "fill-amber-400 text-amber-500 drop-shadow-sm" : "text-botanical-text/20"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">{t('manage.diary')}</label>
                        <textarea required value={rawText} onChange={e => setRawText(e.target.value)} rows={5} className="w-full bg-white/60 p-2 rounded-lg border border-botanical-text/20 focus:outline-none focus:ring-2 focus:ring-botanical-accent1" />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-botanical-accent1 hover:bg-green-800 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shrink-0">
                            {t('manage.submit_log')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

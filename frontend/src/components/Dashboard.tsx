import { useEffect, useState } from 'react';
import { getDashboard, verifyContact, type Person } from '../api';
import { Sparkles, CalendarHeart, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';

export default function Dashboard() {
    const [data, setData] = useState<{ upcoming_events: Person[], needs_cultivation: Person[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<'events' | 'cultivation'>('events');
    const { t } = useSettings();

    const loadData = () => {
        setLoading(true);
        getDashboard().then(res => {
            setData(res);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="text-center mt-20 animate-pulse text-botanical-accent1 font-bold">Loading Garden Status...</div>;

    const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

    return (
        <div className="relative w-full max-w-4xl mx-auto h-[550px] mt-8 perspective-1000 flex items-center justify-center">
            {/* Upcoming Events Card */}
            <motion.div
                layout
                onClick={() => setActiveCard('events')}
                initial={false}
                animate={{
                    y: activeCard === 'events' ? 0 : 30,
                    x: activeCard === 'events' ? 0 : -20,
                    rotate: activeCard === 'events' ? -2 : 4,
                    scale: activeCard === 'events' ? 1 : 0.95,
                    zIndex: activeCard === 'events' ? 10 : 0,
                    filter: activeCard === 'events' ? "brightness(1) blur(0px)" : "brightness(0.9) blur(2px)",
                    opacity: activeCard === 'events' ? 1 : 0.6
                }}
                transition={springConfig}
                className="absolute w-[90%] max-w-3xl h-[450px] glass-card p-8 cursor-pointer rounded-2xl shadow-xl border border-white/40 bg-white/60 backdrop-blur-xl transition-shadow hover:shadow-2xl"
            >
                <div className="h-full overflow-y-auto">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-emerald-800">
                        <CalendarHeart className="text-emerald-600" /> {t('dash.upcoming')}
                    </h2>
                    {data?.upcoming_events.length === 0 ? (
                        <div className="p-6 text-center text-emerald-600/60 italic font-medium">{t('dash.no_events')}</div>
                    ) : (
                        data?.upcoming_events.map(p => (
                            <div key={p.id} className="bg-white/40 p-5 mb-4 rounded-xl shadow-sm border-l-4 border-l-emerald-500 hover:bg-white/60 transition">
                                <h3 className="text-lg font-bold text-emerald-900">🎈 {p.name}</h3>
                                <p className="text-sm text-emerald-700/80 mt-1">{t('dash.birthday_soon')} <strong>{p.birthday?.substring(5)}</strong></p>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Data Cleansing Card */}
            <motion.div
                layout
                onClick={() => setActiveCard('cultivation')}
                initial={false}
                animate={{
                    y: activeCard === 'cultivation' ? 0 : 30,
                    x: activeCard === 'cultivation' ? 0 : 20,
                    rotate: activeCard === 'cultivation' ? 2 : -4,
                    scale: activeCard === 'cultivation' ? 1 : 0.95,
                    zIndex: activeCard === 'cultivation' ? 10 : 0,
                    filter: activeCard === 'cultivation' ? "brightness(1) blur(0px)" : "brightness(0.9) blur(2px)",
                    opacity: activeCard === 'cultivation' ? 1 : 0.6
                }}
                transition={springConfig}
                className="absolute w-[90%] max-w-3xl h-[450px] glass-card p-8 cursor-pointer rounded-2xl shadow-xl border border-white/40 bg-white/60 backdrop-blur-xl transition-shadow hover:shadow-2xl"
            >
                <div className="h-full overflow-y-auto pr-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-amber-800">
                        <Sparkles className="text-amber-500" /> {t('dash.cleansing')}
                    </h2>
                    {data?.needs_cultivation.length === 0 ? (
                        <div className="p-6 text-center text-amber-700/60 font-medium">{t('dash.no_cleansing')}</div>
                    ) : (
                        data?.needs_cultivation.map(p => {
                            const field = p.needs_verification === 'preferences' ? p.preferences : p.similarities_and_differences;
                            const snippet = field ? (field.length > 20 ? field.substring(0, 20) + '...' : field) : '';
                            return (
                                <div key={p.id} className="bg-white/40 p-5 mb-4 border-l-4 border-amber-400 rounded-xl shadow-sm">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-amber-900">
                                        <AlertCircle size={18} className="text-amber-500" />
                                        {p.name} ({p.completeness_score})
                                    </h3>
                                    <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg mt-3 border border-amber-200">
                                        <strong>{t('dash.decay_warning')}</strong> <em>[{snippet}]</em>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card from swapping on click
                                            verifyContact(p.id).then(() => loadData());
                                        }}
                                        className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md">
                                        <RefreshCw size={14} /> {t('dash.verify')}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
}

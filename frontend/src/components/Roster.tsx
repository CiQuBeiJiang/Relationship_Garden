import { useState, useEffect } from 'react';
import { getContacts, deleteContact, type Person } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ChevronLeft, Folder } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Roster() {
    const [people, setPeople] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const { t } = useSettings();

    const loadContacts = () => {
        getContacts().then(setPeople);
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const handleDelete = async () => {
        if (!selectedPerson) return;
        if (deleteConfirm) {
            await deleteContact(selectedPerson.id);
            setSelectedPerson(null);
            setDeleteConfirm(false);
            loadContacts();
        } else {
            setDeleteConfirm(true);
            setTimeout(() => setDeleteConfirm(false), 3000); // Reset confirm state after 3s
        }
    };

    const getFlower = (score: number) => {
        if (score === 100) return '🌸';
        if (score >= 50) return '🌷';
        return '🥀';
    };

    // Group people by group_name
    const groupedPeople = people.reduce((acc, person) => {
        const group = person.group_name || t('roster.no_group');
        if (!acc[group]) acc[group] = [];
        acc[group].push(person);
        return acc;
    }, {} as Record<string, Person[]>);

    // Reusable Envelope Component (Dumb render)
    const renderEnvelope = (p: Person, inStack = false, stackIndex = 0) => {
        // Only the top card of a stack gets the hover effects, others are locked
        const isInteractive = !inStack || stackIndex === 0;
        const stackTransforms = inStack ? [
            "rotate(0deg) translateY(0px)",
            "rotate(-5deg) translateY(8px) translateX(-4px)",
            "rotate(4deg) translateY(12px) translateX(4px)"
        ] : ["rotate(0deg)"];

        const activeTransform = inStack ? stackTransforms[Math.min(stackIndex, 2)] : stackTransforms[0];

        return (
            <div
                key={`${p.id}-${inStack ? 'stack' : 'grid'}`}
                className={`absolute inset-0 flex flex-col justify-end overflow-visible ${isInteractive ? 'cursor-pointer group' : ''}`}
                onClick={() => isInteractive && setSelectedPerson(p)}
                style={{ transform: activeTransform, zIndex: 10 - stackIndex }}
            >
                {/* 1. Envelope Back */}
                <div className={`absolute inset-0 bg-gradient-to-br from-[#E2D8C6] to-[#D5CBB9] rounded-lg shadow-md z-0 overflow-hidden border border-black/5 ${!isInteractive && 'opacity-80'}`}>
                    <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>
                </div>

                {/* 2. Top Flap */}
                <div
                    className={`absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-[#F2ECD8] to-[#EAE3CB] z-30 filter drop-shadow-md border-t border-white/50 origin-top
                        ${isInteractive ? 'transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-x-[180deg]' : ''}`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 85% 65%, 50% 100%, 15% 65%)', transformStyle: 'preserve-3d' }}
                >
                    <div className="absolute inset-0 opacity-[0.2] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>
                </div>

                {/* 3. Left Fold */}
                <div className="absolute top-0 left-0 bottom-0 w-[40%] bg-gradient-to-r from-[#ECE6D2] to-[#E3DCB8] z-10 border-l border-white/40 drop-shadow-sm" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>

                {/* 4. Right Fold */}
                <div className="absolute top-0 right-0 bottom-0 w-[40%] bg-gradient-to-l from-[#E8E1CC] to-[#DFD8BA] z-10 border-r border-white/40 drop-shadow-sm" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }}></div>

                {/* 5. Bottom Fold */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-[#F6F1E5] to-[#EBE4CF] z-20 border-b border-white/60 drop-shadow-[0_-2px_4px_rgba(0,0,0,0.05)] rounded-b-lg flex flex-col justify-end p-5"
                    style={{ clipPath: 'polygon(0 100%, 0 35%, 50% 0, 100% 35%, 100% 100%)' }}
                >
                    <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none rounded-b-lg"></div>

                    {isInteractive && (
                        <div className="z-30 text-center relative mt-auto bg-white/40 backdrop-blur-sm p-2 rounded border border-white/50 shadow-sm">
                            <h3 className="text-xl font-serif font-bold text-[#4A4238] tracking-widest uppercase">{p.name}</h3>
                            <div className="flex justify-center items-center gap-2 mt-1">
                                <p className="text-xs text-[#7A7268] font-sans font-semibold tracking-wider">{p.group_name || t('roster.no_group')}</p>
                                {p.archive_mode && <span className="text-[10px] bg-red-900/10 text-red-800 px-1.5 py-0.5 rounded uppercase font-bold">{t('roster.archived')}</span>}
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Realistic Wax Seal */}
                <div
                    className={`absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-[#ffdbdb] font-serif font-bold text-lg bg-[radial-gradient(circle_at_30%_30%,_#b91c1c,_#7f1d1d_70%,_#450a0a)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-3px_5px_rgba(0,0,0,0.6),0_4px_6px_rgba(0,0,0,0.4)] border border-[#450a0a] z-40 
                    ${isInteractive ? 'transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-0 group-hover:opacity-0' : ''}`}
                    title={isInteractive ? "Click to break seal" : ""}
                >
                    <div className="w-[85%] h-[85%] rounded-full border border-black/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center bg-[#901616]">
                        <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{isInteractive ? p.name.charAt(0).toUpperCase() : ""}</span>
                    </div>
                </div>

                {isInteractive && (
                    <div className="absolute top-4 right-4 text-2xl opacity-80 z-10 transition-transform group-hover:scale-110" title={`${t('roster.score')}: ${p.completeness_score}`}>
                        {getFlower(p.completeness_score)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full relative bg-white/30 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm shadow-botanical-text/5 mt-8 min-h-[600px]">

            {activeGroup === null ? (
                /* Grouped Decks View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-8 pb-12">
                    {Object.entries(groupedPeople).map(([groupName, groupMembers]) => (
                        <div key={groupName} className="flex flex-col items-center">
                            {/* The Stack */}
                            <div
                                className="relative w-full aspect-[3/2] cursor-pointer group transition-transform hover:-translate-y-2 hover:drop-shadow-xl"
                                onClick={() => setActiveGroup(groupName)}
                                title={`Click to open folder: ${groupName}`}
                            >
                                {groupMembers.slice(0, 3).map((p, idx) => renderEnvelope(p, true, idx))}
                                {groupMembers.length > 3 && (
                                    <div className="absolute -bottom-3 -right-3 z-50 bg-botanical-text text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#EBE4CF] shadow-lg">
                                        +{groupMembers.length - 3}
                                    </div>
                                )}
                            </div>
                            {/* Group Label */}
                            <div className="mt-8 text-center flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-botanical-text/10 shadow-sm text-botanical-text">
                                <Folder size={16} className="opacity-70" />
                                <span className="font-serif font-bold tracking-widest uppercase">{groupName}</span>
                            </div>
                        </div>
                    ))}
                    {Object.keys(groupedPeople).length === 0 && (
                        <div className="col-span-full text-center py-20 text-botanical-text/50 font-serif italic">
                            Empty Herbarium. No dossiers found.
                        </div>
                    )}
                </div>
            ) : (
                /* Detail Grid View for Active Group */
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <button
                            onClick={() => setActiveGroup(null)}
                            className="flex items-center gap-2 text-botanical-text bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl transition border border-botanical-text/10 shadow-sm mb-8 font-bold"
                        >
                            <ChevronLeft size={20} /> 返回档案柜 (Back to Archives)
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12 pb-12">
                            {groupedPeople[activeGroup]?.map(p => (
                                <div key={p.id} className="relative aspect-[3/2]">
                                    {renderEnvelope(p, false, 0)}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Framer Motion Letter Extraction Modal */}
            <AnimatePresence>
                {selectedPerson && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
                        onClick={() => setSelectedPerson(null)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0, transition: { duration: 0.3 } }}
                            transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            className="vintage-paper w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm p-10 relative shadow-2xl border-l-[12px] border-l-stone-200"
                            onClick={e => e.stopPropagation()} // Prevent close on background click
                        >
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    className={`flex items-center gap-1 p-2 rounded-full transition-colors text-sm font-bold ${deleteConfirm ? 'bg-red-600 text-white shadow-md' : 'text-stone-400 hover:bg-red-50 hover:text-red-700'}`}
                                    title={deleteConfirm ? "Click again to truly delete" : "Burn Dossier"}
                                >
                                    <Trash2 size={20} strokeWidth={2.5} /> {deleteConfirm && "Burn."}
                                </button>
                                <button
                                    onClick={() => { setSelectedPerson(null); setDeleteConfirm(false); }}
                                    className="text-stone-600 hover:text-stone-900 bg-white/40 p-2 rounded-full transition-colors"
                                >
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="text-center border-b-2 border-stone-800/20 pb-6 mb-8 mt-4">
                                <h2 className="text-4xl font-serif text-stone-900 tracking-tight">{selectedPerson.name}</h2>
                                <div className="text-sm text-stone-500 font-serif italic mt-2 font-semibold tracking-[0.3em] uppercase">
                                    {t('roster.file')}
                                </div>
                            </div>

                            <div className="space-y-6 font-serif text-stone-800 leading-relaxed text-lg">
                                <div className="flex bg-white/30 p-4 rounded text-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                    <div className="flex-1 border-r border-stone-800/10"><strong className="block text-xs uppercase opacity-70 mb-1">🎂 {t('roster.birthday')}</strong> {selectedPerson.birthday || t('roster.unknown')}</div>
                                    <div className="flex-1 pl-4"><strong className="block text-xs uppercase opacity-70 mb-1">🏷️ {t('roster.tags')}</strong> {selectedPerson.tags || t('roster.unknown')}</div>
                                </div>

                                <p className="bg-white/30 p-4 rounded text-md shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                    <strong className="block text-xs uppercase opacity-70 mb-2">💡 {t('roster.preferences')}</strong>
                                    {selectedPerson.preferences || t('roster.unrecorded')}
                                </p>

                                <p className="bg-white/30 p-4 rounded text-md shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                    <strong className="block text-xs uppercase opacity-70 mb-2">🔍 {t('roster.similarities')}</strong>
                                    {selectedPerson.similarities_and_differences || t('roster.unexplored')}
                                </p>

                                {selectedPerson.interactions && selectedPerson.interactions.length > 0 && (
                                    <div className="mt-10 pt-8 border-t-2 border-dashed border-stone-800/20">
                                        <h4 className="text-2xl font-serif text-center mb-6 tracking-widest text-stone-900">{t('roster.history')}</h4>
                                        <div className="space-y-6">
                                            {selectedPerson.interactions.map(inter => (
                                                <div key={inter.id} className="relative bg-[#fcfaf5] p-6 rounded shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60">
                                                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-stone-100 rounded-full border border-stone-200 flex items-center justify-center text-xs text-stone-500 shadow-sm shadow-inner">钉</div>
                                                    <div className="text-xs font-sans tracking-wider opacity-60 mb-3 flex justify-between border-b border-stone-200/50 pb-2">
                                                        <span>🗓️ {inter.date}</span>
                                                        <span className="text-amber-600 font-bold">{t('roster.quality')}: {'★'.repeat(inter.quality_score)}</span>
                                                    </div>
                                                    <p className="italic text-stone-700 whitespace-pre-wrap">{inter.raw_text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

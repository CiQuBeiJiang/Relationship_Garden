import { useState, useEffect } from 'react';
import { getContacts, deleteContact, updateContact, type Person } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Folder, Trash2, Edit2, Save, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import PlantCard from './PlantCard';

export default function Roster() {
    const [people, setPeople] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [isDeleting, setIsDeleting] = useState(false); // Replaced deleteConfirm
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Adjust to fit aesthetically
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Person>>({});
    const [virtualGroups, setVirtualGroups] = useState<string[]>([]); // Virtual empty groups to support creating folders without contacts
    const { t } = useSettings();

    const loadContacts = () => {
        getContacts().then(setPeople);
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const handleDelete = async () => {
        if (!selectedPerson) return;
        if (isDeleting) {
            await deleteContact(selectedPerson.id);
            setSelectedPerson(null);
            setIsDeleting(false);
            loadContacts();
        } else {
            setIsDeleting(true);
            setTimeout(() => setIsDeleting(false), 3000); // Reset confirm state after 3s
        }
    };

    const getFlower = (score: number) => {
        if (score === 100) return '🌸';
        if (score >= 50) return '🌷';
        return '🥀';
    };

    // Group people by group_name
    // Basic derivation of groups
    const derivedGroups = people.reduce((acc, p) => {
        const group = p.group_name || 'ungrouped';
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
    }, {} as Record<string, Person[]>);

    // Merge in virtual empty groups
    virtualGroups.forEach(vg => {
        if (!derivedGroups[vg]) derivedGroups[vg] = [];
    });

    const grouped = derivedGroups;

    const standalonePeople = grouped['ungrouped'] || [];
    const actualGroups = Object.entries(grouped).filter(([name]) => name !== 'ungrouped');


    const handleEditToggle = () => {
        if (!isEditing && selectedPerson) {
            setEditData({
                name: selectedPerson.name,
                birthday: selectedPerson.birthday || '',
                tags: selectedPerson.tags || '',
                group_name: selectedPerson.group_name || '',
                preferences: selectedPerson.preferences || '',
                similarities_and_differences: selectedPerson.similarities_and_differences || ''
            });
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedPerson) return;
        const updated = await updateContact(selectedPerson.id, editData);
        setIsEditing(false);
        loadContacts();
        setSelectedPerson({ ...selectedPerson, ...updated }); // Update local modal immediately
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData("text/plain", id.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetId?: number | string) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = Number(e.dataTransfer.getData('text/plain'));
        if (!draggedId) return;

        let newGroupName = '';

        if (typeof targetId === 'number') {
            if (draggedId === targetId) return; // Dropped on self
            const targetPerson = people.find(p => p.id === targetId);

            if (targetPerson?.group_name) {
                newGroupName = targetPerson.group_name;
            } else {
                newGroupName = window.prompt("创建新文件夹名称 / Name this new folder:") || '';
                if (!newGroupName.trim()) return; // Cancelled

                // Update target person first
                await updateContact(targetId, { group_name: newGroupName });
            }
        } else if (typeof targetId === 'string' && targetId !== 'ungrouped') {
            // Dropped onto an existing valid group string (including virtual groups)
            newGroupName = targetId;
        } else if (targetId === 'ungrouped') {
            // Un-grouping
            newGroupName = '';
        }

        // Update the dragged person
        await updateContact(draggedId, { group_name: newGroupName });

        // Clean up virtual groups if we just populated one
        if (typeof targetId === 'string' && virtualGroups.includes(targetId)) {
            setVirtualGroups(virtualGroups.filter(g => g !== targetId));
        }

        loadContacts();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const addVirtualGroup = () => {
        const name = window.prompt("新建空文件夹名称 / Name the new empty folder:");
        if (name && name.trim()) {
            const trimmed = name.trim();
            if (!grouped[trimmed] && !virtualGroups.includes(trimmed)) {
                setVirtualGroups([...virtualGroups, trimmed]);
            }
        }
    };

    // Reusable Component wrapper function for inline map renders
    const renderPlantObject = (p: Person, inStack = false, stackIndex = 0) => {
        return (
            <PlantCard
                key={`${p.id} -${inStack ? 'stack' : 'grid'} `}
                person={p}
                inStack={inStack}
                stackIndex={stackIndex}
                onClick={() => setSelectedPerson(p)}
                onDragStart={handleDragStart}
            />
        );
    };

    const handleGroupClick = (groupName: string | null) => {
        setActiveGroup(groupName);
        setCurrentPage(1);
    };

    // Pagination derived state for activeGroup === null
    const allMainItems = [
        ...actualGroups.map(([groupName, groupMembers]) => ({ type: 'group' as const, groupName, groupMembers, id: `group - ${groupName} ` })),
        ...standalonePeople.map(p => ({ type: 'person' as const, person: p, id: `person - ${p.id} ` }))
    ];
    // Include virtual groups in the main items if they are not in actualGroups
    virtualGroups.forEach(vg => {
        if (!actualGroups.find(([name]) => name === vg)) {
            allMainItems.push({ type: 'group' as const, groupName: vg, groupMembers: [], id: `group - ${vg} ` });
        }
    });

    const totalMainPages = Math.max(1, Math.ceil(allMainItems.length / ITEMS_PER_PAGE));
    const paginatedMainItems = allMainItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Pagination derived state for activeGroup !== null
    const currentGroupMembers = activeGroup ? (grouped[activeGroup] || []) : [];
    const totalGroupPages = Math.max(1, Math.ceil(currentGroupMembers.length / ITEMS_PER_PAGE));
    const paginatedGroupMembers = currentGroupMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const renderPaginationUI = (totalPages: number) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-4 mt-8 pb-4">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full bg-white/50 border border-botanical-text/10 hover:bg-white transition-colors disabled:opacity-50"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="font-serif font-bold text-botanical-text/70">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full bg-white/50 border border-botanical-text/10 hover:bg-white transition-colors disabled:opacity-50 rotate-180"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>
        );
    };

    return (
        <div className="w-full relative bg-white/30 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm shadow-botanical-text/5 mt-8 min-h-[600px] flex flex-col">

            <div className="absolute top-4 right-8 z-10 flex gap-4">
                {activeGroup === null && (
                    <button
                        onClick={addVirtualGroup}
                        className="flex items-center gap-2 text-sm font-bold bg-white/60 hover:bg-white border border-botanical-text/10 px-4 py-2 rounded-xl transition shadow-sm text-botanical-text"
                        title="Add Empty Folder"
                    >
                        <Folder size={16} /> 新建分组 (New Group)
                    </button>
                )}
            </div>

            {activeGroup === null ? (
                /* Grouped Decks View */
                <div className="flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-12 pb-12">
                        {paginatedMainItems.map((item) => {
                            if (item.type === 'group') {
                                const { groupName, groupMembers } = item;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex flex-col items-center p-4 rounded-xl transition-colors hover:bg-white/10"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, groupName)}
                                    >
                                        <div
                                            className={`relative w - full aspect - [3 / 2] cursor - pointer group transition - transform hover: -translate - y - 2 hover: drop - shadow - xl ${groupMembers.length === 0 ? 'border-2 border-dashed border-botanical-text/40 rounded-xl bg-black/5 flex items-center justify-center text-center' : ''} `}
                                            onClick={() => handleGroupClick(groupName)}
                                            title={`Click to open folder: ${groupName} `}
                                        >
                                            {groupMembers.length === 0 ? (
                                                <span className="text-botanical-text/60 font-serif font-semibold text-sm">请将信件拖至此<br /><span className="text-[10px] opacity-70">(Drop letters here)</span></span>
                                            ) : (
                                                groupMembers.slice(0, 3).map((p, idx) => renderPlantObject(p, true, idx))
                                            )}
                                            {groupMembers.length > 3 && (
                                                <div className="absolute -bottom-3 -right-3 z-50 bg-botanical-text text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#EBE4CF] shadow-lg">
                                                    +{groupMembers.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-8 text-center flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-botanical-text/10 shadow-sm text-botanical-text">
                                            <Folder size={16} className="opacity-70" />
                                            <span className="font-serif font-bold tracking-widest uppercase">{groupName}</span>
                                            {groupMembers.length === 0 && <span className="text-xs font-normal ml-2 opacity-50">(Empty / 空)</span>}
                                        </div>
                                    </div>
                                );
                            } else {
                                const { person: p } = item;
                                return (
                                    <div
                                        key={item.id}
                                        className="relative aspect-[3/4] p-4 transition-colors hover:bg-white/10 rounded-xl"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, p.id)}
                                    >
                                        {renderPlantObject(p, false, 0)}
                                    </div>
                                );
                            }
                        })}

                        {allMainItems.length === 0 && (
                            <div className="col-span-full text-center py-20 text-botanical-text/50 font-serif italic">
                                Empty Herbarium. No dossiers found.
                            </div>
                        )}

                        {/* Drop target for ungrouping removed from main view */}
                    </div>
                    {renderPaginationUI(totalMainPages)}
                </div>
            ) : (
                /* Detail Grid View for Active Group */
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                        <button
                            onClick={() => handleGroupClick(null)}
                            className="flex items-center gap-2 text-botanical-text bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl transition border border-botanical-text/10 shadow-sm mb-8 font-bold self-start"
                        >
                            <ChevronLeft size={20} /> 返回档案柜 (Back to Archives)
                        </button>

                        <div className="flex-1 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12 pb-12">
                                {paginatedGroupMembers.map(p => (
                                    <div key={p.id} className="relative aspect-[3/4]">
                                        {renderPlantObject(p, false, 0)}
                                    </div>
                                ))}
                                {/* Drop target for ungrouping (only show on last page of a group) */}
                                {currentGroupMembers.length > 0 && currentPage === totalGroupPages && (
                                    <div
                                        className="relative aspect-[3/2] p-4 transition-colors hover:bg-white/10 rounded-xl border-2 border-dashed border-botanical-text/20 flex items-center justify-center text-botanical-text/50 font-serif italic text-center text-sm cursor-pointer"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, 'ungrouped')}
                                    >
                                        拖拽到此处以取消分组<br />(Drag here to ungroup)
                                    </div>
                                )}
                            </div>
                            {renderPaginationUI(totalGroupPages)}
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
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-8"
                        onClick={() => { setSelectedPerson(null); setIsDeleting(false); setIsEditing(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.4 }}
                            className="vintage-paper w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-10 relative shadow-2xl border-l-[12px] border-l-stone-200"
                            onClick={e => e.stopPropagation()} // Prevent close on background click
                        >
                            <div className="absolute top-4 right-4 flex gap-2">
                                {isEditing ? (
                                    <button onClick={handleSaveEdit} className="flex items-center gap-1 p-2 rounded-full transition-colors text-sm font-bold bg-green-600 text-white shadow-md hover:bg-green-700">
                                        <Save size={20} strokeWidth={2.5} /> Save
                                    </button>
                                ) : (
                                    <button onClick={handleEditToggle} className="text-stone-600 hover:text-stone-900 bg-white/40 p-2 rounded-full transition-colors">
                                        <Edit2 size={20} strokeWidth={2.5} />
                                    </button>
                                )}
                                <button
                                    onClick={handleDelete}
                                    className={`flex items - center gap - 1 p - 2 rounded - full transition - colors text - sm font - bold ${isDeleting ? 'bg-red-600 text-white shadow-md' : 'text-stone-400 hover:bg-red-50 hover:text-red-700'} `}
                                    title={isDeleting ? "Click again to truly delete" : "Burn Dossier"}
                                >
                                    <Trash2 size={20} strokeWidth={2.5} /> {isDeleting && "Burn."}
                                </button>
                                <button
                                    onClick={() => { setSelectedPerson(null); setIsDeleting(false); setIsEditing(false); }}
                                    className="text-stone-600 hover:text-stone-900 bg-white/40 p-2 rounded-full transition-colors"
                                >
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="text-center border-b-2 border-stone-800/20 pb-6 mb-8 mt-4">
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editData.name || ''}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            className="text-4xl font-serif text-center bg-white/50 border border-stone-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-botanical-accent1 w-3/4 mx-auto block mb-2"
                                            placeholder="Contact Name"
                                        />
                                        <div className="flex items-center justify-center gap-2 max-w-[200px] mx-auto mt-2 text-sm">
                                            <Folder size={14} className="text-stone-500" />
                                            <input
                                                type="text"
                                                value={editData.group_name || ''}
                                                onChange={e => setEditData({ ...editData, group_name: e.target.value })}
                                                placeholder="Clear to ungroup"
                                                className="bg-white/50 border border-stone-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-botanical-accent1 text-xs text-center text-stone-600 font-semibold uppercase tracking-wider"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-4xl font-serif text-stone-900 tracking-tight">{selectedPerson.name}</h2>
                                        <div className="text-sm text-stone-500 font-serif italic mt-2 font-semibold tracking-[0.3em] uppercase flex items-center justify-center gap-1">
                                            {selectedPerson.group_name ? (
                                                <><Folder size={14} /> {selectedPerson.group_name}</>
                                            ) : (
                                                t('roster.file')
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6 font-serif text-stone-800 leading-relaxed text-lg">
                                <div className="flex bg-white/30 p-4 rounded text-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                    <div className="flex-1 border-r border-stone-800/10">
                                        <strong className="block text-xs uppercase opacity-70 mb-1">🎂 {t('roster.birthday')}</strong>
                                        {isEditing ? (
                                            <input type="date" value={editData.birthday as string || ''} onChange={e => setEditData({ ...editData, birthday: e.target.value })} className="bg-white/50 border border-stone-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-botanical-accent1 w-[140px] text-xs" />
                                        ) : (
                                            selectedPerson.birthday || t('roster.unknown')
                                        )}
                                    </div>
                                    <div className="flex-1 pl-4">
                                        <strong className="block text-xs uppercase opacity-70 mb-1">🏷️ {t('roster.tags')}</strong>
                                        {isEditing ? (
                                            <input type="text" value={editData.tags || ''} onChange={e => setEditData({ ...editData, tags: e.target.value })} className="bg-white/50 border border-stone-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-botanical-accent1 text-xs" />
                                        ) : (
                                            selectedPerson.tags || t('roster.unknown')
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white/30 p-4 rounded text-md shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                    <strong className="block text-xs uppercase opacity-70 mb-2">💡 {t('roster.preferences')}</strong>
                                    {isEditing ? (
                                        <textarea value={editData.preferences || ''} onChange={e => setEditData({ ...editData, preferences: e.target.value })} rows={3} className="w-full bg-white/50 border border-stone-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-botanical-accent1 text-sm" />
                                    ) : (
                                        selectedPerson.preferences || t('roster.unrecorded')
                                    )}
                                </div>

                                <div className="bg-white/30 p-4 rounded text-md shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                    <strong className="block text-xs uppercase opacity-70 mb-2">🔍 {t('roster.similarities')}</strong>
                                    {isEditing ? (
                                        <textarea value={editData.similarities_and_differences || ''} onChange={e => setEditData({ ...editData, similarities_and_differences: e.target.value })} rows={3} className="w-full bg-white/50 border border-stone-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-botanical-accent1 text-sm" />
                                    ) : (
                                        selectedPerson.similarities_and_differences || t('roster.unexplored')
                                    )}
                                </div>

                                {selectedPerson.interactions && selectedPerson.interactions.length > 0 && (
                                    <div className="mt-10 pt-8 border-t-2 border-dashed border-stone-800/20">
                                        <h4 className="text-2xl font-serif text-center mb-8 tracking-widest text-stone-900">{t('roster.history')}</h4>
                                        <div className="relative border-l-2 border-botanical-accent1/30 ml-4 pb-4 space-y-10">
                                            {selectedPerson.interactions.map(inter => {
                                                const moodMap: Record<number, { emoji: string, bg: string }> = {
                                                    1: { emoji: '😞', bg: 'bg-indigo-50 border-indigo-200' },
                                                    2: { emoji: '😐', bg: 'bg-stone-50 border-stone-200' },
                                                    3: { emoji: '🙂', bg: 'bg-green-50 border-green-200' },
                                                    4: { emoji: '😄', bg: 'bg-amber-50 border-amber-200' }
                                                };
                                                const mood = moodMap[inter.mood_score || 3] || moodMap[3];

                                                let tagsList: string[] = [];
                                                if (inter.tags) {
                                                    try {
                                                        const cleaned = inter.tags.trim();
                                                        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                                                            // Legacy JSON string storage
                                                            tagsList = JSON.parse(cleaned);
                                                        } else {
                                                            // Standard CSV
                                                            tagsList = cleaned.split(',').map((t: string) => t.trim());
                                                        }
                                                    } catch (e) {
                                                        // Fallback to CSV if JSON parsing fails
                                                        tagsList = inter.tags.split(',').map((t: string) => t.trim());
                                                    }
                                                }
                                                tagsList = tagsList.filter(Boolean);

                                                return (
                                                    <div key={inter.id} className="relative pl-8">
                                                        {/* Timeline Node */}
                                                        <div className={`absolute - left - [17px] top - 0 w - 8 h - 8 rounded - full border - 2 flex items - center justify - center text - sm shadow - sm ${mood.bg} z - 10`}>
                                                            {mood.emoji}
                                                        </div>

                                                        {/* Interaction Card */}
                                                        <div className="relative bg-[#fcfaf5] p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 transition-transform hover:-translate-y-1">

                                                            <div className="flex flex-wrap justify-between items-start mb-3 border-b border-stone-200/50 pb-2 gap-2">
                                                                <span className="text-xs font-sans tracking-wider text-stone-500 font-semibold whitespace-nowrap">🗓️ {inter.date}</span>

                                                                <div className="flex flex-wrap gap-1 justify-end">
                                                                    {tagsList.map((tag: string, idx: number) => (
                                                                        <span key={idx} className="bg-botanical-accent1/10 text-botanical-text border border-botanical-accent1/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <p className="italic text-stone-700 whitespace-pre-wrap leading-relaxed">{inter.raw_text}</p>

                                                            <div className="mt-3 text-right">
                                                                <span className="text-[10px] text-amber-500 font-bold opacity-80" title="Quality Score">{'★'.repeat(inter.quality_score)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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

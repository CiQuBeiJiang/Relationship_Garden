import { motion } from 'framer-motion';
import { type Person } from '../api';
import { useSettings } from '../contexts/SettingsContext';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface PlantCardProps {
    person: Person;
    inStack?: boolean;
    stackIndex?: number;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent, id: number) => void;
}

export default function PlantCard({ person, inStack = false, stackIndex = 0, onClick, onDragStart }: PlantCardProps) {
    const { t } = useSettings();
    const isInteractive = !inStack || stackIndex === 0;

    // Use derived state from Person object
    const p = person;
    const completeness = p.completeness_score || 0; // 0 to 100

    // Calculate a rough "Confidence Score" based on last contact date
    // (Actual backend logic might differ, we use a simple heuristic here or mock if missing)
    // Here we'll just derive one for visual purposes or use affection score
    // Let's use affection_score for now as a proxy for "Confidence" in this visual refactor
    const confidence = p.affection_score || 50;

    // Determine Plant Type (Flower vs Grass)
    // Default to Grass if undetermined
    const tagsStr = p.tags?.toLowerCase() || '';
    const isFlower = tagsStr.includes('flower') || tagsStr.includes('花');

    // Growth scale (0.3 to 1.0 based on completeness)
    const growthScale = 0.3 + (completeness / 100) * 0.7;

    // Health states
    let healthState: 'flourishing' | 'normal' | 'withered' = 'normal';
    if (confidence > 60) healthState = 'flourishing';
    else if (confidence <= 30) healthState = 'withered';

    // SVG Colors based on Health
    const stemColor = healthState === 'withered' ? '#8a7d65' : healthState === 'flourishing' ? '#2e6f40' : '#4a8258';
    const leafColor = healthState === 'withered' ? '#c2b280' : healthState === 'flourishing' ? '#3d8c53' : '#65a77b';
    const flowerColor = healthState === 'withered' ? '#a57a86' : healthState === 'flourishing' ? '#e26d9e' : '#d28fac';

    const stackTransforms = inStack ? [
        "rotate(0deg) translateY(0px)",
        "rotate(-3deg) translateY(6px) translateX(-2px)",
        "rotate(2deg) translateY(10px) translateX(2px)"
    ] : ["rotate(0deg)"];

    const activeTransform = inStack ? stackTransforms[Math.min(stackIndex, 2)] : stackTransforms[0];

    const getStatusText = () => {
        if (isFlower) {
            if (healthState === 'flourishing') return '🌸 盛开 (Blooming)';
            if (healthState === 'normal') return '🌱 绿叶 (Growing)';
            return '🥀 枯萎 (Withered)';
        } else {
            if (healthState === 'flourishing') return '🌿 茂盛 (Flourishing)';
            if (healthState === 'normal') return '🌱 正常 (Normal)';
            return '🍂 泛黄 (Drying)';
        }
    };

    return (
        <div
            className={cn(
                "absolute inset-0 flex flex-col justify-end overflow-visible",
                isInteractive ? "cursor-pointer group" : ""
            )}
            style={{ transform: activeTransform, zIndex: 10 - stackIndex }}
            draggable={isInteractive}
            onDragStart={(e) => isInteractive && onDragStart && onDragStart(e, p.id)}
            onClick={() => {
                if (inStack) return;
                if (isInteractive && onClick) onClick();
            }}
        >
            {/* Background Container - Glassmorphism Pot */}
            <div className={cn(
                "absolute inset-0 rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col items-center justify-end pb-8",
                "bg-white/20 backdrop-blur-md border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
                !isInteractive && "opacity-80 grayscale-[30%]",
                isInteractive && "group-hover:-translate-y-2 group-hover:shadow-[0_12px_40px_rgba(46,111,64,0.15)] group-hover:bg-white/30"
            )}>

                {/* Visual Data Indicators */}
                {isInteractive && (
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
                        <span className="text-[10px] font-mono font-bold text-botanical-text/50 uppercase tracking-widest bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm">
                            H:{completeness}%
                        </span>
                        <span className="text-[10px] font-mono font-bold text-botanical-text/50 uppercase tracking-widest bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm">
                            C:{confidence}%
                        </span>
                    </div>
                )}
                {isInteractive && p.archive_mode && (
                    <div className="absolute top-3 right-3 z-20">
                        <span className="text-[10px] bg-red-900/10 text-red-800 px-2 py-1 rounded uppercase font-bold backdrop-blur-sm border border-red-900/10 shadow-sm">
                            {t('roster.archived')}
                        </span>
                    </div>
                )}


                {/* Dynamic Plant SVG */}
                <div className="relative w-full h-[60%] flex items-end justify-center z-10 pt-4 px-4 overflow-visible">
                    <motion.svg
                        viewBox="0 0 100 150"
                        className="w-[80%] max-h-full overflow-visible drop-shadow-md origin-bottom"
                        initial={{ scaleY: 0.1, opacity: 0 }}
                        animate={{ scaleY: growthScale, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: inStack ? stackIndex * 0.1 : 0 }}
                    >
                        {/* Main Stem */}
                        <motion.path
                            d="M 50,150 Q 55,100 50,50"
                            fill="transparent"
                            stroke={stemColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />

                        {/* Leaves */}
                        <motion.path
                            d="M 52,110 Q 75,100 80,80 Q 60,85 52,110"
                            fill={leafColor}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            style={{ transformOrigin: "52px 110px" }}
                        />
                        <motion.path
                            d="M 48,90 Q 25,80 20,60 Q 40,65 48,90"
                            fill={leafColor}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            style={{ transformOrigin: "48px 90px" }}
                        />
                        <motion.path
                            d="M 51,70 Q 70,60 75,40 Q 55,45 51,70"
                            fill={leafColor}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.1, duration: 0.8 }}
                            style={{ transformOrigin: "51px 70px" }}
                        />

                        {/* Flower Logic */}
                        {isFlower && healthState !== 'withered' && (
                            <motion.g
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 1.5, type: "spring", bounce: 0.4 }}
                                style={{ transformOrigin: "50px 50px" }}
                            >
                                {/* Petals */}
                                <circle cx="40" cy="40" r="12" fill={flowerColor} className="opacity-90" />
                                <circle cx="60" cy="40" r="12" fill={flowerColor} className="opacity-90" />
                                <circle cx="40" cy="60" r="12" fill={flowerColor} className="opacity-90" />
                                <circle cx="60" cy="60" r="12" fill={flowerColor} className="opacity-90" />
                                {/* Center */}
                                <circle cx="50" cy="50" r="8" fill="#fcd34d" />
                            </motion.g>
                        )}
                        {/* Withered Flower state */}
                        {isFlower && healthState === 'withered' && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                            >
                                <path d="M 45,50 Q 35,65 30,70" stroke={flowerColor} strokeWidth="2" fill="none" />
                                <path d="M 55,50 Q 65,65 70,70" stroke={flowerColor} strokeWidth="2" fill="none" />
                                <circle cx="50" cy="50" r="5" fill="#78350f" />
                            </motion.g>
                        )}

                        {/* Extra grass leaves if Grass type and Flourishing */}
                        {!isFlower && healthState === 'flourishing' && (
                            <motion.path
                                d="M 49,50 Q 30,30 25,10 Q 45,20 50,50"
                                fill={leafColor}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1.3, duration: 0.8 }}
                                style={{ transformOrigin: "50px 50px" }}
                            />
                        )}
                        {!isFlower && healthState === 'flourishing' && (
                            <motion.path
                                d="M 51,50 Q 70,30 75,10 Q 55,20 50,50"
                                fill={leafColor}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1.5, duration: 0.8 }}
                                style={{ transformOrigin: "50px 50px" }}
                            />
                        )}

                    </motion.svg>
                </div>

                {/* Pot Base */}
                <div className="relative w-[60%] h-12 bg-stone-200/80 rounded-b-xl border border-white/60 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.05),_0_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center z-20">
                    <div className="absolute top-0 w-full h-2 bg-[#d7ccc0] rounded-t-sm shadow-[inset_0_-1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
                        {/* Soil */}
                        <div className="w-full h-full bg-[#5c4a3d] opacity-90 mx-auto w-[90%] rounded-full mt-0.5"></div>
                    </div>
                    {/* Name Label */}
                    <div className="mt-2 text-center break-words w-full px-2">
                        <span className="font-serif font-bold text-stone-700 text-sm tracking-widest uppercase truncate block">
                            {p.name}
                        </span>
                    </div>
                </div>

                {/* Status Text (visible on hover or always if not in stack) */}
                <div className={cn(
                    "absolute bottom-2 w-full text-center text-[10px] font-sans font-semibold tracking-wider transition-opacity duration-300",
                    isInteractive ? "opacity-0 group-hover:opacity-100 text-stone-500" : "opacity-0"
                )}>
                    {getStatusText()}
                </div>
            </div>
        </div>
    );
}

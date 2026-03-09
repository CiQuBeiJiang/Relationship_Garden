import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'zh' | 'en';
type Theme = 'botanical' | 'dark_forest';

interface Translations {
    [key: string]: {
        zh: string;
        en: string;
    };
}

const dict: Translations = {
    'nav.title': { zh: '关系园丁', en: 'Relationship Gardener' },
    'nav.dashboard': { zh: '观察窗', en: 'Observation' },
    'nav.roster': { zh: '植物志', en: 'Herbarium' },
    'nav.manage': { zh: '栽培区', en: 'Cultivation' },
    'nav.settings': { zh: '设置', en: 'Settings' },

    // Dashboard Strings
    'dash.upcoming': { zh: '近期生辰', en: 'Upcoming Events' },
    'dash.no_events': { zh: '未来 30 天内暂无生日提醒。', en: 'No birthdays within the next 30 days.' },
    'dash.birthday_soon': { zh: '破壳日即将到来:', en: 'Birthday approaching:' },
    'dash.cleansing': { zh: '渐远的联系', en: 'Fading Connections' },
    'dash.no_cleansing': { zh: '全部联系人最新画像动态已确认，未发现衰减记录。', en: 'All profiles up to date. No decay found.' },
    'dash.decay_warning': { zh: '记忆衰减预警: 这份档案已有一年未更新。他现在还具备以下特征吗？', en: 'Decay Warning: This profile hasn\'t been updated in a year. Do they still exhibit:' },
    'dash.verify': { zh: '✅ 确认无误', en: '✅ Verify Data' },

    // Roster Strings
    'roster.archived': { zh: '(已归档)', en: '(Archived)' },
    'roster.no_group': { zh: '无分组', en: 'No Group' },
    'roster.score': { zh: '完整度', en: 'Completeness' },
    'roster.file': { zh: '档案卷宗 - CONFIDENTIAL', en: 'CONFIDENTIAL DOSSIER' },
    'roster.birthday': { zh: '生日', en: 'Birthday' },
    'roster.tags': { zh: '标签', en: 'Tags' },
    'roster.preferences': { zh: '喜好与雷区', en: 'Preferences & Dislikes' },
    'roster.similarities': { zh: '根系交点 (异同之处)', en: 'Similarities & Differences' },
    'roster.unknown': { zh: '未知', en: 'Unknown' },
    'roster.unrecorded': { zh: '尚未记录', en: 'Unrecorded' },
    'roster.unexplored': { zh: '尚未挖掘', en: 'Unexplored' },
    'roster.history': { zh: '回信记录', en: 'Interaction History' },
    'roster.quality': { zh: '质量', en: 'Quality' },

    // Manage Strings
    'manage.add_tab': { zh: '➕ 播种', en: '➕ Add Contact' },
    'manage.log_tab': { zh: '📝 浇水', en: '📝 Log Interaction' },
    'manage.name': { zh: '姓名 (必填)*', en: 'Name (Required)*' },
    'manage.group': { zh: '分组 (归属何处)', en: 'Group' },
    'manage.archive': { zh: '静默归档', en: 'Archive (Disable decay warnings)' },
    'manage.affection': { zh: '当期健康度/好感度', en: 'Current Affection Score' },
    'manage.submit_add': { zh: '种下新种子', en: 'Save Config' },
    'manage.select': { zh: '选择要浇水的植物', en: 'Select Contact' },
    'manage.date': { zh: '互动日期', en: 'Interaction Date' },
    'manage.log_quality': { zh: '互动质量', en: 'Interaction Quality' },
    'manage.diary': { zh: '园丁日记 (发生了什么互动？)*', en: 'Interaction Notes (What happened?)*' },
    'manage.submit_log': { zh: '记录日志', en: 'Submit Log' },

    // Settings Panel
    'settings.title': { zh: '全局设置', en: 'Global Settings' },
    'settings.lang': { zh: '界面语言', en: 'Interface Language' },
    'settings.theme': { zh: '植物园主题', en: 'Botanical Theme' },
    'settings.theme_botanical': { zh: '白昼温室', en: 'Daylight Greenhouse (Light)' },
    'settings.theme_dark': { zh: '暗黑森林', en: 'Dark Forest (Dark)' },
};

interface SettingsContextProps {
    language: Language;
    theme: Theme;
    setLanguage: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('zh');
    const [theme, setTheme] = useState<Theme>('botanical');

    const t = (key: string): string => {
        if (!dict[key]) return key;
        return dict[key][language];
    };

    return (
        <SettingsContext.Provider value={{ language, theme, setLanguage, setTheme, t }}>
            <div className={`theme-${theme} font-sans`}>
                {children}
            </div>
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

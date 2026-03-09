import streamlit as st
import json
import random
from datetime import datetime
from sqlalchemy.orm import Session
from models import init_db, Person, Interaction

# --- Session State Initialization ---
if 'theme' not in st.session_state:
    st.session_state.theme = 'Light'
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'Dashboard'

# --- UI Configuration (Full Screen, No Sidebar) ---
st.set_page_config(
    page_title="关系园丁 (Relationship Gardener)", 
    page_icon="🌿", 
    layout="wide", 
    initial_sidebar_state="collapsed"
)

# --- Theme & Advanced CSS Generation (Notion-like) ---
def get_theme_css():
    if st.session_state.theme == 'Light':
        # Botanical Garden (Light)
        bg_color = "#FAFAFA"
        text_color = "#333333"
        card_bg = "#FFFFFF"
        accent_btn = "#E8F0FE"
        accent_btn_tx = "#1967D2"
        border_color = "#EAEAEA"
        seal_color = "#D32F2F"
    else:
        # Night Shade (Dark)
        bg_color = "#191919"
        text_color = "#E0E0E0"
        card_bg = "#222222"
        accent_btn = "#2B3C5A"
        accent_btn_tx = "#8AB4F8"
        border_color = "#333333"
        seal_color = "#8B0000"

    css = f"""
    <style>
    /* 1. Global Typography: Notion-like Sans-Serif */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    html, body, [class*="css"] {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        background-color: {bg_color};
        color: {text_color} !important;
        letter-spacing: 0.3px;
        line-height: 1.6;
    }}
    
    h1, h2, h3, h4, h5, h6, strong {{
        font-weight: 600 !important;
        color: {text_color};
    }}

    /* 2. Streamlit Overrides: Total Eradication of Chrome */
    #MainMenu {{display: none !important;}}
    .stDeployButton {{display: none !important;}}
    header {{display: none !important;}}
    footer {{display: none !important;}}
    [data-testid="collapsedControl"] {{display: none !important;}}
    section[data-testid="stSidebar"] {{display: none !important;}}
    
    /* 3. Layout Centering */
    .block-container {{
        max-width: 1080px;
        margin: 0 auto;
        padding-top: 2.5rem;
        padding-bottom: 5rem;
    }}
    
    /* 4. Top Navigation Items */
    .nav-container {{
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
    }}

    /* 5. Envelope Cards & UI Containers */
    .envelope-card {{
        background-color: {card_bg};
        border: 1px solid {border_color};
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* Soft suspension shadow */
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }}
    .envelope-card:hover {{
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* Uplift Effect */
    }}
    
    /* Wax Seal */
    .wax-seal {{
        position: absolute;
        top: -12px;
        right: 24px;
        background: linear-gradient(135deg, {seal_color}, #A00000);
        color: #fff !important;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.1rem;
        font-weight: bold;
        box-shadow: inset 0 0 4px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
    }}
    
    .flower-viz {{
        position: absolute;
        bottom: 15px;
        right: 20px;
        font-size: 1.8rem;
    }}
    
    .card-title {{ margin: 0; font-size: 1.25rem; font-weight: 600; }}
    .card-subtitle {{ font-size: 0.85rem; opacity: 0.7; margin-bottom: 12px; margin-top: 4px; }}
    
    /* 6. Dashboard Action Cards */
    .dash-card {{
        background-color: {card_bg};
        border: 1px solid {border_color};
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }}
    
    .verify-hint {{
        background-color: rgba(255, 152, 0, 0.1);
        border-left: 3px solid #FF9800;
        padding: 10px 15px;
        border-radius: 4px;
        color: {text_color};
        font-size: 0.9rem;
        margin-bottom: 10px;
    }}
    
    /* Inputs Override */
    .stTextInput > div > div > input, .stTextArea > div > textarea, .stSelectbox > div > div {{
        background-color: {card_bg} !important;
        border: 1px solid {border_color} !important;
        border-radius: 6px !important;
        color: {text_color} !important;
    }}
    div[data-baseweb="select"] > div {{
        background-color: {card_bg} !important;
        border-color: {border_color} !important;
    }}
    </style>
    """
    return css

st.markdown(get_theme_css(), unsafe_allow_html=True)


# --- DB Setup ---
@st.cache_resource
def get_db_session_factory():
    engine, SessionLocal = init_db('sqlite:///app.db')
    return SessionLocal

SessionLocal = get_db_session_factory()
def get_session():
    return SessionLocal()

# --- Logic & Callbacks ---
def verify_timestamp_callback(person_id: int):
    """Refreshes dynamic field timestamps back to current datetime."""
    with get_session() as session:
        person = session.query(Person).get(person_id)
        if person:
            person.preferences_updated_at = datetime.utcnow()
            person.similarities_updated_at = datetime.utcnow()
            session.commit()

def mock_extract_keywords(text: str) -> list:
    if not text: return []
    return random.sample(text.split(), min(3, len(text.split()))) if len(text.split()) > 0 else []

def get_flower_viz(score):
    if score == 100: return "🌸"
    elif score >= 50: return "🌷"
    else: return "🥀"

def is_birthday_upcoming(birthday: datetime.date, days_ahead=30) -> bool:
    if not birthday: return False
    today = datetime.now().date()
    try: closest_bday = birthday.replace(year=today.year)
    except ValueError: closest_bday = birthday.replace(year=today.year, month=3, day=1)
        
    if closest_bday < today:
        try: closest_bday = closest_bday.replace(year=today.year + 1)
        except ValueError: closest_bday = closest_bday.replace(year=today.year + 1, month=3, day=1)
             
    return 0 <= (closest_bday - today).days <= days_ahead


# --- Components ---
def render_top_nav():
    st.markdown("<h2 style='text-align: center; font-weight: 600; margin-bottom: 0;'>🌿 关系园丁 Relationship Gardener</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #888; margin-bottom: 25px;'>Nurture your connections</p>", unsafe_allow_html=True)
    
    cols = st.columns([1, 1.5, 1.5, 1.5, 1])
    
    with cols[1]:
        if st.button("🌱 仪表盘 (Dashboard)", use_container_width=True):
            st.session_state.current_page = 'Dashboard'
            st.rerun()
    with cols[2]:
        if st.button("✉️ 信封名册 (Roster)", use_container_width=True):
            st.session_state.current_page = 'Roster'
            st.rerun()
    with cols[3]:
        if st.button("✍️ 园丁中心 (Manage)", use_container_width=True):
            st.session_state.current_page = 'Manage'
            st.rerun()
    with cols[4]:
        theme = "🌙 Mode" if st.session_state.theme == 'Light' else "☀️ Mode"
        if st.button(theme, use_container_width=True):
            st.session_state.theme = 'Dark' if st.session_state.theme == 'Light' else 'Light'
            st.rerun()

    st.markdown("<hr style='margin-bottom: 30px; border-color: rgba(128,128,128,0.15);'>", unsafe_allow_html=True)

# --- Pages ---

def render_dashboard():
    col_main, col_verify = st.columns([1, 1.2], gap="large")
    
    with get_session() as session:
        people = session.query(Person).all()
        
        # 1. Upcoming Birthdays
        upcoming_bdays = [p for p in people if is_birthday_upcoming(p.birthday)]
        upcoming_bdays.sort(key=lambda x: (x.birthday.replace(year=datetime.now().year) - datetime.now().date()).days % 365 if x.birthday else 999)
        
        with col_main:
            st.subheader("🎂 近期事件 (Upcoming Events)")
            if not upcoming_bdays:
                st.info("未来 30 天内暂无生日提醒。")
            else:
                for p in upcoming_bdays:
                    st.markdown(f"""
                    <div class="dash-card">
                        <h4 style="margin:0;">🎈 {p.name}</h4>
                        <p style="margin:5px 0 0 0; font-size:0.95em; opacity:0.8;">破壳日即将到来: <strong>{p.birthday.strftime('%m-%d')}</strong></p>
                    </div>
                    """, unsafe_allow_html=True)

        # 2. Data Cleansing & Verifications (Decay Logics)
        with col_verify:
            st.subheader("🧹 数据清洗 (Low Confidence Data)")
            
            decayed = [p for p in people if not p.archive_mode and p.needs_verification]
            
            if not decayed:
                st.success("全部联系人最新画像动态已确认，未发现衰减记录。")
            else:
                for p in decayed:
                    # Identify what decayed
                    reason = p.needs_verification
                    oldest_field = p.preferences if reason == 'preferences' else p.similarities_and_differences
                    # Truncate logic cleanly
                    snippet = oldest_field[:20] + "..." if oldest_field and len(oldest_field) > 20 else oldest_field
                    
                    st.markdown(f"""
                    <div class="dash-card">
                        <h4 style="margin:0; padding-bottom:10px;">📉 {p.name} 的画像置信度降低 ({p.completeness_score} 分)</h4>
                        <div class="verify-hint">
                            <strong>记忆衰减预警:</strong> {p.name} 的档案已有一年未更新。他现在还具备 <em>[{snippet}]</em> 的特征吗？
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Interactivity mapping: Verify Button (resets timestamp locally)
                    if st.button(f"✅ 确认无误 (Verify: {p.name})", key=f"verify_{p.id}"):
                        verify_timestamp_callback(p.id)
                        st.rerun()


def render_roster():
    with get_session() as session:
        people = session.query(Person).all()
        if not people:
            st.info("名册空空如也，请先添加联系人 (Add Profiles first).")
            return

        col_search, col_filter = st.columns([1, 1])
        with col_search:
            search_q = st.text_input("🔍 按姓名搜索 (Search by name)", "")
        with col_filter:
            all_groups = list(set([p.group_name for p in people if p.group_name]))
            selected_group = st.selectbox("📂 按分组归档筛选 (Filter by group)", options=["全部"] + all_groups)
            
        filtered = people
        if selected_group != "全部": filtered = [p for p in filtered if p.group_name == selected_group]
        if search_q.strip(): filtered = [p for p in filtered if search_q.lower() in p.name.lower()]
            
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Flexbox Envelope Grid implementation inside Streamlit columns
        cols = st.columns(3)
        for i, person in enumerate(filtered):
            with cols[i % 3]:
                # CSS Visualization Properties
                flower = get_flower_viz(person.completeness_score)
                seal_char = person.name[0].upper() if person.name else "?"
                archived_txt = "<span style='color:#F44336; font-size:0.7em;'>(已归档)</span>" if person.archive_mode else ""
                
                # HTML Architecture of Card
                st.markdown(f"""
                <div class="envelope-card">
                    <div class="wax-seal">{seal_char}</div>
                    <div class="flower-viz" title="置信分: {person.completeness_score}">{flower}</div>
                    <h3 class="card-title">{person.name} {archived_txt}</h3>
                    <div class="card-subtitle">{person.group_name or '无分组'} | 完整度: {person.completeness_score} 分</div>
                </div>
                """, unsafe_allow_html=True)
                
                # Expandable Deep Log inside Grid col
                with st.expander("阅读详细信件 (Deep Dive)"):
                    st.write(f"**🎂 生日:** {person.birthday if person.birthday else '未知'}")
                    st.write(f"**🏷️ 标签:** {person.tags if person.tags else '暂无'}")
                    st.write(f"**💡 喜好/雷区:** {person.preferences if person.preferences else '暂未记录'}")
                    st.write(f"**🔍 异同点:** {person.similarities_and_differences if person.similarities_and_differences else '尚未挖掘'}")
                    
                    interactions = session.query(Interaction).filter(Interaction.person_id == person.id).order_by(Interaction.date.desc()).all()
                    if interactions:
                        st.markdown("---")
                        for inter in interactions:
                            st.caption(f"🗓️ {inter.date} | 质量: {'★'*inter.quality_score}")
                            st.markdown(f"<p style='font-size:0.9em; margin:0;'>{inter.raw_text}</p>", unsafe_allow_html=True)
                    else:
                        st.write("暂无互动日志...")

def render_manage():
    tab_add, tab_record = st.tabs(["➕ 播种 (Add Contact Profile)", "📝 浇水 (Log Interaction)"])
    
    with tab_add:
        with st.form("add_person_form"):
            col1, col2 = st.columns(2)
            with col1:
                name = st.text_input("姓名 (必填)*")
                group_name = st.text_input("分组 (归属何处)")
                birthday = st.date_input("生日", value=None)
                base_interval = st.number_input("浇水频率 (每 X 天主动联系)", min_value=1, value=30)
                archive_mode = st.checkbox("静默归档 (不再主动提示缺陷与清洗)")
            
            with col2:
                affection_score = st.slider("当期健康度/好感度 (0-100)", min_value=0, max_value=100, value=50)
                tags = st.text_input("标记字典 (用逗号分隔)")
                preferences = st.text_area("肥料偏好 (喜好/雷区)")
                similarities = st.text_area("根系交点 (共同爱好/渊源)")
                
            submitted = st.form_submit_button("种下新种子 (Save Profile)", type="primary")
            
            if submitted:
                if name.strip():
                    with get_session() as session:
                        new_person = Person(
                            name=name.strip(), base_interval=base_interval,
                            birthday=birthday, preferences=preferences,
                            similarities_and_differences=similarities,
                            affection_score=affection_score, group_name=group_name, tags=tags,
                            archive_mode=archive_mode,
                            preferences_updated_at=datetime.utcnow(),
                            similarities_updated_at=datetime.utcnow()
                        )
                        session.add(new_person)
                        session.commit()
                    st.success(f"🌱 成功添加: {name}")
                else:
                    st.error("姓名不能为空。")

    with tab_record:
        with get_session() as session:
            people = session.query(Person).all()
            if not people:
                st.warning("花园空旷，先去播种吧。")
            else:
                person_options = {p.name: p.id for p in people}
                with st.form("record_interaction_form"):
                    selected_name = st.selectbox("选择要浇水的植物 (Select Object)", options=list(person_options.keys()))
                    col_date, col_score = st.columns([1,2])
                    with col_date:
                        interaction_date = st.date_input("互动日期", value=datetime.now().date())
                    with col_score:
                        quality_score = st.slider("互动质量 (星级)", min_value=1, max_value=5, value=3)
                        
                    raw_text = st.text_area("园丁日记 (Log your interaction details here)*")
                    submitted_int = st.form_submit_button("记录日志 (Submit Log)", type="primary")
                    
                    if submitted_int:
                        if not raw_text.strip():
                            st.error("日志不能为空。")
                        else:
                            person_id = person_options[selected_name]
                            tags_ext = mock_extract_keywords(raw_text)
                            
                            new_int = Interaction(
                                person_id=person_id, date=interaction_date, raw_text=raw_text,
                                quality_score=quality_score, tags=json.dumps(tags_ext)
                            )
                            session.add(new_int)
                            
                            p_record = session.query(Person).get(person_id)
                            if not p_record.last_contact_date or interaction_date > p_record.last_contact_date:
                                p_record.last_contact_date = interaction_date
                                
                            session.commit()
                            st.success(f"💦 浇水完成！AI智能提取: {', '.join(tags_ext)}")


# --- Main Application Execution ---
def main():
    render_top_nav()
    
    # Simple Router Layer driven by session_state
    if st.session_state.current_page == 'Dashboard':
        render_dashboard()
    elif st.session_state.current_page == 'Roster':
        render_roster()
    elif st.session_state.current_page == 'Manage':
        render_manage()

if __name__ == '__main__':
    main()

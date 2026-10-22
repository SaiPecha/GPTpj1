import React, { useEffect, useRef, useState } from 'react';
import { Radar, LayoutDashboard, BookOpen, FlaskConical, BookA, ChartNoAxesCombined, Bookmark, ArrowUpRight, ArrowRight, ChevronRight, Search, SlidersHorizontal, Menu, X, Clock3, CircleCheck, LockKeyholeOpen, Sparkles, Radio, Waves, Antenna, Satellite, Target, Layers, GraduationCap, Check, RotateCcw, Palette, ChevronLeft, Info, ExternalLink, Trophy, CircleHelp, Zap } from 'lucide-react';
import { lessons } from './data/curriculum.js';
import RadarLab from './components/RadarLab.jsx';

const levels = {
  beginner: { label: 'Начальный', number: '01', caption: 'Поймать первый сигнал', description: 'Начни с главного: как радар видит мир и зачем ему антенна.', icon: Radio },
  intermediate: { label: 'Средний', number: '02', caption: 'Увидеть больше', description: 'Разберись в Доплере, решётках и обработке отражённого сигнала.', icon: Layers },
  advanced: { label: 'Продвинутый', number: '03', caption: 'Понять глубже', description: 'Исследуй разрешение, когерентность и сопровождение целей.', icon: Satellite },
};
const themes = [
  { id: 'forest', name: 'Лесной сигнал', color: '#ace787' },
  { id: 'ocean', name: 'Глубокий океан', color: '#78c4fb' },
  { id: 'violet', name: 'Ультрафиолет', color: '#c5a2fc' },
  { id: 'amber', name: 'Янтарный экран', color: '#edbf77' },
  { id: 'rose', name: 'Полярное сияние', color: '#f2a4bc' },
];
const iconMap = { radar: Radar, waves: Waves, antenna: Antenna, antennas: Antenna, radio: Radio, satellite: Satellite, target: Target, layers: Layers, signal: ChartNoAxesCombined, doppler: Waves, array: Layers, processing: ChartNoAxesCombined, tracking: Target };
const nav = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { id: 'courses', label: 'Программа обучения', icon: BookOpen },
  { id: 'lab', label: 'Лаборатория', icon: FlaskConical, badge: 'LIVE' },
  { id: 'tests', label: 'Проверка знаний', icon: CircleHelp },
  { id: 'glossary', label: 'Глоссарий', icon: BookA },
];

function useSaved(key, initial, valid) {
  const [value, setValue] = useState(() => {
    try { const stored = JSON.parse(localStorage.getItem(key)); return stored !== null && valid(stored) ? stored : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Learning remains available when storage is unavailable. */ } }, [key, value]);
  return [value, setValue];
}
const validProgress = (v) => v && !Array.isArray(v) && typeof v === 'object' && Object.values(v).every(p => p && typeof p === 'object' && typeof p.read === 'boolean' && Number.isInteger(p.best) && p.best >= 0 && p.best <= 4 && Number.isInteger(p.attempts) && p.attempts >= 0);
const readRoute = () => { const raw = location.hash.slice(1) || 'overview'; try { return decodeURIComponent(raw); } catch { return raw; } };
const go = (route) => { if (location.hash === `#${route}`) window.scrollTo({ top: 0, behavior: 'smooth' }); else location.hash = route; };
const isPassed = (progress, id) => (progress[id]?.best || 0) >= 3;
const plural = (n, one, few, many) => n % 100 >= 11 && n % 100 <= 14 ? many : n % 10 === 1 ? one : n % 10 >= 2 && n % 10 <= 4 ? few : many;

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [theme, setTheme] = useSaved('radar.theme', 'forest', v => themes.some(t => t.id === v));
  const [progress, setProgress] = useSaved('radar.progress', {}, validProgress);
  const [bookmarks, setBookmarks] = useSaved('radar.bookmarks', [], v => Array.isArray(v) && v.every(id => typeof id === 'string'));
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [themeOpen, setThemeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const searchRef = useRef(null);
  const paletteRef = useRef(null);
  const [page, lessonId] = route.split('/');
  const lesson = lessons.find(l => l.id === lessonId);
  const complete = lessons.filter(l => isPassed(progress, l.id)).length;
  const percent = Math.round(complete / lessons.length * 100);
  const nextLesson = lessons.find(l => !isPassed(progress, l.id)) || lessons[0];

  useEffect(() => {
    const handle = () => { setRoute(readRoute()); setMenuOpen(false); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const change = () => { setMobile(media.matches); if (!media.matches) setMenuOpen(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const key = e => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setThemeOpen(false); setMenuOpen(false); searchRef.current?.blur(); }
    };
    const outside = e => { if (!paletteRef.current?.contains(e.target)) setThemeOpen(false); };
    window.addEventListener('keydown', key); window.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', outside); };
  }, []);
  useEffect(() => {
    const name = lesson?.title || [...nav, { id: 'progress', label: 'Мой прогресс' }, { id: 'bookmarks', label: 'Избранное' }].find(n => n.id === page)?.label || 'Страница не найдена';
    document.title = `${name} — РАДАР`;
  }, [route, lesson, page]);

  const toggleBookmark = id => setBookmarks(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const markRead = id => setProgress(old => ({ ...old, [id]: { best: 0, attempts: 0, ...old[id], read: true } }));
  const saveResult = (id, score) => setProgress(old => ({ ...old, [id]: { read: old[id]?.read || false, best: Math.max(old[id]?.best || 0, score), attempts: (old[id]?.attempts || 0) + 1 } }));
  const startCourse = (selectedLevel = 'all') => { setQuery(''); setLevel(selectedLevel); go('courses'); };
  const pageTitle = page === 'lesson' || page === 'test' ? 'Программа обучения' : [...nav, { id: 'progress', label: 'Мой прогресс' }, { id: 'bookmarks', label: 'Избранное' }].find(n => n.id === page)?.label || 'Страница не найдена';
  const filtered = lessons.filter(l => (level === 'all' || l.level === level) && `${l.title} ${l.subtitle} ${l.category} ${l.terms.map(t => t.term).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  const cardProps = { progress, bookmarks, toggleBookmark };

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content').focus(); }}>Перейти к содержимому</a>
    {menuOpen && <button className="mobile-scrim" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Основная навигация" inert={mobile && !menuOpen} onClick={e => { if (e.target.closest('a')) setMenuOpen(false); }}>
      <a className="brand" href="#overview" aria-label="РАДАР — на главную"><span className="brand-mark"><Radar size={27} strokeWidth={1.5} /></span><span><strong>РАДАР<span className="brand-dot">.</span></strong><small>АКАДЕМИЯ РАДИОЛОКАЦИИ</small></span></a>
      <div className="sidebar-section-label">ТВОЯ НАВИГАЦИЯ</div>
      <nav className="nav-list">{nav.map(n => <a key={n.id} href={`#${n.id}`} className={`nav-link ${(page === n.id || (n.id === 'courses' && page === 'lesson') || (n.id === 'tests' && page === 'test')) ? 'active' : ''}`} aria-current={page === n.id ? 'page' : undefined}><n.icon size={19} strokeWidth={1.6} /><span>{n.label}</span>{n.badge && <span className="live-badge">{n.badge}</span>}</a>)}</nav>
      <div className="sidebar-section-label personal-label">ЛИЧНОЕ ПРОСТРАНСТВО</div>
      <nav className="nav-list"><a className={`nav-link ${page === 'progress' ? 'active' : ''}`} href="#progress"><ChartNoAxesCombined size={19} strokeWidth={1.6} /><span>Мой прогресс</span></a><a className={`nav-link ${page === 'bookmarks' ? 'active' : ''}`} href="#bookmarks"><Bookmark size={19} strokeWidth={1.6} /><span>Избранное</span>{bookmarks.length > 0 && <span className="nav-count">{bookmarks.length}</span>}</a></nav>
      <div className="sidebar-bottom">
        <a className="sidebar-progress" href="#progress"><div><span className="status-dot" /> ТВОЙ СИГНАЛ</div><p>{complete === 0 ? 'Всё начинается с интереса' : complete === lessons.length ? 'Все сигналы приняты!' : 'С каждым уроком — яснее'}</p><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><small>{complete} из {lessons.length} тем пройдено <b>{percent}%</b></small></a>
        <div className="sidebar-theme"><span><Palette size={14} /> Атмосфера</span><div className="theme-dots">{themes.map(t => <button key={t.id} style={{ '--swatch': t.color }} className={theme === t.id ? 'selected' : ''} aria-label={`Тема: ${t.name}`} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)} />)}</div></div>
        <div className="sidebar-foot"><span className="status-dot" /> Любопытство на связи <span>v1.0</span></div>
      </div>
    </aside>

    <div className="workspace">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button>
        <div className="breadcrumb"><span>Академия</span><ChevronRight size={13} /><b>{pageTitle}</b></div>
        <form className="global-search" role="search" onSubmit={e => { e.preventDefault(); setLevel('all'); go('courses'); }}><Search size={17} /><input ref={searchRef} aria-label="Найти тему" placeholder="Найти тему или понятие…" value={query} onChange={e => { setQuery(e.target.value); setLevel('all'); if (page !== 'courses') go('courses'); }} />{query ? <button type="button" className="search-clear" aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={14} /></button> : <kbd>/</kbd>}</form>
        <div className="theme-menu" ref={paletteRef}><button className={`icon-button ${themeOpen ? 'pressed' : ''}`} aria-label="Выбрать оформление" aria-expanded={themeOpen} onClick={() => setThemeOpen(!themeOpen)}><SlidersHorizontal size={19} /></button>{themeOpen && <div className="theme-popover" role="dialog" aria-label="Цветовая тема"><strong>Твоя атмосфера</strong><p>Пять оттенков тёмного</p>{themes.map(t => <button key={t.id} onClick={() => { setTheme(t.id); setThemeOpen(false); }} aria-pressed={theme === t.id}><i style={{ background: t.color }} />{t.name}{theme === t.id && <Check size={16} />}</button>)}</div>}</div>
        <a className="avatar" href="#progress" aria-label="Мой прогресс"><Radio size={19} /></a>
      </header>

      <main id="main-content" tabIndex={-1} key={page}>
        {page === 'overview' && <>
          <div className="page-intro"><span><span className="status-dot" /> НА ЧАСТОТЕ ЗНАНИЙ</span><span className="intro-note">Твой путь в мир радиолокации</span></div>
          <section className="hero">
            <div className="hero-content"><div className="eyebrow"><span className="tiny-line" /> ОТ ЛЮБОПЫТСТВА К ПОНИМАНИЮ</div><h1>Мир радаров.<br /><em>На понятном языке.</em></h1><p>Узнай, как увидеть невидимое. Антенны, радиоволны,<br className="desktop-break" /> эффект Доплера — от первого эха до сложных систем.</p><div className="hero-actions"><button className="button primary" onClick={() => go(`lesson/${nextLesson.id}`)}>{complete ? 'Продолжить обучение' : 'Начать обучение'}<ArrowUpRight size={19} /></button><button className="button quiet" onClick={() => go('lab')}><span className="play-symbol">▷</span> Открыть лабораторию</button></div><div className="hero-facts"><span><BookOpen size={15} /><b>{lessons.length}</b> тем</span><i /><span><CircleHelp size={15} /><b>{lessons.reduce((n,l) => n+l.questions.length,0)}</b> вопросов</span><i /><span><LockKeyholeOpen size={15} /> Без регистрации</span></div></div>
            <div className="hero-visual"><span className="scope-label"><span className="status-dot" /> СИГНАЛ ОБНАРУЖЕН</span><RadarLab compact /><div className="visual-caption"><span>ОБЗОР ПРОСТРАНСТВА</span><span>360°</span></div></div>
          </section>
          <div className="benefit-strip"><span><span className="benefit-icon"><Waves size={18} /></span><b>Сначала понять.</b> Потом запомнить.</span><span><Sparkles size={16} /> Интерактивные объяснения</span><span><GraduationCap size={18} /> От основ до деталей</span></div>
          <section className="section learning-path"><div className="section-heading"><div><div className="eyebrow">ШАГ ЗА ШАГОМ</div><h2>У каждого сигнала есть начало</h2></div><button className="text-link" onClick={() => startCourse()}>Вся программа <ArrowRight size={16} /></button></div><div className="path-grid">{Object.entries(levels).map(([id, l]) => <button className={`path-card path-${id}`} key={id} onClick={() => startCourse(id)}><div className="path-card-top"><span className="path-icon"><l.icon size={22} strokeWidth={1.5} /></span><span className="path-number">{l.number}</span></div><span className={`level-label ${id}`}>{l.label}</span><h3>{l.caption}</h3><p>{l.description}</p><div className="path-card-foot"><span>4 темы <i>·</i> {lessons.filter(x => x.level === id).reduce((a,x) => a+x.duration,0)} мин</span><ArrowUpRight size={19} /></div></button>)}</div></section>
          <section className="section"><div className="section-heading"><div><div className="eyebrow">ПЕРВАЯ ТОЧКА НА ЭКРАНЕ</div><h2>{complete ? 'Продолжим исследование?' : 'Начни с самого интересного'}</h2></div><span className="muted small">Материал → понимание → тест</span></div><div className="course-grid">{[nextLesson, ...lessons.filter(l => l.id !== nextLesson.id)].slice(0,3).map((l,i) => <CourseCard key={l.id} lesson={l} index={i} {...cardProps} />)}</div></section>
          <section className="lab-banner"><div className="banner-icon"><FlaskConical size={28} strokeWidth={1.4} /></div><div><span className="eyebrow">ПОПРОБУЙ В ДЕЙСТВИИ</span><h3>Теория оживает в лаборатории</h3><p>Управляй обзором, наблюдай эхо и исследуй эффект Доплера.</p></div><button className="button secondary" onClick={() => go('lab')}>Экспериментировать<ArrowUpRight size={17} /></button></section>
        </>}

        {(page === 'courses' || page === 'tests' || page === 'bookmarks') && <>
          <PageHeading eyebrow={page === 'tests' ? 'ОТ ПОНИМАНИЯ К УВЕРЕННОСТИ' : page === 'bookmarks' ? 'ВСЕГДА ПОД РУКОЙ' : 'ТВОЯ КАРТА ОБУЧЕНИЯ'} title={page === 'tests' ? 'Проверка знаний' : page === 'bookmarks' ? 'Избранные темы' : 'Программа обучения'} description={page === 'tests' ? 'Никаких вычислений. Только смысл, непростые вопросы и разбор каждого ответа.' : page === 'bookmarks' ? 'Сохраняй интересные темы значком закладки, чтобы быстро вернуться к ним.' : 'Выбирай свой уровень. В каждой теме — материал, ключевые идеи и небольшой тест.'} />
          {page !== 'bookmarks' && <div className="filter-bar"><div className="filter-tabs" role="group" aria-label="Уровень сложности"><button className={level === 'all' ? 'active' : ''} aria-pressed={level === 'all'} onClick={() => setLevel('all')}>Все темы <span>{lessons.length}</span></button>{Object.entries(levels).map(([id,l]) => <button className={level === id ? 'active' : ''} aria-pressed={level === id} key={id} onClick={() => setLevel(id)}>{l.label}</button>)}</div><span className="muted small">{filtered.length} из {lessons.length} тем</span></div>}
          {query && page === 'courses' && <p className="search-summary">Результаты по запросу «{query}» <button className="text-link" onClick={() => setQuery('')}>Сбросить</button></p>}
          <div className="course-grid">{(page === 'bookmarks' ? lessons.filter(l => bookmarks.includes(l.id)) : filtered).map((l,i) => <CourseCard key={l.id} lesson={l} index={lessons.indexOf(l)} {...cardProps} testMode={page === 'tests'} />)}</div>
          {((page === 'bookmarks' && !bookmarks.length) || (page !== 'bookmarks' && !filtered.length)) && <EmptyState icon={page === 'bookmarks' ? Bookmark : Search} title={page === 'bookmarks' ? 'Здесь будут твои находки' : 'Сигнал не найден'} text={page === 'bookmarks' ? 'Открой программу и сохрани тему, которую хочется изучить.' : 'Попробуй другое слово или выбери все уровни.'} action={() => { setQuery(''); startCourse(); }} button={page === 'bookmarks' ? 'Выбрать тему' : 'Показать все темы'} />}
        </>}

        {(page === 'lesson' || page === 'test') && (lesson ? <>
          <button className="back-link" onClick={() => startCourse()}><ChevronLeft size={16} /> К программе</button>
          <div className="lesson-heading"><div className="lesson-tags"><span className={`level-label ${lesson.level}`}>{levels[lesson.level].label}</span><span>{lesson.category}</span><span><Clock3 size={14} />{lesson.duration} мин</span></div><h1>{lesson.title}</h1><p>{lesson.subtitle}</p><button className={`button secondary save-lesson ${bookmarks.includes(lesson.id) ? 'is-saved' : ''}`} onClick={() => toggleBookmark(lesson.id)}><Bookmark size={17} fill={bookmarks.includes(lesson.id) ? 'currentColor' : 'none'} />{bookmarks.includes(lesson.id) ? 'В избранном' : 'Сохранить тему'}</button></div>
          <div className="lesson-tabs"><a href={`#lesson/${lesson.id}`} className={page === 'lesson' ? 'active' : ''}><BookOpen size={17} /> Материал</a><a href={`#test/${lesson.id}`} className={page === 'test' ? 'active' : ''}><CircleHelp size={17} /> Тест <span>{lesson.questions.length}</span></a>{progress[lesson.id]?.read && <span className="read-marker"><CircleCheck size={15} /> Материал прочитан</span>}</div>
          {page === 'lesson' ? <LessonReader lesson={lesson} progress={progress} markRead={markRead} /> : <Quiz key={lesson.id} lesson={lesson} onComplete={score => saveResult(lesson.id,score)} progress={progress} />}
        </> : <NotFound />)}

        {page === 'lab' && <>
          <PageHeading eyebrow="МЕНЯЙ. НАБЛЮДАЙ. ПОНИМАЙ." title="Лаборатория сигналов" description="Небольшой эксперимент поможет увидеть то, о чём говорят учебники. Выбери режим и посмотри, что изменится." />
          <div className="lab-notice"><Info size={18} /><p>Это учебная схема: масштабы и яркость условны. Она объясняет принципы, а не моделирует характеристики реальной РЛС.</p></div><RadarLab /><div className="lab-bottom"><h2>Хочется разобраться глубже?</h2><div className="course-grid">{lessons.filter(l => ['radar-basics','doppler','arrays'].includes(l.id)).map(l => <CourseCard key={l.id} lesson={l} index={lessons.indexOf(l)} {...cardProps} />)}</div></div>
        </>}

        {page === 'glossary' && <Glossary />}
        {page === 'progress' && <ProgressView progress={progress} complete={complete} percent={percent} nextLesson={nextLesson} />}
        {!['overview','courses','tests','bookmarks','lesson','test','lab','glossary','progress'].includes(page) && <NotFound />}
        <footer className="footer"><a href="#overview"><Radar size={15} /> РАДАР<span>Академия радиолокации</span></a><span>Сложные вещи становятся понятными.</span></footer>
      </main>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, description }) { return <div className="page-heading"><div className="eyebrow"><span className="tiny-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>; }

function TopicArt({ lesson, index }) {
  const type = ['radar-basics','radar-types','russian-radars','tracking'].includes(lesson.id) ? 'scope' : ['antennas','arrays','modern-radar'].includes(lesson.id) ? 'antenna' : 'wave';
  return <div className={`topic-art art-${type} art-level-${lesson.level}`} aria-hidden="true"><span className="art-code">RDR / {String(index+1).padStart(2,'0')}</span><svg viewBox="0 0 300 140" fill="none">
    <defs><pattern id={`grid-${lesson.id}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" stroke="currentColor" strokeWidth=".5" opacity=".13" /></pattern><linearGradient id={`fade-${lesson.id}`} x1="0" x2="1"><stop stopColor="currentColor" stopOpacity="0"/><stop offset=".5" stopColor="currentColor" stopOpacity=".9"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><rect width="300" height="140" fill={`url(#grid-${lesson.id})`} />
    {type === 'scope' && <g transform="translate(150,78)"><circle r="54" stroke="currentColor" opacity=".4"/><circle r="36" stroke="currentColor" opacity=".24"/><circle r="18" stroke="currentColor" opacity=".24"/><path d="M-66 0H66M0-66V62" stroke="currentColor" opacity=".2"/><path d="M0 0L38-38A54 54 0 0 0 0-54Z" fill="currentColor" opacity=".1"/><path d="M0 0L38-38" stroke="currentColor"/><circle cx="25" cy="-24" r="3" fill="currentColor"/><circle cx="-28" cy="20" r="2" fill="currentColor" opacity=".5"/><path d="M-30-30l4-4m-2 0h-2v2M34 30l4 4m-2 0h2v-2" stroke="currentColor"/></g>}
    {type === 'antenna' && <g stroke="currentColor"><path d="M125 45Q150 93 190 80L125 45Z" fill="currentColor" fillOpacity=".04"/><path d="m153 77-7 30m17-27 13 27m-39 0h50M143 60l31-29m-6-4 12 12" strokeWidth="1.5"/><circle cx="174" cy="31" r="3" fill="currentColor"/><path d="M185 18q22 11 22 35m-17-47q34 15 34 49m-28-61q46 22 46 63" opacity=".4"/><path d="m108 35 81 48M115 55l54 30" opacity=".3"/><path d="M100 111h102" opacity=".3"/></g>}
    {type === 'wave' && <g stroke="currentColor"><path d="M35 78h230M150 20v100" opacity=".18"/><path d="M30 78C43 78 43 32 56 32S69 124 82 124 95 32 108 32 121 124 134 124 147 32 160 32 173 124 186 124 199 32 212 32 225 124 238 124 251 78 270 78" stroke={`url(#fade-${lesson.id})`} strokeWidth="1.7"/><path d="M46 78C61 78 61 55 76 55s15 46 30 46 15-46 30-46 15 46 30 46 15-46 30-46 15 46 30 46 15-23 30-23" opacity=".18"/><circle cx="160" cy="32" r="3" fill="currentColor"/></g>}
  </svg><span className="art-bottom">{type === 'scope' ? 'ECHO DETECTED' : type === 'antenna' ? 'ANTENNA SYSTEM' : 'SIGNAL PROCESSING'}<span>↗</span></span></div>;
}

function CourseCard({ lesson, index, progress, bookmarks, toggleBookmark, testMode = false }) {
  const Icon = iconMap[lesson.icon] || Radar;
  const passed = isPassed(progress, lesson.id);
  return <article className={`course-card ${passed ? 'completed' : ''}`}><a className="course-art-link" href={`#${testMode ? 'test' : 'lesson'}/${lesson.id}`} aria-label={`${testMode ? 'Тест: ' : 'Изучить: '}${lesson.title}`}><TopicArt lesson={lesson} index={index} /></a><div className="course-card-body"><div className="card-meta"><span className={`level-label ${lesson.level}`}>{levels[lesson.level].label}</span>{lesson.reviewNote && <span className="review-badge">На сверке</span>}<button className={`bookmark-button ${bookmarks.includes(lesson.id) ? 'saved' : ''}`} aria-label={`${bookmarks.includes(lesson.id) ? 'Удалить из избранного' : 'В избранное'}: ${lesson.title}`} aria-pressed={bookmarks.includes(lesson.id)} onClick={() => toggleBookmark(lesson.id)}><Bookmark size={17} fill={bookmarks.includes(lesson.id) ? 'currentColor' : 'none'} /></button></div><a className="course-title" href={`#${testMode ? 'test' : 'lesson'}/${lesson.id}`}><h3>{lesson.title}</h3></a><p>{lesson.subtitle}</p><div className="course-card-foot"><span><Clock3 size={13} />{testMode ? `${lesson.questions.length} вопроса` : `${lesson.duration} мин`}</span><span className={passed ? 'course-passed' : ''}>{passed ? <><CircleCheck size={14} />Пройдено</> : progress[lesson.id]?.read ? <><Icon size={14} />Прочитано</> : <><Icon size={14} />{lesson.category}</>}</span><a href={`#${testMode ? 'test' : 'lesson'}/${lesson.id}`} className="card-arrow" aria-label={`Открыть ${lesson.title}`}><ArrowUpRight size={17} /></a></div></div></article>;
}

function LessonReader({ lesson, progress, markRead }) {
  const next = lessons[lessons.indexOf(lesson)+1];
  return <div className="reader-layout"><article className="lesson-article">{lesson.reviewNote && <div className="source-review"><Info size={19} /><div><strong>Материал на проверке</strong><p>{lesson.reviewNote}</p></div></div>}<div className="lesson-lead"><Sparkles size={20} /><div><strong>Что станет понятнее</strong><p>{lesson.takeaway}</p></div></div>{lesson.sections.map((s,i) => <section id={`section-${i}`} className="reading-section" key={s.title}><div className="section-number">{String(i+1).padStart(2,'0')}</div><h2>{s.title}</h2>{s.paragraphs.map((p,j) => <p key={j}>{p}</p>)}{s.callout && <aside className="knowledge-callout"><Info size={18} /><p>{s.callout}</p></aside>}{i === 0 && <ConceptDiagram id={lesson.id} />}</section>)}<section className="takeaway-box"><span className="eyebrow"><Check size={15} /> ГЛАВНОЕ В ОДНОЙ МЫСЛИ</span><p>{lesson.takeaway}</p></section><section className="lesson-sources"><h3>Куда заглянуть дальше</h3><p>Открытые источники и материалы для самостоятельного изучения.</p>{lesson.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ExternalLink size={13} /></a>)}</section><div className="lesson-finish"><div><h2>Сигнал принят?</h2><p>Проверь, что осталось в памяти. К каждому ответу есть объяснение.</p></div><button className="button primary" onClick={() => { markRead(lesson.id); go(`test/${lesson.id}`); }}>Прочитано, к тесту<ArrowRight size={18} /></button></div></article><aside className="reader-aside"><div className="toc"><span className="eyebrow">В ЭТОЙ ТЕМЕ</span>{lesson.sections.map((s,i) => <button key={i} onClick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span>{String(i+1).padStart(2,'0')}</span>{s.title}</button>)}<div className="toc-bottom"><CircleHelp size={17} /> {lesson.questions.length} вопроса после материала</div></div><div className="term-box"><span className="eyebrow">НОВЫЕ ПОНЯТИЯ</span>{lesson.terms.map(t => <dl key={t.term}><dt>{t.term}</dt><dd>{t.definition}</dd></dl>)}</div>{progress[lesson.id]?.read && <div className="aside-read"><CircleCheck size={17} /> Ты уже прочитал эту тему</div>}{next && <button className="next-lesson" onClick={() => go(`lesson/${next.id}`)}><span className="eyebrow">СЛЕДУЮЩАЯ ТЕМА</span><strong>{next.title}</strong><ArrowRight size={18} /></button>}</aside></div>;
}

function ConceptDiagram({ id }) {
  const [playing, setPlaying] = useState(true);
  const isDoppler = ['doppler','coherent-processing','signal-processing'].includes(id);
  return <figure className={`concept-diagram ${playing ? '' : 'paused'}`}><div className="concept-visual" aria-hidden="true"><div className="diagram-station"><Antenna size={34} strokeWidth={1.4} /><span>РЛС</span></div><div className="diagram-path"><span className="diagram-line" /><span className="signal-dot outgoing" /><span className="signal-dot returning" /><span className="path-label">{isDoppler ? 'Частота посылки →' : 'Переданный сигнал →'}</span><span className="path-label bottom">{isDoppler ? '← Частота эха меняется при сближении' : '← Отражённое эхо'}</span></div><div className="diagram-target"><Target size={34} strokeWidth={1.4} /><span>Объект</span></div></div><figcaption><span>Схема: сигнал проходит путь туда и обратно</span><button className="text-link" aria-pressed={!playing} onClick={() => setPlaying(!playing)}>{playing ? 'Остановить' : 'Продолжить'} анимацию</button></figcaption></figure>;
}

function Quiz({ lesson, onComplete, progress }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const q = lesson.questions[step];
  const score = answers.filter((answer,i) => answer === lesson.questions[i].correct).length;
  const check = () => { if (selected === null || checked) return; setAnswers(old => [...old, selected]); setChecked(true); };
  const next = () => { if (step === lesson.questions.length-1) { setFinished(true); onComplete(score); } else { setStep(step+1); setSelected(null); setChecked(false); } };
  const restart = () => { setStep(0); setSelected(null); setChecked(false); setAnswers([]); setFinished(false); };
  if (finished) return <div className="quiz-result"><div className={`result-icon ${score >= 3 ? 'passed' : ''}`}>{score >= 3 ? <Trophy size={38} /> : <Radio size={38} />}</div><span className="eyebrow">{score >= 3 ? 'ТЕМА ОСВОЕНА' : 'ЕЩЁ НЕМНОГО НАСТРОЙКИ'}</span><h2>{score >= 3 ? 'Отличный приём!' : 'Продолжай исследовать'}</h2><div className="result-score">{score}<span> / {lesson.questions.length}</span></div><p>{score >= 3 ? 'Ты уловил главное. Результат сохранён — можно двигаться дальше.' : 'Ошибки — часть обучения. Вернись к материалу и попробуй ещё раз: для зачёта нужно 3 из 4.'}</p><div className="result-actions"><button className="button primary" onClick={() => { const nextLesson = lessons[lessons.indexOf(lesson)+1]; go(score >= 3 && nextLesson ? `lesson/${nextLesson.id}` : `lesson/${lesson.id}`); }}>{score >= 3 && lessons.indexOf(lesson) < lessons.length-1 ? 'Следующая тема' : 'Вернуться к материалу'}<ArrowRight size={17} /></button><button className="button secondary" onClick={restart}><RotateCcw size={16} />Попробовать снова</button></div><div className="answer-review"><h3>Разбор ответов</h3>{lesson.questions.map((question,i) => <div key={i}><span className={answers[i] === question.correct ? 'answer-right' : 'answer-wrong'}>{answers[i] === question.correct ? <CircleCheck size={18} /> : <X size={18} />}</span><div><strong>{question.prompt}</strong><p>Твой ответ: {question.options[answers[i]]}</p>{answers[i] !== question.correct && <p className="answer-right">Верно: {question.options[question.correct]}</p>}<p>{question.explanation}</p></div></div>)}</div></div>;
  return <div className="quiz-layout"><div className="quiz-card"><div className="quiz-topline"><span className="eyebrow">ПРОВЕРЯЕМ ПОНИМАНИЕ</span><span>Вопрос {step+1} из {lesson.questions.length}</span></div><div className="quiz-steps">{lesson.questions.map((_,i) => <span key={i} className={i < step ? 'done' : i === step ? 'current' : ''} />)}</div><h2>{q.prompt}</h2><fieldset className="quiz-options" disabled={checked}><legend className="sr-only">Выбери один ответ</legend>{q.options.map((option,i) => <label key={i} className={`quiz-option ${selected === i ? 'selected' : ''} ${checked && i === q.correct ? 'correct' : ''} ${checked && selected === i && i !== q.correct ? 'incorrect' : ''}`}><input type="radio" name={`question-${step}`} value={i} checked={selected === i} onChange={() => setSelected(i)} /><span className="option-letter">{String.fromCharCode(65+i)}</span><span>{option}</span>{checked && i === q.correct && <CircleCheck size={19} />}{checked && selected === i && i !== q.correct && <X size={19} />}</label>)}</fieldset>{checked && <div className={`quiz-explanation ${selected === q.correct ? 'right' : 'wrong'}`} role="status"><strong>{selected === q.correct ? 'Верно. Сигнал принят!' : 'Не совсем. Давай разберёмся.'}</strong><p>{q.explanation}</p></div>}<div className="quiz-actions"><span>Без таймера. Подумай спокойно.</span>{checked ? <button className="button primary" onClick={next}>{step === lesson.questions.length-1 ? 'Посмотреть результат' : 'Следующий вопрос'}<ArrowRight size={17} /></button> : <button className="button primary" disabled={selected === null} onClick={check}>Проверить ответ<Check size={17} /></button>}</div></div><aside className="quiz-aside"><span className="aside-icon"><GraduationCap size={24} /></span><h3>Здесь можно ошибаться</h3><p>Важнее разобраться в причине, чем угадать букву. Объяснение появится после каждого ответа.</p><div className="quiz-rules"><span><Check size={15} /> Один правильный ответ</span><span><Check size={15} /> Зачёт от 3 из 4</span><span><RotateCcw size={15} /> Сколько угодно попыток</span></div>{progress[lesson.id]?.attempts > 0 && <p className="best-result">Твой лучший результат: <b>{progress[lesson.id].best} / 4</b></p>}<a className="text-link" href={`#lesson/${lesson.id}`}><ChevronLeft size={14} /> Вернуться к материалу</a></aside></div>;
}

function Glossary() {
  const [search, setSearch] = useState('');
  const terms = lessons.flatMap(l => l.terms.map(t => ({ ...t, lesson: l }))).sort((a,b) => a.term.localeCompare(b.term,'ru')).filter(t => `${t.term} ${t.definition}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <><PageHeading eyebrow="БЕЗ СЛОЖНЫХ СЛОВ" title="Глоссарий" description="Новые понятия перестают пугать, когда у каждого есть простое объяснение." /><label className="glossary-search"><Search size={19} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Например, когерентность" aria-label="Поиск по глоссарию" /><span>{terms.length} {plural(terms.length, 'понятие', 'понятия', 'понятий')}</span></label><div className="glossary-grid">{terms.map((t,i) => <article className="glossary-card" key={`${t.lesson.id}-${i}`}><span className="term-letter">{t.term.slice(0,1)}</span><h2>{t.term}</h2><p>{t.definition}</p><a href={`#lesson/${t.lesson.id}`}>К теме «{t.lesson.title}»<ArrowUpRight size={14} /></a></article>)}</div>{!terms.length && <EmptyState icon={Search} title="Понятие не найдено" text="Попробуй сократить запрос или использовать другое слово." action={() => setSearch('')} button="Показать все понятия" />}</>;
}

function ProgressView({ progress, complete, percent, nextLesson }) {
  const attempts = Object.values(progress).reduce((n,p) => n+p.attempts,0);
  const read = lessons.filter(l => progress[l.id]?.read).length;
  return <><PageHeading eyebrow="КАЖДЫЙ ШАГ ИМЕЕТ ЗНАЧЕНИЕ" title="Твой прогресс" description="Не нужно спешить. Двигайся в своём темпе — знания складываются постепенно." /><div className="progress-overview"><div className="progress-donut" style={{ '--completion': `${percent}%` }}><div><strong>{percent}%</strong><span>программы</span></div></div><div><h2>{complete === lessons.length ? 'Весь курс пройден!' : complete === 0 ? 'Твоё исследование начинается' : 'Хороший сигнал. Продолжай!'}</h2><p>Прогресс сохраняется в этом браузере автоматически.<br />Тема засчитывается после теста с результатом от 3 из 4.</p><button className="button primary" onClick={() => go(`lesson/${nextLesson.id}`)}>{complete === lessons.length ? 'Повторить материал' : 'Продолжить обучение'}<ArrowRight size={17} /></button></div></div><div className="progress-stats"><div><BookOpen size={23} /><strong>{read}<span> / {lessons.length}</span></strong><span>тем прочитано</span></div><div><CircleCheck size={23} /><strong>{complete}<span> / {lessons.length}</span></strong><span>тестов зачтено</span></div><div><RotateCcw size={23} /><strong>{attempts}</strong><span>попыток сделано</span></div></div><section className="section"><div className="section-heading"><h2>Карта твоих знаний</h2><span className="muted small">Все темы открыты с самого начала</span></div><div className="progress-list">{lessons.map((l,i) => <a href={`#lesson/${l.id}`} key={l.id}><span className={`progress-list-number ${isPassed(progress,l.id) ? 'done' : ''}`}>{isPassed(progress,l.id) ? <Check size={18} /> : String(i+1).padStart(2,'0')}</span><div><strong>{l.title}</strong><span>{levels[l.level].label} · {l.duration} мин</span></div><span className="progress-list-status">{isPassed(progress,l.id) ? `${progress[l.id].best}/4 · Пройдено` : progress[l.id]?.attempts ? `${progress[l.id].best}/4 · Можно повторить` : progress[l.id]?.read ? 'Прочитано' : 'Впереди'}</span><ChevronRight size={17} /></a>)}</div></section><div className="storage-note"><Info size={17} /><p>Прогресс и избранное хранятся только в этом браузере. На другом устройстве или после очистки данных они не появятся.</p></div></>;
}

function EmptyState({ icon: Icon, title, text, action, button }) { return <div className="empty-state"><Icon size={35} strokeWidth={1.4} /><h2>{title}</h2><p>{text}</p><button className="button secondary" onClick={action}>{button}<ArrowRight size={16} /></button></div>; }
function NotFound() { return <EmptyState icon={Radar} title="Кажется, мы потеряли сигнал" text="Такой страницы нет. Вернёмся к карте обучения?" action={() => go('courses')} button="К программе" />; }

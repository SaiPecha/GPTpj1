import React, { useId, useState } from 'react';
import './RadarLab.css';

const modes = [
  { id: 'scan', title: 'Обзор', description: 'Луч последовательно просматривает пространство. Когда отражённый сигнал возвращается к антенне, на экране появляется отметка. Круги помогают оценить расстояние, а положение отметки — направление.', detail: 'Сканирование → отражение → отметка' },
  { id: 'echo', title: 'Эхо', description: 'Радар отправляет короткий импульс и ждёт эхо. Чем позже приходит отражение, тем дальше объект. Сигнал проходит путь к объекту и обратно — поэтому в формуле дальности есть деление на два.', detail: 'Дальность: R = c · t / 2' },
  { id: 'doppler', title: 'Доплер', description: 'В этой схеме РЛС неподвижна. При движении объекта к ней частота отражённого сигнала повышается, при движении от неё — понижается. Радар измеряет движение вдоль луча: строго поперечное движение в данный момент такого сдвига не даёт.', detail: 'Синий — приближение · янтарный — удаление' },
];

const directions = [
  { id: 'toward', title: 'К радару', color: '#8abbe9', symbol: 'f ↑', periods: 8, result: 'Объект приближается: частота эха выше переданной.', summary: 'Эхо: колебания чаще' },
  { id: 'away', title: 'От радара', color: '#edc581', symbol: 'f ↓', periods: 4, result: 'Объект удаляется: частота эха ниже переданной.', summary: 'Эхо: колебания реже' },
  { id: 'across', title: 'Поперёк луча', color: 'var(--accent, #83ebbd)', symbol: 'Δf = 0', periods: 6, result: 'В этот момент движение строго поперечное: радиальная скорость и доплеровский сдвиг равны нулю.', summary: 'Эхо: частота та же' },
];

function Waveform({ periods, color, label }) {
  const period = 360 / periods;
  const path = Array.from({ length: 661 }, (_, i) => {
    const x = i - 150;
    return `${i ? 'L' : 'M'}${x},${19 - Math.sin(x / period * Math.PI * 2) * 10}`;
  }).join(' ');
  return <svg className="radar-waveform" viewBox="0 0 360 38" role="img" aria-label={label}>
    <line x1="0" y1="19" x2="360" y2="19" stroke="currentColor" opacity=".15" />
    <g className="radar-wave-motion" style={{ '--radar-wave-period': `${period}px`, '--radar-wave-duration': `${period / 40}s` }}><path d={path} fill="none" stroke={color} strokeWidth="1.6" /></g>
  </svg>;
}

function SmallIcon({ pause = false }) {
  return <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true">{pause ? <><rect x="5" y="4" width="3" height="12" rx="1" /><rect x="12" y="4" width="3" height="12" rx="1" /></> : <path d="M6 3.8a1 1 0 0 1 1.5-.86l9 5.2a1 1 0 0 1 0 1.72l-9 5.2A1 1 0 0 1 6 14.2Z" />}</svg>;
}

function Airplane({ x, y, rotation = 0, color = 'var(--accent, #83ebbd)', label }) {
  return <g transform={`translate(${x} ${y})`} className="radar-target">
    <circle r="15" fill="none" stroke={color} strokeOpacity=".18" />
    <circle r="5" fill={color} opacity=".14" />
    <g transform={`rotate(${rotation})`} fill={color}><path d="M0-9 2-2 8 2 8 4 2 2 2 7 4 8 4 9 0 8-4 9-4 8-2 7-2 2-8 4-8 2-2-2Z" /></g>
    {label && <text x="20" y="3" fill={color} fontSize="9" fontFamily="monospace" opacity=".8">{label}</text>}
  </g>;
}

export default function RadarLab({ compact = false }) {
  const id = useId().replace(/:/g, '');
  const [mode, setMode] = useState('scan');
  const [playing, setPlaying] = useState(true);
  const [distance, setDistance] = useState(62);
  const [direction, setDirection] = useState('toward');
  const current = modes.find(item => item.id === mode);
  const motion = directions.find(item => item.id === direction);
  const activeMode = compact ? 'scan' : mode;
  const targetX = 240 + distance * 1.45;
  const targetY = 240 - distance * 1.1;
  const radialLength = Math.hypot(1.45, 1.1);
  const vx = (direction === 'across' ? 1.1 : direction === 'toward' ? -1.45 : 1.45) / radialLength;
  const vy = (direction === 'across' ? 1.45 : direction === 'toward' ? 1.1 : -1.1) / radialLength;
  const heading = Math.atan2(vx, -vy) * 180 / Math.PI;
  const arrowEnd = { x: targetX + vx * 54, y: targetY + vy * 54 };

  return <div className={`radar-lab${compact ? ' compact' : ''}${playing ? '' : ' is-paused'} mode-${activeMode}`}>
    {!compact && <div className="radar-lab-toolbar">
      <div className="radar-mode-buttons" role="group" aria-label="Режим демонстрации">
        {modes.map(item => <button key={item.id} type="button" className={mode === item.id ? 'active' : ''} onClick={() => setMode(item.id)} aria-pressed={mode === item.id}>{item.title}</button>)}
      </div>
      <button className="radar-play-button" type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Приостановить анимацию радара' : 'Продолжить анимацию радара'} title={playing ? 'Пауза' : 'Продолжить'}><SmallIcon pause={playing} /></button>
    </div>}

    <div className="radar-scope-wrap">
      {compact && <button className="radar-play-button radar-compact-pause" type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Приостановить анимацию радара' : 'Продолжить анимацию радара'} title={playing ? 'Пауза' : 'Продолжить'}><SmallIcon pause={playing} /></button>}
      <div className="radar-top-label"><span className="radar-status-dot" /> {activeMode === 'scan' ? 'ОБЗОР ПРОСТРАНСТВА' : activeMode === 'echo' ? 'ИМПУЛЬС И ОТРАЖЕНИЕ' : 'ДОПЛЕРОВСКИЙ СДВИГ'}</div>
      <svg className="radar-scope" viewBox="0 0 480 480" role="img" aria-label={activeMode === 'scan' ? 'Схема радара: вращающийся луч и отметки отражённых сигналов' : activeMode === 'echo' ? 'Схема распространения импульса к объекту и отражения обратно' : `Схема движения объекта: ${motion.title}. ${motion.result}`}>
        <defs>
          <radialGradient id={`${id}-background`}><stop offset="0" stopColor="var(--accent, #83ebbd)" stopOpacity=".075" /><stop offset="1" stopColor="var(--accent, #83ebbd)" stopOpacity=".012" /></radialGradient>
          <radialGradient id={`${id}-sweep`}><stop offset="0" stopColor="var(--accent, #83ebbd)" stopOpacity=".02" /><stop offset="1" stopColor="var(--accent, #83ebbd)" stopOpacity=".2" /></radialGradient>
          <clipPath id={`${id}-clip`}><circle cx="240" cy="240" r="190" /></clipPath>
        </defs>
        <circle cx="240" cy="240" r="190" fill={`url(#${id}-background)`} />
        <g className="radar-grid" fill="none" stroke="var(--accent, #83ebbd)">
          {[47.5, 95, 142.5, 190].map((r, i) => <circle key={r} cx="240" cy="240" r={r} strokeOpacity={i === 3 ? '.24' : '.13'} strokeWidth={i === 3 ? '1' : '.7'} />)}
          {[0, 30, 60, 90, 120, 150].map(angle => <line key={angle} x1="50" y1="240" x2="430" y2="240" transform={`rotate(${angle} 240 240)`} strokeOpacity={angle % 90 === 0 ? '.15' : '.07'} strokeWidth=".7" />)}
          {Array.from({length: 72}, (_, i) => <line key={i} x1="240" y1={i % 6 === 0 ? '37' : '42'} x2="240" y2="47" transform={`rotate(${i * 5} 240 240)`} strokeOpacity={i % 6 === 0 ? '.38' : '.2'} strokeWidth={i % 6 === 0 ? '1.2' : '.7'} />)}
        </g>
        <g className="radar-bearing-labels" fill="var(--muted, #8a9c99)" fontSize="10" textAnchor="middle" fontFamily="monospace">
          <text x="240" y="24">000°</text><text x="456" y="244">090°</text><text x="240" y="466">180°</text><text x="24" y="244">270°</text>
          <text x="349" y="52">030°</text><text x="429" y="132">060°</text><text x="429" y="354">120°</text><text x="349" y="433">150°</text><text x="131" y="433">210°</text><text x="51" y="354">240°</text><text x="51" y="132">300°</text><text x="131" y="52">330°</text>
        </g>
        {activeMode === 'scan' && <g clipPath={`url(#${id}-clip)`}>
          <g className="radar-sweep">
            <path d="M240 240 430 240A190 190 0 0 0 335 75.455Z" fill={`url(#${id}-sweep)`} />
            <path d="M240 240H430" stroke="var(--accent, #83ebbd)" strokeWidth="1.4" strokeOpacity=".7" />
          </g>
        </g>}
        {activeMode === 'echo' && <g clipPath={`url(#${id}-clip)`} fill="none">
          <line x1="240" y1="240" x2={targetX} y2={targetY} stroke="var(--accent, #83ebbd)" strokeOpacity=".5" strokeDasharray="4 5" />
          <circle className="radar-echo-out" cx="240" cy="240" r="180" stroke="var(--accent, #83ebbd)" strokeWidth="1.5" />
          <circle className="radar-echo-back" cx={targetX} cy={targetY} r="180" stroke="#edc581" strokeWidth="1.5" />
          <text x="154" y="307" fill="var(--accent, #83ebbd)" fontSize="10" fontFamily="monospace">ИМПУЛЬС</text>
          <text x={targetX + 12} y={targetY + 35} fill="#edc581" fontSize="10" fontFamily="monospace">ЭХО</text>
        </g>}
        {activeMode === 'doppler' && <g fill="none" strokeWidth="1.3">
          <line x1="240" y1="240" x2={targetX} y2={targetY} stroke="var(--accent, #83ebbd)" strokeOpacity=".2" strokeDasharray="3 5" />
          <line x1={targetX + vx * 20} y1={targetY + vy * 20} x2={arrowEnd.x} y2={arrowEnd.y} stroke={motion.color} strokeDasharray="4 3" />
          <path d={`M${arrowEnd.x - vx * 8 + vy * 4},${arrowEnd.y - vy * 8 - vx * 4}L${arrowEnd.x},${arrowEnd.y}L${arrowEnd.x - vx * 8 - vy * 4},${arrowEnd.y - vy * 8 + vx * 4}`} stroke={motion.color} />
          <text x={targetX + 19} y={targetY + 26} fill={motion.color} stroke="none" fontSize="10" fontFamily="monospace">{motion.symbol}</text>
        </g>}
        <Airplane x={targetX} y={targetY} rotation={activeMode === 'doppler' ? heading : 35} color={activeMode === 'doppler' ? motion.color : 'var(--accent, #83ebbd)'} label={compact ? '01' : 'ОБЪЕКТ 01'} />
        {activeMode === 'scan' && <>
          <Airplane x="144" y="312" rotation="220" color="#edc581" label={compact ? '02' : '02'} />
          {activeMode === 'scan' && <g className="radar-target" transform="translate(379 276)"><circle r="3" fill="var(--accent, #83ebbd)" /><circle r="9" fill="none" stroke="var(--accent, #83ebbd)" strokeOpacity=".25" /></g>}
        </>}
        <g fill="var(--accent, #83ebbd)"><circle cx="240" cy="240" r="3" /><circle cx="240" cy="240" r="8" fill="none" stroke="var(--accent, #83ebbd)" strokeOpacity=".4" /><path d="M240 226v-5m0 33v5m-14-19h-5m33 0h5" fill="none" stroke="var(--accent, #83ebbd)" strokeOpacity=".5" /></g>
      </svg>
      <div className="radar-bottom-label"><span>УЧЕБНАЯ ВИЗУАЛИЗАЦИЯ</span><span>{compact ? 'СХЕМАТИЧНО' : playing ? 'АНИМАЦИЯ ВКЛЮЧЕНА' : 'ПАУЗА'}</span></div>
    </div>

    {!compact && <div className="radar-lab-explanation">
      <label className="radar-distance-label" htmlFor={`${id}-distance`}><span>Положение объекта</span><span>{distance < 45 ? 'Ближе' : distance > 70 ? 'Дальше' : 'На средней дальности'}</span></label>
      <input id={`${id}-distance`} type="range" min="20" max="95" value={distance} onChange={e => setDistance(Number(e.target.value))} aria-label="Положение объекта относительно радара" />
      {mode === 'doppler' && <div className="radar-doppler-demo">
        <div className="radar-direction-label">Направление движения</div>
        <div className="radar-direction-buttons" role="group" aria-label="Направление движения объекта">
          {directions.map(item => <button key={item.id} type="button" aria-pressed={direction === item.id} className={direction === item.id ? 'active' : ''} onClick={() => setDirection(item.id)}>{item.title}</button>)}
        </div>
        <div className="radar-wave-comparison">
          <div className="radar-wave-label"><span>Переданный сигнал</span><span>Опорная частота</span></div>
          <Waveform periods={6} color="var(--muted, #8a9c99)" label="Переданный сигнал: опорная частота" />
          <div className="radar-wave-label" style={{ color: motion.color }}><span>{motion.summary}</span><span>{motion.symbol}</span></div>
          <Waveform periods={motion.periods} color={motion.color} label={motion.result} />
          <div className="radar-wave-time">Одинаковый интервал времени →</div>
        </div>
        <div className="radar-doppler-result" role="status" aria-live="polite" style={{ color: motion.color }}>{motion.result}</div>
      </div>}
      <p>{current.description}</p>
      <div className="radar-lab-detail">{mode === 'doppler' ? 'Решает радиальная составляющая скорости, а не полная скорость объекта.' : current.detail}</div>
      <small>Схема объясняет принцип. Масштаб, скорости и время условны.{mode === 'doppler' ? ' Разница частот на рисунке увеличена для наглядности.' : ''}</small>
    </div>}
  </div>;
}

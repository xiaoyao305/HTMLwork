import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { PetChips } from '../components/PetChips';
import { DrawOrb } from '../components/DrawOrb';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { ACTIVITIES, REACTION_LABEL, TOY_OPTIONS } from '../data/activities';
import { drawActivity } from '../lib/playDraw';
import type { DrawResult } from '../lib/playDraw';
import type { EnergyLevel, Reaction } from '../store/types';
import { uid } from '../store/storage';
import { DiceIcon, HeartIcon, PlayIcon } from '../lib/icons';

const ENERGY_LABEL: Record<EnergyLevel, string> = {
  low: '活力低',
  mid: '活力适中',
  high: '精力旺',
};

const DURATIONS = [10, 15, 30];
const REACTIONS: { key: Reaction; emoji: string }[] = [
  { key: 'happy', emoji: '😻' },
  { key: 'neutral', emoji: '🙂' },
  { key: 'bored', emoji: '😐' },
];

export default function PlayDraw() {
  const { state, dispatch, activePet } = useApp();
  const toast = useToast();

  const [place, setPlace] = useState<'indoor' | 'outdoor'>('indoor');
  const [minutes, setMinutes] = useState(15);
  const [energy, setEnergy] = useState<EnergyLevel>('mid');
  const [toys, setToys] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [done, setDone] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [reaction, setReaction] = useState<Reaction>('happy');
  const [note, setNote] = useState('');
  const timerRef = useRef<number | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => {
      const el = resultRef.current;
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 14, behavior: 'smooth' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [result]);

  useEffect(() => {
    setResult(null);
    setDone(false);
    setDrawing(false);
    if (activePet) setEnergy(activePet.energy);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, [activePet?.id]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  if (!activePet) {
    return (
      <div className="page">
        <EmptyState
          emoji="🎾"
          title="先挑一位玩伴"
          desc="添加宠物后，就能按它的物种、精力和场地抽一个安全的陪玩灵感。"
          action={
            <Link to="/pets" className="btn btn-primary">
              去添加宠物
            </Link>
          }
        />
      </div>
    );
  }

  const pet = activePet;
  const favorites = state.playFavorites.filter((f) => f.petId === pet.id);
  const recent = state.playLogs.filter((l) => l.petId === pet.id).slice(0, 3);
  const isFav = result
    ? favorites.some((f) => f.activityId === result.activity.id)
    : false;

  const toggleToy = (toy: string) => {
    setToys((prev) => (prev.includes(toy) ? prev.filter((t) => t !== toy) : [...prev, toy]));
  };

  const run = (excludeId?: string) => {
    if (drawing) return;
    setDrawing(true);
    setDone(false);
    timerRef.current = window.setTimeout(() => {
      const next = drawActivity({ pet, place, minutes, energy, toys }, excludeId);
      setDrawing(false);
      if (!next) {
        toast('暂时没有合适的灵感，换个条件试试', 'warn');
        return;
      }
      setResult(next);
      if (next.relaxed) toast(next.relaxed, 'info');
    }, 1300);
  };

  const toggleFav = () => {
    if (!result) return;
    dispatch({
      type: 'TOGGLE_PLAY_FAV',
      fav: {
        id: uid('playfav'),
        petId: pet.id,
        activityId: result.activity.id,
        at: new Date().toISOString(),
      },
    });
    toast(isFav ? '已取消收藏' : '已收藏这个灵感');
  };

  const submitLog = () => {
    if (!result) return;
    dispatch({
      type: 'ADD_PLAY_LOG',
      log: {
        id: uid('play'),
        petId: pet.id,
        activityId: result.activity.id,
        activityName: result.activity.name,
        reaction,
        note: note.trim() || undefined,
        at: new Date().toISOString(),
      },
    });
    setLogOpen(false);
    setDone(true);
    setNote('');
    toast('已记录这次的陪玩');
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">陪玩灵感抽签</p>
          <h1>现在玩点什么</h1>
        </div>
        <span className="head-emoji" aria-hidden>
          🎾
        </span>
      </header>

      <PetChips compact />

      <section className="card setup-card">
        <div className="field">
          <span>场地</span>
          <div className="segmented">
            <button className={place === 'indoor' ? 'is-on' : ''} onClick={() => setPlace('indoor')}>
              🏠 室内
            </button>
            <button className={place === 'outdoor' ? 'is-on' : ''} onClick={() => setPlace('outdoor')}>
              🌳 室外
            </button>
          </div>
        </div>

        <div className="field">
          <span>能玩多久</span>
          <div className="chip-row">
            {DURATIONS.map((d) => (
              <button key={d} className={`chip ${minutes === d ? 'is-on' : ''}`} onClick={() => setMinutes(d)}>
                {d} 分钟
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>现在的精力</span>
          <div className="chip-row">
            {(['low', 'mid', 'high'] as EnergyLevel[]).map((e) => (
              <button key={e} className={`chip ${energy === e ? 'is-on' : ''}`} onClick={() => setEnergy(e)}>
                {ENERGY_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>手边的玩具（可多选，不选也可以）</span>
          <div className="chip-row">
            {TOY_OPTIONS.map((toy) => (
              <button
                key={toy}
                className={`chip ${toys.includes(toy) ? 'is-on' : ''}`}
                onClick={() => toggleToy(toy)}
              >
                {toy}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="draw-zone">
        <DrawOrb
          rolling={drawing}
          rollingTexts={['翻一翻玩具箱…', '看看它的精力…', '想一个安全玩法…', '检查一下时长…']}
          emoji={result ? result.activity.emoji : '🧶'}
          label={result ? result.activity.name : '摇一摇，抽个陪玩灵感'}
          hint={
            result
              ? `${result.activity.minutes} 分钟 · ${result.activity.place === 'both' ? '室内外都行' : result.activity.place === 'indoor' ? '室内' : '室外'}`
              : '按物种、场地、时长和精力筛选'
          }
        />
        <button className="btn btn-primary btn-wide draw-btn" onClick={() => run()} disabled={drawing}>
          <DiceIcon size={18} /> {drawing ? '抽签中…' : result ? '换一个' : '开始抽签'}
        </button>
      </div>

      {result && !drawing && (
        <section className="result-card play-result" ref={resultRef}>
          <div className="result-head">
            <span className="result-badge">{result.activity.emoji} 陪玩灵感</span>
            <span className="result-sub">
              {result.activity.minutes} 分钟 · {result.activity.place === 'both' ? '室内外' : result.activity.place === 'indoor' ? '室内' : '室外'}
            </span>
          </div>

          <h2 className="play-title">{result.activity.name}</h2>
          <p className="play-blurb">{result.activity.blurb}</p>

          <div className="props-row">
            <span className="props-label">准备物品</span>
            {result.activity.props.length > 0 ? (
              <div className="chip-row is-static">
                {result.activity.props.map((p) => (
                  <span key={p} className="mini-tag">
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <span className="muted small">什么都不用准备</span>
            )}
          </div>

          <ol className="steps">
            {result.activity.steps.map((step, i) => (
              <li key={step}>
                <span className="step-index">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="safety-box">
            <span className="reason-title">安全提示</span>
            <p>{result.activity.safety}</p>
          </div>

          {done && <div className="done-banner">✓ 已完成，记得看看它的反应</div>}

          <div className="result-actions">
            <button className={`btn btn-ghost btn-sm ${isFav ? 'is-fav' : ''}`} onClick={toggleFav}>
              <HeartIcon size={16} /> {isFav ? '已收藏' : '收藏'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => run(result.activity.id)}>
              <DiceIcon size={16} /> 换一个
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setLogOpen(true)} disabled={done}>
              <PlayIcon size={16} /> {done ? '已记录' : '完成打卡'}
            </button>
          </div>
        </section>
      )}

      <section className="block">
        <div className="section-head">
          <h2>收藏的灵感</h2>
          <span className="section-tip">{favorites.length} 个</span>
        </div>
        {favorites.length === 0 ? (
          <div className="soft-card">
            <p>遇到好玩的就收藏，临时想不出花样时直接翻出来。</p>
          </div>
        ) : (
          <div className="fav-list">
            {favorites.map((fav) => {
              const act = ACTIVITIES.find((a) => a.id === fav.activityId);
              if (!act) return null;
              return (
                <div key={fav.id} className="fav-item">
                  <div>
                    <strong>
                      {act.emoji} {act.name}
                    </strong>
                    <p className="muted small">
                      {act.minutes} 分钟 · {act.place === 'both' ? '室内外' : act.place === 'indoor' ? '室内' : '室外'}
                    </p>
                  </div>
                  <div className="fav-actions">
                    <button
                      className="icon-btn tiny"
                      aria-label="查看这个灵感"
                      onClick={() => {
                        setResult({ activity: act });
                        setDone(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      ↺
                    </button>
                    <button
                      className="icon-btn tiny"
                      aria-label="取消收藏"
                      onClick={() => {
                        dispatch({ type: 'TOGGLE_PLAY_FAV', fav });
                        toast('已取消收藏');
                      }}
                    >
                      <HeartIcon size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="block">
          <div className="section-head">
            <h2>最近玩过</h2>
          </div>
          <div className="card list-card">
            {recent.map((log) => (
              <div key={log.id} className="log-row">
                <span className="log-emoji">
                  {REACTIONS.find((r) => r.key === log.reaction)?.emoji ?? '🐾'}
                </span>
                <div>
                  <strong>{log.activityName}</strong>
                  <p className="muted small">
                    {new Date(log.at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} ·{' '}
                    {REACTION_LABEL[log.reaction]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="disclaimer">
        活动强度请按它的年龄和身体状况调整。有关节、心脏或呼吸问题的宠物，开始前先咨询兽医；玩耍时全程看着，累了就停。
      </p>

      <Sheet
        open={logOpen}
        title="陪玩打卡"
        subtitle={`${pet.name} · ${result?.activity.name ?? ''}`}
        onClose={() => setLogOpen(false)}
        footer={
          <button className="btn btn-primary btn-wide" onClick={submitLog}>
            保存记录
          </button>
        }
      >
        <div className="field">
          <span>它的反应</span>
          <div className="reaction-row">
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                className={`reaction ${reaction === r.key ? 'is-on' : ''}`}
                onClick={() => setReaction(r.key)}
              >
                <span aria-hidden>{r.emoji}</span>
                <small>{REACTION_LABEL[r.key]}</small>
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>补充一句（可不填）</span>
          <textarea
            rows={3}
            placeholder="例如：追了两轮就躺下，喝水后精神不错"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </Sheet>
    </div>
  );
}

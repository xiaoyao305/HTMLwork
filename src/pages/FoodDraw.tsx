import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { PetChips } from '../components/PetChips';
import { DrawOrb } from '../components/DrawOrb';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import {
  SLOT_LABEL,
  SLOT_OPTIONS,
  PREF_OPTIONS,
  drawFood,
  drawPantryFood,
  drawCautions,
  detectUnsafeFood,
  pantryPoolFor,
  prefsText,
} from '../lib/foodDraw';
import { PREF_LABEL, NEVER_FEED } from '../data/foods';
import { uid } from '../store/storage';
import type { FoodDraw, FoodPref, MealSlot, PantryRole, Species } from '../store/types';
import { DiceIcon, HeartIcon, PlusIcon, ThumbDown, TrashIcon } from '../lib/icons';

const SLOT_EMOJI: Record<MealSlot, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  extra: '🍪',
};

const ROLLING = ['正在翻粮袋…', '闻一闻这个…', '拌一点温水…', '算算今天的热量…', '避开忌口再挑一次…'];
const ROLLING_PANTRY = ['翻翻家里的粮袋…', '看看存货还新鲜吗…', '避开忌口再挑一次…', '算算今天的热量…'];

const ROLE_LABEL: Record<PantryRole, string> = {
  main: '主食',
  side: '辅食',
  snack: '零食',
};

const ROLE_ORDER: PantryRole[] = ['main', 'side', 'snack'];

type FoodMode = 'library' | 'pantry';
type PantryScope = 'cat' | 'dog' | 'both';

function speciesText(species: Species[]): string {
  if (species.length >= 2) return '🐱🐶 都行';
  return species[0] === 'cat' ? '🐱 猫咪' : '🐶 狗狗';
}

export default function FoodDraw() {
  const { state, dispatch, activePet } = useApp();
  const toast = useToast();

  const [mode, setMode] = useState<FoodMode>('library');
  const [slot, setSlot] = useState<MealSlot>('dinner');
  const [prefs, setPrefs] = useState<FoodPref[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<FoodDraw | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  const [pantryOpen, setPantryOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pRole, setPRole] = useState<PantryRole>('main');
  const [pScope, setPScope] = useState<PantryScope>('both');
  const [pNote, setPNote] = useState('');

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
    setError(null);
    setDrawing(false);
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
          emoji="🍚"
          title="先有档案，才能配饭"
          desc="添加一只宠物并填好过敏、忌口，抽签时才能自动避开不适合的食物。"
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
  const favorites = state.foodFavorites.filter((f) => f.petId === pet.id);
  const unsuitable = state.foodUnsuitable.filter((f) => f.petId === pet.id);
  const unsuitableMainIds = unsuitable.map((f) => f.main.id);
  const isFav = result ? favorites.some((f) => f.id === result.id) : false;
  const cautions = result ? drawCautions(result) : [];
  const restrictions = [...pet.allergies, ...pet.avoid];
  const pantryPool = pantryPoolFor(pet, state.pantry, unsuitableMainIds);

  const switchMode = (next: FoodMode) => {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setError(null);
    setDrawing(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  };

  const run = () => {
    if (drawing) return;
    setDrawing(true);
    setError(null);
    timerRef.current = window.setTimeout(() => {
      setDrawing(false);
      if (mode === 'pantry') {
        if (pantryPool.usableCount === 0) {
          setResult(null);
          setError(
            state.pantry.length === 0
              ? '食物清单还是空的，先添几样家里常备、它也吃过的食物。'
              : '清单里的食物对它都不太合适（可能命中过敏或忌口），调整一下再抽。',
          );
          return;
        }
        const draw = drawPantryFood(pet, slot, pantryPool);
        if (!draw) {
          setResult(null);
          setError('清单里没有合适的主食。主食是搭配的底子，先加一样它常吃的主粮。');
          return;
        }
        setResult(draw);
        toast('抽好啦，看看今天的搭配');
        return;
      }
      const draw = drawFood(pet, slot, prefs, unsuitableMainIds);
      if (!draw) {
        setResult(null);
        setError('在当前的过敏、忌口和偏好下，没有找到合适的主食。可以少选一点偏好，或到档案里确认限制信息。');
        return;
      }
      setResult(draw);
      toast('抽好啦，看看今天的搭配');
    }, 1500);
  };

  const toggleFav = () => {
    if (!result) return;
    dispatch({ type: 'TOGGLE_FOOD_FAV', draw: result });
    toast(isFav ? '已取消收藏' : '已收藏这份搭配');
  };

  const markUnsuitable = () => {
    if (!result) return;
    dispatch({ type: 'MARK_FOOD_UNSUITABLE', draw: result });
    setResult(null);
    toast('已记下，下次会避开这类主食', 'info');
  };

  const addPantryItem = () => {
    const name = pName.trim();
    if (!name) {
      toast('先填个食物名字', 'info');
      return;
    }
    if (state.pantry.some((p) => p.name === name)) {
      toast('清单里已经有这个名字了', 'info');
      return;
    }
    const unsafeHit = detectUnsafeFood(name);
    dispatch({
      type: 'ADD_PANTRY_ITEM',
      item: {
        id: uid('pantry'),
        name,
        role: pRole,
        species: pScope === 'both' ? ['cat', 'dog'] : [pScope],
        note: pNote.trim() || undefined,
        unsafe: unsafeHit ? true : undefined,
        createdAt: new Date().toISOString(),
      },
    });
    setPName('');
    setPNote('');
    if (unsafeHit) {
      toast(`「${name}」含${unsafeHit}，对猫狗有毒，已标记为不参与抽签`, 'info');
    } else {
      toast(`已把「${name}」加入清单`);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">食物搭配抽签</p>
          <h1>今天吃点什么</h1>
        </div>
        <span className="head-emoji" aria-hidden>
          🍲
        </span>
      </header>

      <PetChips compact />

      <section className="card setup-card">
        <div className="field">
          <span>抽签方式</span>
          <div className="segmented">
            <button className={mode === 'library' ? 'is-on' : ''} onClick={() => switchMode('library')}>
              🎲 灵感库推荐
            </button>
            <button className={mode === 'pantry' ? 'is-on' : ''} onClick={() => switchMode('pantry')}>
              🏠 家里的食物
            </button>
          </div>
        </div>

        <div className="field">
          <span>用餐时段</span>
          <div className="segmented">
            {SLOT_OPTIONS.map((s) => (
              <button key={s} className={slot === s ? 'is-on' : ''} onClick={() => setSlot(s)}>
                {SLOT_EMOJI[s]} {SLOT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {mode === 'library' && (
          <div className="field">
            <span>偏好（可多选）</span>
            <div className="chip-row">
              {PREF_OPTIONS.map((p) => {
                const on = prefs.includes(p);
                return (
                  <button
                    key={p}
                    className={`chip ${on ? 'is-on' : ''}`}
                    onClick={() => setPrefs(on ? prefs.filter((x) => x !== p) : [...prefs, p])}
                  >
                    {PREF_LABEL[p]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'pantry' && (
          <div className="field">
            <span>家里的食物清单</span>
            <div className="pantry-summary">
              <div className="pantry-counts">
                {state.pantry.length === 0 ? (
                  <em>清单还是空的</em>
                ) : (
                  <>
                    主食 {pantryPool.mains.length} · 辅食 {pantryPool.sides.length} · 零食{' '}
                    {pantryPool.snacks.length}
                    {pantryPool.blockedCount > 0 && (
                      <small>已按档案避开 {pantryPool.blockedCount} 样忌口相关的</small>
                    )}
                  </>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPantryOpen(true)}>
                {state.pantry.length === 0 ? '去添加' : '管理清单'}
              </button>
            </div>
          </div>
        )}

        <div className="setup-note">
          {restrictions.length > 0 ? (
            <>
              <span className="dot-pink" /> 已按档案避开：{restrictions.join(' · ')}
            </>
          ) : (
            <>
              <span className="dot-mint" /> 档案里还没有过敏或忌口信息
            </>
          )}
        </div>
      </section>

      <div className="draw-zone">
        <DrawOrb
          rolling={drawing}
          rollingTexts={mode === 'pantry' ? ROLLING_PANTRY : ROLLING}
          emoji={result ? '🍲' : mode === 'pantry' ? '🏠' : '🍚'}
          label={result ? '今天的搭配抽好啦' : '摇一摇，看看今天吃什么'}
          hint={
            result
              ? `${SLOT_LABEL[result.slot]} · ${result.source === 'pantry' ? '来自家里的清单' : prefsText(result.prefs)}`
              : mode === 'pantry'
                ? '只会从清单里挑它能吃的'
                : '会按它的过敏、忌口和年龄筛选'
          }
          tone="amber"
        />
        <button className="btn btn-primary btn-wide draw-btn" onClick={run} disabled={drawing}>
          <DiceIcon size={18} /> {drawing ? '抽签中…' : result ? '再抽一次' : '开始抽签'}
        </button>
      </div>

      {error && (
        <div className="soft-card warn-card">
          <p>{error}</p>
          {mode === 'pantry' ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setPantryOpen(true)}>
              去管理清单
            </button>
          ) : (
            <Link to="/pets" className="btn btn-ghost btn-sm">
              去检查档案
            </Link>
          )}
        </div>
      )}

      {result && !drawing && (
        <section className="result-card food-result" ref={resultRef}>
          <div className="result-head">
            <span className="result-badge">{SLOT_EMOJI[result.slot]} {SLOT_LABEL[result.slot]}</span>
            <span className="result-sub">
              {result.source === 'pantry' ? '来自家里的食物清单' : prefsText(result.prefs)}
            </span>
          </div>

          <div className="food-items">
            <div className="food-item is-main">
              <span className="food-role">主食</span>
              <strong>{result.main.name}</strong>
              <p>{result.main.note}</p>
            </div>
            {result.sides.map((side) => (
              <div key={side.id} className="food-item">
                <span className="food-role">辅食</span>
                <strong>{side.name}</strong>
                <p>{side.note}</p>
              </div>
            ))}
            <div className="food-item is-snack">
              <span className="food-role">零食</span>
              <strong>{result.snack.name}</strong>
              <p>{result.snack.note}</p>
            </div>
          </div>

          <div className="reason-box">
            <span className="reason-title">搭配思路</span>
            <p>{result.reason}</p>
          </div>

          <div className="tip-box">
            <span aria-hidden>💡</span>
            <p>{result.tip}</p>
          </div>

          {cautions.length > 0 && (
            <div className="caution-box">
              <span className="reason-title">多留意一下</span>
              {cautions.map((c) => (
                <p key={c}>{c}</p>
              ))}
            </div>
          )}

          <div className="result-actions">
            <button className={`btn btn-ghost btn-sm ${isFav ? 'is-fav' : ''}`} onClick={toggleFav}>
              <HeartIcon size={16} /> {isFav ? '已收藏' : '收藏'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={run}>
              <DiceIcon size={16} /> 换一组
            </button>
            <button className="btn btn-danger-ghost btn-sm" onClick={markUnsuitable}>
              <ThumbDown size={16} /> 不适合
            </button>
          </div>
        </section>
      )}

      <section className="block">
        <div className="section-head">
          <h2>收藏的搭配</h2>
          <span className="section-tip">{favorites.length} 份</span>
        </div>
        {favorites.length === 0 ? (
          <div className="soft-card">
            <p>抽到满意的组合就点「收藏」，下次可以直接照着喂。</p>
          </div>
        ) : (
          <div className="fav-list">
            {favorites.map((fav) => (
              <div key={fav.id} className="fav-item">
                <div>
                  <strong>
                    {fav.source === 'pantry' && '🏠 '}
                    {fav.main.name}
                  </strong>
                  <p className="muted small">
                    {[fav.sides.map((s) => s.name).join('、'), fav.snack.name].filter(Boolean).join(' + ')}
                  </p>
                </div>
                <div className="fav-actions">
                  <button
                    className="icon-btn tiny"
                    aria-label="再看一次"
                    onClick={() => {
                      setResult(fav);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    ↺
                  </button>
                  <button
                    className="icon-btn tiny"
                    aria-label="取消收藏"
                    onClick={() => {
                      dispatch({ type: 'TOGGLE_FOOD_FAV', draw: fav });
                      toast('已取消收藏');
                    }}
                  >
                    <HeartIcon size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <div className="section-head">
          <h2>这些永远不要喂</h2>
        </div>
        <div className="card never-card">
          <p className="muted small">无论抽到什么，都不建议给猫狗尝试下列食物：</p>
          <div className="never-list">
            {NEVER_FEED.map((n) => (
              <span key={n}>✕ {n}</span>
            ))}
          </div>
        </div>
      </section>

      <p className="disclaimer">
        搭配只是日常灵感，不是营养或治疗方案。食物要以宠物已经适应的为主，换粮请慢慢过渡；有慢性病、孕哺期或不确定是否安全时，先咨询兽医。
      </p>

      <Sheet
        open={pantryOpen}
        title="家里的食物清单"
        subtitle="只放它平时吃过、适应良好的食物，抽签会从这里面挑"
        onClose={() => setPantryOpen(false)}
        footer={
          <button className="btn btn-primary btn-wide" onClick={addPantryItem}>
            <PlusIcon size={17} /> 加入清单
          </button>
        }
      >
        <div className="pantry-form">
          <div className="field">
            <span>食物名称</span>
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="例如：鸡肉主食罐、冻干三文鱼"
              maxLength={20}
            />
          </div>
          <div className="field">
            <span>角色</span>
            <div className="segmented">
              {ROLE_ORDER.map((r) => (
                <button key={r} className={pRole === r ? 'is-on' : ''} onClick={() => setPRole(r)}>
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>谁可以吃</span>
            <div className="segmented">
              <button className={pScope === 'cat' ? 'is-on' : ''} onClick={() => setPScope('cat')}>
                🐱 猫咪
              </button>
              <button className={pScope === 'dog' ? 'is-on' : ''} onClick={() => setPScope('dog')}>
                🐶 狗狗
              </button>
              <button className={pScope === 'both' ? 'is-on' : ''} onClick={() => setPScope('both')}>
                🐱🐶 都行
              </button>
            </div>
          </div>
          <div className="field">
            <span>备注（可不填）</span>
            <input
              value={pNote}
              onChange={(e) => setPNote(e.target.value)}
              placeholder="例如：一顿半罐，拌温水"
              maxLength={30}
            />
          </div>
        </div>

        {state.pantry.length === 0 ? (
          <div className="soft-card">
            <p>清单还是空的。从上面添一样主食，就能开始用家里的食物抽签了。</p>
          </div>
        ) : (
          <div className="pantry-groups">
            {ROLE_ORDER.map((role) => {
              const items = state.pantry.filter((p) => p.role === role);
              if (items.length === 0) return null;
              return (
                <div key={role}>
                  <p className="pantry-group-title">
                    {ROLE_LABEL[role]} · {items.length}
                  </p>
                  <div className="fav-list">
                    {items.map((item) => (
                      <div key={item.id} className={`fav-item ${item.unsafe ? 'is-unsafe' : ''}`}>
                        <div>
                          <strong>
                            {item.unsafe && '⚠️ '}
                            {item.name}
                          </strong>
                          <p className="muted small">
                            {speciesText(item.species)}
                            {item.note ? ` · ${item.note}` : ''}
                            {item.unsafe ? ' · 危险食物，不参与抽签' : ''}
                          </p>
                        </div>
                        <button
                          className="icon-btn tiny"
                          aria-label={`删除 ${item.name}`}
                          onClick={() => {
                            dispatch({ type: 'DELETE_PANTRY_ITEM', id: item.id });
                            toast('已从清单删除');
                          }}
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Sheet>
    </div>
  );
}

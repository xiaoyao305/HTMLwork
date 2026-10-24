import { Link } from 'react-router-dom';
import { useApp, checkInKey, tasksForDay, nextUpcomingTask } from '../store/AppContext';
import { TaskRow } from '../components/TaskRow';
import { PetChips } from '../components/PetChips';
import { ProgressRing } from '../components/ProgressRing';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { greeting, monthDayLabel, nowTime, relativeDay, shortDate, todayStr } from '../lib/date';
import { BellIcon, ChevronRight, ClockIcon, ScaleIcon } from '../lib/icons';

function timeHint(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
  const abs = Math.abs(diff);
  const text = abs >= 60 ? `${Math.floor(abs / 60)} 小时${abs % 60 ? ` ${abs % 60} 分` : ''}` : `${abs} 分钟`;
  return diff >= 0 ? `还有 ${text}` : `已过 ${text}`;
}

export default function Home() {
  const { state, dispatch, activePet } = useApp();
  const toast = useToast();
  const today = todayStr();

  if (!activePet) {
    return (
      <div className="page">
        <EmptyState
          emoji="🐾"
          title="先添加一位小伙伴"
          desc="建立宠物档案后，就能安排每日照护、抽饭和陪玩灵感啦。"
          action={
            <Link to="/pets" className="btn btn-primary">
              去添加宠物
            </Link>
          }
        />
      </div>
    );
  }

  const rows = tasksForDay(state, activePet.id, today);
  const total = rows.length;
  const done = rows.filter((r) => r.checkIn).length;
  const pending = rows.filter((r) => !r.checkIn);
  const next = pending[0];
  const upcoming = nextUpcomingTask(state, activePet.id, today);
  const petHealth = state.health
    .filter((h) => h.petId === activePet.id && h.weightKg !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = petHealth[0]?.weightKg ?? activePet.weightKg;
  const prevWeight = petHealth[1]?.weightKg;
  const delta = prevWeight !== undefined ? latestWeight - prevWeight : 0;

  const toggle = (taskId: string, checkInId?: string, title?: string) => {
    if (checkInId) {
      dispatch({ type: 'UNDO_CHECK_IN', id: checkInId });
      toast('已取消打卡');
      return;
    }
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    dispatch({ type: 'CHECK_IN', task, date: today, at: `${today}T${nowTime()}:00` });
    toast(`打卡成功 · ${title ?? task.title}`);
  };

  const hasAlerts = state.tasks.some(
    (t) => t.petId === activePet.id && t.enabled && ['med', 'vaccine', 'vet', 'deworm'].includes(t.kind),
  );

  return (
    <div className="page home">
      <div className="brand-row">
        <span className="brand">
          <span className="brand-mark" aria-hidden>
            🐾
          </span>
          爪爪日常
        </span>
        <Link to="/records?tab=alerts" className="icon-btn bell-btn" aria-label="查看提醒">
          <BellIcon size={20} />
          {hasAlerts && <i className="ping-dot" />}
        </Link>
      </div>

      <h1 className="greet">
        {greeting()}，{activePet.name}
      </h1>
      <p className="muted">{monthDayLabel()} · 今天也一起好好照顾它</p>

      <PetChips compact />

      <section className="card progress-card">
        <ProgressRing done={done} total={total} />
        <div className="progress-info">
          <span className="eyebrow">今日照护</span>
          <strong>{total === 0 ? '还没有今日任务' : done === total ? '今天全部完成' : `还有 ${total - done} 项待完成`}</strong>
          <p className="muted small">
            {next ? `下一项 ${next.task.time} · ${next.task.title}` : upcoming ? `下次提醒 ${relativeDay(upcoming.date)} ${upcoming.task.time}` : '给自己和它都放个假'}
          </p>
        </div>
      </section>

      {next ? (
        <section className="next-card">
          <div className="next-top">
            <span className="next-time">
              <ClockIcon size={15} />
              {next.task.time}
            </span>
            <span className="next-hint">{timeHint(next.task.time)}</span>
          </div>
          <h2>{next.task.title}</h2>
          <p>{next.task.note ?? '完成后记得打卡，记录会留在这里。'}</p>
          <button
            className="btn btn-primary btn-wide"
            onClick={() => toggle(next.task.id, next.checkIn?.id, next.task.title)}
          >
            完成打卡
          </button>
        </section>
      ) : (
        <section className="next-card all-done">
          <span className="done-emoji" aria-hidden>
            🎉
          </span>
          <div>
            <h2>{total === 0 ? '今天还没有安排' : '今天的任务都完成啦'}</h2>
            <p>
              {upcoming
                ? `下一次是 ${relativeDay(upcoming.date)} ${upcoming.task.time} 的「${upcoming.task.title}」。`
                : '去记录页添加一条日常任务，让照护更有节奏。'}
            </p>
          </div>
          <Link to={total === 0 ? '/records?tab=tasks' : '/records'} className="btn btn-ghost btn-sm">
            {total === 0 ? '添加任务' : '看记录'}
          </Link>
        </section>
      )}

      {pending.length > 0 && (
        <section className="block">
          <div className="section-head">
            <h2>待办 {pending.length}</h2>
            <Link to="/records?tab=tasks" className="text-link">
              管理 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card list-card">
            {pending.map(({ task, checkIn }) => (
              <TaskRow key={task.id} task={task} checkIn={checkIn} onToggle={() => toggle(task.id, checkIn?.id, task.title)} />
            ))}
          </div>
        </section>
      )}

      {done > 0 && (
        <section className="block">
          <div className="section-head">
            <h2>已完成 {done}</h2>
          </div>
          <div className="card list-card">
            {rows
              .filter((r) => r.checkIn)
              .map(({ task, checkIn }) => (
                <TaskRow
                  key={checkInKey(task.id, today)}
                  task={task}
                  checkIn={checkIn}
                  dimmed
                  onToggle={() => toggle(task.id, checkIn?.id, task.title)}
                />
              ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <section className="block">
          <div className="section-head">
            <h2>今天可以这样过</h2>
          </div>
          <div className="soft-card">
            <p>
              还没有为 {activePet.name} 安排固定任务。可以先加一条「喂食」，再抽一份今日搭配试试。
            </p>
            <Link to="/records?tab=tasks" className="btn btn-ghost btn-sm">
              去添加日常任务
            </Link>
          </div>
        </section>
      )}

      <section className="block">
        <div className="section-head">
          <h2>来点灵感</h2>
          <span className="section-tip">随机但要靠谱</span>
        </div>
        <div className="draw-entries">
          <Link to="/food" className="entry-card entry-food">
            <span className="entry-emoji" aria-hidden>
              🍲
            </span>
            <div>
              <strong>食物搭配抽签</strong>
              <p>摇一份今天吃什么</p>
            </div>
            <span className="entry-cta">抽一签</span>
          </Link>
          <Link to="/play" className="entry-card entry-play">
            <span className="entry-emoji" aria-hidden>
              🎾
            </span>
            <div>
              <strong>陪玩灵感抽签</strong>
              <p>找一个现在就能玩的</p>
            </div>
            <span className="entry-cta">抽一签</span>
          </Link>
        </div>
      </section>

      <Link to="/pets" className="card health-card">
        <div className="health-head">
          <span className="health-label">
            <ScaleIcon size={16} /> 体重 & 健康
          </span>
          <ChevronRight size={16} />
        </div>
        <div className="health-value">
          <strong>{latestWeight.toFixed(2)}</strong>
          <span>kg</span>
          {prevWeight !== undefined && (
            <em className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>
              {delta > 0 ? '+' : ''}
              {delta.toFixed(2)} kg
            </em>
          )}
        </div>
        <p className="muted small">
          {petHealth[0] ? `最近记录 ${shortDate(petHealth[0].date)} · 点击查看健康档案` : '还没有体重记录，去记下第一次'}
        </p>
      </Link>

      {activePet.concerns.length > 0 && (
        <section className="block">
          <div className="section-head">
            <h2>长期关注</h2>
          </div>
          <div className="concern-list">
            {activePet.concerns.map((c) => (
              <span key={c} className="concern-pill">
                {c}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

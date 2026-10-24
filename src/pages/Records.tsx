import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp, isTaskDue } from '../store/AppContext';
import { Sheet } from '../components/Sheet';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { uid } from '../store/storage';
import { addDays, relativeDay, shortDate, todayStr, weekdayCN } from '../lib/date';
import type { FrequencyType, Task, TaskKind } from '../store/types';
import { TASK_EMOJI, TASK_LABEL, BellIcon, ClockIcon, EditIcon, PlusIcon, TrashIcon } from '../lib/icons';

type Tab = 'log' | 'tasks' | 'alerts';

const TASK_KINDS: TaskKind[] = [
  'feed',
  'water',
  'walk',
  'litter',
  'med',
  'deworm',
  'groom',
  'vaccine',
  'vet',
  'custom',
];

const FREQ_OPTIONS: { key: FrequencyType; label: string }[] = [
  { key: 'daily', label: '每天' },
  { key: 'weekly', label: '每周' },
  { key: 'interval', label: '间隔天数' },
  { key: 'once', label: '单次' },
];

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function freqText(task: Task): string {
  const f = task.frequency;
  if (f.type === 'daily') return '每天';
  if (f.type === 'weekly') return `每周 ${(f.days ?? []).map((d) => `周${'日一二三四五六'[d]}`).join('、')}`;
  if (f.type === 'interval') return `每 ${f.everyDays ?? 1} 天`;
  return `单次 · ${f.date ? shortDate(f.date) : '未设置'}`;
}

function nextOccurrence(task: Task, from = todayStr()): string | null {
  for (let i = 0; i < 120; i += 1) {
    const date = addDays(from, i);
    if (isTaskDue(task, date)) return date;
  }
  return null;
}

interface TaskForm {
  petId: string;
  kind: TaskKind;
  title: string;
  time: string;
  freqType: FrequencyType;
  days: number[];
  everyDays: string;
  date: string;
  note: string;
}

export default function Records() {
  const { state, dispatch, activePet } = useApp();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const tab: Tab = params.get('tab') === 'tasks' || params.get('tab') === 'alerts' ? (params.get('tab') as Tab) : 'log';
  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true });

  const [logPet, setLogPet] = useState<string>('all');
  const [taskPet, setTaskPet] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(() => ({
    petId: activePet?.id ?? '',
    kind: 'feed',
    title: '喂食',
    time: '08:00',
    freqType: 'daily',
    days: [1, 4],
    everyDays: '7',
    date: todayStr(),
    note: '',
  }));
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const petName = (id: string) => state.pets.find((p) => p.id === id)?.name ?? '未知宠物';

  const logs = useMemo(() => {
    const list = state.checkIns
      .filter((c) => (logPet === 'all' ? true : c.petId === logPet))
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at));
    const groups: { date: string; items: typeof list }[] = [];
    list.forEach((item) => {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) last.items.push(item);
      else groups.push({ date: item.date, items: [item] });
    });
    return groups;
  }, [state.checkIns, logPet]);

  const filteredTasks = state.tasks.filter((t) => (taskPet === 'all' ? true : t.petId === taskPet));

  const alertTasks = useMemo(() => {
    return state.tasks
      .filter((t) => t.enabled && ['med', 'deworm', 'vaccine', 'vet'].includes(t.kind))
      .map((task) => ({ task, next: nextOccurrence(task) }))
      .filter((x): x is { task: Task; next: string } => Boolean(x.next))
      .sort((a, b) => a.next.localeCompare(b.next) || a.task.time.localeCompare(b.task.time));
  }, [state.tasks]);

  const weekAhead = useMemo(() => {
    const days: { date: string; items: Task[] }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(todayStr(), i);
      const items = state.tasks
        .filter((t) => t.enabled && isTaskDue(t, date))
        .sort((a, b) => a.time.localeCompare(b.time));
      if (items.length > 0) days.push({ date, items });
    }
    return days;
  }, [state.tasks]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      petId: activePet?.id ?? state.pets[0]?.id ?? '',
      kind: 'feed',
      title: '喂食',
      time: '08:00',
      freqType: 'daily',
      days: [1, 4],
      everyDays: '7',
      date: todayStr(),
      note: '',
    });
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      petId: task.petId,
      kind: task.kind,
      title: task.title,
      time: task.time,
      freqType: task.frequency.type,
      days: task.frequency.days ?? [1, 4],
      everyDays: String(task.frequency.everyDays ?? 7),
      date: task.frequency.date ?? todayStr(),
      note: task.note ?? '',
    });
    setFormOpen(true);
  };

  const submitTask = () => {
    if (!form.petId) {
      toast('先选择一只宠物', 'warn');
      return;
    }
    if (!form.title.trim()) {
      toast('给任务写个名字吧', 'warn');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(form.time)) {
      toast('提醒时间格式不对', 'warn');
      return;
    }
    const frequency: Task['frequency'] =
      form.freqType === 'daily'
        ? { type: 'daily' }
        : form.freqType === 'weekly'
          ? { type: 'weekly', days: form.days }
          : form.freqType === 'interval'
            ? { type: 'interval', everyDays: Math.max(1, Number(form.everyDays) || 7), anchor: todayStr() }
            : { type: 'once', date: form.date };

    if (form.freqType === 'weekly' && form.days.length === 0) {
      toast('至少选一个星期几', 'warn');
      return;
    }

    const base: Task = {
      id: editing?.id ?? uid('task'),
      petId: form.petId,
      kind: form.kind,
      title: form.title.trim(),
      time: form.time,
      frequency,
      enabled: editing?.enabled ?? true,
      note: form.note.trim() || undefined,
    };

    dispatch({ type: editing ? 'UPDATE_TASK' : 'ADD_TASK', task: base });
    setFormOpen(false);
    toast(editing ? '任务已更新' : '任务已添加');
  };

  const confirmDeleteTask = () => {
    if (!deleteTask) return;
    dispatch({ type: 'DELETE_TASK', id: deleteTask.id });
    toast('任务已删除');
    setDeleteTask(null);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">记录与提醒</p>
          <h1>照护足迹</h1>
        </div>
      </header>

      <div className="segmented tabs">
        <button className={tab === 'log' ? 'is-on' : ''} onClick={() => setTab('log')}>
          打卡记录
        </button>
        <button className={tab === 'tasks' ? 'is-on' : ''} onClick={() => setTab('tasks')}>
          任务管理
        </button>
        <button className={tab === 'alerts' ? 'is-on' : ''} onClick={() => setTab('alerts')}>
          提醒
        </button>
      </div>

      {tab === 'log' && (
        <>
          <div className="chip-row filter-row">
            <button className={`chip ${logPet === 'all' ? 'is-on' : ''}`} onClick={() => setLogPet('all')}>
              全部
            </button>
            {state.pets.map((p) => (
              <button
                key={p.id}
                className={`chip ${logPet === p.id ? 'is-on' : ''}`}
                onClick={() => setLogPet(p.id)}
              >
                {p.avatar} {p.name}
              </button>
            ))}
          </div>

          {logs.length === 0 ? (
            <EmptyState
              emoji="🗒️"
              title="还没有打卡记录"
              desc="在首页完成任务后，打卡记录会按日期整理在这里。"
              compact
            />
          ) : (
            <div className="log-groups">
              {logs.map((group) => (
                <section key={group.date} className="log-group">
                  <div className="log-date">
                    <strong>{relativeDay(group.date)}</strong>
                    <span>{shortDate(group.date)} · {weekdayCN(group.date)}</span>
                  </div>
                  <div className="card list-card">
                    {group.items.map((item) => (
                      <div key={item.id} className="log-row">
                        <span className="log-emoji">{TASK_EMOJI[item.kind]}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <p className="muted small">
                            {petName(item.petId)} · {item.at.slice(11, 16)}
                          </p>
                        </div>
                        <button
                          className="icon-btn tiny"
                          aria-label="撤销这条打卡"
                          onClick={() => {
                            dispatch({ type: 'UNDO_CHECK_IN', id: item.id });
                            toast('已撤销打卡');
                          }}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tasks' && (
        <>
          <div className="chip-row filter-row">
            <button className={`chip ${taskPet === 'all' ? 'is-on' : ''}`} onClick={() => setTaskPet('all')}>
              全部
            </button>
            {state.pets.map((p) => (
              <button
                key={p.id}
                className={`chip ${taskPet === p.id ? 'is-on' : ''}`}
                onClick={() => setTaskPet(p.id)}
              >
                {p.avatar} {p.name}
              </button>
            ))}
          </div>

          <button className="btn btn-primary btn-wide" onClick={openCreate}>
            <PlusIcon size={16} /> 添加日常任务
          </button>

          {filteredTasks.length === 0 ? (
            <EmptyState
              emoji="⏰"
              title="还没有日常任务"
              desc="从喂食、换水、遛弯开始，把每天要做的事安排好。"
              action={
                <button className="btn btn-ghost btn-sm" onClick={openCreate}>
                  添加第一条任务
                </button>
              }
              compact
            />
          ) : (
            <div className="card list-card admin-list">
              {filteredTasks
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((task) => (
                  <div key={task.id} className={`admin-row ${task.enabled ? '' : 'is-off'}`}>
                    <span className="log-emoji">{TASK_EMOJI[task.kind]}</span>
                    <div className="admin-main">
                      <strong>{task.title}</strong>
                      <p className="muted small">
                        {petName(task.petId)} · {task.time} · {freqText(task)}
                      </p>
                      {task.note && <p className="admin-note">{task.note}</p>}
                    </div>
                    <div className="admin-actions">
                      <button
                        className={`switch ${task.enabled ? 'is-on' : ''}`}
                        role="switch"
                        aria-checked={task.enabled}
                        aria-label={task.enabled ? '暂停任务' : '启用任务'}
                        onClick={() => {
                          dispatch({ type: 'TOGGLE_TASK', id: task.id });
                          toast(task.enabled ? '已暂停这个任务' : '已重新启用');
                        }}
                      >
                        <span />
                      </button>
                      <button className="icon-btn tiny" aria-label="编辑任务" onClick={() => openEdit(task)}>
                        <EditIcon size={15} />
                      </button>
                      <button className="icon-btn tiny" aria-label="删除任务" onClick={() => setDeleteTask(task)}>
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {tab === 'alerts' && (
        <>
          <section className="card alert-toggle">
            <div>
              <strong>
                <BellIcon size={16} /> 提醒整理
              </strong>
              <p className="muted small">
                打开后，重要提醒会排在最前面。爪爪日常不会真的推送系统通知，到点还需要你自己留意。
              </p>
            </div>
            <button
              className={`switch ${state.remindersOn ? 'is-on' : ''}`}
              role="switch"
              aria-checked={state.remindersOn}
              aria-label="提醒开关"
              onClick={() => {
                dispatch({ type: 'TOGGLE_REMINDERS' });
                toast(state.remindersOn ? '已收起提醒' : '已打开提醒整理');
              }}
            >
              <span />
            </button>
          </section>

          <section className="block">
            <div className="section-head">
              <h2>重要提醒</h2>
              <span className="section-tip">{alertTasks.length} 项</span>
            </div>
            {alertTasks.length === 0 ? (
              <div className="soft-card">
                <p>用药、驱虫、疫苗和复诊等任务会自动出现在这里。去任务管理添加一条吧。</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('tasks')}>
                  去添加任务
                </button>
              </div>
            ) : (
              <div className="alert-list">
                {alertTasks.map(({ task, next }) => (
                  <div key={task.id} className="alert-item">
                    <span className="alert-emoji">{TASK_EMOJI[task.kind]}</span>
                    <div className="alert-main">
                      <strong>{task.title}</strong>
                      <p className="muted small">
                        {petName(task.petId)} · {TASK_LABEL[task.kind]} · {task.time}
                      </p>
                      {task.note && <p className="admin-note">{task.note}</p>}
                    </div>
                    <span className={`alert-day ${next === todayStr() ? 'is-today' : ''}`}>
                      {relativeDay(next)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="block">
            <div className="section-head">
              <h2>未来 7 天</h2>
            </div>
            {weekAhead.length === 0 ? (
              <div className="soft-card">
                <p>接下来 7 天没有安排任务，可以安心休息，或者补一条日常照护。</p>
              </div>
            ) : (
              <div className="week-list">
                {weekAhead.map((day) => (
                  <div key={day.date} className="week-day">
                    <div className="week-day-head">
                      <strong>{relativeDay(day.date)}</strong>
                      <span>{weekdayCN(day.date)}</span>
                    </div>
                    <div className="card list-card">
                      {day.items.map((task) => (
                        <div key={task.id} className="mini-task">
                          <span className="mini-time">
                            <ClockIcon size={13} /> {task.time}
                          </span>
                          <span className="mini-title">
                            {TASK_EMOJI[task.kind]} {task.title}
                          </span>
                          <span className="mini-pet">{petName(task.petId)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Sheet
        open={formOpen}
        title={editing ? '编辑任务' : '添加日常任务'}
        subtitle="任务会出现在首页的今日清单里"
        onClose={() => setFormOpen(false)}
        footer={
          <button className="btn btn-primary btn-wide" onClick={submitTask}>
            {editing ? '保存修改' : '添加任务'}
          </button>
        }
      >
        <label className="field">
          <span>宠物</span>
          <select value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })}>
            {state.pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.species === 'cat' ? '猫' : '狗'}）
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>任务类型</span>
          <div className="chip-row">
            {TASK_KINDS.map((kind) => (
              <button
                key={kind}
                className={`chip ${form.kind === kind ? 'is-on' : ''}`}
                onClick={() =>
                  setForm({
                    ...form,
                    kind,
                    title: form.title === TASK_LABEL[form.kind] || !form.title.trim() ? TASK_LABEL[kind] : form.title,
                  })
                }
              >
                {TASK_EMOJI[kind]} {TASK_LABEL[kind]}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>任务名称</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例如：晚餐 · 湿粮 40g"
            maxLength={30}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>提醒时间</span>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
          <div className="field">
            <span>频率</span>
            <div className="segmented is-grid">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  className={form.freqType === f.key ? 'is-on' : ''}
                  onClick={() => setForm({ ...form, freqType: f.key })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {form.freqType === 'weekly' && (
          <div className="field">
            <span>每周哪几天</span>
            <div className="chip-row">
              {WEEKDAYS.map((d) => {
                const on = form.days.includes(d);
                return (
                  <button
                    key={d}
                    className={`chip ${on ? 'is-on' : ''}`}
                    onClick={() =>
                      setForm({ ...form, days: on ? form.days.filter((x) => x !== d) : [...form.days, d] })
                    }
                  >
                    周{'日一二三四五六'[d]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {form.freqType === 'interval' && (
          <label className="field">
            <span>每隔多少天</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={form.everyDays}
              onChange={(e) => setForm({ ...form, everyDays: e.target.value })}
            />
          </label>
        )}

        {form.freqType === 'once' && (
          <label className="field">
            <span>日期</span>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
        )}

        <label className="field">
          <span>备注（可不填）</span>
          <textarea
            rows={2}
            placeholder="例如：按体重确认剂量"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>
      </Sheet>

      <Sheet
        open={Boolean(deleteTask)}
        title="删除这条任务？"
        subtitle="已有的打卡记录会一起移除。也可以先用开关暂停它。"
        onClose={() => setDeleteTask(null)}
        footer={
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setDeleteTask(null)}>
              取消
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteTask}>
              删除任务
            </button>
          </div>
        }
      >
        <p className="muted">{deleteTask?.title}</p>
      </Sheet>
    </div>
  );
}

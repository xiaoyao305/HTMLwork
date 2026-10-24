import type { CheckIn, Task } from '../store/types';
import { CheckIcon, TASK_EMOJI } from '../lib/icons';

interface TaskRowProps {
  task: Task;
  checkIn?: CheckIn;
  onToggle: () => void;
  dimmed?: boolean;
}

export function TaskRow({ task, checkIn, onToggle, dimmed }: TaskRowProps) {
  const done = Boolean(checkIn);
  return (
    <div className={`task-row ${done ? 'is-done' : ''} ${dimmed ? 'is-dimmed' : ''}`}>
      <div className="task-emoji" aria-hidden>
        {TASK_EMOJI[task.kind]}
      </div>
      <div className="task-main">
        <div className="task-title-line">
          <strong>{task.title}</strong>
          <span className="task-time">{done ? `${checkIn?.at.slice(11, 16)} 已打卡` : task.time}</span>
        </div>
        {task.note && <p className="task-note">{task.note}</p>}
      </div>
      <button
        className={`check-btn ${done ? 'is-checked' : ''}`}
        onClick={onToggle}
        aria-label={done ? `取消打卡：${task.title}` : `打卡：${task.title}`}
      >
        {done ? <CheckIcon size={18} /> : <span className="check-dot" />}
      </button>
    </div>
  );
}

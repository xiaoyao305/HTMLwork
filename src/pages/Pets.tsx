import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { PetChips } from '../components/PetChips';
import { Sheet } from '../components/Sheet';
import { TagInput } from '../components/TagInput';
import { WeightChart } from '../components/WeightChart';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { ageText, shortDate, toDateStr, todayStr } from '../lib/date';
import type { EnergyLevel, HealthTag, Pet, Species } from '../store/types';
import { uid } from '../store/storage';
import { EditIcon, PlusIcon, ScaleIcon, TrashIcon } from '../lib/icons';

const AVATARS = ['🐱', '🐶', '🐈', '🐕', '🐈‍⬛', '🐕‍🦺', '😺', '🐾', '🐰', '🦊'];

const ENERGY_LABEL: Record<EnergyLevel, string> = {
  low: '慵懒',
  mid: '适中',
  high: '精力旺盛',
};

const HEALTH_TAGS: HealthTag[] = ['体重', '用药', '驱虫', '洗护', '疫苗', '复诊', '其他'];

interface PetForm {
  name: string;
  avatar: string;
  species: Species;
  breed: string;
  birthday: string;
  weightKg: string;
  allergies: string[];
  avoid: string[];
  concerns: string[];
  energy: EnergyLevel;
}

function defaultBirthday(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return toDateStr(d);
}

function emptyForm(): PetForm {
  return {
    name: '',
    avatar: '🐱',
    species: 'cat',
    breed: '',
    birthday: defaultBirthday(),
    weightKg: '',
    allergies: [],
    avoid: [],
    concerns: [],
    energy: 'mid',
  };
}

function toForm(pet: Pet): PetForm {
  return {
    name: pet.name,
    avatar: pet.avatar,
    species: pet.species,
    breed: pet.breed,
    birthday: pet.birthday,
    weightKg: String(pet.weightKg),
    allergies: pet.allergies,
    avoid: pet.avoid,
    concerns: pet.concerns,
    energy: pet.energy,
  };
}

export default function Pets() {
  const { state, dispatch, activePet } = useApp();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [form, setForm] = useState<PetForm>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [healthOpen, setHealthOpen] = useState(false);
  const [healthForm, setHealthForm] = useState({
    date: todayStr(),
    weight: '',
    tags: ['体重'] as HealthTag[],
    note: '',
  });

  const pet = activePet;

  const weightRecords = useMemo(
    () =>
      state.health
        .filter((h) => h.petId === pet?.id && h.weightKg !== undefined)
        .map((h) => ({ date: h.date, weightKg: h.weightKg as number })),
    [state.health, pet?.id],
  );

  const healthList = useMemo(
    () =>
      state.health
        .filter((h) => h.petId === pet?.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.health, pet?.id],
  );

  const openCreate = () => {
    setEditingPet(null);
    setForm({ ...emptyForm(), species: pet?.species === 'dog' ? 'dog' : 'cat' });
    setFormOpen(true);
  };

  const openEdit = (target: Pet) => {
    setEditingPet(target);
    setForm(toForm(target));
    setFormOpen(true);
  };

  const submitPet = () => {
    if (!form.name.trim()) {
      toast('先给伙伴取个名字吧', 'warn');
      return;
    }
    const weight = Number(form.weightKg);
    if (!Number.isFinite(weight) || weight <= 0) {
      toast('体重请填写大于 0 的数字', 'warn');
      return;
    }
    if (editingPet) {
      dispatch({
        type: 'UPDATE_PET',
        pet: {
          ...editingPet,
          ...form,
          name: form.name.trim(),
          breed: form.breed.trim() || '品种未填',
          weightKg: weight,
        },
      });
      toast(`已更新 ${form.name} 的档案`);
    } else {
      dispatch({
        type: 'ADD_PET',
        pet: {
          ...form,
          id: uid('pet'),
          name: form.name.trim(),
          breed: form.breed.trim() || '品种未填',
          weightKg: weight,
          createdAt: new Date().toISOString(),
        },
      });
      toast(`欢迎 ${form.name} 加入爪爪日常`);
    }
    setFormOpen(false);
  };

  const deletePet = () => {
    if (!pet) return;
    dispatch({ type: 'DELETE_PET', id: pet.id });
    setConfirmDelete(false);
    toast(`已删除 ${pet.name} 的档案`);
  };

  const submitHealth = () => {
    if (!pet) return;
    const weight = healthForm.weight ? Number(healthForm.weight) : undefined;
    if (healthForm.weight && (!Number.isFinite(weight) || (weight as number) <= 0)) {
      toast('体重请填写大于 0 的数字', 'warn');
      return;
    }
    dispatch({
      type: 'ADD_HEALTH',
      record: {
        id: uid('hr'),
        petId: pet.id,
        date: healthForm.date || todayStr(),
        weightKg: weight,
        tags: healthForm.tags.length > 0 ? healthForm.tags : ['其他'],
        note: healthForm.note.trim() || undefined,
      },
    });
    if (weight) {
      dispatch({ type: 'UPDATE_PET', pet: { ...pet, weightKg: weight } });
    }
    setHealthOpen(false);
    setHealthForm({ date: todayStr(), weight: '', tags: ['体重'], note: '' });
    toast('健康记录已保存');
  };

  if (!pet) {
    return (
      <div className="page">
        <EmptyState
          emoji="🐱"
          title="还没有宠物档案"
          desc="添加猫咪或狗狗，记录体重、过敏和长期关注的事项。"
          action={
            <button className="btn btn-primary" onClick={openCreate}>
              <PlusIcon size={16} /> 添加第一只宠物
            </button>
          }
        />
        <PetFormSheet
          open={formOpen}
          form={form}
          editing={Boolean(editingPet)}
          onForm={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={submitPet}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">宠物档案</p>
          <h1>我的伙伴们</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <PlusIcon size={16} /> 添加
        </button>
      </header>

      <PetChips onAdd={openCreate} />

      <section className="card pet-hero">
        <div className="pet-hero-top">
          <div className="pet-avatar-xl" aria-hidden>
            {pet.avatar.startsWith('data:') ? <img src={pet.avatar} alt="" /> : pet.avatar}
          </div>
          <div className="pet-hero-name">
            <h2>{pet.name}</h2>
            <p className="muted">
              {pet.species === 'cat' ? '猫咪' : '狗狗'} · {pet.breed} · {ageText(pet.birthday)}
            </p>
          </div>
          <button className="icon-btn" aria-label="编辑档案" onClick={() => openEdit(pet)}>
            <EditIcon size={18} />
          </button>
        </div>

        <div className="pet-stats">
          <div>
            <span>当前体重</span>
            <strong>{pet.weightKg.toFixed(2)} kg</strong>
          </div>
          <div>
            <span>生日</span>
            <strong>{pet.birthday ? shortDate(pet.birthday) : '未填写'}</strong>
          </div>
          <div>
            <span>日常精力</span>
            <strong>{ENERGY_LABEL[pet.energy]}</strong>
          </div>
        </div>

        <div className="restrict-grid">
          <div>
            <span className="restrict-label allergy">过敏</span>
            {pet.allergies.length > 0 ? (
              <div className="tag-list is-static">
                {pet.allergies.map((t) => (
                  <span key={t} className="tag tag-pink">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted small">暂无记录</p>
            )}
          </div>
          <div>
            <span className="restrict-label avoid">忌口</span>
            {pet.avoid.length > 0 ? (
              <div className="tag-list is-static">
                {pet.avoid.map((t) => (
                  <span key={t} className="tag tag-amber">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted small">暂无记录</p>
            )}
          </div>
        </div>

        <div className="concern-block">
          <span className="restrict-label concern">长期关注</span>
          {pet.concerns.length > 0 ? (
            <div className="tag-list is-static">
              {pet.concerns.map((t) => (
                <span key={t} className="tag tag-mint">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted small">还没有特别标注的事项</p>
          )}
        </div>

        <div className="pet-hero-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(pet)}>
            <EditIcon size={15} /> 编辑档案
          </button>
          <button className="btn btn-danger-ghost btn-sm" onClick={() => setConfirmDelete(true)}>
            <TrashIcon size={15} /> 删除
          </button>
        </div>
      </section>

      <section className="block">
        <div className="section-head">
          <h2>体重趋势</h2>
          <button
            className="text-link"
            onClick={() => {
              setHealthForm({ date: todayStr(), weight: String(pet.weightKg), tags: ['体重'], note: '' });
              setHealthOpen(true);
            }}
          >
            <ScaleIcon size={14} /> 记录
          </button>
        </div>
        <div className="card">
          <WeightChart records={weightRecords} />
        </div>
      </section>

      <section className="block">
        <div className="section-head">
          <h2>健康记录</h2>
          <span className="section-tip">{healthList.length} 条</span>
        </div>
        {healthList.length === 0 ? (
          <div className="soft-card">
            <p>还没有健康记录。体重、用药、疫苗和复诊都可以记在这里。</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setHealthOpen(true)}>
              添加第一条记录
            </button>
          </div>
        ) : (
          <div className="timeline">
            {healthList.map((record) => (
              <div key={record.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-body">
                  <div className="timeline-head">
                    <strong>{shortDate(record.date)}</strong>
                    {record.weightKg !== undefined && <span className="weight-pill">{record.weightKg.toFixed(2)} kg</span>}
                  </div>
                  <div className="timeline-tags">
                    {record.tags.map((t) => (
                      <span key={t} className="mini-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                  {record.note && <p className="timeline-note">{record.note}</p>}
                </div>
                <button
                  className="icon-btn tiny"
                  aria-label="删除记录"
                  onClick={() => {
                    dispatch({ type: 'DELETE_HEALTH', id: record.id });
                    toast('已删除这条记录');
                  }}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="disclaimer">
        健康记录仅作日常参考，不能替代兽医诊断。出现持续异常时请及时就医。
      </p>

      <PetFormSheet
        open={formOpen}
        form={form}
        editing={Boolean(editingPet)}
        onForm={setForm}
        onClose={() => setFormOpen(false)}
        onSubmit={submitPet}
      />

      <Sheet
        open={healthOpen}
        title="添加健康记录"
        subtitle={`${pet.name} · 记下今天的情况`}
        onClose={() => setHealthOpen(false)}
        footer={
          <button className="btn btn-primary btn-wide" onClick={submitHealth}>
            保存记录
          </button>
        }
      >
        <div className="field-row">
          <label className="field">
            <span>日期</span>
            <input
              type="date"
              value={healthForm.date}
              onChange={(e) => setHealthForm({ ...healthForm, date: e.target.value })}
            />
          </label>
          <label className="field">
            <span>体重（kg，可不填）</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="例如 4.35"
              value={healthForm.weight}
              onChange={(e) => setHealthForm({ ...healthForm, weight: e.target.value })}
            />
          </label>
        </div>

        <div className="field">
          <span>记录类型</span>
          <div className="chip-row">
            {HEALTH_TAGS.map((tag) => {
              const on = healthForm.tags.includes(tag);
              return (
                <button
                  key={tag}
                  className={`chip ${on ? 'is-on' : ''}`}
                  onClick={() =>
                    setHealthForm({
                      ...healthForm,
                      tags: on ? healthForm.tags.filter((t) => t !== tag) : [...healthForm.tags, tag],
                    })
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field">
          <span>备注</span>
          <textarea
            rows={3}
            placeholder="食欲、精神、便便或用药反应…"
            value={healthForm.note}
            onChange={(e) => setHealthForm({ ...healthForm, note: e.target.value })}
          />
        </label>
      </Sheet>

      <Sheet
        open={confirmDelete}
        title={`删除 ${pet.name} 的档案？`}
        subtitle="相关任务、打卡和健康记录会一起移除，且无法恢复。"
        onClose={() => setConfirmDelete(false)}
        footer={
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
              再想想
            </button>
            <button className="btn btn-danger" onClick={deletePet}>
              确认删除
            </button>
          </div>
        }
      >
        <p className="muted">
          如果只是想暂时不看它的任务，可以在任务管理里把任务关掉，不必删除档案。
        </p>
      </Sheet>
    </div>
  );
}

interface PetFormSheetProps {
  open: boolean;
  form: PetForm;
  editing: boolean;
  onForm: (next: PetForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function PetFormSheet({ open, form, editing, onForm, onClose, onSubmit }: PetFormSheetProps) {
  return (
    <Sheet
      open={open}
      title={editing ? '编辑档案' : '添加新伙伴'}
      subtitle="信息越完整，抽签时的筛选就越贴合"
      onClose={onClose}
      footer={
        <button className="btn btn-primary btn-wide" onClick={onSubmit}>
          {editing ? '保存修改' : '创建档案'}
        </button>
      }
    >
      <div className="avatar-picker">
        {AVATARS.map((a) => (
          <button
            key={a}
            className={`avatar-option ${form.avatar === a ? 'is-on' : ''}`}
            onClick={() => onForm({ ...form, avatar: a })}
            aria-label={`选择头像 ${a}`}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="field">
        <span>名字</span>
        <input
          value={form.name}
          onChange={(e) => onForm({ ...form, name: e.target.value })}
          placeholder="例如：奶糖"
          maxLength={12}
        />
      </label>

      <div className="field">
        <span>猫狗类型</span>
        <div className="segmented">
          <button
            className={form.species === 'cat' ? 'is-on' : ''}
            onClick={() => onForm({ ...form, species: 'cat', avatar: form.avatar === '🐶' ? '🐱' : form.avatar })}
          >
            🐱 猫咪
          </button>
          <button
            className={form.species === 'dog' ? 'is-on' : ''}
            onClick={() => onForm({ ...form, species: 'dog', avatar: form.avatar === '🐱' ? '🐶' : form.avatar })}
          >
            🐶 狗狗
          </button>
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span>品种</span>
          <input
            value={form.breed}
            onChange={(e) => onForm({ ...form, breed: e.target.value })}
            placeholder="例如：英短"
          />
        </label>
        <label className="field">
          <span>生日</span>
          <input
            type="date"
            value={form.birthday}
            max={todayStr()}
            onChange={(e) => onForm({ ...form, birthday: e.target.value })}
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>体重（kg）</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.weightKg}
            onChange={(e) => onForm({ ...form, weightKg: e.target.value })}
            placeholder="例如 4.35"
          />
        </label>
        <div className="field">
          <span>精力水平</span>
          <div className="segmented">
            {(['low', 'mid', 'high'] as EnergyLevel[]).map((level) => (
              <button
                key={level}
                className={form.energy === level ? 'is-on' : ''}
                onClick={() => onForm({ ...form, energy: level })}
              >
                {ENERGY_LABEL[level]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <span>过敏源</span>
        <TagInput
          value={form.allergies}
          onChange={(next) => onForm({ ...form, allergies: next })}
          placeholder="例如：乳制品、鸡肉"
          tone="pink"
        />
      </div>

      <div className="field">
        <span>忌口 / 不爱吃</span>
        <TagInput
          value={form.avoid}
          onChange={(next) => onForm({ ...form, avoid: next })}
          placeholder="例如：生鱼、玉米"
          tone="amber"
        />
      </div>

      <div className="field">
        <span>长期关注</span>
        <TagInput
          value={form.concerns}
          onChange={(next) => onForm({ ...form, concerns: next })}
          placeholder="例如：控制体重、留意关节"
          tone="mint"
        />
      </div>
    </Sheet>
  );
}

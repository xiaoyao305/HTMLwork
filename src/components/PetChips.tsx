import { useApp } from '../store/AppContext';
import { PlusIcon } from '../lib/icons';

interface PetChipsProps {
  onAdd?: () => void;
  compact?: boolean;
}

export function PetChips({ onAdd, compact }: PetChipsProps) {
  const { state, dispatch } = useApp();

  return (
    <div className={`pet-chips ${compact ? 'is-compact' : ''}`} role="tablist" aria-label="切换宠物">
      {state.pets.map((pet) => {
        const active = pet.id === state.activePetId;
        return (
          <button
            key={pet.id}
            role="tab"
            aria-selected={active}
            className={`pet-chip ${active ? 'is-active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_PET', id: pet.id })}
          >
            <span className="pet-chip-avatar">
              {pet.avatar.startsWith('data:') || pet.avatar.startsWith('http') ? (
                <img src={pet.avatar} alt="" />
              ) : (
                pet.avatar
              )}
            </span>
            <span className="pet-chip-text">
              <strong>{pet.name}</strong>
              <small>{pet.species === 'cat' ? '猫咪' : '狗狗'}</small>
            </span>
          </button>
        );
      })}
      {onAdd && (
        <button className="pet-chip pet-chip-add" onClick={onAdd} aria-label="添加宠物">
          <span className="pet-chip-avatar">
            <PlusIcon size={18} />
          </span>
          <span className="pet-chip-text">
            <strong>添加</strong>
            <small>新伙伴</small>
          </span>
        </button>
      )}
    </div>
  );
}

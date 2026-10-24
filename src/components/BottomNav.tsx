import { NavLink } from 'react-router-dom';
import { HomeIcon, PawIcon, BowlIcon, SparkIcon, ListIcon } from '../lib/icons';

const items = [
  { to: '/', label: '首页', Icon: HomeIcon, end: true },
  { to: '/pets', label: '档案', Icon: PawIcon },
  { to: '/food', label: '搭配', Icon: BowlIcon },
  { to: '/play', label: '陪玩', Icon: SparkIcon },
  { to: '/records', label: '记录', Icon: ListIcon },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
        >
          <span className="nav-icon">
            <Icon size={21} />
          </span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

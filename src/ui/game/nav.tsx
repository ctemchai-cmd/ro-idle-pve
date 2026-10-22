import { StoreIcon } from './store-icon.tsx';
import { Icon } from '../icon.tsx';
import type { AssetPack } from '../../renderer/pack.ts';
import { iconUrl } from './kit.tsx';

export type Tab = 'backpack' | 'team' | 'buddy' | 'dungeon' | 'store';
const tabs: { id: Tab; label: string; icon: string }[] = [{ id: 'backpack', label: 'กระเป๋า', icon: 'nav_backpack' }, { id: 'team', label: 'ทีม', icon: 'nav_team' }, { id: 'buddy', label: 'ตัวละคร', icon: 'nav_buddy' }, { id: 'dungeon', label: 'ดันเจี้ยน', icon: 'nav_dungeon' }];
export function BottomBar({ pack, active, open, locked }: { pack: AssetPack | null; active: Tab | null; open: (tab: Tab) => void; locked: () => void }) {
  const craft = iconUrl(pack, 'feature_icons', 'crafting');
  return <nav className="bottom-bar" aria-label="เมนูหลัก">
    {tabs.map(tab => { const url = iconUrl(pack, 'ui_icons', active === tab.id ? `${tab.icon}_active` : tab.icon); return <button key={tab.id} className={`nav-item ${active === tab.id ? 'active' : ''}`} aria-current={active === tab.id ? 'page' : undefined} onClick={() => open(tab.id)}>{url ? <img src={url} alt="" /> : <span className="nav-glyph" />}<span>{tab.label}</span></button>; })}
    <button className={`nav-item ${active === 'store' ? 'active' : ''}`} aria-current={active === 'store' ? 'page' : undefined} onClick={() => open('store')}><StoreIcon /><span>ร้านค้า</span></button>
    <button className="nav-item locked" aria-disabled="true" onClick={locked}>{craft ? <img className="pixel-2x" src={craft} alt="" /> : <span className="nav-glyph" />}<span>คราฟต์</span><i className="lock-badge" aria-label="ล็อก"><Icon name="lock" /></i></button>
  </nav>;
}

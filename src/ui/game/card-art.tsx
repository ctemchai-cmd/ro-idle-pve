import type { cardView } from '../../client/slots.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { ItemIcon } from './kit.tsx';

/** Share the original illustration; tone only the image so rarity borders remain legible. */
export function CardIcon({ card, pack }: { card: Pick<ReturnType<typeof cardView>, 'iconId'> & Partial<Pick<ReturnType<typeof cardView>, 'origin'>>; pack: AssetPack | null }) {
  return <ItemIcon id={card.iconId} pack={pack} className={card.origin?.variant==='puppet'?'puppet-art':''} />;
}

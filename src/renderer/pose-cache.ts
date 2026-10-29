export interface PoseImage {
  image: HTMLCanvasElement;
  x: number;
  y: number;
  bytes: number;
}
export const POSE_CACHE_BYTES = 12 * 1024 * 1024;
export const POSE_CACHE_FRAMES = 256;

/** Artwork only; a pack owns this bounded LRU, independent of accounts/actors. */
export class PoseCache {
  private readonly entries = new Map<string, PoseImage>();
  private bytes = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  constructor(readonly maxBytes = POSE_CACHE_BYTES, readonly maxFrames = POSE_CACHE_FRAMES) {
    if(!Number.isSafeInteger(maxBytes)||maxBytes<0||maxBytes>POSE_CACHE_BYTES||!Number.isSafeInteger(maxFrames)||maxFrames<0||maxFrames>POSE_CACHE_FRAMES)throw new RangeError('POSE_CACHE_BUDGET');
  }
  get(key:string):PoseImage|undefined {
    const frame=this.entries.get(key);
    if(!frame){this.misses++;return undefined;}
    this.hits++;this.entries.delete(key);this.entries.set(key,frame);return frame;
  }
  put(key:string,frame:PoseImage):boolean {
    if(frame.bytes>this.maxBytes||this.maxFrames===0)return false;
    const old=this.entries.get(key);
    if(old){this.entries.delete(key);this.bytes-=old.bytes;if(old.image!==frame.image)this.release(old);}
    while(this.entries.size&&(this.bytes+frame.bytes>this.maxBytes||this.entries.size>=this.maxFrames)){
      const [id,entry]=this.entries.entries().next().value!;this.entries.delete(id);this.bytes-=entry.bytes;this.evictions++;this.release(entry);
    }
    this.entries.set(key,frame);this.bytes+=frame.bytes;return true;
  }
  private release(frame:PoseImage){frame.image.width=0;frame.image.height=0;}
  clear(){for(const frame of this.entries.values())this.release(frame);this.entries.clear();this.bytes=0;this.hits=0;this.misses=0;this.evictions=0;}
  stats(){return{bytes:this.bytes,frames:this.entries.size,hits:this.hits,misses:this.misses,evictions:this.evictions,budget_bytes:this.maxBytes,max_frames:this.maxFrames};}
}

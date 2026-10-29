import test from 'node:test';
import assert from 'node:assert/strict';
import { PoseCache, POSE_CACHE_BYTES, type PoseImage } from '../../src/renderer/pose-cache.ts';
const frame=(bytes:number):PoseImage=>({image:{width:bytes/4,height:1} as HTMLCanvasElement,x:-2,y:-3,bytes});
test('pose LRU honors both byte and entry budgets, retains recently used artwork and releases evicted backing stores',()=>{
 const cache=new PoseCache(100,2),a=frame(40),b=frame(40),c=frame(40);assert(cache.put('a',a));assert(cache.put('b',b));assert.equal(cache.get('a'),a);assert(cache.put('c',c));assert.equal(cache.get('b'),undefined);assert.equal(b.image.width,0);assert.equal(cache.get('a'),a);assert.equal(cache.stats().bytes,80);assert.equal(cache.stats().frames,2);assert.equal(cache.stats().evictions,1);
});
test('oversized and disabled-cache frames do not evict useful artwork or claim ownership',()=>{
 const cache=new PoseCache(100,2),a=frame(80),large=frame(104);cache.put('a',a);assert.equal(cache.put('large',large),false);assert.equal(cache.get('a'),a);assert.equal(large.image.width,26);assert.equal(cache.stats().bytes,80);const disabled=new PoseCache(0,0);assert.equal(disabled.put('a',a),false);assert.equal(a.image.width,20);
});
test('replacement conserves accounting and clear releases all cached canvas memory',()=>{
 const cache=new PoseCache(100,3),old=frame(40),next=frame(20);cache.put('a',old);cache.put('a',next);assert.equal(old.image.width,0);assert.equal(cache.stats().bytes,20);cache.clear();assert.equal(next.image.width,0);assert.equal(cache.stats().bytes,0);assert.equal(cache.stats().frames,0);
});
test('cache policies cannot exceed the renderer memory cap or accept invalid budgets',()=>{
 for(const [bytes,frames]of[[Infinity,1],[-1,1],[POSE_CACHE_BYTES+1,1],[100,257],[100,-1],[NaN,1]])assert.throws(()=>new PoseCache(bytes,frames),RangeError);
});

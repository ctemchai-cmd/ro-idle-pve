import { actorFrame, attachmentFrame, drawActor, drawParts } from '/src/renderer/native.mjs';
const lerp = (a, b, t) => a + (b - a) * t;
const angle = (a, b, t) => a + (((b - a + 180) % 360 + 360) % 360 - 180) * t;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => n * n * (3 - 2 * n);
const anchor = (f) => f?.anchor?.length === 2 && f.anchor.every(Number.isFinite) && f.anchor[1] < -1 ? [f.anchor[0], f.anchor[1]] : null;
/** Keeps root at0 and neck attached. Large bends rotate rather than stretch a torso. */
export function rootNeckTransform(source, target, rotate = true) {
    const shear = (target[0] - source[0]) / source[1], vertical = target[1] / source[1];
    if (!rotate)
        return [1, 0, shear, vertical];
    const square = source[0] ** 2 + source[1] ** 2;
    const a = (source[0] * target[0] + source[1] * target[1]) / square, b = (source[0] * target[1] - source[1] * target[0]) / square;
    return [a, b, -b, a];
}
/** Geometry is generated between native keys, never by changing their ACT clock. */
export function actorTweenSample(parts, state, elapsed) {
    if (!parts.head || !state.startsWith('attack') || !Number.isFinite(elapsed) || elapsed < 0)
        return null;
    const from = actorFrame(parts, state, elapsed), delay = from.action?.frame_duration_ms ?? 0;
    if (!from.frame || !from.action || delay <= 0 || elapsed >= from.action.frames.length * delay)
        return null;
    const amount = elapsed / delay - Math.floor(elapsed / delay);
    if (amount < 1e-8)
        return null;
    const to = from.index === from.action.frames.length - 1 ? actorFrame(parts, 'idle', 0) : actorFrame(parts, state, (from.index + 1) * delay), a = anchor(from.frame), b = anchor(to.frame);
    if (!a || !b)
        return null;
    const target = [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount)];
    for (const source of [a, b]) {
        const ratio = Math.hypot(...target) / Math.hypot(...source);
        if (ratio < .5 || ratio > 2)
            return null;
    }
    // Choose for the whole source pair, so no transform mode switches mid-interval.
    const rotate = [[a, b], [b, a]].some(([s, t]) => Math.abs((t[0] - s[0]) / s[1]) > .5 || t[1] / s[1] < .65 || t[1] / s[1] > 1.5);
    return { from, to, amount, blend: smooth(clamp((amount - .38) / .24)), anchor: target, rotate };
}
function segments(parts, s, state, group) {
    if (!s.frame || !s.action)
        return [];
    const result = [];
    const add = (asset, head = false) => { if (!asset)
        return; const f = attachmentFrame(asset, s.action, s.frame, s.index, state); if (f)
        result.push({ asset, frame: f.frame, offset: head ? f.offset : [0, 0] }); };
    if (group === 'lower') {
        add(parts.garment);
        add(parts.shield);
        result.push({ asset: parts.body, frame: s.frame, offset: [0, 0] });
    }
    if (group === 'head') {
        add(parts.head, true);
        add(parts.headgear, true);
    }
    if (group === 'weapon')
        add(parts.weapon);
    return result;
}
function matching(a, b) {
    return a.length === b.length && a.every((s, i) => s.asset === b[i].asset && s.frame.layers.length === b[i].frame.layers.length && s.frame.layers.every((l, j) => l[2] === b[i].frame.layers[j][2] && l[3] === b[i].frame.layers[j][3]));
}
function intermediate(a, b, t, chooseNext = false) {
    const chosen = chooseNext ? b : a;
    return { layers: chosen.frame.layers.map((layer, i) => {
            const l = a.frame.layers[i], r = b.frame.layers[i];
            if (!l || !r) {
                const row = [...layer];
                row[0] = row[0] + chosen.offset[0];
                row[1] = row[1] + chosen.offset[1];
                return row;
            }
            const get = (v, n, def) => v?.[n] ?? def;
            const row = [...layer];
            row[0] = lerp(l[0] + a.offset[0], r[0] + b.offset[0], t);
            row[1] = lerp(l[1] + a.offset[1], r[1] + b.offset[1], t);
            for (const n of [4, 5, 6, 7])
                row[n] = lerp(get(l, n, 255), get(r, n, 255), t);
            row[8] = lerp(get(l, 8, 1), get(r, 8, 1), t);
            row[9] = lerp(get(l, 9, 1), get(r, 9, 1), t);
            row[10] = angle(get(l, 10, 0), get(r, 10, 0), t);
            return row;
        }) };
}
function paint(ctx, items, source, target, rotate = false) {
    ctx.save();
    if (source && target) {
        const [a, b, c, d] = rootNeckTransform(source, target, rotate);
        ctx.transform(a, b, c, d, 0, 0);
    }
    let count = 0;
    for (const s of items)
        count += drawParts(ctx, s.asset, s.frame, s.offset);
    ctx.restore();
    return count;
}
/** Reusable scratch belongs to the renderer, not to every frame or actor. */
export class NativeActorTween {
    surfaces = null;
    rigSurface = null;
    get scratchBytes() { return ((this.surfaces ? 3 : 0) + (this.rigSurface ? 1 : 0)) * 384 * 384 * 4; }
    blend(ctx, a, b, sample, warp) {
        const from = warp ? anchor(sample.from.frame) : undefined, to = warp ? anchor(sample.to.frame) : undefined;
        if (sample.blend === 0)
            return paint(ctx, a, from, warp ? sample.anchor : undefined, sample.rotate);
        if (sample.blend === 1)
            return paint(ctx, b, to, warp ? sample.anchor : undefined, sample.rotate);
        this.surfaces ??= Array.from({ length: 3 }, () => { const c = document.createElement('canvas'); c.width = c.height = 384; c.getContext('2d').imageSmoothingEnabled = false; return c; });
        let count = 0;
        for (const [canvas, items, source] of [[this.surfaces[0], a, from], [this.surfaces[1], b, to]]) {
            const c = canvas.getContext('2d');
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, 384, 384);
            c.save();
            c.translate(192, 300);
            count += paint(c, items, source, warp ? sample.anchor : undefined, sample.rotate);
            c.restore();
        }
        const mix = this.surfaces[2], c = mix.getContext('2d');
        c.clearRect(0, 0, 384, 384);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = 1 - sample.blend;
        c.drawImage(this.surfaces[0], 0, 0);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = sample.blend;
        c.drawImage(this.surfaces[1], 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        ctx.drawImage(mix, -192, -300);
        return count + 3;
    }
    draw(ctx, parts, state, elapsed, x, y, facing = 'right', scale = 2.5, enabled = true) {
        const sample = enabled ? actorTweenSample(parts, state, elapsed) : null;
        if (!sample)
            return drawActor(ctx, parts, state, elapsed, x, y, facing, scale);
        // Rasterize the complete intermediate rig once before flipping/scaling it.
        // This gives head, limbs and overlays the same pixel grid in both facings.
        this.rigSurface ??= (() => { const c = document.createElement('canvas'); c.width = c.height = 384; c.getContext('2d').imageSmoothingEnabled = false; return c; })();
        const rig = this.rigSurface.getContext('2d');
        rig.setTransform(1, 0, 0, 1, 0, 0);
        rig.clearRect(0, 0, 384, 384);
        rig.save();
        rig.translate(192, 300);
        let count = 0;
        for (const group of ['lower', 'head', 'weapon']) {
            const a = segments(parts, sample.from, state, group), b = segments(parts, sample.to, state, group);
            if (matching(a, b)) {
                for (let i = 0; i < a.length; i++)
                    count += drawParts(rig, a[i].asset, intermediate(a[i], b[i], sample.amount));
            }
            // A face is never double exposed, even for an unusual headgear frame change.
            else if (group === 'head') {
                for (const asset of new Set([...a, ...b].map(s => s.asset))) {
                    const first = a.find(s => s.asset === asset), next = b.find(s => s.asset === asset);
                    if (first && next)
                        count += drawParts(rig, asset, intermediate(first, next, sample.amount, sample.amount >= .5));
                    else {
                        const single = first ?? next;
                        count += drawParts(rig, asset, single.frame, single.offset);
                    }
                }
            }
            else
                count += this.blend(rig, a, b, sample, group === 'lower');
        }
        rig.restore();
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing === 'left' ? -scale : scale, scale);
        ctx.drawImage(this.rigSurface, -192, -300);
        ctx.restore();
        return count + 1;
    }
}

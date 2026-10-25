export interface NativeAction { state: string; source_action_index: number; frame_duration_ms: number; frames: NativeFrame[] }
export interface NativeFrame { layers: number[][]; anchor?: number[]; event?: number }
export interface NativeMeta {
  id: string; width: number; height: number; status: string;
  file: { path: string }; missing_dependencies?: unknown[];
  sprite_sheet?: { frames: number[][] };
  animation?: { actions: NativeAction[]; events?: string[] };
  effect?: { fps: number; max_key: number; layers: unknown[]; textures: number[][] };
}
export interface NativeAsset { meta: NativeMeta; image: HTMLImageElement }
export interface ActorParts { body: NativeAsset; head?: NativeAsset; weapon?: NativeAsset; headgear?: NativeAsset; garment?: NativeAsset; shield?: NativeAsset; attackIndex?: number; attackVariants?: readonly number[]; releaseFrame?: number }
export function drawActor(context: CanvasRenderingContext2D, parts: ActorParts, state: string, elapsed: number, x: number, y: number, facing?: string, scale?: number): number;
export function drawEffect(context: CanvasRenderingContext2D, asset: NativeAsset, elapsed: number, x: number, y: number, scale?: number): number;
export function drawParts(context: CanvasRenderingContext2D, asset: NativeAsset, frame: NativeFrame | null, offset?: number[]): number;
export function drawProcedural(context: CanvasRenderingContext2D, recipe: { family: string; color: string; duration_ms: number }, elapsed: number, x: number, y: number): number;
export function frameAt(action: NativeAction, elapsed: number, loop?: boolean): { index: number; frame: NativeFrame | null };
export function actionFor(meta: NativeMeta, state?: string): NativeAction | undefined;
export function attackSourceIndex(parts: ActorParts, state: string): number | null | undefined;
export function actorAction(parts: ActorParts, state: string): NativeAction | undefined;
export function actorDuration(parts: ActorParts, state: string): number;
export function actorFrame(parts: ActorParts, state: string, elapsed: number): { action: NativeAction | undefined; index: number; frame: NativeFrame | null };
export function attachmentFrame(asset: NativeAsset | undefined, bodyAction: NativeAction, bodyFrame: NativeFrame, index: number, state: string): { frame: NativeFrame; offset: number[] } | null;

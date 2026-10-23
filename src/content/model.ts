import type { DeepReadonly, Json, ObjectValue } from './value.ts';
import type { JobCatalog } from './jobs.ts';

export interface ContentManifest {
  schema_version: 1;
  content_version: string;
  rules_version: string;
  engine_data_hash: string;
  schema_hash: string;
  implementation_hash: string;
  content_hash: string;
  presentation_selection_hash: string;
  runtime_asset_pack_hash: string | null;
  input_sha256: Record<string, string>;
  document_versions: Record<string, string>;
}

export interface RawContent {
  manifest: ContentManifest;
  schemas: Record<string, ObjectValue>;
  documents: Record<string, ObjectValue>;
}

export interface ContentIssue {
  code: string;
  source: string;
  definition_id?: string;
  effect_id?: string;
  path: string;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: ContentIssue[] };

export interface ContentData {
  jobs: JobCatalog;
  manifest: ContentManifest;
  documents: Record<string, ObjectValue>;
  skills: Record<string, ObjectValue>;
  items: Record<string, ObjectValue>;
  statuses: Record<string, ObjectValue>;
  actors: Record<string, ObjectValue>;
  schemas: Record<string, ObjectValue>;
}
export type ValidatedContent = DeepReadonly<ContentData>;
export interface DefinitionLocation {
  source: string;
  definition_id?: string;
  effect_id?: string;
  path: string;
}
export interface DefinitionRow { value: ObjectValue; location: DefinitionLocation }
export type ResolvedValue = Json;

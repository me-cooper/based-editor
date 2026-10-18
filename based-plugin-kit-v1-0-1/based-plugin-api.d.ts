/** Based Plugin API 0.5. Browser runtime; Node is a build/test tool only. */
export type JSONValue = null | boolean | number | string | JSONValue[] | {[key: string]: JSONValue};
export interface FileMetadata {name: string; extension: string; label: string; src: string; url: string;}
export interface RuntimeFile extends FileMetadata {
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
}
export interface EventBus {
  on(name: string, callback: (detail: Record<string, unknown>) => void): () => void;
  emit(name: string, detail: Record<string, unknown>): unknown[];
}
export interface MountAPI {
  file: RuntimeFile | null;
  data: JSONValue;
  signal: AbortSignal;
  events: EventBus;
  on(name: string, callback: (detail: Record<string, unknown>) => void): () => void;
  emit(name: string, detail?: Record<string, unknown>): void;
  onDispose(callback: () => void): void;
}
export interface RenderContext {
  /** markdown-it instance; use that library's own types for detailed rule authoring. */
  markdown: any;
  meta: Record<string, unknown>;
  services: Record<string, unknown>;
  escape(text: string): string;
  wrap(html: string, options?: {block?: boolean; data?: JSONValue}): string;
  renderFile(file: FileMetadata): string | null;
}
export interface InsertContext {selection: string; text: string; now: Date;}
export type Action = {
  id: string;
  label: string;
  insert: string | ((context: InsertContext) => string);
} | {
  id: string;
  label: string;
  command: 'import-media';
  kind?: 'file' | 'all' | 'image' | 'video' | 'audio';
};
export interface Design {css?: string; file?: string; stylesheets?: string[];}
export interface FenceContent {
  fence: string;
  render(text: string, argument: string, context: RenderContext): string;
}
/** At least files+render, content, or run is required by runtime validation. */
export interface Plugin {
  id: string;
  title?: string;
  enabled?: boolean;
  design?: Design;
  actions?: Action[];
  files?: string[];
  render?(file: FileMetadata, context: {escape(text: string): string}): string;
  content?: FenceContent | ((text: string, context: RenderContext) => string);
  run?(text: string, context: RenderContext): string;
  mount?(container: ShadowRoot, api: MountAPI): void | (() => void) | Promise<void | (() => void)>;
}

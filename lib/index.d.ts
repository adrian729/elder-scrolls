export type PaperId = 'ivory' | 'sage' | 'original' | 'rag' | 'ivory-dark' | 'sage-dark' | 'original-dark' | 'rag-dark';
export type Ending = 'roll' | 'paper';
export type PaperMode = 'light' | 'dark';
export type PaperTone = 'neutral' | 'warm';
export type PaperFamily = 'light' | 'burnt' | 'dark' | 'dark-burnt';
export type TableSurfaceId = 'oak' | 'walnut' | 'marble' | 'plain';
export interface ParchmentOptions {
  paper?: PaperId;
  top?: Ending;
  bottom?: Ending;
  /** CSS pixels; the sheet still shrinks to fit its container. */
  maxWidth?: number | 'fluid';
  shadow?: boolean;
  /** Optional directory URL containing the original WebP texture filenames. */
  assetsBase?: string;
}
export interface TableSurfaceOptions { surface?: TableSurfaceId; assetsBase?: string; }
export interface Controller<Options> {
  /** Latest update. False means superseded or destroyed before application. */
  readonly ready: Promise<boolean>;
  update(options?: Options): Promise<boolean>;
  destroy(): void;
}
export interface ParchmentController extends Controller<ParchmentOptions> {
  /** Append new HTML here while mounted, not directly to the outer root. */
  readonly content: HTMLElement;
}
export interface Paper {
  readonly id: PaperId;
  readonly label: string;
  readonly description: string;
  readonly mode: PaperMode;
  readonly tone: PaperTone;
  readonly family: PaperFamily;
  readonly pair: string;
  readonly counterpart: PaperId;
  readonly palette: Readonly<{surface:string;ink:string;muted:string;link:string}>;
}
export interface Family { readonly id: PaperFamily; readonly label: string; readonly mode: PaperMode; readonly tone: PaperTone; }
export interface Background { readonly id: TableSurfaceId; readonly label: string; readonly image: string | null; readonly color: string; readonly tileSize: number | null; }
export declare const families: readonly Family[];
export declare const backgrounds: readonly Background[];
export declare const papers: {
  readonly families: readonly Family[];
  get(id: PaperId): Paper;
  list(filter?: {family?:PaperFamily;mode?:PaperMode;tone?:PaperTone}): Paper[];
  resolve(options?: {paper?:PaperId;mode?:PaperMode;tone?:PaperTone}): Paper;
};
export declare function createParchment(element: HTMLElement, options?: ParchmentOptions): ParchmentController;
export declare function createTableSurface(element: HTMLElement, options?: TableSurfaceOptions): Controller<TableSurfaceOptions>;
export interface PreloadOptions { papers?: readonly PaperId[]; surfaces?: readonly TableSurfaceId[]; assetsBase?: string; }
/** Fetches and decodes artwork ahead of use; sheets and tables mounted afterwards apply it before the next frame. */
export declare function preloadArtwork(options?: PreloadOptions): Promise<void>;

import type { HTMLAttributes, ReactElement } from 'react';
import type { ParchmentOptions, TableSurfaceOptions } from './index.js';
export interface ParchmentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'>, ParchmentOptions {
  onReady?: () => void;
  onError?: (error: Error) => void;
}
export interface TableSurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'>, TableSurfaceOptions {
  onReady?: () => void;
  onError?: (error: Error) => void;
}
export declare function Parchment(props: ParchmentProps): ReactElement;
export declare function TableSurface(props: TableSurfaceProps): ReactElement;

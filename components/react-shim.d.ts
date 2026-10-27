// Type definitions for React and JSX in static component files
declare module "react" {
  export = React;
  export as namespace React;
  namespace React {
    type ReactNode = any;
    type ReactElement = any;
    type CSSProperties = Record<string, any>;
    type RefObject<T> = { current: T | null };
    type Ref<T> = any;
    type PointerEvent<T = Element> = any;
    type KeyboardEvent<T = Element> = any;
    type MouseEvent<T = Element> = any;
    type ChangeEvent<T = Element> = any;
    type FormEvent<T = Element> = any;
    type ComponentProps<T> = any;
    function useState<T>(initial: T | (() => T)): [T, (val: T | ((prev: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
    function useRef<T>(initial?: T | null): { current: T | null };
    function useId(): string;
    function useMemo<T>(factory: () => T, deps?: readonly any[]): T;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: readonly any[]): T;
  }
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactElement {}
}

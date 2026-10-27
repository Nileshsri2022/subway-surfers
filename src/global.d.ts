export {};

declare global {
  interface Window {
    __SUBWAY_RUNNER__: { ready: boolean } | undefined;
  }
}

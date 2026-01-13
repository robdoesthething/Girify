/// <reference types="vite/client" />

declare module '*.jsx' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

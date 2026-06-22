if (typeof global !== "undefined") {
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      constructor() {}
    };
  }
}
export {};

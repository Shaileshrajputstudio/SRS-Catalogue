// pdf.js (even its "legacy" build) calls Promise.withResolvers, which only
// exists from iOS/Safari 17.4. Older iPhones threw "Promise.withResolvers is
// not a function" and the catalogue viewer never opened. The worker file
// (public/pdf.worker.legacy.min.mjs) carries the same one-line shim at its top.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {};

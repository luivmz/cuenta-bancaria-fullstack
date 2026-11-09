// One queue for standalone: includes reads so partial operations are not exposed by this process.
export function createMutex() {
  let tail = Promise.resolve();
  return async function exclusive(task) {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await task();
    } finally {
      release();
    }
  };
}

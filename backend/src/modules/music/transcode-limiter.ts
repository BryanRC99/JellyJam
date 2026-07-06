const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_TRANSCODES) || 1;

let active = 0;
const waiters: Array<() => void> = [];

export function acquireTranscodeSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (active < MAX_CONCURRENT) {
        active++;
        resolve(() => {
          active--;
          waiters.shift()?.();
        });
      } else {
        waiters.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}
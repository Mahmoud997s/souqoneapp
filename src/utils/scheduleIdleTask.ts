type IdleCallbackRuntime = typeof globalThis & {
  requestIdleCallback?: (callback: () => void) => number
  cancelIdleCallback?: (id: number) => void
}

export function scheduleIdleTask(callback: () => void) {
  const runtime = globalThis as IdleCallbackRuntime

  if (typeof runtime.requestIdleCallback !== 'function') {
    const timeout = setTimeout(callback, 0)
    return { cancel: () => clearTimeout(timeout) }
  }

  const idleTaskId = runtime.requestIdleCallback(callback)
  return { cancel: () => runtime.cancelIdleCallback?.(idleTaskId) }
}

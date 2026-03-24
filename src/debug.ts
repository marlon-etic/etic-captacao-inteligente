export function enableDebugLogging() {
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args: any[]) => {
      originalLog(`[${new Date().toISOString()}]`, ...args)
    }

    console.error = (...args: any[]) => {
      originalError(`[${new Date().toISOString()}] ❌`, ...args)
    }

    console.warn = (...args: any[]) => {
      originalWarn(`[${new Date().toISOString()}] ⚠️`, ...args)
    }
  }
}

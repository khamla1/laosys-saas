/**
 * Enterprise Centralized Logger
 * Provides standardized logging, slow query tracking, and latency metrics.
 */

export const logger = {
  /**
   * Tracks the execution time of an async function and logs a warning if it exceeds the threshold.
   * @param operationName Name of the operation being tracked
   * @param asyncFn The async function to execute
   * @param thresholdMs The latency threshold in milliseconds (default: 300ms)
   */
  async trackQuery<T>(operationName: string, asyncFn: () => Promise<T>, thresholdMs: number = 300): Promise<T> {
    const start = performance.now();
    try {
      return await asyncFn();
    } finally {
      const duration = Math.round(performance.now() - start);
      if (duration > thresholdMs) {
        console.warn(`[SLOW_QUERY] ${operationName} took ${duration}ms (Threshold: ${thresholdMs}ms)`);
      } else {
        // Optional: Debug mode logging
        // console.debug(`[METRIC] ${operationName} completed in ${duration}ms`);
      }
    }
  },

  error(context: string, error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown Error";
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error(`[ERROR] [${context}]: ${errMessage}`, errStack ? `\nStack: ${errStack}` : "");
  },

  info(context: string, message: string) {
    console.info(`[INFO] [${context}]: ${message}`);
  }
};

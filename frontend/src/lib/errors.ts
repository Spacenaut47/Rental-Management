export type ProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Normalizes the various error shapes returned by RTK Query / ASP.NET Core
 * into a single human-readable message.
 */
export function getErrorMessage(error: unknown, fallback = "Request failed."): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (!isRecord(error)) return fallback;

  const data = error.data;

  if (data !== undefined) {
    if (typeof data === "string") return data;

    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (typeof item === "string") return item;
          if (isRecord(item) && typeof item.errorMessage === "string") {
            return item.errorMessage;
          }
          return JSON.stringify(item);
        })
        .join("\n");
    }

    if (isRecord(data)) {
      const problem = data as ProblemDetails;
      if (problem.errors) {
        const messages = Object.values(problem.errors).flat();
        if (messages.length) return messages.join("\n");
      }
      if (problem.detail) return problem.detail;
      if (problem.title) return problem.title;
    }

    return JSON.stringify(data);
  }

  if (typeof error.message === "string") return error.message;
  if (typeof error.error === "string") return error.error;

  return fallback;
}

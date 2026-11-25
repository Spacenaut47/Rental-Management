export function newestFirst<T extends { id: number }>(
  items: readonly T[],
  timestamp: (item: T) => string | undefined
): T[] {
  return [...items].sort((a, b) => {
    const aTime = timestamp(a);
    const bTime = timestamp(b);
    if (!aTime || !bTime) return b.id - a.id;
    return new Date(bTime).getTime() - new Date(aTime).getTime() || b.id - a.id;
  });
}

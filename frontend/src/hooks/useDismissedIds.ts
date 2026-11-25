import { useCallback, useState } from "react";

export function useDismissedIds() {
  const [ids, setIds] = useState<ReadonlySet<number>>(() => new Set());

  const dismiss = useCallback((id: number) => {
    setIds((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  const isDismissed = useCallback((id: number) => ids.has(id), [ids]);

  return { dismiss, isDismissed };
}

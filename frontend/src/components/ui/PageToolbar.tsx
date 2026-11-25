import { Filter, Plus } from "lucide-react";
import Button from "./Button";

type PageToolbarProps = {
  title: string;
  filterLabel?: string;
  onFilter: () => void;
  addLabel?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
};

export default function PageToolbar({
  title,
  filterLabel,
  onFilter,
  addLabel,
  onAdd,
  addDisabled,
}: PageToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={onFilter}
          aria-label={filterLabel ?? `Filter ${title.toLowerCase()}`}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filter
        </Button>
        {addLabel && onAdd && (
          <Button
            onClick={onAdd}
            disabled={addDisabled}
            aria-label={`Add ${addLabel.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

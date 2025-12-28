import { useState } from "react";
import { X, CheckCircle, ArrowRight, UserPlus, Link as LinkIcon } from "lucide-react";

interface Props {
  count: number;
  onClear: () => void;
  onAction: (action: BulkAction) => Promise<void>;
}

type BulkAction = "confirm" | "move_to_process" | "assign" | "link_duplicate";

export function BulkActionBar({ count, onClear, onAction }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: BulkAction) => {
    if (loading) return;
    
    setLoading(true);
    try {
      await onAction(action);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary-600 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">
            {count} {count === 1 ? "сигнал" : "сигнала"} избран{count > 1 ? "и" : ""}
          </span>

          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm hover:text-primary-100 transition-colors"
          >
            <X className="h-4 w-4" />
            Изчисти
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("confirm")}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Потвърди всички
          </button>

          <button
            onClick={() => handleAction("move_to_process")}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
            В процес
          </button>

          <button
            onClick={() => handleAction("assign")}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Възложи
          </button>

          <button
            onClick={() => handleAction("link_duplicate")}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50"
          >
            <LinkIcon className="h-4 w-4" />
            Линквай дубликат
          </button>
        </div>
      </div>
    </div>
  );
}

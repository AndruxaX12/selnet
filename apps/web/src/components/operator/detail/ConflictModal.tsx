import { AlertTriangle } from "lucide-react";

interface Props {
  signalId: string;
  onReload: () => void;
  onDismiss: () => void;
}

export function ConflictModal({ signalId, onReload, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Конфликт при редакция
            </h3>
            <p className="text-sm text-gray-600">
              Сигналът е бил обновен от друг оператор междувременно. Моля, презаредете
              страницата, за да видите последната версия.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Отказ
          </button>
          <button
            onClick={onReload}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Презареди
          </button>
        </div>
      </div>
    </div>
  );
}

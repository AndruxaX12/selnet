import { useState } from "react";
import { WorkOrder, WorkOrderStatus } from "@/types/operator";
import { formatDateTime } from "@/lib/operator/sla-utils";
import { Wrench, Plus, Clock, CheckCircle } from "lucide-react";

interface Props {
  signalId: string;
  orders: WorkOrder[];
  onChange: () => void;
}

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  open: "Отворен",
  assigned: "Възложен",
  in_progress: "В процес",
  done: "Завършен",
  verified: "Проверен",
  rework: "За поправка"
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  open: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  verified: "bg-green-200 text-green-800",
  rework: "bg-orange-100 text-orange-700"
};

export function WorkOrdersPanel({ signalId, orders, onChange }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Работни ордери ({orders?.length || 0})
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Нов ордер
        </button>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Няма работни ордери</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <WorkOrderCard key={order.id} order={order} onChange={onChange} />
          ))}
        </div>
      )}

      {/* Create Work Order Modal */}
      {showModal && (
        <CreateWorkOrderModal
          signalId={signalId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function WorkOrderCard({
  order,
  onChange
}: {
  order: WorkOrder;
  onChange: () => void;
}) {
  const dueDate = new Date(order.due_at);
  const isOverdue = dueDate < new Date() && order.status !== "done" && order.status !== "verified";

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                STATUS_COLORS[order.status]
              }`}
            >
              {STATUS_LABELS[order.status]}
            </span>
            {order.priority === "urgent" && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                Спешно
              </span>
            )}
          </div>
          {order.notes && <p className="text-sm text-gray-700">{order.notes}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
          <Clock className="h-3 w-3" />
          Краен срок: {formatDateTime(order.due_at)}
        </span>
        {order.assigned_to && (
          <span>Възложен на: {order.assigned_to}</span>
        )}
      </div>
    </div>
  );
}

function CreateWorkOrderModal({
  signalId,
  onClose,
  onSuccess
}: {
  signalId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async () => {
    // TODO: Implement API call
    console.log("Creating work order:", { signalId, priority, notes, dueDate });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Създаване на работен ордер
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Приоритет
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="normal">Нормален</option>
              <option value="high">Висок</option>
              <option value="urgent">Спешен</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Краен срок
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Бележки
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Описание на работата..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Отказ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!dueDate}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            Създай
          </button>
        </div>
      </div>
    </div>
  );
}

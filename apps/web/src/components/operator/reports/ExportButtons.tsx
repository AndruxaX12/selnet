import { Download, FileJson, FileSpreadsheet } from "lucide-react";

interface Props {
  data: any;
  filename: string;
  type: "sla" | "trends" | "volumes";
}

export function ExportButtons({ data, filename, type }: Props) {
  const downloadCSV = () => {
    const csv = convertToCSV(data, type);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadCSV}
        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        title="Експорт като CSV"
      >
        <FileSpreadsheet className="h-4 w-4" />
        CSV
      </button>
      <button
        onClick={downloadJSON}
        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        title="Експорт като JSON"
      >
        <FileJson className="h-4 w-4" />
        JSON
      </button>
    </div>
  );
}

function convertToCSV(data: any, type: string): string {
  if (type === "sla") {
    const headers = [
      "Метрика",
      "Стойност",
      "Процент",
      "Цел"
    ];
    
    const rows = [
      ["TTA ≤48ч", data.tta_within_48h, `${data.tta_within_48h_pct}%`, "≥90%"],
      ["TTA Просрочени", data.tta_overdue, "-", "-"],
      ["В процес ≤5д", data.process_within_5d, `${data.process_within_5d_pct}%`, "≥85%"],
      ["TTR Медиана (дни)", data.ttr_median_days, "-", "≤14"],
      ["TTR >14 дни", data.ttr_over_14d, "-", "-"]
    ];

    return [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");
  }

  if (type === "trends") {
    const headers = ["Дата", "Нови", "Потвърдени", "В процес", "Решени"];
    const rows = data.map((d: any) => [
      d.date,
      d.new,
      d.confirmed,
      d.in_process,
      d.resolved
    ]);

    return [
      headers.join(","),
      ...rows.map((row: any[]) => row.join(","))
    ].join("\n");
  }

  if (type === "volumes") {
    const headers = ["ID", "Име", "Брой"];
    const rows = data.map((d: any) => [d.id, d.name, d.count]);

    return [
      headers.join(","),
      ...rows.map((row: any[]) => row.join(","))
    ].join("\n");
  }

  return "";
}

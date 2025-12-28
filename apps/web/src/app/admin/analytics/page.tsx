"use client";

import { useState, useEffect } from "react";
import { getIdTokenHeader } from "@/lib/get-id-token";
import { Loader2, Download, BarChart3, TrendingUp, Users, CheckCircle } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface StatsData {
  totalSignals: number;
  totalUsers: number;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  timeline: { date: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const STATUS_LABELS: Record<string, string> = {
  submitted: "Подаден",
  approved: "Одобрен",
  in_progress: "В работа",
  resolved: "Решен",
  rejected: "Отхвърлен"
};

export default function AnalyticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/stats", { headers });
      if (res.ok) {
        const jsonData = await res.json();
        setData(jsonData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    // Create CSV content
    let csv = "Metric,Value\n";
    csv += `Total Signals,${data.totalSignals}\n`;
    csv += `Total Users,${data.totalUsers}\n\n`;

    csv += "Status,Count\n";
    Object.entries(data.statusCounts).forEach(([status, count]) => {
        csv += `${STATUS_LABELS[status] || status},${count}\n`;
    });
    csv += "\n";

    csv += "Category,Count\n";
    Object.entries(data.categoryCounts).forEach(([cat, count]) => {
        csv += `${cat},${count}\n`;
    });
    csv += "\n";

    csv += "Date,Signals\n";
    data.timeline.forEach(item => {
        csv += `${item.date},${item.count}\n`;
    });

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>;
  if (!data) return <div className="p-12 text-center text-red-500">Грешка при зареждане на данни.</div>;

  const statusData = Object.entries(data.statusCounts).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value }));
  const categoryData = Object.entries(data.categoryCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Анализи и Справки</h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Експорт CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600"><BarChart3 className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">Общо сигнали</p>
                <p className="text-2xl font-bold">{data.totalSignals}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600"><Users className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">Потребители</p>
                <p className="text-2xl font-bold">{data.totalUsers}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">Решени</p>
                <p className="text-2xl font-bold">{data.statusCounts['resolved'] || 0}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600"><TrendingUp className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">Активност (30 дни)</p>
                <p className="text-2xl font-bold">{data.timeline.reduce((acc, curr) => acc + curr.count, 0)}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Статус на сигналите</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Категории</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-lg shadow border lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Сигнали за последните 30 дни</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
}


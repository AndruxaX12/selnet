"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash, ArrowLeft, Shield, Ban, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getIdTokenHeader } from "@/lib/get-id-token";

interface UserDetail {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
  disabled?: boolean;
  creationTime?: string;
  lastSignInTime?: string;
}

export default function AdminUserDetailPage({ params }: { params: { locale: string; id: string } }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/users/${params.id}`, { headers });
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();
      setUser(data.user);
      setSelectedRole(data.user.role || "resident");
    } catch (err) {
      console.error(err);
      setError("Грешка при зареждане на потребителя");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: "PUT",
        headers: {
            ...headers,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: selectedRole })
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }
      
      alert("Промените са запазени успешно!");
      fetchUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async () => {
    if (!user) return;
    const confirmMsg = user.disabled 
        ? "Сигурни ли сте, че искате да отблокирате този потребител?" 
        : "Сигурни ли сте, че искате да блокирате този потребител? Той няма да може да влиза в системата.";
    
    if (!confirm(confirmMsg)) return;

    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: "PUT",
        headers: {
            ...headers,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ disabled: !user.disabled })
      });

      if (!res.ok) throw new Error("Failed to update status");
      fetchUser();
    } catch (err: any) {
      alert("Грешка: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("ВНИМАНИЕ: Това действие е необратимо! Сигурни ли сте, че искате да изтриете този потребител?")) return;
    
    try {
      const headers = await getIdTokenHeader();
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        router.push("/admin/users");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err: any) {
      alert("Грешка при изтриване: " + err.message);
    }
  };

  if (loading) return <div className="p-6">Зареждане...</div>;
  if (!user) return <div className="p-6 text-red-500">Потребителят не е намерен</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Управление на потребител
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-xl font-semibold">{user.displayName || "Няма име"}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="mt-2 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {user.disabled ? "Блокиран" : "Активен"}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {user.role || "resident"}
                    </span>
                </div>
            </div>
            
            <div className="flex gap-2">
                 <button
                    onClick={toggleBlock}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${user.disabled ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                    {user.disabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                    {user.disabled ? "Отблокирай" : "Блокирай"}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Роля в системата</label>
                <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="resident">Жител (Resident)</option>
                    <option value="coordinator">Координатор (Coordinator)</option>
                    <option value="municipal">Общински служител (Municipal)</option>
                    <option value="operator">Оператор (Operator)</option>
                    <option value="admin">Администратор (Admin)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                    Внимание: Промяната на ролята дава различни права за достъп до системата.
                </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Информация</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">ID:</span>
                        <span className="font-mono">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Създаден:</span>
                        <span>{user.creationTime ? new Date(user.creationTime).toLocaleDateString("bg-BG") : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Последен вход:</span>
                        <span>{user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleDateString("bg-BG") : "-"}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
            <button
                type="button"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50"
            >
                <Trash size={20} />
                Изтрий потребител
            </button>
            
            <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={20} />
                {saving ? "Запазване..." : "Запази промените"}
            </button>
        </div>
      </div>
    </div>
  );
}

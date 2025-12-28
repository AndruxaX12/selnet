"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPageEditor({ params }: { params: { locale: string; slug: string } }) {
  const isNew = params.slug === "new";
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: ""
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isNew) {
      fetchPage();
    }
  }, [params.slug]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/admin/pages/${params.slug}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });
      if (!res.ok) throw new Error("Failed to load page");
      const data = await res.json();
      setFormData({
        slug: data.slug,
        title: data.title,
        content: data.content || ""
      });
    } catch (err) {
      console.error(err);
      setError("Грешка при зареждане на страницата");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isNew ? "/api/admin/pages" : `/api/admin/pages/${params.slug}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/pages");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази страница?")) return;
    
    try {
      const res = await fetch(`/api/admin/pages/${params.slug}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });
      if (res.ok) {
        router.push("/admin/pages");
      }
    } catch (err) {
      console.error(err);
      alert("Грешка при изтриване");
    }
  };

  if (loading) return <div className="p-6">Зареждане...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/pages" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNew ? "Нова страница" : "Редактиране на страница"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Заглавие</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
            <input
              type="text"
              required
              disabled={!isNew}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg outline-none ${!isNew ? "bg-gray-100 text-gray-500" : "focus:ring-2 focus:ring-blue-500"}`}
              placeholder="example-page"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Съдържание (HTML)</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-96 font-mono text-sm"
            placeholder="<div>Your content here...</div>"
          />
          <p className="text-xs text-gray-500 mt-2">Можете да използвате HTML тагове.</p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
            {!isNew ? (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50"
                >
                    <Trash size={20} />
                    Изтрий
                </button>
            ) : (
                <div></div>
            )}
            
            <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={20} />
                {saving ? "Запазване..." : "Запази"}
            </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Plus, Trash, Tag } from "lucide-react";

interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ label: "", color: "#3B82F6", icon: "alert-circle" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        setNewCategory({ label: "", color: "#3B82F6", icon: "alert-circle" });
        fetchCategories();
      } else {
        alert("Failed to add category");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Tag />
        Категории сигнали
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left p-4 font-medium text-gray-600">Име</th>
                            <th className="text-left p-4 font-medium text-gray-600">Цвят</th>
                            <th className="text-right p-4 font-medium text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Зареждане...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-gray-500">Няма категории</td></tr>
                        ) : (
                            categories.map(cat => (
                                <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                        {cat.label}
                                    </td>
                                    <td className="p-4 text-gray-600">{cat.color}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(cat.id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Нова категория</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Име</label>
                        <input 
                            type="text" 
                            required
                            value={newCategory.label}
                            onChange={e => setNewCategory({...newCategory, label: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Напр. Инфраструктура"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цвят</label>
                        <input 
                            type="color" 
                            value={newCategory.color}
                            onChange={e => setNewCategory({...newCategory, color: e.target.value})}
                            className="w-full h-10 px-1 py-1 border rounded-lg cursor-pointer"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={adding}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
                    >
                        <Plus size={18} />
                        Добави
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageDoc {
  id: string; // usually slug
  slug: string;
  title: string;
  updatedAt: string;
}

export default function AdminPagesList({ params }: { params: { locale: string } }) {
  const [pages, setPages] = useState<PageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem("token"); // or get from auth
      // In this project we rely on cookies or onAuthStateChanged usually, 
      // but for API calls from client components we might need to attach token if API requires it.
      // My API middleware checks Authorization header.
      // Let's assume we have a helper or we get it from auth.currentUser
      
      const res = await fetch("/api/admin/pages", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages);
      }
    } catch (error) {
      console.error("Failed to fetch pages", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Статични страници</h1>
        <Link 
          href="/admin/pages/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Нова страница
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Заглавие</th>
              <th className="text-left p-4 font-medium text-gray-600">Slug</th>
              <th className="text-left p-4 font-medium text-gray-600">Последна промяна</th>
              <th className="text-right p-4 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Зареждане...</td></tr>
            ) : pages.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Няма намерени страници</td></tr>
            ) : (
              pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{page.title}</td>
                  <td className="p-4 text-gray-600">/{page.slug}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(page.updatedAt).toLocaleDateString("bg-BG")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/admin/pages/${page.slug}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Редактирай"
                      >
                        <Edit size={18} />
                      </Link>
                      {/* Add Delete functionality later if needed */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

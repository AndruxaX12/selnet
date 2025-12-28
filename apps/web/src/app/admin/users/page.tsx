"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, UserPlus, Mail, Calendar, Shield } from "lucide-react";
import Link from "next/link";
import { getIdTokenHeader } from "@/lib/get-id-token";

interface User {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  createdAt?: number;
  lastLogin?: number;
  status?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  moderator: "Модератор",
  coordinator: "Координатор",
  municipal: "Общински служител",
  resident: "Жител",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  moderator: "bg-purple-100 text-purple-800 border-purple-200",
  coordinator: "bg-blue-100 text-blue-800 border-blue-200",
  municipal: "bg-green-100 text-green-800 border-green-200",
  resident: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      const headers = await getIdTokenHeader();
      const res = await fetch("/api/admin/users", {
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Users API error:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err.message || "Грешка при зареждане на потребители");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      (user.roles && user.roles.includes(roleFilter));

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Потребители</h1>
            <p className="text-gray-600 mt-1">Зареждане...</p>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <Card className="p-4">
          <div className="flex gap-3">
            <div className="h-10 flex-1 max-w-md bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </Card>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }}></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Потребители</h1>
          <p className="text-gray-600 mt-1">Управление на потребители</p>
        </div>
        <Card className="p-8">
          <div className="text-center text-red-600">
            <p className="font-semibold">Грешка</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Потребители</h1>
          <p className="text-gray-600 mt-1">
            Управление на потребители и роли
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <UserPlus className="h-4 w-4" />
          Добави потребител
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Търси по име или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-md border bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Всички роли</option>
                <option value="admin">Администратори</option>
                <option value="moderator">Модератори</option>
                <option value="coordinator">Координатори</option>
                <option value="municipal">Общински служители</option>
                <option value="resident">Жители</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredUsers.length} {filteredUsers.length === 1 ? "потребител" : "потребители"}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени потребители
            </h3>
            <p className="text-sm text-gray-600">
              {search || roleFilter !== "all"
                ? "Опитайте да промените филтрите"
                : "Все още няма регистрирани потребители"}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Потребител
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Роли
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Създаден
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Последно влизане
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name || "—"}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              className={`text-xs border ${ROLE_COLORS[role] || ROLE_COLORS.resident}`}
                            >
                              {ROLE_LABELS[role] || role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">Няма роли</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("bg-BG")
                          : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString("bg-BG")
                          : "Никога"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Shield className="h-4 w-4" />
                        Управление
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import { Shield, Users, Settings, FileText, MapPin } from "lucide-react";
import { ROLES } from "@/lib/rbac/roles";
import { usePathname } from "next/navigation";

interface AdminSettingsProps {
  user: any;
}

export default function AdminSettings({ user }: AdminSettingsProps) {

  // Only show for ADMIN and ADMINISTRATOR
  if (user?.role !== ROLES.ADMIN && user?.role !== ROLES.OPERATOR) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Нямате достъп до административни настройки</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Административен панел
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Бързи връзки към административни функции
      </p>

      {/* Admin Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Users Management */}
        <a
          href="/admin/users"
          className="group flex items-start gap-4 p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all"
        >
          <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Управление на потребители
            </h3>
            <p className="text-sm text-gray-600">
              Преглед, блокиране и управление на роли
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>

        {/* Signals Management */}
        {user?.role === ROLES.ADMIN && (
          <a
            href="/admin/mod"
            className="group flex items-start gap-4 p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition-all"
          >
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Управление на сигнали
              </h3>
              <p className="text-sm text-gray-600">
                Модериране, промяна на статус, коментари
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        )}

        {/* Administrator Signals */}
        {user?.role === ROLES.OPERATOR && (
          <a
            href="/administrator/signals"
            className="group flex items-start gap-4 p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition-all"
          >
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Управление на сигнали
              </h3>
              <p className="text-sm text-gray-600">
                Модериране и промяна на статус
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        )}

        {/* System Settings - Only ADMIN */}
        {user?.role === ROLES.ADMIN && (
          <a
            href="/admin/settings"
            className="group flex items-start gap-4 p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Системни настройки
              </h3>
              <p className="text-sm text-gray-600">
                Конфигурация на платформата
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        )}

        {/* Categories - Only ADMIN */}
        {user?.role === ROLES.ADMIN && (
          <a
            href="/admin/categories"
            className="group flex items-start gap-4 p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-lg transition-all"
          >
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Категории и Pointer-и
              </h3>
              <p className="text-sm text-gray-600">
                Управление на категории и map markers
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Role Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Вашата роля: {user?.role === ROLES.ADMIN ? "Главен администратор" : "Администратор"}
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              {user?.role === ROLES.ADMIN ? (
                <>
                  <p>✅ Пълен достъп до всички функции</p>
                  <p>✅ Управление на потребители и роли</p>
                  <p>✅ Управление на сигнали</p>
                  <p>✅ Системни настройки</p>
                  <p>✅ Категории и настройки на карта</p>
                </>
              ) : (
                <>
                  <p>✅ Управление на потребители (само USER)</p>
                  <p>✅ Модериране на сигнали</p>
                  <p>❌ Системни настройки (само ADMIN)</p>
                  <p>❌ Категории (само ADMIN)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


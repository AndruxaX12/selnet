// apps/web/src/app/[locale]/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { 
  title: "Вход — СелНет",
  description: "Вход в системата за сигнали и управление"
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в акаунта ви
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Моля, въведете вашите данни за вход
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
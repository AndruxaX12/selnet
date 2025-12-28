import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Регистрация — СелНет" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Създаване на профил</h1>
      <p className="text-gray-600 mb-6">
        Създай профил и започни да участваш в подобряването на общността.
      </p>
      <RegisterForm />
    </div>
  );
}

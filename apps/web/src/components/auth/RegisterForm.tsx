"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile, getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/form/FormField";
import Button from "@/components/ui/Button";

const registerSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа"),
  email: z.string().email("Невалиден имейл адрес"),
  password: z.string().min(6, "Паролата трябва да е поне 6 символа"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролите не съвпадат",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!app) throw new Error("Firebase app not initialized");
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      // Redirect to home or onboarding
      router.push("/me");
      
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Този имейл вече е регистриран.");
      } else {
        setError("Възникна грешка при регистрацията. Моля, опитайте отново.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <FormField label="Име" error={errors.name}>
        <input
          {...register("name")}
          className={inputClass}
          placeholder="Иван Иванов"
          autoComplete="name"
        />
      </FormField>

      <FormField label="Имейл" error={errors.email}>
        <input
          {...register("email")}
          type="email"
          className={inputClass}
          placeholder="ivan@example.com"
          autoComplete="email"
        />
      </FormField>

      <FormField label="Парола" error={errors.password}>
        <input
          {...register("password")}
          type="password"
          className={inputClass}
          autoComplete="new-password"
        />
      </FormField>

      <FormField label="Потвърди парола" error={errors.confirmPassword}>
        <input
          {...register("confirmPassword")}
          type="password"
          className={inputClass}
          autoComplete="new-password"
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Регистриране..." : "Регистрация"}
      </Button>
      
      <div className="text-center text-sm text-gray-600 mt-4">
        Вече имате акаунт?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Вход
        </a>
      </div>
    </form>
  );
}

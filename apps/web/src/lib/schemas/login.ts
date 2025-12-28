import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Невалиден имейл"),
  password: z.string().min(8, "Минимум 8 символа")
});

export type LoginInput = z.infer<typeof LoginSchema>;

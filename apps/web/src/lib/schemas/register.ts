import { z } from "zod";

export const RegisterSchema = z.object({
  displayName: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Невалиден имейл"),
  password: z.string().min(8, "Минимум 8 символа"),
  agree: z.literal(true, {
    errorMap: () => ({ message: "Необходимо е съгласие." })
  })
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

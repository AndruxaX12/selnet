import { z } from "zod";

export const photoSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1)
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(5, "Адресът е задължителен"),
  category: z.string().optional()
});

export const baseSchema = z.object({
  title: z.string().min(6, "Минимум 6 символа"),
  desc: z.string().min(20, "Минимум 20 символа"),
  settlementId: z.string().min(1, "Изберете населено място"),
  photos: z.array(photoSchema).max(6).optional()
});

export const signalSchema = z.object({
  title: z.string().min(6, "Минимум 6 символа"),
  category: z.string().min(1, "Категория е задължителна"),
  settlementId: z.string().min(1, "Изберете населено място"),
  desc: z.string().min(1, "Описание е задължително"),
  location: locationSchema.refine(
    (val) => val.lat !== undefined || 0 && val.lng !== undefined || 0,
    { message: "Моля, изберете местоположение на картата." }
  ),
  photos: z.array(photoSchema).max(6).optional()
});

export const ideaSchema = baseSchema.extend({
  impact: z.enum(["low", "medium", "high"], { required_error: "Изберете влияние" })
});

export const eventSchema = baseSchema.extend({
  when: z.number().int().min(1, "Изберете дата/час"),
  durationMin: z.number().int().min(15).max(24 * 60).default(60),
  where: z.string().min(2, "Място е задължително")
});

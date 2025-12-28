"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signalSchema } from "@/features/forms/schemas";
import { z } from "zod";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";
import { clearCache } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import PhotosUploader from "@/components/form/PhotosUploader";
import { FormField, inputClass, textareaClass, selectClass } from "@/components/form/FormField";
import { canSubmit, markSubmitted } from "@/lib/antispam";
import { ALL_LOCATIONS } from "@/lib/constants/locations";
import dynamic from "next/dynamic";

const DynamicLocationPicker = dynamic(() => 
  import("@/components/map/LocationPicker"), 
  { ssr: false, loading: () => <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded-lg">Зареждане на картата...</div> }
);

type Form = z.infer<typeof signalSchema>;
const COOLDOWN_KEY = "submit:signal";

export default function NewSignalPage() {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(signalSchema) });
  const db = getFirestore(app!);
  const auth = getAuth(app!);
  const { show } = useToast();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const addressValue = watch("location.address");
  const category = watch("category");

  async function onSubmit(values: Form) {
    if (!canSubmit(COOLDOWN_KEY, 45)) {
      show({ title: "Изчакайте малко", desc: "Защитаваме от спам. Опитайте след няколко секунди.", type: "error" });
      return;
    }

    const currentUser = auth.currentUser;
    let userData = {
      uid: currentUser?.uid || null,
      displayName: currentUser?.displayName || null,
      email: currentUser?.email || null,
      photoURL: currentUser?.photoURL || null,
      role: null as string | null
    };

    if (!userData.uid && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userData = {
            uid: parsed.uid || null,
            displayName: parsed.displayName || null,
            email: parsed.email || null,
            photoURL: parsed.photoURL || null,
            role: parsed.role || null
          };
        } catch (e) {
          console.error("Error parsing localStorage user:", e);
        }
      }
    }

    const authorData = isAnonymous ? {
      author_id: "anonymous",
      author_name: null,
      author_email: null,
      author_photo: null,
      author_role: null,
      isAnonymous: true,
    } : {
      author_id: userData.uid || null,
      author_name: userData.displayName || userData.email?.split("@")[0] || null,
      author_email: userData.email || null,
      author_photo: userData.photoURL || null,
      author_role: userData.role?.toLowerCase() || null,
      isAnonymous: false,
    };

    const id = crypto.randomUUID();
    const settlementLabel = ALL_LOCATIONS.find(l => l.value === values.settlementId)?.label || values.settlementId;

    const nowIso = new Date().toISOString();
    await setDoc(doc(db, "signals", id), {
      ...values,
      ...authorData,
      title: values.title,
      description: values.desc,
      address: values.location?.address || settlementLabel,
      district: values.settlementId,
      settlementLabel,
      status: "novo",
      createdAt: Date.now(),
      createdAtSrv: serverTimestamp(),
      created_at: nowIso,
      updated_at: nowIso,
      photos: values.photos || []
    });
    
    markSubmitted(COOLDOWN_KEY);
    clearCache("/signals");
    show({ title: "Успешно изпратен сигнал" });
    location.href = `/${getLocale()}/signals/${id}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Нов сигнал</h1>
              <p className="text-gray-600">Сигнализирайте за проблем в общността</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 normal-case font-sans">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Добавен text-gray-900 за ясен цвят на шрифта при избор */}
            <FormField label="Категория" error={errors.category} required>
              <select className={`${selectClass} text-gray-900`} {...register("category")}>
                <option value="" className="text-gray-500">— Изберете категория —</option>
                <option value="Ток">Ток</option>
                <option value="ВиК">ВиК</option>
                <option value="Пожар">Пожар</option>
                <option value="Пътища и тротоари">Пътища и тротоари</option>
                <option value="отпадъци">Сметище / Отпадъци</option>
                <option value="Осветление">Осветление</option>
                <option value="Транспорт">Транспорт</option>
                <option value="Шум">Шум</option>
                <option value="Друго">📋 Друго</option>
              </select>
            </FormField>

            <FormField label="Заглавие" error={errors.title} required>
              <input
                className={`${inputClass} text-gray-900`}
                placeholder="Кратко заглавие на сигнала"
                {...register("title")}
              />
            </FormField>

            <FormField label="Описание на проблема" error={errors.desc} required>
              <textarea
                className={`${textareaClass} text-gray-900`}
                rows={5}
                placeholder="Опишете подробно проблема..."
                {...register("desc")}
              />
            </FormField>

            <FormField label="Населено място" error={errors.settlementId} required>
              <select
                className={`${selectClass} text-gray-900`}
                {...register("settlementId")}
              >
                <option value="" className="text-gray-500">— Изберете населено място —</option>
                {ALL_LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
              <p className="text-sm">
                Първо изберете точното място на картата. Адресът ще се попълни автоматично.
              </p>
            </div>

            <FormField error={errors.location?.lat || errors.location?.lng} required>
              <DynamicLocationPicker
                onChange={(location) => {
                  setValue("location.lat", location?.lat ?? 0, { shouldValidate: true });
                  setValue("location.lng", location?.lng ?? 0, { shouldValidate: true });
                  setValue("location.address", location?.address || '', { shouldValidate: true });
                }}
              />
            </FormField>

            <FormField
              label="Адрес (Попълва се автоматично)"
              error={errors.location?.address}
              required
              hint="Можете да промените автоматично генерирания адрес, ако е неточен."
            >
              <input
                className={`${inputClass} text-gray-900`}
                placeholder="ул. Цар Освободител 1, Ботевград"
                {...register("location.address")}
                value={addressValue || ''}
              />
            </FormField>

            <FormField label="Снимки" hint="Добавете снимки на проблема">
              <PhotosUploader onChange={(arr) => setValue("photos", arr as any)} />
            </FormField>

            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">Подай сигнала анонимно</span>
                <p className="text-xs text-gray-500 mt-0.5">Името ви няма да бъде показано публично</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:bg-green-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1">
                  {isSubmitting ? "Записване…" : "Изпратете сигнала"}
                </Button>
                <Button as="a" href={"/"} variant="secondary" size="lg">
                  Отказ
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getLocale() {
  try {
    return location.pathname.split("/")[1] || "bg";
  } catch {
    return "bg";
  }
}

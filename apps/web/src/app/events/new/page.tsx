"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { eventSchema } from "@/features/forms/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { FormField, inputClass, textareaClass, selectClass } from "@/components/form/FormField";
import PhotosUploader from "@/components/form/PhotosUploader";
import { canSubmit, markSubmitted } from "@/lib/antispam";

type Form = z.infer<typeof eventSchema>;
const COOLDOWN_KEY = "submit:event";

export default function NewEventPage() {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(eventSchema) });
  const db = getFirestore(app); 
  const { show } = useToast();

  async function onSubmit(values: Form) {
    if (!canSubmit(COOLDOWN_KEY, 45)) {
      show({ title: "Изчакайте малко", desc: "Защитаваме от спам. Опитайте след няколко секунди.", type: "error" }); 
      return;
    }
    const id = crypto.randomUUID();
    await setDoc(doc(db, "events", id), {
      ...values,
      when: Number(values.when),
      createdAt: Date.now(),
      createdAtSrv: serverTimestamp(),
      photos: values.photos || []
    });
    markSubmitted(COOLDOWN_KEY);
    show({ title: "Събитието е създадено" });
    location.href = `/${getLocale()}/events/${id}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ново събитие</h1>
              <p className="text-gray-600">Организирайте събитие за общността</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField label="Заглавие на събитието" error={errors.title} required>
              <input 
                className={inputClass} 
                placeholder="Име на събитието (напр. Почистване на парка, Концерт в центъра)"
                {...register("title")} 
              />
            </FormField>

            <FormField label="Описание" error={errors.desc} required>
              <textarea 
                className={textareaClass} 
                rows={5} 
                placeholder="Опишете събитието - какво ще се случи, кой може да участва, какво да донесат участниците..."
                {...register("desc")} 
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Къде ще се проведе" error={errors.where} required>
                <input 
                  className={inputClass} 
                  placeholder="Адрес или описание на мястото"
                  {...register("where")} 
                />
              </FormField>

              <FormField label="Кога" error={errors.when} required>
                <input 
                  type="datetime-local" 
                  className={inputClass}
                  onChange={(e) => { 
                    const ts = Date.parse(e.target.value); 
                    setValue("when", isFinite(ts) ? ts : (undefined as any)); 
                  }} 
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Продължителност" 
                error={errors.durationMin}
                hint="В минути (15 мин - 24 часа)"
              >
                <select 
                  className={selectClass} 
                  {...register("durationMin", { valueAsNumber: true })}
                >
                  <option value="">— Изберете —</option>
                  <option value={30}>⏱️ 30 минути</option>
                  <option value={60}>🕐 1 час</option>
                  <option value={90}>🕐 1.5 часа</option>
                  <option value={120}>🕑 2 часа</option>
                  <option value={180}>🕒 3 часа</option>
                  <option value={240}>🕓 4 часа</option>
                  <option value={480}>🕗 8 часа (цял ден)</option>
                </select>
              </FormField>

              <FormField 
                label="Населено място" 
                error={errors.settlementId} 
                hint="ID на населеното място"
                required
              >
                <input 
                  className={inputClass} 
                  placeholder="напр. sofia, plovdiv, varna"
                  {...register("settlementId")} 
                />
              </FormField>
            </div>

            <FormField 
              label="Снимки на събитието" 
              hint="Добавете снимки от предишни събития или илюстрации"
            >
              <PhotosUploader onChange={(arr) => setValue("photos", arr as any)} />
            </FormField>

            {/* Submit Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1">
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Създаване…
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🎉</span>
                      Създай събитие
                    </>
                  )}
                </Button>
                <Button as="a" href={"/"} variant="secondary" size="lg">
                  Отказ
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Събитието ще бъде видимо за всички членове на общността
              </p>
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

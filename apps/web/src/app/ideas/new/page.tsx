"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ideaSchema } from "@/features/forms/schemas";
import { z } from "zod";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import PhotosUploader from "@/components/form/PhotosUploader";
import { FormField, inputClass, textareaClass, selectClass } from "@/components/form/FormField";
import { canSubmit, markSubmitted } from "@/lib/antispam";

type Form = z.infer<typeof ideaSchema>;
const COOLDOWN_KEY = "submit:idea";

export default function NewIdeaPage() {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(ideaSchema) });
  const db = getFirestore(app);
  const { show } = useToast();

  async function onSubmit(values: Form) {
    if (!canSubmit(COOLDOWN_KEY, 45)) {
      show({ title: "Изчакайте малко", desc: "Защитаваме от спам. Опитайте след няколко секунди.", type: "error" }); 
      return;
    }
    const id = crypto.randomUUID();
    await setDoc(doc(db, "ideas", id), {
      ...values,
      createdAt: Date.now(),
      createdAtSrv: serverTimestamp(),
      status: "new",
      photos: values.photos || []
    });
    markSubmitted(COOLDOWN_KEY);
    show({ title: "Успешно изпратена идея" });
    location.href = `/${getLocale()}/ideas/${id}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Нова идея</h1>
              <p className="text-gray-600">Споделете идея за подобрение на общността</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField label="Заглавие на идеята" error={errors.title} required>
              <input 
                className={inputClass} 
                placeholder="Кратко описание на идеята (напр. Нова детска площадка в парка)"
                {...register("title")} 
              />
            </FormField>

            <FormField label="Подробно описание" error={errors.desc} required>
              <textarea 
                className={textareaClass} 
                rows={5} 
                placeholder="Опишете подробно идеята - какво предлагате, как ще помогне на общността, как може да се реализира..."
                {...register("desc")} 
              />
            </FormField>

            <FormField label="Очаквано влияние" error={errors.impact} required>
              <select className={selectClass} {...register("impact")}>
                <option value="">— Изберете влияние —</option>
                <option value="low">🔹 Ниско влияние - засяга малка група хора</option>
                <option value="medium">🔸 Средно влияние - засяга част от общността</option>
                <option value="high">🔶 Високо влияние - засяга цялата общност</option>
              </select>
            </FormField>

            <FormField 
              label="Населено място" 
              error={errors.settlementId} 
              hint="Въведете ID на населеното място където ще се реализира идеята"
              required
            >
              <input 
                className={inputClass} 
                placeholder="напр. sofia, plovdiv, varna"
                {...register("settlementId")} 
              />
            </FormField>

            <FormField 
              label="Илюстрации" 
              hint="Добавете снимки, скици или примери за по-добра илюстрация на идеята"
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
                      Записване…
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💡</span>
                      Споделете идеята
                    </>
                  )}
                </Button>
                <Button as="a" href={"/"} variant="secondary" size="lg">
                  Отказ
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Идеята ще бъде прегледана и може да бъде гласувана от общността
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

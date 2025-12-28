"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const SOFIA_DISTRICTS = [
  "Витоша", "Връбница", "Изгрев", "Илинден", "Красна поляна",
  "Красно село", "Кремиковци", "Лозенец", "Люлин", "Младост",
  "Надежда", "Нови Искър", "Ovча купел", "Панчарево", "Подуяне",
  "Сердика", "Слатина", "Средец", "Студентски", "Триадица",
  "Artificial", "Bank", "Vitosha", "Lozenets",
];

const INTERESTS = [
  { id: "cleanliness", label: "Чистота", icon: "🧹" },
  { id: "parks", label: "Паркове и зелени площи", icon: "🌳" },
  { id: "transport", label: "Транспорт", icon: "🚌" },
  { id: "culture", label: "Култура и изкуство", icon: "🎭" },
  { id: "sports", label: "Спорт", icon: "⚽" },
  { id: "education", label: "Образование", icon: "📚" },
  { id: "infrastructure", label: "Инфраструктура", icon: "🏗️" },
  { id: "social", label: "Социални дейности", icon: "🤝" },
];

interface OnboardingFlowProps {
  userId: string;
}

export function OnboardingFlow({ userId }: OnboardingFlowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1: Districts
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  
  // Step 2: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Step 3: Channels
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    push: true,
  });
  
  const handleDistrictToggle = (district: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  };
  
  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    );
  };
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };
  
  const handleSkip = () => {
    router.push("/me?welcome=1");
  };
  
  async function handleFinish() {
    setIsSaving(true);
    
    try {
      await fetch(`/api/users/${userId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districts: selectedDistricts,
          interests: selectedInterests,
          channels,
        }),
      });
      
      router.push("/me?welcome=1");
    } catch (err) {
      console.error("Onboarding save error:", err);
      alert("Грешка при запазване. Опитай отново.");
      setIsSaving(false);
    }
  }
  
  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 w-16 rounded-full transition-colors ${
              s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
            }`}
          />
        ))}
      </div>
      
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground">Стъпка {step} от 3</p>
      </div>
      
      {/* Step 1: Districts */}
      {step === 1 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Избери район(и)</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Ще получаваш известия за сигнали и събития от избраните райони
          </p>
          
          <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-4 md:grid-cols-3">
            {SOFIA_DISTRICTS.map((district) => (
              <label
                key={district}
                className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedDistricts.includes(district)}
                  onCheckedChange={() => handleDistrictToggle(district)}
                />
                <span className="text-sm">{district}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 2: Interests */}
      {step === 2 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Какво те интересува?</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Персонализирай какъв тип съдържание искаш да виждаш
          </p>
          
          <div className="grid gap-3 sm:grid-cols-2">
            {INTERESTS.map((interest) => (
              <label
                key={interest.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-4 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedInterests.includes(interest.id)}
                  onCheckedChange={() => handleInterestToggle(interest.id)}
                />
                <span className="text-2xl">{interest.icon}</span>
                <span className="text-sm font-medium">{interest.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 3: Notification channels */}
      {step === 3 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Как искаш да получаваш известия?</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Избери предпочитаните канали за комуникация
          </p>
          
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-muted">
              <Checkbox
                checked={channels.email}
                onCheckedChange={(checked) =>
                  setChannels((prev) => ({ ...prev, email: !!checked }))
                }
              />
              <div>
                <div className="font-medium">Email известия</div>
                <div className="text-sm text-muted-foreground">
                  Получавай актуализации по email (препоръчително)
                </div>
              </div>
            </label>
            
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-muted">
              <Checkbox
                checked={channels.sms}
                onCheckedChange={(checked) =>
                  setChannels((prev) => ({ ...prev, sms: !!checked }))
                }
              />
              <div>
                <div className="font-medium">SMS известия</div>
                <div className="text-sm text-muted-foreground">
                  Получавай спешни съобщения по SMS
                </div>
              </div>
            </label>
            
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-muted">
              <Checkbox
                checked={channels.push}
                onCheckedChange={(checked) =>
                  setChannels((prev) => ({ ...prev, push: !!checked }))
                }
              />
              <div>
                <div className="font-medium">Push известия</div>
                <div className="text-sm text-muted-foreground">
                  Получавай известия в браузъра
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <Button
          onClick={handleSkip}
          variant="outline"
          className="flex-1"
          disabled={isSaving}
        >
          Пропусни засега
        </Button>
        
        <Button
          onClick={handleNext}
          className="flex-1"
          disabled={isSaving}
        >
          {step === 3 ? (isSaving ? "Запазване..." : "Завърши") : "Напред"}
        </Button>
      </div>
    </div>
  );
}


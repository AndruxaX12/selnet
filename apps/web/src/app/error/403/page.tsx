"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Forbidden403Page({ params: { locale } }: { params: { locale: string } }) {
  const base = `/${locale}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">🚫</div>
        
        <h1 className="mb-4 text-4xl font-bold">403</h1>
        
        <h2 className="mb-4 text-xl font-semibold">Нямаш права за този раздел</h2>
        
        <p className="mb-8 text-muted-foreground">
          Нямаш необходимите права за достъп до тази страница. Ако смяташ, че това е грешка, свържи се с администратор.
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`${base}/me`}>
            <Button size="lg" className="w-full sm:w-auto">
              Моят профил
            </Button>
          </Link>
          
          <Link href={base}>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Към началото
            </Button>
          </Link>
        </div>
        
        <div className="mt-8">
          <a href="mailto:support@selnet.bg" className="text-sm text-muted-foreground hover:text-foreground">
            Свържи се с нас →
          </a>
        </div>
      </div>
    </div>
  );
}


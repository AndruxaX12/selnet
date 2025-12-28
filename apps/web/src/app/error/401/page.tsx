import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Неоторизиран достъп | SelNet",
};

export default function Unauthorized401Page({ params: { locale } }: { params: { locale: string } }) {
  const base = `/${locale}`;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">🔒</div>
        
        <h1 className="mb-4 text-4xl font-bold">401</h1>
        
        <h2 className="mb-4 text-xl font-semibold">Неоторизиран достъп</h2>
        
        <p className="mb-8 text-muted-foreground">
          Трябва да влезеш в профила си, за да достъпиш тази страница.
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`${base}/login`}>
            <Button size="lg" className="w-full sm:w-auto">
              Вход
            </Button>
          </Link>
          
          <Link href={`${base}/register`}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Регистрация
            </Button>
          </Link>
        </div>
        
        <div className="mt-8">
          <Link href={base} className="text-sm text-muted-foreground hover:text-foreground">
            ← Към началото
          </Link>
        </div>
      </div>
    </div>
  );
}


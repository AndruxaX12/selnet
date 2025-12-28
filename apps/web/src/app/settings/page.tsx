import { Metadata } from "next";
import dynamic from "next/dynamic";

const SettingsPage = dynamic(() => import("./SettingsPage"), { ssr: false });

export const metadata: Metadata = {
  title: "Настройки | Моят Ботевград",
  description: "Управление на настройките на профила",
};

export default function Settings() {
  return <SettingsPage />;
}


import { Metadata } from "next";
import dynamic from "next/dynamic";

const ProfilePage = dynamic(() => import("./ProfilePage"), { ssr: false });

export const metadata: Metadata = {
  title: "Профил | Моят Ботевград",
  description: "Вашият потребителски профил",
};

export default function Profile() {
  return <ProfilePage />;
}


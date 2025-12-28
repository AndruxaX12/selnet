import { redirect } from 'next/navigation';

export default function MySignalsPage() {
  // Redirect to the signals page with the mine=true filter
  redirect("/signals?mine=true");
}
export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-3">
      <div className="text-6xl">404</div>
      <div className="text-xl font-semibold">Страницата не е намерена</div>
      <div className="text-sm text-neutral-600">Провери адреса или се върни към началото.</div>
      <a href="/" className="underline">Към начало</a>
    </div>
  );
}

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto space-y-6 text-center p-6">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-3xl font-bold text-gray-900">Няма връзка</h1>
        <p className="text-lg text-gray-600">
          Изглежда си офлайн. Някои страници може да са достъпни от кеша.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Можеш да опиташ следното:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Провери интернет връзката си</li>
            <li>• Опресни страницата</li>
            <li>• Опитай отново след малко</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Опресни страницата
          </button>
          <a 
            href="/" 
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Към началната страница
          </a>
        </div>
      </div>
    </div>
  );
}


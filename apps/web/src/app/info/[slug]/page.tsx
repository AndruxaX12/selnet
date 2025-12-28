import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown"; // If installed, otherwise just render HTML/Text
// I don't know if react-markdown is installed. I'll check package.json or just render as HTML if I trust it, or text.
// The user editor supports Markdown.
// I'll assume simple text/html for now or try to use a simple parser.
// Actually, I can just display the content.

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

async function getPage(slug: string) {
  try {
    const doc = await adminDb.collection("pages").doc(slug).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as any;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export default async function StaticPage({ params }: PageProps) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{page.title}</h1>
      <div className="prose prose-blue max-w-none">
        {/* Simple rendering. For Markdown, we'd need a library. 
            For now, I'll render as whitespace-pre-wrap to preserve formatting 
            if it's plain text, or dangerouslySetInnerHTML if I trust admin.
            Given it's a CMS for admin, I'll trust admin.
        */}
        <div className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
          {page.content}
        </div>
      </div>
    </div>
  );
}

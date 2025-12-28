export const metadata = { robots: "noindex" };
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}


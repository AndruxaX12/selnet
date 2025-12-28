"use client";
import { useEffect, useMemo, useState } from "react";
import { Comment, CommentWithId } from "@selnet/shared";
import {
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore, limit, onSnapshot,
  orderBy, query, serverTimestamp, startAfter, setDoc
} from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

type Props = {
  coll: "signals" | "ideas" | "events";
  docId: string;
  pageSize?: number;
};

export default function Comments({ coll, docId, pageSize = 10 }: Props) {
  const { user } = useAuth();
  const db = useMemo(() => getFirestore(app), []);
  const base = useMemo(() => collection(db, coll, docId, "comments"), [db, coll, docId]);

  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreCursor, setMoreCursor] = useState<any>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  // Get locale for links
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const loginLink = `/${locale}/login`;

  useEffect(() => {
    const q = query(base, orderBy("createdAt", "desc"), limit(pageSize));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
      setLoading(false);
      setMoreCursor(snap.docs[snap.docs.length - 1] || null);
    });
    return () => unsub();
  }, [base, pageSize]);

  async function loadMore() {
    if (!moreCursor) return;
    const q = query(base, orderBy("createdAt", "desc"), startAfter(moreCursor), limit(pageSize));
    const snap = await getDocs(q);
    setItems(prev => [...prev, ...snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))]);
    setMoreCursor(snap.docs[snap.docs.length - 1] || null);
  }

  async function submit() {
    if (!user || !text.trim()) return;
    setBusy(true);
    try {
      await addDoc(base, {
        by: user.uid,
        text: text.trim().slice(0, 5000),
        createdAt: Date.now(),
        likesCount: 0
      });
      setText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="font-medium">Коментари</div>

      {/* Форма */}
      <div className="rounded border p-3">
        {!user ? (
          <div className="text-sm">За да коментираш, <a className="underline" href={loginLink}>влез</a>.</div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Напиши коментар…"
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-neutral-500">{text.length}/5000</div>
              <button
                onClick={submit}
                disabled={busy || !text.trim()}
                className="rounded bg-black text-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Публикувай
              </button>
            </div>
          </>
        )}
      </div>

      {/* Списък */}
      <ul className="space-y-3">
        {items.map((c) => (
          <li id={`c_${c.id}`} key={c.id} className="rounded border p-3">
            <div className="text-xs text-neutral-500 flex items-center justify-between">
              <span>{new Date(c.createdAt).toLocaleString()}</span>
              {/* по-късно: покажи име/аватар на автора */}
            </div>
            <div className="text-sm whitespace-pre-line mt-1">{c.text}</div>

            <div className="mt-2 flex items-center gap-3">
              <LikeButton coll={coll} docId={docId} commentId={c.id} initial={c.likesCount || 0} />
            </div>
          </li>
        ))}
      </ul>

      {moreCursor && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Зареди още
          </button>
        </div>
      )}

      {loading && <div className="text-sm text-neutral-600">Зареждане…</div>}
      {!loading && items.length === 0 && <div className="text-sm text-neutral-600">Все още няма коментари.</div>}
    </div>
  );
}

function LikeButton({ coll, docId, commentId, initial }: {
  coll: "signals" | "ideas" | "events";
  docId: string;
  commentId: string;
  initial: number;
}) {
  const { user } = useAuth();
  const db = getFirestore(app);
  const [count, setCount] = useState(initial);
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const likeRef = doc(db, coll, docId, "comments", commentId, "likes", user.uid);
    const unsub = onSnapshot(likeRef, (snap) => setMine(snap.exists()));
    return () => unsub();
  }, [db, user, coll, docId, commentId]);

  async function toggle() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const likeRef = doc(db, coll, docId, "comments", commentId, "likes", user.uid);
      if (mine) {
        await deleteDoc(likeRef);
        setCount(c => Math.max(0, c - 1));
      } else {
        await setDoc(likeRef, { by: user.uid, at: Date.now() });
        setCount(c => c + 1);
      }
      setMine(!mine);
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`rounded border px-2 py-1 text-xs ${mine ? "bg-black text-white" : ""}`}
      disabled={busy}
    >
      ❤️ {count}
    </button>
  );
}

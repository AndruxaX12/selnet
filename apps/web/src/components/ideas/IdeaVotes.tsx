"use client";
import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import { doc, getFirestore, onSnapshot, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { IdeaVote } from "@selnet/shared";

export default function IdeaVotes({ ideaId }: { ideaId: string }) {
  const { user } = useAuth();
  const db = useMemo(() => getFirestore(app), []);
  const ideaRef = useMemo(() => doc(db, "ideas", ideaId), [db, ideaId]);
  const myVoteRef = useMemo(() => user ? doc(db, "ideas", ideaId, "votes", user.uid) : null, [db, ideaId, user]);

  const [score, setScore] = useState<number>(0);
  const [upCount, setUpCount] = useState<number>(0);
  const [downCount, setDownCount] = useState<number>(0);
  const [mine, setMine] = useState<1 | -1 | 0>(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(ideaRef, (snap) => {
      const x: any = snap.data() || {};
      setScore(x.score ?? 0);
      setUpCount(x.upCount ?? 0);
      setDownCount(x.downCount ?? 0);
    });
    return () => unsub();
  }, [ideaRef]);

  useEffect(() => {
    if (!myVoteRef) { setMine(0); return; }
    const load = async () => {
      const s = await getDoc(myVoteRef);
      setMine(s.exists() ? ((s.data() as any).v as 1|-1) : 0);
    };
    load();
  }, [myVoteRef]);

  async function vote(v: 1 | -1) {
    if (!user) { alert("Моля, влез за да гласуваш."); return; }
    if (!myVoteRef) return;
    setBusy(true);
    try {
      if (mine === v) {
        await deleteDoc(myVoteRef);
        setMine(0);
      } else {
        await setDoc(myVoteRef, { v, at: Date.now() } as IdeaVote);
        setMine(v);
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="inline-flex items-center gap-2" aria-label="Votes">
      <button
        onClick={()=>vote(1)}
        disabled={busy}
        className={`rounded border px-2 py-1 text-sm ${mine===1 ? "bg-black text-white" : "hover:bg-neutral-50"}` }
        aria-pressed={mine===1}
        aria-label="Upvote"
        title="Upvote"
      >👍 {upCount}</button>

      <div className="text-sm font-medium" aria-live="polite">{score}</div>

      <button
        onClick={()=>vote(-1)}
        disabled={busy}
        className={`rounded border px-2 py-1 text-sm ${mine===-1 ? "bg-black text-white" : "hover:bg-neutral-50"}` }
        aria-pressed={mine===-1}
        aria-label="Downvote"
        title="Downvote"
      >👎 {downCount}</button>
    </div>
  );
}

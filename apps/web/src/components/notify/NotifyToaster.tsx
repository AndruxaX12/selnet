"use client";
import { useEffect, useRef, useState } from "react";
import { useInbox } from "@/lib/notify/useInbox";
import { useAuth } from "@/components/auth/AuthProvider";
import { app } from "@/lib/firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export default function NotifyToaster() {
  const { items } = useInbox(1); // само най-новото е достатъчно
  const lastShown = useRef<string | null>(null);
  const [pref, setPref] = useState<{ sound:boolean; toast:boolean; muted:string[] }>({ sound:true, toast:true, muted:[] });
  const { user } = useAuth();
  const db = getFirestore(app);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(s => {
      const st = (s.data() as any)?.notify || {};
      setPref({ sound: st.sound ?? true, toast: st.toast ?? true, muted: st.muted ?? [] });
    });
  }, [db, user]);

  useEffect(() => {
    const n = items[0];
    if (!n || !pref.toast || (pref.muted||[]).includes(n.channel)) return;
    if (lastShown.current === n.id) return;
    lastShown.current = n.id;

    showToast(n.title, n.body, n.link);
    if (pref.sound) playBeep();
  }, [items, pref]);

  return null;
}

function showToast(title: string, body?: string, href?: string) {
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;

  const el = document.createElement("div");
  el.className = `fixed z-[9999] ${
    isMobile
      ? 'bottom-4 left-4 right-4'
      : 'left-1/2 -translate-x-1/2 bottom-6'
  } bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-2xl max-w-sm mx-auto animate-in slide-in-from-bottom-2 duration-300`;

  el.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-lg flex-shrink-0">🔔</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-white line-clamp-2">${escapeHtml(title)}</div>
        ${body ? `<div class="text-gray-300 text-sm mt-1 line-clamp-2">${escapeHtml(body)}</div>` : ''}
        ${href ? `<div class="mt-2">
          <a href="${href}" class="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            Отвори →
          </a>
        </div>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(el);

  // Auto-dismiss after 5 seconds
  const dismissTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = isMobile ? 'translateY(100%)' : 'translateY(20px) scale(0.95)';
    setTimeout(() => el.remove(), 300);
  }, 5000);

  // Click to dismiss
  el.addEventListener('click', () => {
    clearTimeout(dismissTimer);
    el.style.opacity = '0';
    el.style.transform = isMobile ? 'translateY(100%)' : 'translateY(20px) scale(0.95)';
    setTimeout(() => el.remove(), 300);
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] as string));
}

function playBeep() {
  try {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 800Hz beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Fallback: do nothing if Web Audio API is not supported
    console.log('Web Audio API not supported, skipping beep sound');
  }
}

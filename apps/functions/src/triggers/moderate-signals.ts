import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { analyzeUrl, blurFromGsPath } from "../moderation/imageMod";
import { addHistory } from "../history/log";

const db = admin.firestore();

/**
 * Когато се създаде или обнови signals/{id} и photos[] съдържа елементи без 'unsafe' поле,
 * анализирай и (ако е нужно) генерирай blurredUrl. Поддържа снимки както като string, така и Photo обекти.
 */
export const moderateSignalPhotos = functions.firestore
  .document("signals/{id}")
  .onWrite(async (change, context) => {
    const after = change.after.exists ? (change.after.data() as any) : null;
    if (!after) return;

    if (!Array.isArray(after.photos) || after.photos.length === 0) return;

    // нормализирай масива към Photo обекти
    const photos: any[] = after.photos.map((p: any) => (typeof p === "string" ? { url: p } : p));

    let changed = false;

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      // пропусни вече оценени
      if (typeof p.unsafe === "boolean") continue;

      try {
        const { unsafe } = await analyzeUrl(p.url);
        p.unsafe = unsafe;

        if (unsafe) {
          // ако имаме path -> правим blur от storage; ако нямаме, опит с download по URL (по-скъпо/несигурно) => пропускаме
          if (p.path && p.path.startsWith("signals/")) {
            const blurredUrl = await blurFromGsPath(p.path);
            p.blurredUrl = blurredUrl;
          } else {
            // няма path — маркираме като unsafe, но без blurredUrl
          }
        }
        changed = true;
      } catch (e) {
        // при грешка — не променяме нищо по този елемент
      }
    }

    if (changed) {
      await db.collection("signals").doc(context.params.id as string).update({ photos, updatedAt: Date.now() });
      await addHistory("signals", context.params.id as string, {
        type: "photo_mod",
        msg: "Автоматична модерация на изображения (SafeSearch/blur)"
      });
    }
  });

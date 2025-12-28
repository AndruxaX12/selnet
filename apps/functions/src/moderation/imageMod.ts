import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v4 as uuid } from "uuid";
import Sharp from "sharp";
import vision from "@google-cloud/vision";

const storage = admin.storage();
const db = admin.firestore();
const client = new vision.ImageAnnotatorClient();

type Likelihood = "UNKNOWN"|"VERY_UNLIKELY"|"UNLIKELY"|"POSSIBLE"|"LIKELY"|"VERY_LIKELY";
type SafeFlags = { adult: Likelihood; violence: Likelihood; racy: Likelihood };

const RISK_SET = new Set<Likelihood>(["LIKELY","VERY_LIKELY"]);

export async function analyzeUrl(imageUrl: string) {
  const [result] = await client.safeSearchDetection(imageUrl);
  const s = result.safeSearchAnnotation!;
  const flags: SafeFlags = {
    adult: (s.adult as any) || "UNKNOWN",
    violence: (s.violence as any) || "UNKNOWN",
    racy: (s.racy as any) || "UNKNOWN"
  };
  const unsafe = RISK_SET.has(flags.adult) || RISK_SET.has(flags.violence) || RISK_SET.has(flags.racy);
  return { unsafe, flags };
}

export async function blurFromGsPath(gsPath: string): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(gsPath);
  const [buf] = await file.download();
  const blurred = await Sharp(buf).blur(12).toFormat("jpeg", { mozjpeg: true }).toBuffer();

  const outPath = gsPath.replace(/^signals\//, "signals_blurred/").replace(/\.(png|jpg|jpeg|webp|gif)$/i, "") + "-blur.jpg";
  const out = bucket.file(outPath);
  const token = uuid();
  await out.save(blurred, {
    contentType: "image/jpeg",
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    resumable: false,
    public: false
  });
  // Сглоби downloadURL
  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(outPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}` ;
  return url;
}

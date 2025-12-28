import * as functions from "firebase-functions";
import sg from "@sendgrid/mail";
import mjml2html from "mjml";
import * as admin from "firebase-admin";

const cfg = functions.config();
const SENDGRID_KEY = cfg?.sendgrid?.key as string | undefined;
const FROM = cfg?.sendgrid?.from as string | undefined;

if (!admin.apps.length) admin.initializeApp();

export function renderMjml(mjml: string, vars: Record<string, string | number> = {}) {
  const withVars = mjml.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
  const { html, errors } = mjml2html(withVars, { minify: true });
  if (errors?.length) functions.logger.warn("MJML errors", errors);
  return html;
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_KEY || !FROM) {
    functions.logger.error("SendGrid credentials missing");
    return { ok: false, reason: "missing-credentials" };
  }
  sg.setApiKey(SENDGRID_KEY);
  await sg.send({ to, from: FROM, subject, html });
  return { ok: true };
}

import { renderMjml } from "../utils/email";
import fs from "node:fs";
import path from "node:path";

const basePath = path.resolve(__dirname, "./");

function load(file: string) {
  return fs.readFileSync(path.join(basePath, file), "utf8");
}

const base = load("base.mjml");
const statusTpl = load("signal-status.mjml");
const commentTpl = load("comment.mjml");

export function renderNewCommentEmail(vars: {
  title: string; collection: string; commentPreview: string; url: string;
}) {
  const inner = renderMjml(commentTpl, vars);
  return renderMjml(base, {
    title: "Нов коментар",
    content: inner,
    year: new Date().getFullYear()
  });
}

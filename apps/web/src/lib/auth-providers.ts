"use client";
import {
  GoogleAuthProvider, OAuthProvider, signInWithPopup, linkWithPopup,
  EmailAuthProvider, linkWithCredential, reauthenticateWithCredential,
  updateEmail, updatePassword, deleteUser
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function signInWithGoogle() {
  const prov = new GoogleAuthProvider();
  return await signInWithPopup(auth, prov);
}

export async function linkGoogle() {
  if (!auth.currentUser) throw new Error("not-auth");
  const prov = new GoogleAuthProvider();
  return await linkWithPopup(auth.currentUser, prov);
}

export async function signInWithApple() {
  const prov = new OAuthProvider("apple.com");
  prov.addScope("email"); prov.addScope("name");
  return await signInWithPopup(auth, prov);
}

export async function linkApple() {
  if (!auth.currentUser) throw new Error("not-auth");
  const prov = new OAuthProvider("apple.com");
  prov.addScope("email"); prov.addScope("name");
  return await linkWithPopup(auth.currentUser, prov);
}

export async function linkEmailPassword(email: string, password: string) {
  if (!auth.currentUser) throw new Error("not-auth");
  const cred = EmailAuthProvider.credential(email, password);
  return await linkWithCredential(auth.currentUser, cred);
}

export async function reauthWithPassword(email: string, password: string) {
  if (!auth.currentUser) throw new Error("not-auth");
  const cred = EmailAuthProvider.credential(email, password);
  return await reauthenticateWithCredential(auth.currentUser, cred);
}

export async function changeEmail(newEmail: string) {
  if (!auth.currentUser) throw new Error("not-auth");
  await updateEmail(auth.currentUser, newEmail);
}

export async function changePassword(newPass: string) {
  if (!auth.currentUser) throw new Error("not-auth");
  await updatePassword(auth.currentUser, newPass);
}

export async function deleteMyAccount() {
  if (!auth.currentUser) throw new Error("not-auth");
  await deleteUser(auth.currentUser);
}

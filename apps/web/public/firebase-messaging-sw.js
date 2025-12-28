/* global importScripts, firebase */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA-demo-key-placeholder",
  authDomain: "selnet-ab187.firebaseapp.com",
  projectId: "selnet-ab187",
  messagingSenderId: "932806802011",
  appId: "1:932806802011:web:xxxxxxxxxxxxxxxx"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, link } = normalize(payload);
  const options = {
    body,
    icon: icon || "/icons/icon-192.png",
    data: { link }
  };
  self.registration.showNotification(title || "SelNet", options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || "/";
  event.waitUntil(clients.openWindow(link));
});

function normalize(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const link = (payload.fcmOptions && payload.fcmOptions.link) || data.link || "/";
  return {
    title: notification.title || data.title,
    body: notification.body || data.body,
    icon: notification.icon || data.icon,
    link
  };
}

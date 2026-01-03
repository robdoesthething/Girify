/* eslint-disable no-undef, no-console */
// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyDKaEi-d2ekrCkm2Gyw0VtfQCktY1GVTsY',
  authDomain: 'glorify-ad348.firebaseapp.com',
  projectId: 'glorify-ad348',
  storageBucket: 'glorify-ad348.firebasestorage.app',
  messagingSenderId: '469511129298',
  appId: '1:469511129298:web:3bfddeeec0611dafcd050b',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/lizard-v2.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

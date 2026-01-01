// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "REPLACE_WITH_YOUR_API_KEY", // Note: Usually needed here, but standard practice often puts config. 
    // For Vercel/Vite, we can't inject env vars into SW easily without build steps.
    // We will assume the browser handles the registration via main thread config generally, 
    // but for background handling, explicit init is often required. 
    // However, for this MVP, we'll try standard 'setBackgroundMessageHandler'.
    messagingSenderId: "367803389445"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/girify-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

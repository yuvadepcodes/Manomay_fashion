
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Manomay', body: 'New update available!' };
  
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3067/3067160.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3067/3067160.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

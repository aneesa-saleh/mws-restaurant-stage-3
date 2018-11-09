importScripts('/js/swhelper.js', '/js/dbhelper.js', 'https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js');

const staticCacheName = 'restaurant-reviews-static-v5';
const restaurantImagesCache = 'restaurant-reviews-restaurant-images';
const mapboxTilesCache = 'restaurant-reviews-map-tiles';
const allCaches = [
  staticCacheName,
  restaurantImagesCache,
  mapboxTilesCache,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => cache.addAll([
      '/',
      '/restaurant.html',
      '/css/restaurant-details.css',
      '/css/restaurants-list.css',
      '/js/dbhelper.js',
      '/js/swhelper.js',
      '/js/main.js',
      '/js/restaurant_info.js',
      '/img/offline.svg',
      '/img/offline_wide.svg',
      '/img/spinner.gif',
      'https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js',
      'https://use.fontawesome.com/releases/v5.5.0/css/all.css',
      'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
      'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
      'https://fonts.googleapis.com/css?family=Source+Sans+Pro:200,300,400,600,700',
      'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
      'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png',
      'https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png',
    ])).catch(error => console.log(error)),
  );
});

self.addEventListener('activate', (event) => {
  // delete the old versions of the cache
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.filter(cacheName => (
        cacheName.startsWith('restaurant-reviews-') && !allCaches.includes(cacheName)
      )).map(cacheName => caches.delete(cacheName)),
    )).catch(error => console.log(error)),
  );

  self.clients.claim();
});

const dbPromise = openDatabase(true);

self.addEventListener('message', (event) => {
  if (event.data.type === 'post-review') {
    const { review, requestId } = event.data;
    dbPromise.then((db) => {
      const outboxStore = db.transaction('outbox', 'readwrite').objectStore('outbox');
      outboxStore.put({ ...review, request_id: requestId });
      self.registration.sync.register(requestId);
    });
  }
});

self.addEventListener('sync', function (event) {
  event.waitUntil(
    dbPromise.then((db) => {
      const requestId = event.tag;
      let outboxStore = db.transaction('outbox').objectStore('outbox');
      outboxStore.get(requestId).then((request) => {
        const { restaurant_id, name, rating, comments } = request;
        return DBHelper.addReview(restaurant_id, name, rating, comments, (error, newReview) => {
          if (error) {
            // broadcast update to all clients
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                  client.postMessage({
                    type: 'update-review',
                    error: true,
                    requestId,
                  });
              });
            });
            // delete review from outbox store
            outboxStore = db.transaction('outbox', 'readwrite').objectStore('outbox');
            outboxStore.delete(requestId);
          } else {
            // broadcast update to all clients
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                  client.postMessage({
                    type: 'update-review',
                    review: newReview,
                    requestId,
                  });
              });
            });
            // add review to reviews store
            const reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
            reviewsStore.put(newReview);
            // delete review from outbox store
            outboxStore = db.transaction('outbox', 'readwrite').objectStore('outbox');
            outboxStore.delete(requestId);
          }
        })
      })
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    const restaurantImagePathRegex = /img\/[0-9_\-a-zA-Z]+\.jpg/;
    if (restaurantImagePathRegex.test(requestUrl.pathname)) {
      event.respondWith(serveRestaurantImage(event.request));
      return;
    }

    // cache should match index.html to /
    if (requestUrl.pathname.startsWith('/index.html')) {
      event.respondWith(caches.match('/')
        .then(response => response || fetch(event.request)));
      return;
    }
  } else if (requestUrl.origin === 'https://api.tiles.mapbox.com') {
    event.respondWith(serveMapboxTiles(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }) // ignore search for /restaurant.html?id=X
      .then(response => response || fetch(event.request)),
  );
});

const serveRestaurantImage = (request) => {
  // image urls have multiple - and _ for orientation, crop, pixel density and screen size
  // the relevant part of the url is before the first -
  const storageUrl = request.url.split('-')[0];

  return caches.open(restaurantImagesCache).then(
    cache => cache.match(storageUrl).then((response) => {
      if (response) return response;

      return fetch(request).then((networkResponse) => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      }).catch((error) => {
        console.log(error);
        // use of offline images inspired by Salah Hamza's stage 1 project
        // Available at https://github.com/SalahHamza/mws-restaurant-stage-1/blob/master/sw.js
        if (request.url.includes('wide')) return caches.match('/img/offline_wide.svg');
        return caches.match('/img/offline.svg');
      });
    }),
  );
};

const serveMapboxTiles = request => caches.open(mapboxTilesCache).then(
  cache => cache.match(request.url).then((response) => {
    if (response) return response;

    // if request isn't cached, cache it when fetch response is returned
    return fetch(request).then((networkResponse) => {
      cache.put(request.url, networkResponse.clone());
      return networkResponse;
    });
  }),
);

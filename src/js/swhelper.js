const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/service-worker.js')
    .catch(error => console.log(error));
};

const cleanMapboxTilesCache = () => {
  caches.open('restaurant-reviews-map-tiles').then(
    cache => cache.keys().then((requests) => {
      const { length } = requests;
      if (length <= 12) return;

      // keep only the 12 most recent tiles
      requests.slice(0, length - 12).forEach((request) => {
        cache.delete(request);
      });
    }),
  );
};

const openDatabase = () => {
  if (!navigator.serviceWorker) return Promise.resolve();

  return idb.open('restaurant-reviews', 2, (upgradeDb) => {
    switch(upgradeDb.oldVersion) {
      case 0:
        const restaurantsStore = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id',
        });
      case 1:
        const reviewsStore = upgradeDb.createObjectStore('reviews', {
          keyPath: 'id',
        });
        reviewsStore.createIndex('restaurant_id', 'restaurant_id');
    }
  });
};

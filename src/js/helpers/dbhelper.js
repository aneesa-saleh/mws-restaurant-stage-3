const dbPromise = openDatabase();

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return dbPromise.then((db) => {
      const restaurantsURL = `${DBHelper.DATABASE_URL}/restaurants`;

      if (!db) {
        // make regular fetch call
        return fetch(restaurantsURL)
          .then((response) => {
            if (!response.ok) {
              const error = (`Request failed. Returned status of ${response.status}`);
              return Promise.reject(error);
            }
            return response.json();
          });
      }

      // return restaurants from IDB
      let store = db.transaction('restaurants').objectStore('restaurants');
      return store.getAll().then((idbRestaurants) => {
        const fetchResponse = fetch(restaurantsURL)
          .then((response) => {
            if (!response.ok) {
              const error = (`Request failed. Returned status of ${response.status}`);
              return Promise.reject(error);
            }
            const responseJSON = response.clone().json();
            // update IDB restaurants with fetch response even if values from IDB will be returned
            responseJSON.then((fetchedRestaurants) => {
              store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
              fetchedRestaurants.forEach((restaurant) => {
                store.put(restaurant);
              });
            });
            return response.json();
          });
        if (idbRestaurants && idbRestaurants.length > 1) {
          // use > 1 in case restaurant page was visited before home page and only that restaurant is in storage
          return idbRestaurants;
        }
        // if IDB.restaurants is empty, return the fetch response instead
        return fetchResponse;
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    dbPromise.then((db) => {
      const restaurantByIdURL = `${DBHelper.DATABASE_URL}/restaurants/${id}`;

      if (!db) {
        // make regular fetch call
        return fetch(restaurantByIdURL)
          .then((response) => {
            if (!response.ok) {
              const error = (`Request failed. Returned status of ${response.status}`);
              return Promise.reject(error);
            }
            return response.json();
          });
      }

      // return restaurant from IDB
      let store = db.transaction('restaurants').objectStore('restaurants');
      // id comes as a string from the url, convert to a number before lookup
      return store.get(Number.parseInt(id, 10)).then((idbRestaurant) => {
        const fetchResponse = fetch(restaurantByIdURL)
          .then((response) => {
            if (!response.ok) {
              const error = (`Request failed. Returned status of ${response.status}`);
              return Promise.reject(error);
            }
            const responseJSON = response.clone().json();
            // update IDB restaurants with fetch response even if value from IDB will be returned
            responseJSON.then((fetchedRestaurant) => {
              store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
              store.put(fetchedRestaurant);
            });
            return response.json();
          });
        return idbRestaurant || fetchResponse;
      });
    }).then((restaurant) => { callback(null, restaurant); })
      .catch((error) => { callback(error, null); });
  }


  /**
   * Fetch reviews by restaurant ID.
   */
  static fetchReviewsByRestaurantId(restaurantId, callback) {
    dbPromise.then((db) => {
      const reviewsByRestaurantIdURL = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurantId}`;

      if (!db) {
        // make regular fetch call
        return fetch(reviewsByRestaurantIdURL)
          .then((response) => {
            if (!response.ok) {
              const error = (`Request failed. Returned status of ${response.status}`);
              return Promise.reject(error);
            }
            return response.json();
          });
      }

      // return reviews from IDB
      let store = db.transaction('reviews').objectStore('reviews');
      const reviewsByRestaurantIdIndex = store.index('restaurant_id');
      // id comes as a string from the url, convert to a number before lookup
      return reviewsByRestaurantIdIndex.getAll(Number.parseInt(restaurantId, 10)).then((idbReviews) => {
        // get the value of idbReviews length before fetch
        let idbReviewsLength = 0;
        if (idbReviews && idbReviews.length) idbReviewsLength = idbReviews.length;

        const fetchResponse = fetch(reviewsByRestaurantIdURL)
          .then((response) => {
            if (!response.ok) {
              const error = (`Request failed. Returned status of ${response.status}`);
              return Promise.reject(error);
            }
            const responseJSON = response.clone().json();
            // update IDB reviews with fetch response even if values from IDB will be returned
            responseJSON.then((fetchedReviews) => {
              store = db.transaction('reviews', 'readwrite').objectStore('reviews');
              fetchedReviews.forEach((review) => {
                store.put(review);
              });
            });
            return response.json();
          });
        if (idbReviewsLength) {
          return idbReviews;
        }
        // if IDB.reviews is empty, return the fetch response instead
        return fetchResponse;
      });
    }).then((reviews) => { callback(null, reviews); })
      .catch((error) => { callback(error, null); });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants().then((restaurants) => {
      // Filter restaurants to have only given cuisine type
      const results = restaurants.filter(r => r.cuisine_type == cuisine);
      callback(null, results);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then((restaurants) => {
      // Filter restaurants to have only given neighborhood
      const results = restaurants.filter(r => r.neighborhood == neighborhood);
      callback(null, results);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then((restaurants) => {
      let results = restaurants;
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      callback(null, results);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then((restaurants) => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      callback(null, uniqueNeighborhoods);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then((restaurants) => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      callback(null, uniqueCuisines);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, options) {
    if (options) {
      if (options.size === 'small') {
        if (options.singleValue === true) return `img/${restaurant.photograph_small_2x}`;
        return `img/${restaurant.photograph_small_1x} 1x, img/${restaurant.photograph_small_2x} 2x`;
      } if (options.size === 'medium') {
        if (options.singleValue === true) return `img/${restaurant.photograph_medium_2x}`;
        return `img/${restaurant.photograph_medium_1x} 1x, img/${restaurant.photograph_medium_2x} 2x`;
      } if (options.size === 'large' && options.wide) {
        return `img/${restaurant.photograph_large_wide}`;
      }
    }
    return (`img/${restaurant.photograph_large}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
      });
    marker.addTo(newMap);
    return marker;
  }

  /**
   * Mark or unmark a restaurant as favourite
   */
  static setRestaurantFavouriteStatus(restaurantId, status, callback) {
    const setFavouriteStatusUrl = `${DBHelper.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${status}`;
    fetch(setFavouriteStatusUrl, { method: 'PUT' }).then((response) => {
      if (!response.ok) {
        return Promise.reject();
      }
      return response.json();
    }).then((updatedRestaurant) => {
      dbPromise.then((db) => {
        const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
        store.put(updatedRestaurant);
      });
      callback(null, updatedRestaurant);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Add a review for a restaurant
   */
  static addReview(restaurantId, name, rating, comments, callback) {
    const addReviewUrl = `${DBHelper.DATABASE_URL}/reviews`;
    const body = JSON.stringify({
      restaurant_id: restaurantId,
      name,
      rating,
      comments,
    });
    fetch(addReviewUrl, { method: 'POST', body }).then((response) => {
      if (!response.ok) {
        const error = (`Request failed. Returned status of ${response.status}`);
        return Promise.reject(error);
      }
      return response.json();
    }).then((newReview) => {
      callback(null, newReview);
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Get reviews that have been saved offline
   */
  static getOutboxReviews(restaurantId, callback) {
    dbPromise.then((db) => {
      if (!db) {
        const error = 'Error connecting to IndexedDB';
        callback(error, null);
        return;
      }
      const store = db.transaction('outbox').objectStore('outbox');
      const reviewsByRestaurantIdIndex = store.index('restaurant_id');
      // id comes as a string from the url, convert to a number before lookup
      reviewsByRestaurantIdIndex.getAll(Number.parseInt(restaurantId, 10)).then((idbReviews) => {
        callback(null, idbReviews);
      });
    });
  }
}

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
        if (idbRestaurants && idbRestaurants.length > 0) {
          return idbRestaurants;
        }
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
        return `img/${restaurant.photograph_small_1x} 1x, img/${restaurant.photograph_small_2x} 2x`;
      } if (options.size === 'medium') {
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
}

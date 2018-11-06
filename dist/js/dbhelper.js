"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var dbPromise = openDatabase();
/**
 * Common database helper functions.
 */

var DBHelper =
/*#__PURE__*/
function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: "fetchRestaurants",

    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants() {
      return dbPromise.then(function (db) {
        var restaurantsURL = "".concat(DBHelper.DATABASE_URL, "/restaurants");

        if (!db) {
          // make regular fetch call
          return fetch(restaurantsURL).then(function (response) {
            if (!response.ok) {
              var error = "Request failed. Returned status of ".concat(response.status);
              return Promise.reject(error);
            }

            return response.json();
          });
        } // return restaurants from IDB


        var store = db.transaction('restaurants').objectStore('restaurants');
        return store.getAll().then(function (idbRestaurants) {
          var fetchResponse = fetch(restaurantsURL).then(function (response) {
            if (!response.ok) {
              var error = "Request failed. Returned status of ".concat(response.status);
              return Promise.reject(error);
            }

            var responseJSON = response.clone().json(); // update IDB restaurants with fetch response even if values from IDB will be returned

            responseJSON.then(function (fetchedRestaurants) {
              store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
              fetchedRestaurants.forEach(function (restaurant) {
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

  }, {
    key: "fetchRestaurantById",
    value: function fetchRestaurantById(id, callback) {
      dbPromise.then(function (db) {
        var restaurantByIdURL = "".concat(DBHelper.DATABASE_URL, "/restaurants/").concat(id);

        if (!db) {
          // make regular fetch call
          return fetch(restaurantByIdURL).then(function (response) {
            if (!response.ok) {
              var error = "Request failed. Returned status of ".concat(response.status);
              return Promise.reject(error);
            }

            return response.json();
          });
        } // return restaurant from IDB


        var store = db.transaction('restaurants').objectStore('restaurants'); // id comes as a string from the url, convert to a number before lookup

        return store.get(Number.parseInt(id, 10)).then(function (idbRestaurant) {
          var fetchResponse = fetch(restaurantByIdURL).then(function (response) {
            if (!response.ok) {
              var error = "Request failed. Returned status of ".concat(response.status);
              return Promise.reject(error);
            }

            var responseJSON = response.clone().json(); // update IDB restaurants with fetch response even if value from IDB will be returned

            responseJSON.then(function (fetchedRestaurant) {
              store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
              store.put(fetchedRestaurant);
            });
            return response.json();
          });
          return idbRestaurant || fetchResponse;
        });
      }).then(function (restaurant) {
        callback(null, restaurant);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Fetch reviews by restaurant ID.
     */

  }, {
    key: "fetchReviewsByRestaurantId",
    value: function fetchReviewsByRestaurantId(id, callback) {
      dbPromise.then(function (db) {
        var reviewsByRestaurantIdURL = "".concat(DBHelper.DATABASE_URL, "/reviews/?restaurant_id=").concat(id); // if (!db) {
        // make regular fetch call

        return fetch(reviewsByRestaurantIdURL).then(function (response) {
          if (!response.ok) {
            var error = "Request failed. Returned status of ".concat(response.status);
            return Promise.reject(error);
          }

          return response.json();
        }); // }
        // // return restaurant from IDB
        // let store = db.transaction('restaurants').objectStore('restaurants');
        // // id comes as a string from the url, convert to a number before lookup
        // return store.get(Number.parseInt(id, 10)).then((idbRestaurant) => {
        //   const fetchResponse = fetch(restaurantByIdURL)
        //     .then((response) => {
        //       if (!response.ok) {
        //         const error = (`Request failed. Returned status of ${response.status}`);
        //         return Promise.reject(error);
        //       }
        //       const responseJSON = response.clone().json();
        //       // update IDB restaurants with fetch response even if value from IDB will be returned
        //       responseJSON.then((fetchedRestaurant) => {
        //         store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
        //         store.put(fetchedRestaurant);
        //       });
        //       return response.json();
        //     });
        //   return idbRestaurant || fetchResponse;
        // });
      }).then(function (reviews) {
        callback(null, reviews);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisine",
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants().then(function (restaurants) {
        // Filter restaurants to have only given cuisine type
        var results = restaurants.filter(function (r) {
          return r.cuisine_type == cuisine;
        });
        callback(null, results);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByNeighborhood",
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants().then(function (restaurants) {
        // Filter restaurants to have only given neighborhood
        var results = restaurants.filter(function (r) {
          return r.neighborhood == neighborhood;
        });
        callback(null, results);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisineAndNeighborhood",
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants().then(function (restaurants) {
        var results = restaurants;

        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
        }

        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
        }

        callback(null, results);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: "fetchNeighborhoods",
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants().then(function (restaurants) {
        // Get all neighborhoods from all restaurants
        var neighborhoods = restaurants.map(function (v, i) {
          return restaurants[i].neighborhood;
        }); // Remove duplicates from neighborhoods

        var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
          return neighborhoods.indexOf(v) == i;
        });
        callback(null, uniqueNeighborhoods);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: "fetchCuisines",
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants().then(function (restaurants) {
        // Get all cuisines from all restaurants
        var cuisines = restaurants.map(function (v, i) {
          return restaurants[i].cuisine_type;
        }); // Remove duplicates from cuisines

        var uniqueCuisines = cuisines.filter(function (v, i) {
          return cuisines.indexOf(v) == i;
        });
        callback(null, uniqueCuisines);
      }).catch(function (error) {
        callback(error, null);
      });
    }
    /**
     * Restaurant page URL.
     */

  }, {
    key: "urlForRestaurant",
    value: function urlForRestaurant(restaurant) {
      return "./restaurant.html?id=".concat(restaurant.id);
    }
    /**
     * Restaurant image URL.
     */

  }, {
    key: "imageUrlForRestaurant",
    value: function imageUrlForRestaurant(restaurant, options) {
      if (options) {
        if (options.size === 'small') {
          return "img/".concat(restaurant.photograph_small_1x, " 1x, img/").concat(restaurant.photograph_small_2x, " 2x");
        }

        if (options.size === 'medium') {
          return "img/".concat(restaurant.photograph_medium_1x, " 1x, img/").concat(restaurant.photograph_medium_2x, " 2x");
        }

        if (options.size === 'large' && options.wide) {
          return "img/".concat(restaurant.photograph_large_wide);
        }
      }

      return "img/".concat(restaurant.photograph_large);
    }
    /**
     * Map marker for a restaurant.
     */

  }, {
    key: "mapMarkerForRestaurant",
    value: function mapMarkerForRestaurant(restaurant, map) {
      // https://leafletjs.com/reference-1.3.0.html#marker
      var marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(newMap);
      return marker;
    }
  }, {
    key: "DATABASE_URL",

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    get: function get() {
      var port = 1337; // Change this to your server port

      return "http://localhost:".concat(port);
    }
  }]);

  return DBHelper;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbImRiUHJvbWlzZSIsIm9wZW5EYXRhYmFzZSIsIkRCSGVscGVyIiwidGhlbiIsImRiIiwicmVzdGF1cmFudHNVUkwiLCJEQVRBQkFTRV9VUkwiLCJmZXRjaCIsInJlc3BvbnNlIiwib2siLCJlcnJvciIsInN0YXR1cyIsIlByb21pc2UiLCJyZWplY3QiLCJqc29uIiwic3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiZ2V0QWxsIiwiaWRiUmVzdGF1cmFudHMiLCJmZXRjaFJlc3BvbnNlIiwicmVzcG9uc2VKU09OIiwiY2xvbmUiLCJmZXRjaGVkUmVzdGF1cmFudHMiLCJmb3JFYWNoIiwicmVzdGF1cmFudCIsInB1dCIsImxlbmd0aCIsImlkIiwiY2FsbGJhY2siLCJyZXN0YXVyYW50QnlJZFVSTCIsImdldCIsIk51bWJlciIsInBhcnNlSW50IiwiaWRiUmVzdGF1cmFudCIsImZldGNoZWRSZXN0YXVyYW50IiwiY2F0Y2giLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwiLCJyZXZpZXdzIiwiY3Vpc2luZSIsImZldGNoUmVzdGF1cmFudHMiLCJyZXN0YXVyYW50cyIsInJlc3VsdHMiLCJmaWx0ZXIiLCJyIiwiY3Vpc2luZV90eXBlIiwibmVpZ2hib3Job29kIiwibmVpZ2hib3Job29kcyIsIm1hcCIsInYiLCJpIiwidW5pcXVlTmVpZ2hib3Job29kcyIsImluZGV4T2YiLCJjdWlzaW5lcyIsInVuaXF1ZUN1aXNpbmVzIiwib3B0aW9ucyIsInNpemUiLCJwaG90b2dyYXBoX3NtYWxsXzF4IiwicGhvdG9ncmFwaF9zbWFsbF8yeCIsInBob3RvZ3JhcGhfbWVkaXVtXzF4IiwicGhvdG9ncmFwaF9tZWRpdW1fMngiLCJ3aWRlIiwicGhvdG9ncmFwaF9sYXJnZV93aWRlIiwicGhvdG9ncmFwaF9sYXJnZSIsIm1hcmtlciIsIkwiLCJsYXRsbmciLCJsYXQiLCJsbmciLCJ0aXRsZSIsIm5hbWUiLCJhbHQiLCJ1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QXJCLEVBQStCO0FBQy9CLCtCQUFjL0IsVUFBVSxDQUFDa0Msb0JBQXpCLHNCQUF5RGxDLFVBQVUsQ0FBQ21DLG9CQUFwRTtBQUNEOztBQUFDLFlBQUlMLE9BQU8sQ0FBQ0MsSUFBUixLQUFpQixPQUFqQixJQUE0QkQsT0FBTyxDQUFDTSxJQUF4QyxFQUE4QztBQUM5QywrQkFBY3BDLFVBQVUsQ0FBQ3FDLHFCQUF6QjtBQUNEO0FBQ0Y7O0FBQ0QsMkJBQWVyQyxVQUFVLENBQUNzQyxnQkFBMUI7QUFDRDtBQUVEOzs7Ozs7MkNBRzhCdEMsVSxFQUFZdUIsRyxFQUFLO0FBQzdDO0FBQ0EsVUFBTWdCLE1BQU0sR0FBRyxJQUFJQyxDQUFDLENBQUNELE1BQU4sQ0FBYSxDQUFDdkMsVUFBVSxDQUFDeUMsTUFBWCxDQUFrQkMsR0FBbkIsRUFBd0IxQyxVQUFVLENBQUN5QyxNQUFYLENBQWtCRSxHQUExQyxDQUFiLEVBQ2I7QUFDRUMsUUFBQUEsS0FBSyxFQUFFNUMsVUFBVSxDQUFDNkMsSUFEcEI7QUFFRUMsUUFBQUEsR0FBRyxFQUFFOUMsVUFBVSxDQUFDNkMsSUFGbEI7QUFHRUUsUUFBQUEsR0FBRyxFQUFFdEUsUUFBUSxDQUFDdUUsZ0JBQVQsQ0FBMEJoRCxVQUExQjtBQUhQLE9BRGEsQ0FBZjtBQU1BdUMsTUFBQUEsTUFBTSxDQUFDVSxLQUFQLENBQWFDLE1BQWI7QUFDQSxhQUFPWCxNQUFQO0FBQ0Q7Ozs7QUFqUUQ7Ozs7d0JBSTBCO0FBQ3hCLFVBQU1ZLElBQUksR0FBRyxJQUFiLENBRHdCLENBQ0w7O0FBQ25CLHdDQUEyQkEsSUFBM0I7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGRiUHJvbWlzZSA9IG9wZW5EYXRhYmFzZSgpO1xuXG4vKipcbiAqIENvbW1vbiBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zLlxuICovXG5jbGFzcyBEQkhlbHBlciB7XG4gIC8qKlxuICAgKiBEYXRhYmFzZSBVUkwuXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cbiAgICovXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xuICAgIGNvbnN0IHBvcnQgPSAxMzM3OyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHNlcnZlciBwb3J0XG4gICAgcmV0dXJuIGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKCkge1xuICAgIHJldHVybiBkYlByb21pc2UudGhlbigoZGIpID0+IHtcbiAgICAgIGNvbnN0IHJlc3RhdXJhbnRzVVJMID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXN0YXVyYW50c2A7XG5cbiAgICAgIGlmICghZGIpIHtcbiAgICAgICAgLy8gbWFrZSByZWd1bGFyIGZldGNoIGNhbGxcbiAgICAgICAgcmV0dXJuIGZldGNoKHJlc3RhdXJhbnRzVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiByZXN0YXVyYW50cyBmcm9tIElEQlxuICAgICAgbGV0IHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG4gICAgICByZXR1cm4gc3RvcmUuZ2V0QWxsKCkudGhlbigoaWRiUmVzdGF1cmFudHMpID0+IHtcbiAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGZldGNoKHJlc3RhdXJhbnRzVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlSlNPTiA9IHJlc3BvbnNlLmNsb25lKCkuanNvbigpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIElEQiByZXN0YXVyYW50cyB3aXRoIGZldGNoIHJlc3BvbnNlIGV2ZW4gaWYgdmFsdWVzIGZyb20gSURCIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgICAgICAgIHJlc3BvbnNlSlNPTi50aGVuKChmZXRjaGVkUmVzdGF1cmFudHMpID0+IHtcbiAgICAgICAgICAgICAgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnLCAncmVhZHdyaXRlJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG4gICAgICAgICAgICAgIGZldGNoZWRSZXN0YXVyYW50cy5mb3JFYWNoKChyZXN0YXVyYW50KSA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcmUucHV0KHJlc3RhdXJhbnQpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlkYlJlc3RhdXJhbnRzICYmIGlkYlJlc3RhdXJhbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gaWRiUmVzdGF1cmFudHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZldGNoUmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIGNhbGxiYWNrKSB7XG4gICAgZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCByZXN0YXVyYW50QnlJZFVSTCA9IGAke0RCSGVscGVyLkRBVEFCQVNFX1VSTH0vcmVzdGF1cmFudHMvJHtpZH1gO1xuXG4gICAgICBpZiAoIWRiKSB7XG4gICAgICAgIC8vIG1ha2UgcmVndWxhciBmZXRjaCBjYWxsXG4gICAgICAgIHJldHVybiBmZXRjaChyZXN0YXVyYW50QnlJZFVSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gcmVzdGF1cmFudCBmcm9tIElEQlxuICAgICAgbGV0IHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG4gICAgICAvLyBpZCBjb21lcyBhcyBhIHN0cmluZyBmcm9tIHRoZSB1cmwsIGNvbnZlcnQgdG8gYSBudW1iZXIgYmVmb3JlIGxvb2t1cFxuICAgICAgcmV0dXJuIHN0b3JlLmdldChOdW1iZXIucGFyc2VJbnQoaWQsIDEwKSkudGhlbigoaWRiUmVzdGF1cmFudCkgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaFJlc3BvbnNlID0gZmV0Y2gocmVzdGF1cmFudEJ5SWRVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VKU09OID0gcmVzcG9uc2UuY2xvbmUoKS5qc29uKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgSURCIHJlc3RhdXJhbnRzIHdpdGggZmV0Y2ggcmVzcG9uc2UgZXZlbiBpZiB2YWx1ZSBmcm9tIElEQiB3aWxsIGJlIHJldHVybmVkXG4gICAgICAgICAgICByZXNwb25zZUpTT04udGhlbigoZmV0Y2hlZFJlc3RhdXJhbnQpID0+IHtcbiAgICAgICAgICAgICAgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnLCAncmVhZHdyaXRlJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG4gICAgICAgICAgICAgIHN0b3JlLnB1dChmZXRjaGVkUmVzdGF1cmFudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpZGJSZXN0YXVyYW50IHx8IGZldGNoUmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9KS50aGVuKChyZXN0YXVyYW50KSA9PiB7IGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpOyB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4geyBjYWxsYmFjayhlcnJvciwgbnVsbCk7IH0pO1xuICB9XG5cblxuICAvKipcbiAgICogRmV0Y2ggcmV2aWV3cyBieSByZXN0YXVyYW50IElELlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkKGlkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmV2aWV3c0J5UmVzdGF1cmFudElkVVJMID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXZpZXdzLz9yZXN0YXVyYW50X2lkPSR7aWR9YDtcblxuICAgICAgLy8gaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmV2aWV3c0J5UmVzdGF1cmFudElkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAvLyB9XG5cbiAgICAgIC8vIC8vIHJldHVybiByZXN0YXVyYW50IGZyb20gSURCXG4gICAgICAvLyBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgIC8vIC8vIGlkIGNvbWVzIGFzIGEgc3RyaW5nIGZyb20gdGhlIHVybCwgY29udmVydCB0byBhIG51bWJlciBiZWZvcmUgbG9va3VwXG4gICAgICAvLyByZXR1cm4gc3RvcmUuZ2V0KE51bWJlci5wYXJzZUludChpZCwgMTApKS50aGVuKChpZGJSZXN0YXVyYW50KSA9PiB7XG4gICAgICAvLyAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXN0YXVyYW50QnlJZFVSTClcbiAgICAgIC8vICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIC8vICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIC8vICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAvLyAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAvLyAgICAgICB9XG4gICAgICAvLyAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgIC8vICAgICAgIC8vIHVwZGF0ZSBJREIgcmVzdGF1cmFudHMgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlIGZyb20gSURCIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgIC8vICAgICAgIHJlc3BvbnNlSlNPTi50aGVuKChmZXRjaGVkUmVzdGF1cmFudCkgPT4ge1xuICAgICAgLy8gICAgICAgICBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgIC8vICAgICAgICAgc3RvcmUucHV0KGZldGNoZWRSZXN0YXVyYW50KTtcbiAgICAgIC8vICAgICAgIH0pO1xuICAgICAgLy8gICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIC8vICAgICB9KTtcbiAgICAgIC8vICAgcmV0dXJuIGlkYlJlc3RhdXJhbnQgfHwgZmV0Y2hSZXNwb25zZTtcbiAgICAgIC8vIH0pO1xuICAgIH0pLnRoZW4oKHJldmlld3MpID0+IHsgY2FsbGJhY2sobnVsbCwgcmV2aWV3cyk7IH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7IGNhbGxiYWNrKGVycm9yLCBudWxsKTsgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzICB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZ1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gbmVpZ2hib3Job29kXG4gICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSBhbmQgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHM7XG4gICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IG5laWdoYm9yaG9vZFxuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZCk7XG4gICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIG5laWdoYm9yaG9vZHNcbiAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlTmVpZ2hib3Job29kcyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoQ3Vpc2luZXMoY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgIGNvbnN0IGN1aXNpbmVzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5jdWlzaW5lX3R5cGUpO1xuICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xuICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cbiAgICovXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXG4gICAqL1xuICBzdGF0aWMgaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMuc2l6ZSA9PT0gJ3NtYWxsJykge1xuICAgICAgICByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9zbWFsbF8xeH0gMXgsIGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9zbWFsbF8yeH0gMnhgO1xuICAgICAgfSBpZiAob3B0aW9ucy5zaXplID09PSAnbWVkaXVtJykge1xuICAgICAgICByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9tZWRpdW1fMXh9IDF4LCBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbWVkaXVtXzJ4fSAyeGA7XG4gICAgICB9IGlmIChvcHRpb25zLnNpemUgPT09ICdsYXJnZScgJiYgb3B0aW9ucy53aWRlKSB7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX2xhcmdlX3dpZGV9YDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX2xhcmdlfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cbiAgICovXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xuICAgIC8vIGh0dHBzOi8vbGVhZmxldGpzLmNvbS9yZWZlcmVuY2UtMS4zLjAuaHRtbCNtYXJrZXJcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgTC5tYXJrZXIoW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgICAgYWx0OiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcbiAgICAgIH0pO1xuICAgIG1hcmtlci5hZGRUbyhuZXdNYXApO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cbn1cbiJdLCJmaWxlIjoiZGJoZWxwZXIuanMifQ==

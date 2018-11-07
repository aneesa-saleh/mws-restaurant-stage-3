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
          } // if IDB.restaurants is empty, return the fetch response instead


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
    value: function fetchReviewsByRestaurantId(restaurantId, callback) {
      dbPromise.then(function (db) {
        var reviewsByRestaurantIdURL = "".concat(DBHelper.DATABASE_URL, "/reviews/?restaurant_id=").concat(restaurantId);

        if (!db) {
          // make regular fetch call
          return fetch(reviewsByRestaurantIdURL).then(function (response) {
            if (!response.ok) {
              var error = "Request failed. Returned status of ".concat(response.status);
              return Promise.reject(error);
            }

            return response.json();
          });
        } // return reviews from IDB


        var store = db.transaction('reviews').objectStore('reviews');
        var reviewsByRestaurantIdIndex = store.index('restaurant_id'); // id comes as a string from the url, convert to a number before lookup

        return reviewsByRestaurantIdIndex.getAll(Number.parseInt(restaurantId, 10)).then(function (idbReviews) {
          var fetchResponse = fetch(reviewsByRestaurantIdURL).then(function (response) {
            if (!response.ok) {
              var error = "Request failed. Returned status of ".concat(response.status);
              return Promise.reject(error);
            }

            var responseJSON = response.clone().json(); // update IDB reviews with fetch response even if values from IDB will be returned

            responseJSON.then(function (fetchedReviews) {
              store = db.transaction('reviews', 'readwrite').objectStore('reviews');
              fetchedReviews.forEach(function (review) {
                store.put(review);
              });
            });
            return response.json();
          });

          if (idbReviews && idbReviews.length > 0) {
            return idbReviews;
          } // if IDB.reviews is empty, return the fetch response instead


          return fetchResponse;
        });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbImRiUHJvbWlzZSIsIm9wZW5EYXRhYmFzZSIsIkRCSGVscGVyIiwidGhlbiIsImRiIiwicmVzdGF1cmFudHNVUkwiLCJEQVRBQkFTRV9VUkwiLCJmZXRjaCIsInJlc3BvbnNlIiwib2siLCJlcnJvciIsInN0YXR1cyIsIlByb21pc2UiLCJyZWplY3QiLCJqc29uIiwic3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiZ2V0QWxsIiwiaWRiUmVzdGF1cmFudHMiLCJmZXRjaFJlc3BvbnNlIiwicmVzcG9uc2VKU09OIiwiY2xvbmUiLCJmZXRjaGVkUmVzdGF1cmFudHMiLCJmb3JFYWNoIiwicmVzdGF1cmFudCIsInB1dCIsImxlbmd0aCIsImlkIiwiY2FsbGJhY2siLCJyZXN0YXVyYW50QnlJZFVSTCIsImdldCIsIk51bWJlciIsInBhcnNlSW50IiwiaWRiUmVzdGF1cmFudCIsImZldGNoZWRSZXN0YXVyYW50IiwiY2F0Y2giLCJyZXN0YXVyYW50SWQiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleCIsImluZGV4IiwiaWRiUmV2aWV3cyIsImZldGNoZWRSZXZpZXdzIiwicmV2aWV3IiwicmV2aWV3cyIsImN1aXNpbmUiLCJmZXRjaFJlc3RhdXJhbnRzIiwicmVzdGF1cmFudHMiLCJyZXN1bHRzIiwiZmlsdGVyIiwiciIsImN1aXNpbmVfdHlwZSIsIm5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsIm9wdGlvbnMiLCJzaXplIiwicGhvdG9ncmFwaF9zbWFsbF8xeCIsInBob3RvZ3JhcGhfc21hbGxfMngiLCJwaG90b2dyYXBoX21lZGl1bV8xeCIsInBob3RvZ3JhcGhfbWVkaXVtXzJ4Iiwid2lkZSIsInBob3RvZ3JhcGhfbGFyZ2Vfd2lkZSIsInBob3RvZ3JhcGhfbGFyZ2UiLCJtYXJrZXIiLCJMIiwibGF0bG5nIiwibGF0IiwibG5nIiwidGl0bGUiLCJuYW1lIiwiYWx0IiwidXJsIiwidXJsRm9yUmVzdGF1cmFudCIsImFkZFRvIiwibmV3TWFwIiwicG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFNQSxTQUFTLEdBQUdDLFlBQVksRUFBOUI7QUFFQTs7OztJQUdNQyxROzs7Ozs7Ozs7O0FBVUo7Ozt1Q0FHMEI7QUFDeEIsYUFBT0YsU0FBUyxDQUFDRyxJQUFWLENBQWUsVUFBQ0MsRUFBRCxFQUFRO0FBQzVCLFlBQU1DLGNBQWMsYUFBTUgsUUFBUSxDQUFDSSxZQUFmLGlCQUFwQjs7QUFFQSxZQUFJLENBQUNGLEVBQUwsRUFBUztBQUNQO0FBQ0EsaUJBQU9HLEtBQUssQ0FBQ0YsY0FBRCxDQUFMLENBQ0pGLElBREksQ0FDQyxVQUFDSyxRQUFELEVBQWM7QUFDbEIsZ0JBQUksQ0FBQ0EsUUFBUSxDQUFDQyxFQUFkLEVBQWtCO0FBQ2hCLGtCQUFNQyxLQUFLLGdEQUEwQ0YsUUFBUSxDQUFDRyxNQUFuRCxDQUFYO0FBQ0EscUJBQU9DLE9BQU8sQ0FBQ0MsTUFBUixDQUFlSCxLQUFmLENBQVA7QUFDRDs7QUFDRCxtQkFBT0YsUUFBUSxDQUFDTSxJQUFULEVBQVA7QUFDRCxXQVBJLENBQVA7QUFRRCxTQWIyQixDQWU1Qjs7O0FBQ0EsWUFBSUMsS0FBSyxHQUFHWCxFQUFFLENBQUNZLFdBQUgsQ0FBZSxhQUFmLEVBQThCQyxXQUE5QixDQUEwQyxhQUExQyxDQUFaO0FBQ0EsZUFBT0YsS0FBSyxDQUFDRyxNQUFOLEdBQWVmLElBQWYsQ0FBb0IsVUFBQ2dCLGNBQUQsRUFBb0I7QUFDN0MsY0FBTUMsYUFBYSxHQUFHYixLQUFLLENBQUNGLGNBQUQsQ0FBTCxDQUNuQkYsSUFEbUIsQ0FDZCxVQUFDSyxRQUFELEVBQWM7QUFDbEIsZ0JBQUksQ0FBQ0EsUUFBUSxDQUFDQyxFQUFkLEVBQWtCO0FBQ2hCLGtCQUFNQyxL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KTtcblxuLyoqXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cbiAqL1xuY2xhc3MgREJIZWxwZXIge1xuICAvKipcbiAgICogRGF0YWJhc2UgVVJMLlxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcbiAgICBjb25zdCBwb3J0ID0gMTMzNzsgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgcmVzdGF1cmFudHMuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cygpIHtcbiAgICByZXR1cm4gZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCByZXN0YXVyYW50c1VSTCA9IGAke0RCSGVscGVyLkRBVEFCQVNFX1VSTH0vcmVzdGF1cmFudHNgO1xuXG4gICAgICBpZiAoIWRiKSB7XG4gICAgICAgIC8vIG1ha2UgcmVndWxhciBmZXRjaCBjYWxsXG4gICAgICAgIHJldHVybiBmZXRjaChyZXN0YXVyYW50c1VSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gcmVzdGF1cmFudHMgZnJvbSBJREJcbiAgICAgIGxldCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgcmV0dXJuIHN0b3JlLmdldEFsbCgpLnRoZW4oKGlkYlJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXN0YXVyYW50c1VSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBJREIgcmVzdGF1cmFudHMgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlcyBmcm9tIElEQiB3aWxsIGJlIHJldHVybmVkXG4gICAgICAgICAgICByZXNwb25zZUpTT04udGhlbigoZmV0Y2hlZFJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgICAgICAgICBmZXRjaGVkUmVzdGF1cmFudHMuZm9yRWFjaCgocmVzdGF1cmFudCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmIChpZGJSZXN0YXVyYW50cyAmJiBpZGJSZXN0YXVyYW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIGlkYlJlc3RhdXJhbnRzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIElEQi5yZXN0YXVyYW50cyBpcyBlbXB0eSwgcmV0dXJuIHRoZSBmZXRjaCByZXNwb25zZSBpbnN0ZWFkXG4gICAgICAgIHJldHVybiBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmVzdGF1cmFudEJ5SWRVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzLyR7aWR9YDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmVzdGF1cmFudEJ5SWRVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIHJlc3RhdXJhbnQgZnJvbSBJREJcbiAgICAgIGxldCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgLy8gaWQgY29tZXMgYXMgYSBzdHJpbmcgZnJvbSB0aGUgdXJsLCBjb252ZXJ0IHRvIGEgbnVtYmVyIGJlZm9yZSBsb29rdXBcbiAgICAgIHJldHVybiBzdG9yZS5nZXQoTnVtYmVyLnBhcnNlSW50KGlkLCAxMCkpLnRoZW4oKGlkYlJlc3RhdXJhbnQpID0+IHtcbiAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGZldGNoKHJlc3RhdXJhbnRCeUlkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlSlNPTiA9IHJlc3BvbnNlLmNsb25lKCkuanNvbigpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIElEQiByZXN0YXVyYW50cyB3aXRoIGZldGNoIHJlc3BvbnNlIGV2ZW4gaWYgdmFsdWUgZnJvbSBJREIgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgICAgICAgcmVzcG9uc2VKU09OLnRoZW4oKGZldGNoZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgICAgICAgICBzdG9yZS5wdXQoZmV0Y2hlZFJlc3RhdXJhbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaWRiUmVzdGF1cmFudCB8fCBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSkudGhlbigocmVzdGF1cmFudCkgPT4geyBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTsgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHsgY2FsbGJhY2soZXJyb3IsIG51bGwpOyB9KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEZldGNoIHJldmlld3MgYnkgcmVzdGF1cmFudCBJRC5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZChyZXN0YXVyYW50SWQsIGNhbGxiYWNrKSB7XG4gICAgZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCByZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jldmlld3MvP3Jlc3RhdXJhbnRfaWQ9JHtyZXN0YXVyYW50SWR9YDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmV2aWV3c0J5UmVzdGF1cmFudElkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiByZXZpZXdzIGZyb20gSURCXG4gICAgICBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmV2aWV3cycpLm9iamVjdFN0b3JlKCdyZXZpZXdzJyk7XG4gICAgICBsZXQgcmV2aWV3c0J5UmVzdGF1cmFudElkSW5kZXggPSBzdG9yZS5pbmRleCgncmVzdGF1cmFudF9pZCcpO1xuICAgICAgLy8gaWQgY29tZXMgYXMgYSBzdHJpbmcgZnJvbSB0aGUgdXJsLCBjb252ZXJ0IHRvIGEgbnVtYmVyIGJlZm9yZSBsb29rdXBcbiAgICAgIHJldHVybiByZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleC5nZXRBbGwoTnVtYmVyLnBhcnNlSW50KHJlc3RhdXJhbnRJZCwgMTApKS50aGVuKChpZGJSZXZpZXdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VKU09OID0gcmVzcG9uc2UuY2xvbmUoKS5qc29uKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgSURCIHJldmlld3Mgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlcyBmcm9tIElEQiB3aWxsIGJlIHJldHVybmVkXG4gICAgICAgICAgICByZXNwb25zZUpTT04udGhlbigoZmV0Y2hlZFJldmlld3MpID0+IHtcbiAgICAgICAgICAgICAgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmV2aWV3cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmV2aWV3cycpO1xuICAgICAgICAgICAgICBmZXRjaGVkUmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICAgICAgICAgICAgICBzdG9yZS5wdXQocmV2aWV3KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmIChpZGJSZXZpZXdzICYmIGlkYlJldmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBpZGJSZXZpZXdzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIElEQi5yZXZpZXdzIGlzIGVtcHR5LCByZXR1cm4gdGhlIGZldGNoIHJlc3BvbnNlIGluc3RlYWRcbiAgICAgICAgcmV0dXJuIGZldGNoUmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9KS50aGVuKChyZXZpZXdzKSA9PiB7IGNhbGxiYWNrKG51bGwsIHJldmlld3MpOyB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4geyBjYWxsYmFjayhlcnJvciwgbnVsbCk7IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSB0eXBlIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXG4gICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxuICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzO1xuICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICB9XG4gICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoTmVpZ2hib3Job29kcyhjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gR2V0IGFsbCBuZWlnaGJvcmhvb2RzIGZyb20gYWxsIHJlc3RhdXJhbnRzXG4gICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpO1xuICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXG4gICAgICBjb25zdCB1bmlxdWVOZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcy5maWx0ZXIoKHYsIGkpID0+IG5laWdoYm9yaG9vZHMuaW5kZXhPZih2KSA9PSBpKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXG4gICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKTtcbiAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcbiAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXG4gICAqL1xuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XG4gICAgcmV0dXJuIChgLi9yZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxuICAgKi9cbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zLnNpemUgPT09ICdzbWFsbCcpIHtcbiAgICAgICAgcmV0dXJuIGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfc21hbGxfMXh9IDF4LCBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfc21hbGxfMnh9IDJ4YDtcbiAgICAgIH0gaWYgKG9wdGlvbnMuc2l6ZSA9PT0gJ21lZGl1bScpIHtcbiAgICAgICAgcmV0dXJuIGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbWVkaXVtXzF4fSAxeCwgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX21lZGl1bV8yeH0gMnhgO1xuICAgICAgfSBpZiAob3B0aW9ucy5zaXplID09PSAnbGFyZ2UnICYmIG9wdGlvbnMud2lkZSkge1xuICAgICAgICByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9sYXJnZV93aWRlfWA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9sYXJnZX1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXG4gICAqL1xuICBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBtYXApIHtcbiAgICAvLyBodHRwczovL2xlYWZsZXRqcy5jb20vcmVmZXJlbmNlLTEuMy4wLmh0bWwjbWFya2VyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IEwubWFya2VyKFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICAgIGFsdDogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXG4gICAgICB9KTtcbiAgICBtYXJrZXIuYWRkVG8obmV3TWFwKTtcbiAgICByZXR1cm4gbWFya2VyO1xuICB9XG59XG4iXSwiZmlsZSI6ImRiaGVscGVyLmpzIn0=

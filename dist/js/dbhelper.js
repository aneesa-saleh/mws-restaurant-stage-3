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
    key: "setRestaurantFavouriteStatus",
    value: function setRestaurantFavouriteStatus(restaurant_id, status, callback) {
      var setFavouriteStatusUrl = "".concat(DBHelper.DATABASE_URL, "/restaurants/").concat(restaurant_id, "/?is_favorite=").concat(status);
      fetch(setFavouriteStatusUrl, {
        method: 'PUT'
      }).then(function (response) {
        if (!response.ok) {
          return Promise.reject();
        }

        return response.json();
      }).then(function (updatedRestaurant) {
        dbPromise.then(function (db) {
          var store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
          store.put(updatedRestaurant);
        });
        callback(null, updatedRestaurant);
      }).catch(function (error) {
        callback(error, null);
      });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbImRiUHJvbWlzZSIsIm9wZW5EYXRhYmFzZSIsIkRCSGVscGVyIiwidGhlbiIsImRiIiwicmVzdGF1cmFudHNVUkwiLCJEQVRBQkFTRV9VUkwiLCJmZXRjaCIsInJlc3BvbnNlIiwib2siLCJlcnJvciIsInN0YXR1cyIsIlByb21pc2UiLCJyZWplY3QiLCJqc29uIiwic3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiZ2V0QWxsIiwiaWRiUmVzdGF1cmFudHMiLCJmZXRjaFJlc3BvbnNlIiwicmVzcG9uc2VKU09OIiwiY2xvbmUiLCJmZXRjaGVkUmVzdGF1cmFudHMiLCJmb3JFYWNoIiwicmVzdGF1cmFudCIsInB1dCIsImxlbmd0aCIsImlkIiwiY2FsbGJhY2siLCJyZXN0YXVyYW50QnlJZFVSTCIsImdldCIsIk51bWJlciIsInBhcnNlSW50IiwiaWRiUmVzdGF1cmFudCIsImZldGNoZWRSZXN0YXVyYW50IiwiY2F0Y2giLCJyZXN0YXVyYW50SWQiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleCIsImluZGV4IiwiaWRiUmV2aWV3cyIsImZldGNoZWRSZXZpZXdzIiwicmV2aWV3IiwicmV2aWV3cyIsImN1aXNpbmUiLCJmZXRjaFJlc3RhdXJhbnRzIiwicmVzdGF1cmFudHMiLCJyZXN1bHRzIiwiZmlsdGVyIiwiciIsImN1aXNpbmVfdHlwZSIsIm5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsIm9wdGlvbnMiLCJzaXplIiwicGhvdG9ncmFwaF9zbWFsbF8xeCIsInBob3RvZ3JhcGhfc21hbGxfMngiLCJwaG90b2dyYXBoX21lZGl1bV8xeCIsInBob3RvZ3JhcGhfbWVkaXVtXzJ4Iiwid2lkZSIsInBob3RvZ3JhcGhfbGFyZ2Vfd2lkZSIsInBob3RvZ3JhcGhfbGFyZ2UiLCJtYXJrZXIiLCJMIiwibGF0bG5nIiwibGF0IiwibG5nIiwidGl0bGUiLCJuYW1lIiwiYWx0IiwidXJsIiwidXJsRm9yUmVzdGF1cmFudCIsImFkZFRvIiwibmV3TWFwIiwicmVzdGF1cmFudF9pZCIsInNldEZhdm91cml0ZVN0YXR1c1VybCIsIm1ldGhvZCIsInVwZGF0ZWRSZXN0YXVyYW50IiwicG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFNQSxTQUFTLEdBQUdDLFlBQVksRUFBOUI7QUFFQTs7OztJQUdNQyxROzs7Ozs7Ozs7O0FBVUo7Ozt1Q0FHMEI7QUFDeEIsYUFBT0YsU0FBUyxDQUFDRyxJQUFWLENBQWUsVUFBQ0MsRUFBRCxFQUFRO0FBQzVCLFlBQU1DLGNBQWMsYUFBTUgsUUFBUSxDQUFDSSxZQUFmLGlCQUFwQjs7QUFFQSxZQUFJLENBQUNGLEVBQUwsRUFBUztBQUNQO0FBQ0EsaUJBQU9HLEtBQUssQ0FBQ0YsY0FBRCxDQUFMLENBQ0pGLElBREksQ0FDQyxVQUFDSyxRQUFELEVBQWM7QUFDbEIsZ0JBQUksQ0FBQ0EsUUFBUSxDQUFDQyxFQUFkLEVBQWtCO0FBQ2hCLGtCQUFNQyxLQUFLLGdEQUEwQ0YsUUFBUSxDQUFDRyxNQUFuRCxDQUFYO0FBQ0EscUJBQU9DLE9BQU8sQ0FBQ0MsTUFBUixDQUFlSCxLQUFmLENBQVA7QUFDRDs7QUFDRCxtQkFBT0YsUUFBUSxDQUFDTSxJQUFULEVBQVA7QUFDRCxXQVBJLENBQVA7QUFRRCxTQWIyQixDQWU1Qjs7O0FBQ0EsWUFBSUMsS0FBSyxHQUFHWCxFQUFFLENBQUNZLFdBQUgsQ0FBZSxhQUFmLEVBQThCQyxXQUE5QixDQUEwQyxhQUExQyxDQUFaO0FBQ0EsZUFBT0YsS0FBSyxDQUFDRyxNQUFOLEdBQWVmLElBQWYsQ0FBb0IsVUFBQ2dCLGNBQUQsRUFBb0I7QUFDN0MsY0FBTUMsYUFBYSxHQUFHYixLQUFLLENBQUNGLGNBQUQsQ0FBTCxDQUNuQkYsSUFEbUIsQ0FDZCxV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USxDQUFDSSxZQUFmLDBCQUEyQzRFLGFBQTNDLDJCQUF5RXZFLE1BQXpFLENBQTNCO0FBQ0FKLE1BQUFBLEtBQUssQ0FBQzRFLHFCQUFELEVBQXdCO0FBQUVDLFFBQUFBLE1BQU0sRUFBRTtBQUFWLE9BQXhCLENBQUwsQ0FBZ0RqRixJQUFoRCxDQUFxRCxVQUFDSyxRQUFELEVBQWM7QUFDakUsWUFBRyxDQUFDQSxRQUFRLENBQUNDLEVBQWIsRUFBaUI7QUFDZixpQkFBT0csT0FBTyxDQUFDQyxNQUFSLEVBQVA7QUFDRDs7QUFDRCxlQUFPTCxRQUFRLENBQUNNLElBQVQsRUFBUDtBQUNELE9BTEQsRUFLR1gsSUFMSCxDQUtRLFVBQUNrRixpQkFBRCxFQUF1QjtBQUM3QnJGLFFBQUFBLFNBQVMsQ0FBQ0csSUFBVixDQUFlLFVBQUNDLEVBQUQsRUFBUTtBQUNyQixjQUFNVyxLQUFLLEdBQUdYLEVBQUUsQ0FBQ1ksV0FBSCxDQUFlLGFBQWYsRUFBOEIsV0FBOUIsRUFBMkNDLFdBQTNDLENBQXVELGFBQXZELENBQWQ7QUFDQUYsVUFBQUEsS0FBSyxDQUFDVyxHQUFOLENBQVUyRCxpQkFBVjtBQUNELFNBSEQ7QUFJQXhELFFBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU93RCxpQkFBUCxDQUFSO0FBQ0QsT0FYRCxFQVdHakQsS0FYSCxDQVdTLFVBQUMxQixLQUFELEVBQVc7QUFDbEJtQixRQUFBQSxRQUFRLENBQUNuQixLQUFELEVBQVEsSUFBUixDQUFSO0FBQ0QsT0FiRDtBQWNEOzs7O0FBM1JEOzs7O3dCQUkwQjtBQUN4QixVQUFNNEUsSUFBSSxHQUFHLElBQWIsQ0FEd0IsQ0FDTDs7QUFDbkIsd0NBQTJCQSxJQUEzQjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZGJQcm9taXNlID0gb3BlbkRhdGFiYXNlKCk7XG5cbi8qKlxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXG4gKi9cbmNsYXNzIERCSGVscGVyIHtcbiAgLyoqXG4gICAqIERhdGFiYXNlIFVSTC5cbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRBQkFTRV9VUkwoKSB7XG4gICAgY29uc3QgcG9ydCA9IDEzMzc7IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcbiAgICByZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fWA7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudHMoKSB7XG4gICAgcmV0dXJuIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmVzdGF1cmFudHNVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzYDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmVzdGF1cmFudHNVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIHJlc3RhdXJhbnRzIGZyb20gSURCXG4gICAgICBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKS50aGVuKChpZGJSZXN0YXVyYW50cykgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaFJlc3BvbnNlID0gZmV0Y2gocmVzdGF1cmFudHNVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VKU09OID0gcmVzcG9uc2UuY2xvbmUoKS5qc29uKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgSURCIHJlc3RhdXJhbnRzIHdpdGggZmV0Y2ggcmVzcG9uc2UgZXZlbiBpZiB2YWx1ZXMgZnJvbSBJREIgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgICAgICAgcmVzcG9uc2VKU09OLnRoZW4oKGZldGNoZWRSZXN0YXVyYW50cykgPT4ge1xuICAgICAgICAgICAgICBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgICAgICAgICAgZmV0Y2hlZFJlc3RhdXJhbnRzLmZvckVhY2goKHJlc3RhdXJhbnQpID0+IHtcbiAgICAgICAgICAgICAgICBzdG9yZS5wdXQocmVzdGF1cmFudCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICBpZiAoaWRiUmVzdGF1cmFudHMgJiYgaWRiUmVzdGF1cmFudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBpZGJSZXN0YXVyYW50cztcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBJREIucmVzdGF1cmFudHMgaXMgZW1wdHksIHJldHVybiB0aGUgZmV0Y2ggcmVzcG9uc2UgaW5zdGVhZFxuICAgICAgICByZXR1cm4gZmV0Y2hSZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcbiAgICBkYlByb21pc2UudGhlbigoZGIpID0+IHtcbiAgICAgIGNvbnN0IHJlc3RhdXJhbnRCeUlkVVJMID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXN0YXVyYW50cy8ke2lkfWA7XG5cbiAgICAgIGlmICghZGIpIHtcbiAgICAgICAgLy8gbWFrZSByZWd1bGFyIGZldGNoIGNhbGxcbiAgICAgICAgcmV0dXJuIGZldGNoKHJlc3RhdXJhbnRCeUlkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiByZXN0YXVyYW50IGZyb20gSURCXG4gICAgICBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgIC8vIGlkIGNvbWVzIGFzIGEgc3RyaW5nIGZyb20gdGhlIHVybCwgY29udmVydCB0byBhIG51bWJlciBiZWZvcmUgbG9va3VwXG4gICAgICByZXR1cm4gc3RvcmUuZ2V0KE51bWJlci5wYXJzZUludChpZCwgMTApKS50aGVuKChpZGJSZXN0YXVyYW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXN0YXVyYW50QnlJZFVSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBJREIgcmVzdGF1cmFudHMgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlIGZyb20gSURCIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgICAgICAgIHJlc3BvbnNlSlNPTi50aGVuKChmZXRjaGVkUmVzdGF1cmFudCkgPT4ge1xuICAgICAgICAgICAgICBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgICAgICAgICAgc3RvcmUucHV0KGZldGNoZWRSZXN0YXVyYW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGlkYlJlc3RhdXJhbnQgfHwgZmV0Y2hSZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKHJlc3RhdXJhbnQpID0+IHsgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7IH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7IGNhbGxiYWNrKGVycm9yLCBudWxsKTsgfSk7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXZpZXdzIGJ5IHJlc3RhdXJhbnQgSUQuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQocmVzdGF1cmFudElkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmV2aWV3c0J5UmVzdGF1cmFudElkVVJMID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXZpZXdzLz9yZXN0YXVyYW50X2lkPSR7cmVzdGF1cmFudElkfWA7XG5cbiAgICAgIGlmICghZGIpIHtcbiAgICAgICAgLy8gbWFrZSByZWd1bGFyIGZldGNoIGNhbGxcbiAgICAgICAgcmV0dXJuIGZldGNoKHJldmlld3NCeVJlc3RhdXJhbnRJZFVSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gcmV2aWV3cyBmcm9tIElEQlxuICAgICAgbGV0IHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jldmlld3MnKS5vYmplY3RTdG9yZSgncmV2aWV3cycpO1xuICAgICAgbGV0IHJldmlld3NCeVJlc3RhdXJhbnRJZEluZGV4ID0gc3RvcmUuaW5kZXgoJ3Jlc3RhdXJhbnRfaWQnKTtcbiAgICAgIC8vIGlkIGNvbWVzIGFzIGEgc3RyaW5nIGZyb20gdGhlIHVybCwgY29udmVydCB0byBhIG51bWJlciBiZWZvcmUgbG9va3VwXG4gICAgICByZXR1cm4gcmV2aWV3c0J5UmVzdGF1cmFudElkSW5kZXguZ2V0QWxsKE51bWJlci5wYXJzZUludChyZXN0YXVyYW50SWQsIDEwKSkudGhlbigoaWRiUmV2aWV3cykgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaFJlc3BvbnNlID0gZmV0Y2gocmV2aWV3c0J5UmVzdGF1cmFudElkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlSlNPTiA9IHJlc3BvbnNlLmNsb25lKCkuanNvbigpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIElEQiByZXZpZXdzIHdpdGggZmV0Y2ggcmVzcG9uc2UgZXZlbiBpZiB2YWx1ZXMgZnJvbSBJREIgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgICAgICAgcmVzcG9uc2VKU09OLnRoZW4oKGZldGNoZWRSZXZpZXdzKSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jldmlld3MnLCAncmVhZHdyaXRlJykub2JqZWN0U3RvcmUoJ3Jldmlld3MnKTtcbiAgICAgICAgICAgICAgZmV0Y2hlZFJldmlld3MuZm9yRWFjaCgocmV2aWV3KSA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcmUucHV0KHJldmlldyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICBpZiAoaWRiUmV2aWV3cyAmJiBpZGJSZXZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gaWRiUmV2aWV3cztcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBJREIucmV2aWV3cyBpcyBlbXB0eSwgcmV0dXJuIHRoZSBmZXRjaCByZXNwb25zZSBpbnN0ZWFkXG4gICAgICAgIHJldHVybiBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSkudGhlbigocmV2aWV3cykgPT4geyBjYWxsYmFjayhudWxsLCByZXZpZXdzKTsgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHsgY2FsbGJhY2soZXJyb3IsIG51bGwpOyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIGN1aXNpbmUgdHlwZVxuICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50cztcbiAgICAgIGlmIChjdWlzaW5lICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBjdWlzaW5lXG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xuICAgICAgfVxuICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEdldCBhbGwgbmVpZ2hib3Job29kcyBmcm9tIGFsbCByZXN0YXVyYW50c1xuICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKTtcbiAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xuICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xuICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSk7XG4gICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXG4gICAgICBjb25zdCB1bmlxdWVDdWlzaW5lcyA9IGN1aXNpbmVzLmZpbHRlcigodiwgaSkgPT4gY3Vpc2luZXMuaW5kZXhPZih2KSA9PSBpKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZUN1aXNpbmVzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXVyYW50IHBhZ2UgVVJMLlxuICAgKi9cbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIHJldHVybiAoYC4vcmVzdGF1cmFudC5odG1sP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cbiAgICovXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucy5zaXplID09PSAnc21hbGwnKSB7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzF4fSAxeCwgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzJ4fSAyeGA7XG4gICAgICB9IGlmIChvcHRpb25zLnNpemUgPT09ICdtZWRpdW0nKSB7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX21lZGl1bV8xeH0gMXgsIGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9tZWRpdW1fMnh9IDJ4YDtcbiAgICAgIH0gaWYgKG9wdGlvbnMuc2l6ZSA9PT0gJ2xhcmdlJyAmJiBvcHRpb25zLndpZGUpIHtcbiAgICAgICAgcmV0dXJuIGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbGFyZ2Vfd2lkZX1gO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbGFyZ2V9YCk7XG4gIH1cblxuICAvKipcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxuICAgKi9cbiAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XG4gICAgLy8gaHR0cHM6Ly9sZWFmbGV0anMuY29tL3JlZmVyZW5jZS0xLjMuMC5odG1sI21hcmtlclxuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBMLm1hcmtlcihbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAge1xuICAgICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgICBhbHQ6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxuICAgICAgfSk7XG4gICAgbWFya2VyLmFkZFRvKG5ld01hcCk7XG4gICAgcmV0dXJuIG1hcmtlcjtcbiAgfVxuXG4gIHN0YXRpYyBzZXRSZXN0YXVyYW50RmF2b3VyaXRlU3RhdHVzKHJlc3RhdXJhbnRfaWQsIHN0YXR1cywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBzZXRGYXZvdXJpdGVTdGF0dXNVcmwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzLyR7cmVzdGF1cmFudF9pZH0vP2lzX2Zhdm9yaXRlPSR7c3RhdHVzfWA7XG4gICAgZmV0Y2goc2V0RmF2b3VyaXRlU3RhdHVzVXJsLCB7IG1ldGhvZDogJ1BVVCcgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmKCFyZXNwb25zZS5vaykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgfSkudGhlbigodXBkYXRlZFJlc3RhdXJhbnQpID0+IHtcbiAgICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgICBjb25zdCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgICAgc3RvcmUucHV0KHVwZGF0ZWRSZXN0YXVyYW50KTtcbiAgICAgIH0pO1xuICAgICAgY2FsbGJhY2sobnVsbCwgdXBkYXRlZFJlc3RhdXJhbnQpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG59XG4iXSwiZmlsZSI6ImRiaGVscGVyLmpzIn0=

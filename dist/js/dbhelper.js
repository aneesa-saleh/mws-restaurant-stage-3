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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbImRiUHJvbWlzZSIsIm9wZW5EYXRhYmFzZSIsIkRCSGVscGVyIiwidGhlbiIsImRiIiwicmVzdGF1cmFudHNVUkwiLCJEQVRBQkFTRV9VUkwiLCJmZXRjaCIsInJlc3BvbnNlIiwib2siLCJlcnJvciIsInN0YXR1cyIsIlByb21pc2UiLCJyZWplY3QiLCJqc29uIiwic3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiZ2V0QWxsIiwiaWRiUmVzdGF1cmFudHMiLCJmZXRjaFJlc3BvbnNlIiwicmVzcG9uc2VKU09OIiwiY2xvbmUiLCJmZXRjaGVkUmVzdGF1cmFudHMiLCJmb3JFYWNoIiwicmVzdGF1cmFudCIsInB1dCIsImxlbmd0aCIsImlkIiwiY2FsbGJhY2siLCJyZXN0YXVyYW50QnlJZFVSTCIsImdldCIsIk51bWJlciIsInBhcnNlSW50IiwiaWRiUmVzdGF1cmFudCIsImZldGNoZWRSZXN0YXVyYW50IiwiY2F0Y2giLCJjdWlzaW5lIiwiZmV0Y2hSZXN0YXVyYW50cyIsInJlc3RhdXJhbnRzIiwicmVzdWx0cyIsImZpbHRlciIsInIiLCJjdWlzaW5lX3R5cGUiLCJuZWlnaGJvcmhvb2QiLCJuZWlnaGJvcmhvb2RzIiwibWFwIiwidiIsImkiLCJ1bmlxdWVOZWlnaGJvcmhvb2RzIiwiaW5kZXhPZiIsImN1aXNpbmVzIiwidW5pcXVlQ3Vpc2luZXMiLCJvcHRpb25zIiwic2l6ZSIsInBob3RvZ3JhcGhfc21hbGxfMXgiLCJwaG90b2dyYXBoX3NtYWxsXzJ4IiwicGhvdG9ncmFwaF9tZWRpdW1fMXgiLCJwaG90b2dyYXBoX21lZGl1bV8yeCIsIndpZGUiLCJwaG90b2dyYXBoX2xhcmdlX3dpZGUiLCJwaG90b2dyYXBoX2xhcmdlIiwibWFya2VyIiwiTCIsImxhdGxuZyIsImxhdCIsImxuZyIsInRpdGxlIiwibmFtZSIsImFsdCIsInVybCIsInVybEZvclJlc3RhdXJhbnQiLCJhZGRUbyIsIm5ld01h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QUFSLEtBQWlCLE9BQXJCLEVBQThCO0FBQzVCLCtCQUFjN0IsVUFBVSxDQUFDOEIsbUJBQXpCLHNCQUF3RDlCLFVBQVUsQ0FBQytCLG1CQUFuRTtBQUNEOztBQUFDLFlBQUlILE9BQU8sQ0FBQ0MsSUFBUixLQUFpQixRQUFyQixFQUErQjtBQUMvQiwrQkFBYzdCLFVBQVUsQ0FBQ2dDLG9CQUF6QixzQkFBeURoQyxVQUFVLENBQUNpQyxvQkFBcEU7QUFDRDs7QUFBQyxZQUFJTCxPQUFPLENBQUNDLElBQVIsS0FBaUIsT0FBakIsSUFBNEJELE9BQU8sQ0FBQ00sSUFBeEMsRUFBOEM7QUFDOUMsK0JBQWNsQyxVQUFVLENBQUNtQyxxQkFBekI7QUFDRDtBQUNGOztBQUNELDJCQUFlbkMsVUFBVSxDQUFDb0MsZ0JBQTFCO0FBQ0Q7QUFFRDs7Ozs7OzJDQUc4QnBDLFUsRUFBWXFCLEcsRUFBSztBQUM3QztBQUNBLFVBQU1nQixNQUFNLEdBQUcsSUFBSUMsQ0FBQyxDQUFDRCxNQUFOLENBQWEsQ0FBQ3JDLFVBQVUsQ0FBQ3VDLE1BQVgsQ0FBa0JDLEdBQW5CLEVBQXdCeEMsVUFBVSxDQUFDdUMsTUFBWCxDQUFrQkUsR0FBMUMsQ0FBYixFQUNiO0FBQ0VDLFFBQUFBLEtBQUssRUFBRTFDLFVBQVUsQ0FBQzJDLElBRHBCO0FBRUVDLFFBQUFBLEdBQUcsRUFBRTVDLFVBQVUsQ0FBQzJDLElBRmxCO0FBR0VFLFFBQUFBLEdBQUcsRUFBRXBFLFFBQVEsQ0FBQ3FFLGdCQUFULENBQTBCOUMsVUFBMUI7QUFIUCxPQURhLENBQWY7QUFNQXFDLE1BQUFBLE1BQU0sQ0FBQ1UsS0FBUCxDQUFhQyxNQUFiO0FBQ0EsYUFBT1gsTUFBUDtBQUNEOzs7O0FBck5EOzs7O3dCQUkwQjtBQUN4QixVQUFNWSxJQUFJLEdBQUcsSUFBYixDQUR3QixDQUNMOztBQUNuQix3Q0FBMkJBLElBQTNCO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBkYlByb21pc2UgPSBvcGVuRGF0YWJhc2UoKTtcblxuLyoqXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cbiAqL1xuY2xhc3MgREJIZWxwZXIge1xuICAvKipcbiAgICogRGF0YWJhc2UgVVJMLlxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcbiAgICBjb25zdCBwb3J0ID0gMTMzNzsgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgcmVzdGF1cmFudHMuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cygpIHtcbiAgICByZXR1cm4gZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCByZXN0YXVyYW50c1VSTCA9IGAke0RCSGVscGVyLkRBVEFCQVNFX1VSTH0vcmVzdGF1cmFudHNgO1xuXG4gICAgICBpZiAoIWRiKSB7XG4gICAgICAgIC8vIG1ha2UgcmVndWxhciBmZXRjaCBjYWxsXG4gICAgICAgIHJldHVybiBmZXRjaChyZXN0YXVyYW50c1VSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gcmVzdGF1cmFudHMgZnJvbSBJREJcbiAgICAgIGxldCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgcmV0dXJuIHN0b3JlLmdldEFsbCgpLnRoZW4oKGlkYlJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXN0YXVyYW50c1VSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBJREIgcmVzdGF1cmFudHMgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlcyBmcm9tIElEQiB3aWxsIGJlIHJldHVybmVkXG4gICAgICAgICAgICByZXNwb25zZUpTT04udGhlbigoZmV0Y2hlZFJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgICAgICAgICBmZXRjaGVkUmVzdGF1cmFudHMuZm9yRWFjaCgocmVzdGF1cmFudCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmIChpZGJSZXN0YXVyYW50cyAmJiBpZGJSZXN0YXVyYW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIGlkYlJlc3RhdXJhbnRzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmVzdGF1cmFudEJ5SWRVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzLyR7aWR9YDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmVzdGF1cmFudEJ5SWRVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIHJlc3RhdXJhbnQgZnJvbSBJREJcbiAgICAgIGxldCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgLy8gaWQgY29tZXMgYXMgYSBzdHJpbmcgZnJvbSB0aGUgdXJsLCBjb252ZXJ0IHRvIGEgbnVtYmVyIGJlZm9yZSBsb29rdXBcbiAgICAgIHJldHVybiBzdG9yZS5nZXQoTnVtYmVyLnBhcnNlSW50KGlkLCAxMCkpLnRoZW4oKGlkYlJlc3RhdXJhbnQpID0+IHtcbiAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGZldGNoKHJlc3RhdXJhbnRCeUlkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlSlNPTiA9IHJlc3BvbnNlLmNsb25lKCkuanNvbigpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIElEQiByZXN0YXVyYW50cyB3aXRoIGZldGNoIHJlc3BvbnNlIGV2ZW4gaWYgdmFsdWUgZnJvbSBJREIgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgICAgICAgcmVzcG9uc2VKU09OLnRoZW4oKGZldGNoZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgICAgICAgICBzdG9yZS5wdXQoZmV0Y2hlZFJlc3RhdXJhbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaWRiUmVzdGF1cmFudCB8fCBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSkudGhlbigocmVzdGF1cmFudCkgPT4geyBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTsgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHsgY2FsbGJhY2soZXJyb3IsIG51bGwpOyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIGN1aXNpbmUgdHlwZVxuICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50cztcbiAgICAgIGlmIChjdWlzaW5lICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBjdWlzaW5lXG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xuICAgICAgfVxuICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEdldCBhbGwgbmVpZ2hib3Job29kcyBmcm9tIGFsbCByZXN0YXVyYW50c1xuICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKTtcbiAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xuICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xuICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSk7XG4gICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXG4gICAgICBjb25zdCB1bmlxdWVDdWlzaW5lcyA9IGN1aXNpbmVzLmZpbHRlcigodiwgaSkgPT4gY3Vpc2luZXMuaW5kZXhPZih2KSA9PSBpKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZUN1aXNpbmVzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXVyYW50IHBhZ2UgVVJMLlxuICAgKi9cbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIHJldHVybiAoYC4vcmVzdGF1cmFudC5odG1sP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cbiAgICovXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucy5zaXplID09PSAnc21hbGwnKSB7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzF4fSAxeCwgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzJ4fSAyeGA7XG4gICAgICB9IGlmIChvcHRpb25zLnNpemUgPT09ICdtZWRpdW0nKSB7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX21lZGl1bV8xeH0gMXgsIGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9tZWRpdW1fMnh9IDJ4YDtcbiAgICAgIH0gaWYgKG9wdGlvbnMuc2l6ZSA9PT0gJ2xhcmdlJyAmJiBvcHRpb25zLndpZGUpIHtcbiAgICAgICAgcmV0dXJuIGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbGFyZ2Vfd2lkZX1gO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbGFyZ2V9YCk7XG4gIH1cblxuICAvKipcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxuICAgKi9cbiAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XG4gICAgLy8gaHR0cHM6Ly9sZWFmbGV0anMuY29tL3JlZmVyZW5jZS0xLjMuMC5odG1sI21hcmtlclxuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBMLm1hcmtlcihbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAge1xuICAgICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgICBhbHQ6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxuICAgICAgfSk7XG4gICAgbWFya2VyLmFkZFRvKG5ld01hcCk7XG4gICAgcmV0dXJuIG1hcmtlcjtcbiAgfVxufVxuIl0sImZpbGUiOiJkYmhlbHBlci5qcyJ9

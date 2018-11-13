"use strict";

var registerServiceWorker = function registerServiceWorker() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.register('/service-worker.js').catch(function (error) {
    return console.log(error);
  });
};

var cleanMapboxTilesCache = function cleanMapboxTilesCache() {
  caches.open('restaurant-reviews-map-tiles').then(function (cache) {
    return cache.keys().then(function (requests) {
      var length = requests.length;
      if (length <= 12) return; // keep only the 12 most recent tiles

      requests.slice(0, length - 12).forEach(function (request) {
        cache.delete(request);
      });
    });
  });
};
/* eslint-disable default-case */

/* eslint-disable no-fallthrough */


var openDatabase = function openDatabase(requestFromServiceWorker) {
  if (!navigator.serviceWorker && !requestFromServiceWorker) return Promise.resolve();
  return idb.open('restaurant-reviews', 4, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        {
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        }

      case 1:
        {
          var reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('restaurant_id', 'restaurant_id');
        }

      case 2:
        {
          upgradeDb.createObjectStore('outbox', {
            keyPath: 'request_id'
          });
        }

      case 3:
        {
          var outboxStore = upgradeDb.transaction.objectStore('outbox');
          outboxStore.createIndex('restaurant_id', 'restaurant_id');
        }
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN3aGVscGVyLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyU2VydmljZVdvcmtlciIsIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsImNhdGNoIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwiY2xlYW5NYXBib3hUaWxlc0NhY2hlIiwiY2FjaGVzIiwib3BlbiIsInRoZW4iLCJjYWNoZSIsImtleXMiLCJyZXF1ZXN0cyIsImxlbmd0aCIsInNsaWNlIiwiZm9yRWFjaCIsInJlcXVlc3QiLCJkZWxldGUiLCJvcGVuRGF0YWJhc2UiLCJyZXF1ZXN0RnJvbVNlcnZpY2VXb3JrZXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsImlkYiIsInVwZ3JhZGVEYiIsIm9sZFZlcnNpb24iLCJjcmVhdGVPYmplY3RTdG9yZSIsImtleVBhdGgiLCJyZXZpZXdzU3RvcmUiLCJjcmVhdGVJbmRleCIsIm91dGJveFN0b3JlIiwidHJhbnNhY3Rpb24iLCJvYmplY3RTdG9yZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNQSxxQkFBcUIsR0FBRyxTQUF4QkEscUJBQXdCLEdBQU07QUFDbEMsTUFBSSxDQUFDQyxTQUFTLENBQUNDLGFBQWYsRUFBOEI7QUFFOUJELEVBQUFBLFNBQVMsQ0FBQ0MsYUFBVixDQUF3QkMsUUFBeEIsQ0FBaUMsb0JBQWpDLEVBQ0dDLEtBREgsQ0FDUyxVQUFBQyxLQUFLO0FBQUEsV0FBSUMsT0FBTyxDQUFDQyxHQUFSLENBQVlGLEtBQVosQ0FBSjtBQUFBLEdBRGQ7QUFFRCxDQUxEOztBQU9BLElBQU1HLHFCQUFxQixHQUFHLFNBQXhCQSxxQkFBd0IsR0FBTTtBQUNsQ0MsRUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVksOEJBQVosRUFBNENDLElBQTVDLENBQ0UsVUFBQUMsS0FBSztBQUFBLFdBQUlBLEtBQUssQ0FBQ0MsSUFBTixHQUFhRixJQUFiLENBQWtCLFVBQUNHLFFBQUQsRUFBYztBQUFBLFVBQy9CQyxNQUQrQixHQUNwQkQsUUFEb0IsQ0FDL0JDLE1BRCtCO0FBRXZDLFVBQUlBLE1BQU0sSUFBSSxFQUFkLEVBQWtCLE9BRnFCLENBSXZDOztBQUNBRCxNQUFBQSxRQUFRLENBQUNFLEtBQVQsQ0FBZSxDQUFmLEVBQWtCRCxNQUFNLEdBQUcsRUFBM0IsRUFBK0JFLE9BQS9CLENBQXVDLFVBQUNDLE9BQUQsRUFBYTtBQUNsRE4sUUFBQUEsS0FBSyxDQUFDTyxNQUFOLENBQWFELE9BQWI7QUFDRCxPQUZEO0FBR0QsS0FSUSxDQUFKO0FBQUEsR0FEUDtBQVdELENBWkQ7QUFjQTs7QUFDQTs7O0FBRUEsSUFBTUUsWUFBWSxHQUFHLFNBQWZBLFlBQWUsQ0FBQ0Msd0JBQUQsRUFBOEI7QUFDakQsTUFBSSxDQUFDcEIsU0FBUyxDQUFDQyxhQUFYLElBQTRCLENBQUNtQix3QkFBakMsRUFBMkQsT0FBT0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFFM0QsU0FBT0MsR0FBRyxDQUFDZCxJQUFKLENBQVMsb0JBQVQsRUFBK0IsQ0FBL0IsRUFBa0MsVUFBQ2UsU0FBRCxFQUFlO0FBQ3RELFlBQVFBLFNBQVMsQ0FBQ0MsVUFBbEI7QUFDRSxXQUFLLENBQUw7QUFBUTtBQUNORCxVQUFBQSxTQUFTLENBQUNFLGlCQUFWLENBQTRCLGFBQTVCLEVBQTJDO0FBQ3pDQyxZQUFBQSxPQUFPLEVBQUU7QUFEZ0MsV0FBM0M7QUFHRDs7QUFDRCxXQUFLLENBQUw7QUFBUTtBQUFFLGNBQU1DLFlBQVksR0FBR0osU0FBUyxDQUFDRSxpQkFBVixDQUE0QixTQUE1QixFQUF1QztBQUNwRUMsWUFBQUEsT0FBTyxFQUFFO0FBRDJELFdBQXZDLENBQXJCO0FBR1ZDLFVBQUFBLFlBQVksQ0FBQ0MsV0FBYixDQUF5QixlQUF6QixFQUEwQyxlQUExQztBQUNDOztBQUNELFdBQUssQ0FBTDtBQUFRO0FBQ05MLFVBQUFBLFNBQVMsQ0FBQ0UsaUJBQVYsQ0FBNEIsUUFBNUIsRUFBc0M7QUFDcENDLFlBQUFBLE9BQU8sRUFBRTtBQUQyQixXQUF0QztBQUdEOztBQUNELFdBQUssQ0FBTDtBQUFRO0FBQ04sY0FBTUcsV0FBVyxHQUFHTixTQUFTLENBQUNPLFdBQVYsQ0FBc0JDLFdBQXRCLENBQWtDLFFBQWxDLENBQXBCO0FBQ0FGLFVBQUFBLFdBQVcsQ0FBQ0QsV0FBWixDQUF3QixlQUF4QixFQUF5QyxlQUF6QztBQUNEO0FBbkJIO0FBcUJELEdBdEJNLENBQVA7QUF1QkQsQ0ExQkQiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCByZWdpc3RlclNlcnZpY2VXb3JrZXIgPSAoKSA9PiB7XG4gIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHJldHVybjtcblxuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignL3NlcnZpY2Utd29ya2VyLmpzJylcbiAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5sb2coZXJyb3IpKTtcbn07XG5cbmNvbnN0IGNsZWFuTWFwYm94VGlsZXNDYWNoZSA9ICgpID0+IHtcbiAgY2FjaGVzLm9wZW4oJ3Jlc3RhdXJhbnQtcmV2aWV3cy1tYXAtdGlsZXMnKS50aGVuKFxuICAgIGNhY2hlID0+IGNhY2hlLmtleXMoKS50aGVuKChyZXF1ZXN0cykgPT4ge1xuICAgICAgY29uc3QgeyBsZW5ndGggfSA9IHJlcXVlc3RzO1xuICAgICAgaWYgKGxlbmd0aCA8PSAxMikgcmV0dXJuO1xuXG4gICAgICAvLyBrZWVwIG9ubHkgdGhlIDEyIG1vc3QgcmVjZW50IHRpbGVzXG4gICAgICByZXF1ZXN0cy5zbGljZSgwLCBsZW5ndGggLSAxMikuZm9yRWFjaCgocmVxdWVzdCkgPT4ge1xuICAgICAgICBjYWNoZS5kZWxldGUocmVxdWVzdCk7XG4gICAgICB9KTtcbiAgICB9KSxcbiAgKTtcbn07XG5cbi8qIGVzbGludC1kaXNhYmxlIGRlZmF1bHQtY2FzZSAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tZmFsbHRocm91Z2ggKi9cblxuY29uc3Qgb3BlbkRhdGFiYXNlID0gKHJlcXVlc3RGcm9tU2VydmljZVdvcmtlcikgPT4ge1xuICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyICYmICFyZXF1ZXN0RnJvbVNlcnZpY2VXb3JrZXIpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICByZXR1cm4gaWRiLm9wZW4oJ3Jlc3RhdXJhbnQtcmV2aWV3cycsIDQsICh1cGdyYWRlRGIpID0+IHtcbiAgICBzd2l0Y2ggKHVwZ3JhZGVEYi5vbGRWZXJzaW9uKSB7XG4gICAgICBjYXNlIDA6IHtcbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycsIHtcbiAgICAgICAgICBrZXlQYXRoOiAnaWQnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgMTogeyBjb25zdCByZXZpZXdzU3RvcmUgPSB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jldmlld3MnLCB7XG4gICAgICAgIGtleVBhdGg6ICdpZCcsXG4gICAgICB9KTtcbiAgICAgIHJldmlld3NTdG9yZS5jcmVhdGVJbmRleCgncmVzdGF1cmFudF9pZCcsICdyZXN0YXVyYW50X2lkJyk7XG4gICAgICB9XG4gICAgICBjYXNlIDI6IHtcbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdvdXRib3gnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3JlcXVlc3RfaWQnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgMzoge1xuICAgICAgICBjb25zdCBvdXRib3hTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnb3V0Ym94Jyk7XG4gICAgICAgIG91dGJveFN0b3JlLmNyZWF0ZUluZGV4KCdyZXN0YXVyYW50X2lkJywgJ3Jlc3RhdXJhbnRfaWQnKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcbiJdLCJmaWxlIjoic3doZWxwZXIuanMifQ==

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
          if (options.singleValue === true) return "img/".concat(restaurant.photograph_small_2x);
          return "img/".concat(restaurant.photograph_small_1x, " 1x, img/").concat(restaurant.photograph_small_2x, " 2x");
        }

        if (options.size === 'medium') {
          if (options.singleValue === true) return "img/".concat(restaurant.photograph_medium_2x);
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
    value: function setRestaurantFavouriteStatus(restaurantId, status, callback) {
      var setFavouriteStatusUrl = "".concat(DBHelper.DATABASE_URL, "/restaurants/").concat(restaurantId, "/?is_favorite=").concat(status);
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
    key: "addReview",
    value: function addReview(restaurantId, name, rating, comments, callback) {
      var addReviewUrl = "".concat(DBHelper.DATABASE_URL, "/reviews");
      var body = JSON.stringify({
        restaurant_id: restaurantId,
        name: name,
        rating: rating,
        comments: comments
      });
      fetch(addReviewUrl, {
        method: 'POST',
        body: body
      }).then(function (response) {
        if (!response.ok) {
          var error = "Request failed. Returned status of ".concat(response.status);
          return Promise.reject(error);
        }

        return response.json();
      }).then(function (newReview) {
        callback(null, newReview);
      }).catch(function (error) {
        callback(error, null);
      });
    }
  }, {
    key: "getOutboxReviews",
    value: function getOutboxReviews(restaurantId, callback) {
      dbPromise.then(function (db) {
        if (!db) {
          var error = 'Error connecting to IndexedDB';
          callback(error, null);
          return;
        }

        var store = db.transaction('outbox').objectStore('outbox');
        var reviewsByRestaurantIdIndex = store.index('restaurant_id'); // id comes as a string from the url, convert to a number before lookup

        reviewsByRestaurantIdIndex.getAll(Number.parseInt(restaurantId, 10)).then(function (idbReviews) {
          callback(null, idbReviews);
        });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbImRiUHJvbWlzZSIsIm9wZW5EYXRhYmFzZSIsIkRCSGVscGVyIiwidGhlbiIsImRiIiwicmVzdGF1cmFudHNVUkwiLCJEQVRBQkFTRV9VUkwiLCJmZXRjaCIsInJlc3BvbnNlIiwib2siLCJlcnJvciIsInN0YXR1cyIsIlByb21pc2UiLCJyZWplY3QiLCJqc29uIiwic3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiZ2V0QWxsIiwiaWRiUmVzdGF1cmFudHMiLCJmZXRjaFJlc3BvbnNlIiwicmVzcG9uc2VKU09OIiwiY2xvbmUiLCJmZXRjaGVkUmVzdGF1cmFudHMiLCJmb3JFYWNoIiwicmVzdGF1cmFudCIsInB1dCIsImxlbmd0aCIsImlkIiwiY2FsbGJhY2siLCJyZXN0YXVyYW50QnlJZFVSTCIsImdldCIsIk51bWJlciIsInBhcnNlSW50IiwiaWRiUmVzdGF1cmFudCIsImZldGNoZWRSZXN0YXVyYW50IiwiY2F0Y2giLCJyZXN0YXVyYW50SWQiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleCIsImluZGV4IiwiaWRiUmV2aWV3cyIsImZldGNoZWRSZXZpZXdzIiwicmV2aWV3IiwicmV2aWV3cyIsImN1aXNpbmUiLCJmZXRjaFJlc3RhdXJhbnRzIiwicmVzdGF1cmFudHMiLCJyZXN1bHRzIiwiZmlsdGVyIiwiciIsImN1aXNpbmVfdHlwZSIsIm5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsIm9wdGlvbnMiLCJzaXplIiwic2luZ2xlVmFsdWUiLCJwaG90b2dyYXBoX3NtYWxsXzJ4IiwicGhvdG9ncmFwaF9zbWFsbF8xeCIsInBob3RvZ3JhcGhfbWVkaXVtXzJ4IiwicGhvdG9ncmFwaF9tZWRpdW1fMXgiLCJ3aWRlIiwicGhvdG9ncmFwaF9sYXJnZV93aWRlIiwicGhvdG9ncmFwaF9sYXJnZSIsIm1hcmtlciIsIkwiLCJsYXRsbmciLCJsYXQiLCJsbmciLCJ0aXRsZSIsIm5hbWUiLCJhbHQiLCJ1cmwiLCJ1cmxGb3JSZXN0YXVyYW50IiwiYWRkVG8iLCJuZXdNYXAiLCJzZXRGYXZvdXJpdGVTdGF0dXNVcmwiLCJtZXRob2QiLCJ1cGRhdGVkUmVzdGF1cmFudCIsInJhdGluZyIsImNvbW1lbnRzIiwiYWRkUmV2aWV3VXJsIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXN0YXVyYW50X2lkIiwibmV3UmV2aWV3IiwicG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFNQSxTQUFTLEdBQUdDLFlBQVksRUFBOUI7QUFFQTs7OztJQUdNQyxROzs7Ozs7Ozs7O0FBVUo7Ozt1Q0FHMEI7QUFDeEIsYUFBT0YsU0FBUyxDQUFDRyxJQUFWLENBQWUsVUFBQ0MsRUFBRCxFQUFRO0FBQzVCLFlBQU1DLGNBQWMsYUFBTUgsUUFBUSxDQUFDSSxZQUFmLGlCQUFwQjs7QUFFQSxZQUFJLENBQUNGLEVBQUwsRUFBUztBQUNQO0FBQ0EsaUJBQU9HLEtBQUssQ0FBQ0YsY0FBRCxDQUFMLENBQ0pGLElBREksQ0FDQyxVQUFDSyxRQUFELEVBQWM7QUFDbEIsZ0JBQUksQ0FBQ0EsUUFBUSxDQUFDQyxFQUFkLEVBQWtCO0FBQ2hCLGtCQUFNQyxLQUFLLGdEQUEwQ0YsUUFBUSxDQUFDRyxNQUFuRCxDQUFYO0FBQ0EscUJBQU9DLE9BQU8sQ0FBQ0MsTUFBUixDQUFlSCxLQUFmLENBQVA7QUFDRDs7QUFDRCxtQkFBT0YsUUFBUSxDQUFDTSxJQUFULEVBQVA7QUFDRCxXQVBJLENBQVA7QUFRRCxTQWIyQixDQWU1Qjs7O0FBQ0EsWUFBSUMsS0FBSyxHQUFHWCxFQUFFLENBQUNZLFdBQUgsQ0FBZSxhQUFmLEVBQThCQyxXQUE5QixDQUEwQyxhQUExQyxDQUFaO0FBQ0EsZUFBT0YsS0FBSyxDQUFDRyxNQUFOLEdBQWVmLElBQWYs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Q0FtQixVQUFBQSxRQUFRLENBQUNuQixLQUFELEVBQVEsSUFBUixDQUFSO0FBQ0E7QUFDRDs7QUFDRCxZQUFNSyxLQUFLLEdBQUdYLEVBQUUsQ0FBQ1ksV0FBSCxDQUFlLFFBQWYsRUFBeUJDLFdBQXpCLENBQXFDLFFBQXJDLENBQWQ7QUFDQSxZQUFNc0IsMEJBQTBCLEdBQUd4QixLQUFLLENBQUN5QixLQUFOLENBQVksZUFBWixDQUFuQyxDQVBxQixDQVFyQjs7QUFDQUQsUUFBQUEsMEJBQTBCLENBQUNyQixNQUEzQixDQUFrQ2MsTUFBTSxDQUFDQyxRQUFQLENBQWdCSSxZQUFoQixFQUE4QixFQUE5QixDQUFsQyxFQUFxRWxDLElBQXJFLENBQTBFLFVBQUNzQyxVQUFELEVBQWdCO0FBQ3hGWixVQUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPWSxVQUFQLENBQVI7QUFDRCxTQUZEO0FBR0QsT0FaRDtBQWFEOzs7O0FBbFVEOzs7O3dCQUkwQjtBQUN4QixVQUFNcUQsSUFBSSxHQUFHLElBQWIsQ0FEd0IsQ0FDTDs7QUFDbkIsd0NBQTJCQSxJQUEzQjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZGJQcm9taXNlID0gb3BlbkRhdGFiYXNlKCk7XG5cbi8qKlxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXG4gKi9cbmNsYXNzIERCSGVscGVyIHtcbiAgLyoqXG4gICAqIERhdGFiYXNlIFVSTC5cbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRBQkFTRV9VUkwoKSB7XG4gICAgY29uc3QgcG9ydCA9IDEzMzc7IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcbiAgICByZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fWA7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudHMoKSB7XG4gICAgcmV0dXJuIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmVzdGF1cmFudHNVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzYDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmVzdGF1cmFudHNVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIHJlc3RhdXJhbnRzIGZyb20gSURCXG4gICAgICBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKS50aGVuKChpZGJSZXN0YXVyYW50cykgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaFJlc3BvbnNlID0gZmV0Y2gocmVzdGF1cmFudHNVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VKU09OID0gcmVzcG9uc2UuY2xvbmUoKS5qc29uKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgSURCIHJlc3RhdXJhbnRzIHdpdGggZmV0Y2ggcmVzcG9uc2UgZXZlbiBpZiB2YWx1ZXMgZnJvbSBJREIgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgICAgICAgcmVzcG9uc2VKU09OLnRoZW4oKGZldGNoZWRSZXN0YXVyYW50cykgPT4ge1xuICAgICAgICAgICAgICBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgICAgICAgICAgZmV0Y2hlZFJlc3RhdXJhbnRzLmZvckVhY2goKHJlc3RhdXJhbnQpID0+IHtcbiAgICAgICAgICAgICAgICBzdG9yZS5wdXQocmVzdGF1cmFudCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICBpZiAoaWRiUmVzdGF1cmFudHMgJiYgaWRiUmVzdGF1cmFudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBpZGJSZXN0YXVyYW50cztcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBJREIucmVzdGF1cmFudHMgaXMgZW1wdHksIHJldHVybiB0aGUgZmV0Y2ggcmVzcG9uc2UgaW5zdGVhZFxuICAgICAgICByZXR1cm4gZmV0Y2hSZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcbiAgICBkYlByb21pc2UudGhlbigoZGIpID0+IHtcbiAgICAgIGNvbnN0IHJlc3RhdXJhbnRCeUlkVVJMID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXN0YXVyYW50cy8ke2lkfWA7XG5cbiAgICAgIGlmICghZGIpIHtcbiAgICAgICAgLy8gbWFrZSByZWd1bGFyIGZldGNoIGNhbGxcbiAgICAgICAgcmV0dXJuIGZldGNoKHJlc3RhdXJhbnRCeUlkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiByZXN0YXVyYW50IGZyb20gSURCXG4gICAgICBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgIC8vIGlkIGNvbWVzIGFzIGEgc3RyaW5nIGZyb20gdGhlIHVybCwgY29udmVydCB0byBhIG51bWJlciBiZWZvcmUgbG9va3VwXG4gICAgICByZXR1cm4gc3RvcmUuZ2V0KE51bWJlci5wYXJzZUludChpZCwgMTApKS50aGVuKChpZGJSZXN0YXVyYW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXN0YXVyYW50QnlJZFVSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBJREIgcmVzdGF1cmFudHMgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlIGZyb20gSURCIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgICAgICAgIHJlc3BvbnNlSlNPTi50aGVuKChmZXRjaGVkUmVzdGF1cmFudCkgPT4ge1xuICAgICAgICAgICAgICBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgICAgICAgICAgc3RvcmUucHV0KGZldGNoZWRSZXN0YXVyYW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGlkYlJlc3RhdXJhbnQgfHwgZmV0Y2hSZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKHJlc3RhdXJhbnQpID0+IHsgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7IH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7IGNhbGxiYWNrKGVycm9yLCBudWxsKTsgfSk7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXZpZXdzIGJ5IHJlc3RhdXJhbnQgSUQuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQocmVzdGF1cmFudElkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmV2aWV3c0J5UmVzdGF1cmFudElkVVJMID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXZpZXdzLz9yZXN0YXVyYW50X2lkPSR7cmVzdGF1cmFudElkfWA7XG5cbiAgICAgIGlmICghZGIpIHtcbiAgICAgICAgLy8gbWFrZSByZWd1bGFyIGZldGNoIGNhbGxcbiAgICAgICAgcmV0dXJuIGZldGNoKHJldmlld3NCeVJlc3RhdXJhbnRJZFVSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gcmV2aWV3cyBmcm9tIElEQlxuICAgICAgbGV0IHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jldmlld3MnKS5vYmplY3RTdG9yZSgncmV2aWV3cycpO1xuICAgICAgY29uc3QgcmV2aWV3c0J5UmVzdGF1cmFudElkSW5kZXggPSBzdG9yZS5pbmRleCgncmVzdGF1cmFudF9pZCcpO1xuICAgICAgLy8gaWQgY29tZXMgYXMgYSBzdHJpbmcgZnJvbSB0aGUgdXJsLCBjb252ZXJ0IHRvIGEgbnVtYmVyIGJlZm9yZSBsb29rdXBcbiAgICAgIHJldHVybiByZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleC5nZXRBbGwoTnVtYmVyLnBhcnNlSW50KHJlc3RhdXJhbnRJZCwgMTApKS50aGVuKChpZGJSZXZpZXdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VKU09OID0gcmVzcG9uc2UuY2xvbmUoKS5qc29uKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgSURCIHJldmlld3Mgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlcyBmcm9tIElEQiB3aWxsIGJlIHJldHVybmVkXG4gICAgICAgICAgICByZXNwb25zZUpTT04udGhlbigoZmV0Y2hlZFJldmlld3MpID0+IHtcbiAgICAgICAgICAgICAgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmV2aWV3cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmV2aWV3cycpO1xuICAgICAgICAgICAgICBmZXRjaGVkUmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICAgICAgICAgICAgICBzdG9yZS5wdXQocmV2aWV3KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmIChpZGJSZXZpZXdzICYmIGlkYlJldmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBpZGJSZXZpZXdzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIElEQi5yZXZpZXdzIGlzIGVtcHR5LCByZXR1cm4gdGhlIGZldGNoIHJlc3BvbnNlIGluc3RlYWRcbiAgICAgICAgcmV0dXJuIGZldGNoUmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9KS50aGVuKChyZXZpZXdzKSA9PiB7IGNhbGxiYWNrKG51bGwsIHJldmlld3MpOyB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4geyBjYWxsYmFjayhlcnJvciwgbnVsbCk7IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSB0eXBlIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXG4gICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxuICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzO1xuICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICB9XG4gICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoTmVpZ2hib3Job29kcyhjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gR2V0IGFsbCBuZWlnaGJvcmhvb2RzIGZyb20gYWxsIHJlc3RhdXJhbnRzXG4gICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpO1xuICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXG4gICAgICBjb25zdCB1bmlxdWVOZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcy5maWx0ZXIoKHYsIGkpID0+IG5laWdoYm9yaG9vZHMuaW5kZXhPZih2KSA9PSBpKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXG4gICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKTtcbiAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcbiAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXG4gICAqL1xuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XG4gICAgcmV0dXJuIChgLi9yZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxuICAgKi9cbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zLnNpemUgPT09ICdzbWFsbCcpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuc2luZ2xlVmFsdWUgPT09IHRydWUpIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzJ4fWA7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzF4fSAxeCwgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX3NtYWxsXzJ4fSAyeGA7XG4gICAgICB9IGlmIChvcHRpb25zLnNpemUgPT09ICdtZWRpdW0nKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnNpbmdsZVZhbHVlID09PSB0cnVlKSByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9tZWRpdW1fMnh9YDtcbiAgICAgICAgcmV0dXJuIGBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbWVkaXVtXzF4fSAxeCwgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX21lZGl1bV8yeH0gMnhgO1xuICAgICAgfSBpZiAob3B0aW9ucy5zaXplID09PSAnbGFyZ2UnICYmIG9wdGlvbnMud2lkZSkge1xuICAgICAgICByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9sYXJnZV93aWRlfWA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9sYXJnZX1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXG4gICAqL1xuICBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBtYXApIHtcbiAgICAvLyBodHRwczovL2xlYWZsZXRqcy5jb20vcmVmZXJlbmNlLTEuMy4wLmh0bWwjbWFya2VyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IEwubWFya2VyKFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICAgIGFsdDogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXG4gICAgICB9KTtcbiAgICBtYXJrZXIuYWRkVG8obmV3TWFwKTtcbiAgICByZXR1cm4gbWFya2VyO1xuICB9XG5cbiAgc3RhdGljIHNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMocmVzdGF1cmFudElkLCBzdGF0dXMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgc2V0RmF2b3VyaXRlU3RhdHVzVXJsID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXN0YXVyYW50cy8ke3Jlc3RhdXJhbnRJZH0vP2lzX2Zhdm9yaXRlPSR7c3RhdHVzfWA7XG4gICAgZmV0Y2goc2V0RmF2b3VyaXRlU3RhdHVzVXJsLCB7IG1ldGhvZDogJ1BVVCcgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgIH0pLnRoZW4oKHVwZGF0ZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgICBkYlByb21pc2UudGhlbigoZGIpID0+IHtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnLCAncmVhZHdyaXRlJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG4gICAgICAgIHN0b3JlLnB1dCh1cGRhdGVkUmVzdGF1cmFudCk7XG4gICAgICB9KTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHVwZGF0ZWRSZXN0YXVyYW50KTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBhZGRSZXZpZXcocmVzdGF1cmFudElkLCBuYW1lLCByYXRpbmcsIGNvbW1lbnRzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGFkZFJldmlld1VybCA9IGAke0RCSGVscGVyLkRBVEFCQVNFX1VSTH0vcmV2aWV3c2A7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3RhdXJhbnRfaWQ6IHJlc3RhdXJhbnRJZCxcbiAgICAgIG5hbWUsXG4gICAgICByYXRpbmcsXG4gICAgICBjb21tZW50cyxcbiAgICB9KTtcbiAgICBmZXRjaChhZGRSZXZpZXdVcmwsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHkgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgIH0pLnRoZW4oKG5ld1JldmlldykgPT4ge1xuICAgICAgY2FsbGJhY2sobnVsbCwgbmV3UmV2aWV3KTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRPdXRib3hSZXZpZXdzKHJlc3RhdXJhbnRJZCwgY2FsbGJhY2spIHtcbiAgICBkYlByb21pc2UudGhlbigoZGIpID0+IHtcbiAgICAgIGlmICghZGIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSAnRXJyb3IgY29ubmVjdGluZyB0byBJbmRleGVkREInO1xuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ291dGJveCcpLm9iamVjdFN0b3JlKCdvdXRib3gnKTtcbiAgICAgIGNvbnN0IHJldmlld3NCeVJlc3RhdXJhbnRJZEluZGV4ID0gc3RvcmUuaW5kZXgoJ3Jlc3RhdXJhbnRfaWQnKTtcbiAgICAgIC8vIGlkIGNvbWVzIGFzIGEgc3RyaW5nIGZyb20gdGhlIHVybCwgY29udmVydCB0byBhIG51bWJlciBiZWZvcmUgbG9va3VwXG4gICAgICByZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleC5nZXRBbGwoTnVtYmVyLnBhcnNlSW50KHJlc3RhdXJhbnRJZCwgMTApKS50aGVuKChpZGJSZXZpZXdzKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGlkYlJldmlld3MpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJmaWxlIjoiZGJoZWxwZXIuanMifQ==

"use strict";

// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
function formatDate(date) {
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var day = date.getDate();
  var month = monthNames[date.getMonth()];
  var year = date.getFullYear();
  return "".concat(month, " ").concat(day, ", ").concat(year);
}

function stringToBoolean(string) {
  if (typeof string === 'boolean') return string;
  return string === 'true';
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1pc2NoZWxwZXJzLmpzIl0sIm5hbWVzIjpbImZvcm1hdERhdGUiLCJkYXRlIiwibW9udGhOYW1lcyIsImRheSIsImdldERhdGUiLCJtb250aCIsImdldE1vbnRoIiwieWVhciIsImdldEZ1bGxZZWFyIiwic3RyaW5nVG9Cb29sZWFuIiwic3RyaW5nIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0EsU0FBU0EsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEI7QUFDeEIsTUFBTUMsVUFBVSxHQUFHLENBQ2pCLFNBRGlCLEVBQ04sVUFETSxFQUNNLE9BRE4sRUFFakIsT0FGaUIsRUFFUixLQUZRLEVBRUQsTUFGQyxFQUVPLE1BRlAsRUFHakIsUUFIaUIsRUFHUCxXQUhPLEVBR00sU0FITixFQUlqQixVQUppQixFQUlMLFVBSkssQ0FBbkI7QUFPQSxNQUFNQyxHQUFHLEdBQUdGLElBQUksQ0FBQ0csT0FBTCxFQUFaO0FBQ0EsTUFBTUMsS0FBSyxHQUFHSCxVQUFVLENBQUNELElBQUksQ0FBQ0ssUUFBTCxFQUFELENBQXhCO0FBQ0EsTUFBTUMsSUFBSSxHQUFHTixJQUFJLENBQUNPLFdBQUwsRUFBYjtBQUVBLG1CQUFVSCxLQUFWLGNBQW1CRixHQUFuQixlQUEyQkksSUFBM0I7QUFDRDs7QUFFRCxTQUFTRSxlQUFULENBQXlCQyxNQUF6QixFQUFpQztBQUMvQixNQUFJLE9BQU9BLE1BQVAsS0FBa0IsU0FBdEIsRUFBaUMsT0FBT0EsTUFBUDtBQUVqQyxTQUFPQSxNQUFNLEtBQUssTUFBbEI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NTI0NjEvaG93LXRvLWZvcm1hdC1hLWphdmFzY3JpcHQtZGF0ZVxuZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlKSB7XG4gIGNvbnN0IG1vbnRoTmFtZXMgPSBbXG4gICAgJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLFxuICAgICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JyxcbiAgICAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJyxcbiAgICAnTm92ZW1iZXInLCAnRGVjZW1iZXInLFxuICBdO1xuXG4gIGNvbnN0IGRheSA9IGRhdGUuZ2V0RGF0ZSgpO1xuICBjb25zdCBtb250aCA9IG1vbnRoTmFtZXNbZGF0ZS5nZXRNb250aCgpXTtcbiAgY29uc3QgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcblxuICByZXR1cm4gYCR7bW9udGh9ICR7ZGF5fSwgJHt5ZWFyfWA7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ1RvQm9vbGVhbihzdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgPT09ICdib29sZWFuJykgcmV0dXJuIHN0cmluZztcblxuICByZXR1cm4gc3RyaW5nID09PSAndHJ1ZSc7XG59XG4iXSwiZmlsZSI6Im1pc2NoZWxwZXJzLmpzIn0=

"use strict";

var toastTimer = null;
var pendingToasts = [];
var shouldRestartToastTimer = false;

function pauseToastTimer() {
  clearTimeout(toastTimer);
  toastTimer = null;
  shouldRestartToastTimer = true;
}

function restartToastTimer() {
  if (shouldRestartToastTimer) {
    shouldRestartToastTimer = false;
    setTimeout(hideToast, 2000);
  }
}

function enqueueToast(message, type) {
  // add the toast to the beginning of the array (queue)
  pendingToasts.unshift({
    message: message,
    type: type
  });

  if (toastTimer === null) {
    // no toast is currently showing
    showToast();
  }
}

function showDummyToast() {
  var str = "".concat(Math.random());
  enqueueToast(str);
}

function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;
  shouldRestartToastTimer = false;
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  toast.classList.remove('show');
  setTimeout(function () {
    toastText.setAttribute('aria-live', 'polite'); // show the next toast if there is any pending

    showToast();
  }, 0);
}

function showToast() {
  var toast = pendingToasts.pop();
  if (!toast || !toast.message) return;
  var message = toast.message,
      type = toast.type;
  var toastElement = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  var toastIcon = document.getElementById('toast-icon');
  toastText.setAttribute('aria-live', 'polite');
  toastText.innerHTML = message;

  if (type === 'error') {
    toastElement.className = 'toast show error';
    toastIcon.className = 'fas fa-exclamation-triangle';
  } else if (type === 'success') {
    toastElement.className = 'toast show success';
    toastIcon.className = 'fas fa-check';
  } else {
    toastElement.className = 'toast show';
    toastIcon.className = 'fas fa-info-circle';
  }

  clearTimeout(toastTimer);
  setTimeout(function () {
    toastText.setAttribute('aria-live', 'off');
  }, 0);
  toastTimer = setTimeout(hideToast, 10000);
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRvYXN0cy5qcyJdLCJuYW1lcyI6WyJ0b2FzdFRpbWVyIiwicGVuZGluZ1RvYXN0cyIsInNob3VsZFJlc3RhcnRUb2FzdFRpbWVyIiwicGF1c2VUb2FzdFRpbWVyIiwiY2xlYXJUaW1lb3V0IiwicmVzdGFydFRvYXN0VGltZXIiLCJzZXRUaW1lb3V0IiwiaGlkZVRvYXN0IiwiZW5xdWV1ZVRvYXN0IiwibWVzc2FnZSIsInR5cGUiLCJ1bnNoaWZ0Iiwic2hvd1RvYXN0Iiwic2hvd0R1bW15VG9hc3QiLCJzdHIiLCJNYXRoIiwicmFuZG9tIiwidG9hc3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwidG9hc3RUZXh0IiwiY2xhc3NMaXN0IiwicmVtb3ZlIiwic2V0QXR0cmlidXRlIiwicG9wIiwidG9hc3RFbGVtZW50IiwidG9hc3RJY29uIiwiaW5uZXJIVE1MIiwiY2xhc3NOYW1lIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLFVBQVUsR0FBRyxJQUFqQjtBQUNBLElBQU1DLGFBQWEsR0FBRyxFQUF0QjtBQUNBLElBQUlDLHVCQUF1QixHQUFHLEtBQTlCOztBQUVBLFNBQVNDLGVBQVQsR0FBMkI7QUFDekJDLEVBQUFBLFlBQVksQ0FBQ0osVUFBRCxDQUFaO0FBQ0FBLEVBQUFBLFVBQVUsR0FBRyxJQUFiO0FBQ0FFLEVBQUFBLHVCQUF1QixHQUFHLElBQTFCO0FBQ0Q7O0FBRUQsU0FBU0csaUJBQVQsR0FBNkI7QUFDM0IsTUFBSUgsdUJBQUosRUFBNkI7QUFDM0JBLElBQUFBLHVCQUF1QixHQUFHLEtBQTFCO0FBQ0FJLElBQUFBLFVBQVUsQ0FBQ0MsU0FBRCxFQUFZLElBQVosQ0FBVjtBQUNEO0FBQ0Y7O0FBRUQsU0FBU0MsWUFBVCxDQUFzQkMsT0FBdEIsRUFBK0JDLElBQS9CLEVBQXFDO0FBQ25DO0FBQ0FULEVBQUFBLGFBQWEsQ0FBQ1UsT0FBZCxDQUFzQjtBQUFFRixJQUFBQSxPQUFPLEVBQVBBLE9BQUY7QUFBV0MsSUFBQUEsSUFBSSxFQUFKQTtBQUFYLEdBQXRCOztBQUNBLE1BQUlWLFVBQVUsS0FBSyxJQUFuQixFQUF5QjtBQUFFO0FBQ3pCWSxJQUFBQSxTQUFTO0FBQ1Y7QUFDRjs7QUFFRCxTQUFTQyxjQUFULEdBQTBCO0FBQ3hCLE1BQU1DLEdBQUcsYUFBTUMsSUFBSSxDQUFDQyxNQUFMLEVBQU4sQ0FBVDtBQUNBUixFQUFBQSxZQUFZLENBQUNNLEdBQUQsQ0FBWjtBQUNEOztBQUVELFNBQVNQLFNBQVQsR0FBcUI7QUFDbkJILEVBQUFBLFlBQVksQ0FBQ0osVUFBRCxDQUFaO0FBQ0FBLEVBQUFBLFVBQVUsR0FBRyxJQUFiO0FBQ0FFLEVBQUFBLHVCQUF1QixHQUFHLEtBQTFCO0FBQ0EsTUFBTWUsS0FBSyxHQUFHQyxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsT0FBeEIsQ0FBZDtBQUNBLE1BQU1DLFNBQVMsR0FBR0YsUUFBUSxDQUFDQyxjQUFULENBQXdCLFlBQXhCLENBQWxCO0FBQ0FGLEVBQUFBLEtBQUssQ0FBQ0ksU0FBTixDQUFnQkMsTUFBaEIsQ0FBdUIsTUFBdkI7QUFDQWhCLEVBQUFBLFVBQVUsQ0FBQyxZQUFNO0FBQ2ZjLElBQUFBLFNBQVMsQ0FBQ0csWUFBVixDQUF1QixXQUF2QixFQUFvQyxRQUFwQyxFQURlLENBRWY7O0FBQ0FYLElBQUFBLFNBQVM7QUFDVixHQUpTLEVBSVAsQ0FKTyxDQUFWO0FBS0Q7O0FBRUQsU0FBU0EsU0FBVCxHQUFxQjtBQUNuQixNQUFNSyxLQUFLLEdBQUdoQixhQUFhLENBQUN1QixHQUFkLEVBQWQ7QUFDQSxNQUFJLENBQUNQLEtBQUQsSUFBVSxDQUFDQSxLQUFLLENBQUNSLE9BQXJCLEVBQThCO0FBRlgsTUFJWEEsT0FKVyxHQUlPUSxLQUpQLENBSVhSLE9BSlc7QUFBQSxNQUlGQyxJQUpFLEdBSU9PLEtBSlAsQ0FJRlAsSUFKRTtBQUtuQixNQUFNZSxZQUFZLEdBQUdQLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixPQUF4QixDQUFyQjtBQUNBLE1BQU1DLFNBQVMsR0FBR0YsUUFBUSxDQUFDQyxjQUFULENBQXdCLFlBQXhCLENBQWxCO0FBQ0EsTUFBTU8sU0FBUyxHQUFHUixRQUFRLENBQUNDLGNBQVQsQ0FBd0IsWUFBeEIsQ0FBbEI7QUFFQUMsRUFBQUEsU0FBUyxDQUFDRyxZQUFWLENBQXVCLFdBQXZCLEVBQW9DLFFBQXBDO0FBQ0FILEVBQUFBLFNBQVMsQ0FBQ08sU0FBVixHQUFzQmxCLE9BQXRCOztBQUVBLE1BQUlDLElBQUksS0FBSyxPQUFiLEVBQXNCO0FBQ3BCZSxJQUFBQSxZQUFZLENBQUNHLFNBQWIsR0FBeUIsa0JBQXpCO0FBQ0FGLElBQUFBLFNBQVMsQ0FBQ0UsU0FBVixHQUFzQiw2QkFBdEI7QUFDRCxHQUhELE1BR08sSUFBSWxCLElBQUksS0FBSyxTQUFiLEVBQXdCO0FBQzdCZSxJQUFBQSxZQUFZLENBQUNHLFNBQWIsR0FBeUIsb0JBQXpCO0FBQ0FGLElBQUFBLFNBQVMsQ0FBQ0UsU0FBVixHQUFzQixjQUF0QjtBQUNELEdBSE0sTUFHQTtBQUNMSCxJQUFBQSxZQUFZLENBQUNHLFNBQWIsR0FBeUIsWUFBekI7QUFDQUYsSUFBQUEsU0FBUyxDQUFDRSxTQUFWLEdBQXNCLG9CQUF0QjtBQUNEOztBQUVEeEIsRUFBQUEsWUFBWSxDQUFDSixVQUFELENBQVo7QUFDQU0sRUFBQUEsVUFBVSxDQUFDLFlBQU07QUFDZmMsSUFBQUEsU0FBUyxDQUFDRyxZQUFWLENBQXVCLFdBQXZCLEVBQW9DLEtBQXBDO0FBQ0QsR0FGUyxFQUVQLENBRk8sQ0FBVjtBQUdBdkIsRUFBQUEsVUFBVSxHQUFHTSxVQUFVLENBQUNDLFNBQUQsRUFBWSxLQUFaLENBQXZCO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgdG9hc3RUaW1lciA9IG51bGw7XG5jb25zdCBwZW5kaW5nVG9hc3RzID0gW107XG5sZXQgc2hvdWxkUmVzdGFydFRvYXN0VGltZXIgPSBmYWxzZTtcblxuZnVuY3Rpb24gcGF1c2VUb2FzdFRpbWVyKCkge1xuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBudWxsO1xuICBzaG91bGRSZXN0YXJ0VG9hc3RUaW1lciA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlc3RhcnRUb2FzdFRpbWVyKCkge1xuICBpZiAoc2hvdWxkUmVzdGFydFRvYXN0VGltZXIpIHtcbiAgICBzaG91bGRSZXN0YXJ0VG9hc3RUaW1lciA9IGZhbHNlO1xuICAgIHNldFRpbWVvdXQoaGlkZVRvYXN0LCAyMDAwKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbnF1ZXVlVG9hc3QobWVzc2FnZSwgdHlwZSkge1xuICAvLyBhZGQgdGhlIHRvYXN0IHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5IChxdWV1ZSlcbiAgcGVuZGluZ1RvYXN0cy51bnNoaWZ0KHsgbWVzc2FnZSwgdHlwZSB9KTtcbiAgaWYgKHRvYXN0VGltZXIgPT09IG51bGwpIHsgLy8gbm8gdG9hc3QgaXMgY3VycmVudGx5IHNob3dpbmdcbiAgICBzaG93VG9hc3QoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG93RHVtbXlUb2FzdCgpIHtcbiAgY29uc3Qgc3RyID0gYCR7TWF0aC5yYW5kb20oKX1gO1xuICBlbnF1ZXVlVG9hc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gaGlkZVRvYXN0KCkge1xuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBudWxsO1xuICBzaG91bGRSZXN0YXJ0VG9hc3RUaW1lciA9IGZhbHNlO1xuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xuICBjb25zdCB0b2FzdFRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtdGV4dCcpO1xuICB0b2FzdC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRvYXN0VGV4dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcbiAgICAvLyBzaG93IHRoZSBuZXh0IHRvYXN0IGlmIHRoZXJlIGlzIGFueSBwZW5kaW5nXG4gICAgc2hvd1RvYXN0KCk7XG4gIH0sIDApO1xufVxuXG5mdW5jdGlvbiBzaG93VG9hc3QoKSB7XG4gIGNvbnN0IHRvYXN0ID0gcGVuZGluZ1RvYXN0cy5wb3AoKTtcbiAgaWYgKCF0b2FzdCB8fCAhdG9hc3QubWVzc2FnZSkgcmV0dXJuO1xuXG4gIGNvbnN0IHsgbWVzc2FnZSwgdHlwZSB9ID0gdG9hc3Q7XG4gIGNvbnN0IHRvYXN0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xuICBjb25zdCB0b2FzdFRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtdGV4dCcpO1xuICBjb25zdCB0b2FzdEljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtaWNvbicpO1xuXG4gIHRvYXN0VGV4dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcbiAgdG9hc3RUZXh0LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICB0b2FzdEVsZW1lbnQuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cgZXJyb3InO1xuICAgIHRvYXN0SWNvbi5jbGFzc05hbWUgPSAnZmFzIGZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJztcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICB0b2FzdEVsZW1lbnQuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cgc3VjY2Vzcyc7XG4gICAgdG9hc3RJY29uLmNsYXNzTmFtZSA9ICdmYXMgZmEtY2hlY2snO1xuICB9IGVsc2Uge1xuICAgIHRvYXN0RWxlbWVudC5jbGFzc05hbWUgPSAndG9hc3Qgc2hvdyc7XG4gICAgdG9hc3RJY29uLmNsYXNzTmFtZSA9ICdmYXMgZmEtaW5mby1jaXJjbGUnO1xuICB9XG5cbiAgY2xlYXJUaW1lb3V0KHRvYXN0VGltZXIpO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0b2FzdFRleHQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAnb2ZmJyk7XG4gIH0sIDApO1xuICB0b2FzdFRpbWVyID0gc2V0VGltZW91dChoaWRlVG9hc3QsIDEwMDAwKTtcbn1cbiJdLCJmaWxlIjoidG9hc3RzLmpzIn0=

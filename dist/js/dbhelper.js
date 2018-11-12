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

      return "http://192.168.1.12:".concat(port);
    }
  }]);

  return DBHelper;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbImRiUHJvbWlzZSIsIm9wZW5EYXRhYmFzZSIsIkRCSGVscGVyIiwidGhlbiIsImRiIiwicmVzdGF1cmFudHNVUkwiLCJEQVRBQkFTRV9VUkwiLCJmZXRjaCIsInJlc3BvbnNlIiwib2siLCJlcnJvciIsInN0YXR1cyIsIlByb21pc2UiLCJyZWplY3QiLCJqc29uIiwic3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiZ2V0QWxsIiwiaWRiUmVzdGF1cmFudHMiLCJmZXRjaFJlc3BvbnNlIiwicmVzcG9uc2VKU09OIiwiY2xvbmUiLCJmZXRjaGVkUmVzdGF1cmFudHMiLCJmb3JFYWNoIiwicmVzdGF1cmFudCIsInB1dCIsImxlbmd0aCIsImlkIiwiY2FsbGJhY2siLCJyZXN0YXVyYW50QnlJZFVSTCIsImdldCIsIk51bWJlciIsInBhcnNlSW50IiwiaWRiUmVzdGF1cmFudCIsImZldGNoZWRSZXN0YXVyYW50IiwiY2F0Y2giLCJyZXN0YXVyYW50SWQiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwiLCJyZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleCIsImluZGV4IiwiaWRiUmV2aWV3cyIsImZldGNoZWRSZXZpZXdzIiwicmV2aWV3IiwicmV2aWV3cyIsImN1aXNpbmUiLCJmZXRjaFJlc3RhdXJhbnRzIiwicmVzdGF1cmFudHMiLCJyZXN1bHRzIiwiZmlsdGVyIiwiciIsImN1aXNpbmVfdHlwZSIsIm5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsIm9wdGlvbnMiLCJzaXplIiwicGhvdG9ncmFwaF9zbWFsbF8xeCIsInBob3RvZ3JhcGhfc21hbGxfMngiLCJwaG90b2dyYXBoX21lZGl1bV8xeCIsInBob3RvZ3JhcGhfbWVkaXVtXzJ4Iiwid2lkZSIsInBob3RvZ3JhcGhfbGFyZ2Vfd2lkZSIsInBob3RvZ3JhcGhfbGFyZ2UiLCJtYXJrZXIiLCJMIiwibGF0bG5nIiwibGF0IiwibG5nIiwidGl0bGUiLCJuYW1lIiwiYWx0IiwidXJsIiwidXJsRm9yUmVzdGF1cmFudCIsImFkZFRvIiwibmV3TWFwIiwic2V0RmF2b3VyaXRlU3RhdHVzVXJsIiwibWV0aG9kIiwidXBkYXRlZFJlc3RhdXJhbnQiLCJyYXRpbmciLCJjb21tZW50cyIsImFkZFJldmlld1VybCIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5IiwicmVzdGF1cmFudF9pZCIsIm5ld1JldmlldyIsInBvcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBUyxHQUFHQyxZQUFZLEVBQTlCO0FBRUE7Ozs7SUFHTUMsUTs7Ozs7Ozs7OztBQVVKOzs7dUNBRzBCO0FBQ3hCLGFBQU9GLFNBQVMsQ0FBQ0csSUFBVixDQUFlLFVBQUNDLEVBQUQsRUFBUTtBQUM1QixZQUFNQyxjQUFjLGFBQU1ILFFBQVEsQ0FBQ0ksWUFBZixpQkFBcEI7O0FBRUEsWUFBSSxDQUFDRixFQUFMLEVBQVM7QUFDUDtBQUNBLGlCQUFPRyxLQUFLLENBQUNGLGNBQUQsQ0FBTCxDQUNKRixJQURJLENBQ0MsVUFBQ0ssUUFBRCxFQUFjO0FBQ2xCLGdCQUFJLENBQUNBLFFBQVEsQ0FBQ0MsRUFBZCxFQUFrQjtBQUNoQixrQkFBTUMsS0FBSyxnREFBMENGLFFBQVEsQ0FBQ0csTUFBbkQsQ0FBWDtBQUNBLHFCQUFPQyxPQUFPLENBQUNDLE1BQVIsQ0FBZUgsS0FBZixDQUFQO0FBQ0Q7O0FBQ0QsbUJBQU9GLFFBQVEsQ0FBQ00sSUFBVCxFQUFQO0FBQ0QsV0FQSSxDQUFQO0FBUUQsU0FiMkIsQ0FlNUI7OztBQUNBLFlBQUlDLEtBQUssR0FBR1gsRUFBRSxDQUFDWSxXQUFILENBQWUsYUFBZixFQUE4QkMsV0FBOUIsQ0FBMEMsYUFBMUMsQ0FBWjtBQUNBLGVBQU9GLEtBQUssQ0FBQ0csTUFBTixHQUFlZixJQUFmLENBQW9CLFVBQUNnQixjQUFELEVBQW9CO0FBQzdDLGNBQU1DLGFBQWEsR0FBR2IsS0FBSyxDQUFDRixjQUFELENBQUwsQ0FDbkJGLElBRG1CLENBQ2QsVUFBQ0ssUUFBRCxFQUFjO0FBQ2xCLGdCQUFJLENBQUNBLFFBQVEsQ0FBQ0MsRUFBZCxFQUFrQjtBQUNoQixrQkFBTUMsS0FBSyxnREFBMENGLFFBQVEsQ0FBQ0csTUFBbkQsQ0FBWDtBQUNBLHFCQUFPQyxPQUFPLENBQUNDLE1BQVIsQ0FBZUgsS0FBZixDQUFQO0FBQ0Q7O0FBQ0QsZ0JBQU1XLFlBQVksR0FBR2IsUUFBUSxDQUFDYyxLQUFULEdBQWlCUixJQUFqQixFQUFyQixDQUxrQixDQU1sQjs7QUFDQU8sWUFBQUEsWUFBWSxDQUFDbEIsSUFBYixDQUFrQixVQUFDb0Isa0JBQUQsRUFBd0I7QUFDeENSLGNBQUFBLEtBQUssR0FBR1gsRUFBRSxDQUFDWSxXQUFILENBQWUsYUFBZixFQUE4QixXQUE5QixFQUEyQ0MsV0FBM0MsQ0FBdUQsYUFBdkQsQ0FBUjtBQUNBTSxjQUFBQSxrQkFBa0IsQ0FBQ0MsT0FBbkIsQ0FBMkIsVUFBQ0MsVUFBRCxFQUFnQjtBQUN6Q1YsZ0JBQUFBLEtBQUssQ0FBQ1csR0FBTixDQUFVRCxVQUFWO0FBQ0QsZUFGRDtBQUdELGFBTEQ7QUFNQSxtQkFBT2pCLFFBQVEsQ0FBQ00sSUFBVCxFQUFQO0FBQ0QsV0FmbUIsQ0FBdEI7O0FBZ0JBLGNBQUlLLGNBQWMsSUFBSUEsY0FBYyxDQUFDUSxNQUFmLEdBQXdCLENBQTlDLEVBQWlEO0FBQy9DLG1CQUFPUixjQUFQO0FBQ0QsV0FuQjRDLENBb0I3Qzs7O0FBQ0EsaUJBQU9DLGFBQVA7QUFDRCxTQXRCTSxDQUFQO0FBdUJELE9BeENNLENBQVA7QUF5Q0Q7QUFFRDs7Ozs7O3dDQUcyQlEsRSxFQUFJQyxRLEVBQVU7QUFDdkM3QixNQUFBQSxTQUFTLENBQUNHLElBQVYsQ0FBZSxVQUFDQyxFQUFELEVBQVE7QUFDckIsWUFBTTBCLGlCQUFpQixhQUFNNUIsUUFBUSxDQUFDSSxZQUFmLDBCQUEyQ3NCLEVBQTNDLENBQXZCOztBQUVBLFlBQUksQ0FBQ3hCLEVBQUwsRUFBUztBQUNQO0FBQ0EsaUJBQU9HLEtBQUssQ0FBQ3VCLGlCQUFELENBQUwsQ0FDSjNCLElBREksQ0FDQyxVQUFDSyxRQUFELEVBQWM7QUFDbEIsZ0JBQUksQ0FBQ0EsUUFBUSxDQUFDQyxFQUFkLEVBQWtCO0FBQ2hCLGtCQUFNQyxLQUFLLGdEQUEwQ0YsUUFBUSxDQUFDRyxNQUFuRCxDQUFYO0FBQ0EscUJBQU9DLE9BQU8sQ0FBQ0MsTUFBUixDQUFlSCxLQUFmLENBQVA7QUFDRDs7QUFDRCxtQkFBT0YsUUFBUSxDQUFDTSxJQUFULEVBQVA7QUFDRCxXQVBJLENBQVA7QUFRRCxTQWJvQixDQWVyQjs7O0FBQ0EsWUFBSUMsS0FBSyxHQUFHWCxFQUFFLENBQUNZLFdBQUgsQ0FBZSxhQUFmLEVBQThCQyxXQUE5QixDQUEwQyxhQUExQyxDQUFaLENBaEJxQixDQWlCckI7O0FBQ0EsZUFBT0YsS0FBSyxDQUFDZ0IsR0FBTixDQUFVQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JMLEVBQWhCLEVBQW9CLEVBQXBCLENBQVYsRUFBbUN6QixJQUFuQyxDQUF3QyxVQUFDK0IsYUFBRCxFQUFtQjtBQUNoRSxjQUFNZCxhQUFhLEdBQUdiLEtBQUssQ0FBQ3VCLGlCQUFELENBQUwsQ0FDbkIzQixJQURtQixDQUNkLFVBQUNLLFFBQUQsRUFBYztBQUNsQixnQkFBSSxDQUFDQSxRQUFRLENBQUNDLEVBQWQsRUFBa0I7QUFDaEIsa0JBQU1DLEtBQUssZ0RBQTBDRixRQUFRLENBQUNHLE1BQW5ELENBQVg7QUFDQSxxQkFBT0MsT0FBTyxDQUFDQyxNQUFSLENBQWVILEtBQWYsQ0FBUDtBQUNEOztBQUNELGdCQUFNVyxZQUFZLEdBQUdiLFFBQVEsQ0FBQ2MsS0FBVCxHQUFpQlIsSUFBakIsRUFBckIsQ0FMa0IsQ0FNbEI7O0FBQ0FPLFlBQUFBLFlBQVksQ0FBQ2xCLElBQWIsQ0FBa0IsVUFBQ2dDLGlCQUFELEVBQXVCO0FBQ3ZDcEIsY0FBQUEsS0FBSyxHQUFHWCxFQUFFLENBQUNZLFdBQUgsQ0FBZSxhQUFmLEVBQThCLFdBQTlCLEVBQTJDQyxXQUEzQyxDQUF1RCxhQUF2RCxDQUFSO0FBQ0FGLGNBQUFBLEtBQUssQ0FBQ1csR0FBTixDQUFVUyxpQkFBVjtBQUNELGFBSEQ7QUFJQSxtQkFBTzNCLFFBQVEsQ0FBQ00sSUFBVCxFQUFQO0FBQ0QsV0FibUIsQ0FBdEI7QUFjQSxpQkFBT29CLGFBQWEsSUFBSWQsYUFBeEI7QUFDRCxTQWhCTSxDQUFQO0FBaUJELE9BbkNELEVBbUNHakIsSUFuQ0gsQ0FtQ1EsVUFBQ3NCLFVBQUQsRUFBZ0I7QUFBRUksUUFBQUEsUUFBUSxDQUFDLElBQUQsRUFBT0osVUFBUCxDQUFSO0FBQTZCLE9BbkN2RCxFQW9DR1csS0FwQ0gsQ0FvQ1MsVUFBQzFCLEtBQUQsRUFBVztBQUFFbUIsUUFBQUEsUUFBUSxDQUFDbkIsS0FBRCxFQUFRLElBQVIsQ0FBUjtBQUF3QixPQXBDOUM7QUFxQ0Q7QUFHRDs7Ozs7OytDQUdrQzJCLFksRUFBY1IsUSxFQUFVO0FBQ3hEN0IsTUFBQUEsU0FBUyxDQUFDRyxJQUFWLENBQWUsVUFBQ0MsRUFBRCxFQUFRO0FBQ3JCLFlBQU1rQyx3QkFBd0IsYUFBTXBDLFFBQVEsQ0FBQ0ksWUFBZixxQ0FBc0QrQixZQUF0RCxDQUE5Qjs7QUFFQSxZQUFJLENBQUNqQyxFQUFMLEVBQVM7QUFDUDtBQUNBLGlCQUFPRyxLQUFLLENBQUMrQix3QkFBRCxDQUFMLENBQ0puQyxJQURJLENBQ0MsVUFBQ0ssUUFBRCxFQUFjO0FBQ2xCLGdCQUFJLENBQUNBLFFBQVEsQ0FBQ0MsRUFBZCxFQUFrQjtBQUNoQixrQkFBTUMsS0FBSyxnREFBMENGLFFBQVEsQ0FBQ0csTUFBbkQsQ0FBWDtBQUNBLHFCQUFPQyxPQUFPLENBQUNDLE1BQVIsQ0FBZUgsS0FBZixDQUFQO0FBQ0Q7O0FBQ0QsbUJBQU9GLFFBQVEsQ0FBQ00sSUFBVCxFQUFQO0FBQ0QsV0FQSSxDQUFQO0FBUUQsU0Fib0IsQ0FlckI7OztBQUNBLFlBQUlDLEtBQUssR0FBR1gsRUFBRSxDQUFDWSxXQUFILENBQWUsU0FBZixFQUEwQkMsV0FBMUIsQ0FBc0MsU0FBdEMsQ0FBWjtBQUNBLFlBQU1zQiwwQkFBMEIsR0FBR3hCLEtBQUssQ0FBQ3lCLEtBQU4sQ0FBWSxlQUFaLENBQW5DLENBakJxQixDQWtCckI7O0FBQ0EsZUFBT0QsMEJBQTBCLENBQUNyQixNQUEzQixDQUFrQ2MsTUFBTSxDQUFDQyxRQUFQLENBQWdCSSxZQUFoQixFQUE4QixFQUE5QixDQUFsQyxFQUFxRWxDLElBQXJFLENBQTBFLFVBQUNzQyxVQUFELEVBQWdCO0FBQy9GLGNBQU1yQixhQUFhLEdBQUdiLEtBQUssQ0FBQytCLHdCQUFELENBQUwsQ0FDbkJuQyxJQURtQixDQUNkLFVBQUNLLFFBQUQsRUFBYztBQUNsQixnQkFBSSxDQUFDQSxRQUFRLENBQUNDLEVBQWQsRUFBa0I7QUFDaEIsa0JBQU1DLEtBQUssZ0RBQTBDRixRQUFRLENBQUNHLE1BQW5ELENBQVg7QUFDQSxxQkFBT0MsT0FBTyxDQUFDQyxNQUFSLENBQWVILEtBQWYsQ0FBUDtBQUNEOztBQUNELGdCQUFNVyxZQUFZLEdBQUdiLFFBQVEsQ0FBQ2MsS0FBVCxHQUFpQlIsSUFBakIsRUFBckIsQ0FMa0IsQ0FNbEI7O0FBQ0FPLFlBQUFBLFlBQVksQ0FBQ2xCLElBQWIsQ0FBa0IsVUFBQ3VDLGNBQUQsRUFBb0I7QUFDcEMzQixjQUFBQSxLQUFLLEdBQUdYLEVBQUUsQ0FBQ1ksV0FBSCxDQUFlLFNBQWYsRUFBMEIsV0FBMUIsRUFBdUNDLFdBQXZDLENBQW1ELFNBQW5ELENBQVI7QUFDQXlCLGNBQUFBLGNBQWMsQ0FBQ2xCLE9BQWYsQ0FBdUIsVUFBQ21CLE1BQUQsRUFBWTtBQUNqQzVCLGdCQUFBQSxLQUFLLENBQUNXLEdBQU4sQ0FBVWlCLE1BQVY7QUFDRCxlQUZEO0FBR0QsYUFMRDtBQU1BLG1CQUFPbkMsUUFBUSxDQUFDTSxJQUFULEVBQVA7QUFDRCxXQWZtQixDQUF0Qjs7QUFnQkEsY0FBSTJCLFVBQVUsSUFBSUEsVUFBVSxDQUFDZCxNQUFYLEdBQW9CLENBQXRDLEVBQXlDO0FBQ3ZDLG1CQUFPYyxVQUFQO0FBQ0QsV0FuQjhGLENBb0IvRjs7O0FBQ0EsaUJBQU9yQixhQUFQO0FBQ0QsU0F0Qk0sQ0FBUDtBQXVCRCxPQTFDRCxFQTBDR2pCLElBMUNILENBMENRLFVBQUN5QyxPQUFELEVBQWE7QUFBRWYsUUFBQUEsUUFBUSxDQUFDLElBQUQsRUFBT2UsT0FBUCxDQUFSO0FBQTBCLE9BMUNqRCxFQTJDR1IsS0EzQ0gsQ0EyQ1MsVUFBQzFCLEtBQUQsRUFBVztBQUFFbUIsUUFBQUEsUUFBUSxDQUFDbkIsS0FBRCxFQUFRLElBQVIsQ0FBUjtBQUF3QixPQTNDOUM7QUE0Q0Q7QUFFRDs7Ozs7OzZDQUdnQ21DLE8sRUFBU2hCLFEsRUFBVTtBQUNqRDtBQUNBM0IsTUFBQUEsUUFBUSxDQUFDNEMsZ0JBQVQsR0FBNEIzQyxJQUE1QixDQUFpQyxVQUFDNEMsV0FBRCxFQUFpQjtBQUNoRDtBQUNBLFlBQU1DLE9BQU8sR0FBR0QsV0FBVyxDQUFDRSxNQUFaLENBQW1CLFVBQUFDLENBQUM7QUFBQSxpQkFBSUEsQ0FBQyxDQUFDQyxZQUFGLElBQWtCTixPQUF0QjtBQUFBLFNBQXBCLENBQWhCO0FBQ0FoQixRQUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPbUIsT0FBUCxDQUFSO0FBQ0QsT0FKRCxFQUlHWixLQUpILENBSVMsVUFBQzFCLEtBQUQsRUFBVztBQUNsQm1CLFFBQUFBLFFBQVEsQ0FBQ25CLEtBQUQsRUFBUSxJQUFSLENBQVI7QUFDRCxPQU5EO0FBT0Q7QUFFRDs7Ozs7O2tEQUdxQzBDLFksRUFBY3ZCLFEsRUFBVTtBQUMzRDtBQUNBM0IsTUFBQUEsUUFBUSxDQUFDNEMsZ0JBQVQsR0FBNEIzQyxJQUE1QixDQUFpQyxVQUFDNEMsV0FBRCxFQUFpQjtBQUNoRDtBQUNBLFlBQU1DLE9BQU8sR0FBR0QsV0FBVyxDQUFDRSxNQUFaLENBQW1CLFVBQUFDLENBQUM7QUFBQSxpQkFBSUEsQ0FBQyxDQUFDRSxZQUFGLElBQWtCQSxZQUF0QjtBQUFBLFNBQXBCLENBQWhCO0FBQ0F2QixRQUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPbUIsT0FBUCxDQUFSO0FBQ0QsT0FKRCxFQUlHWixLQUpILENBSVMsVUFBQzFCLEtBQUQsRUFBVztBQUNsQm1CLFFBQUFBLFFBQVEsQ0FBQ25CLEtBQUQsRUFBUSxJQUFSLENBQVI7QUFDRCxPQU5EO0FBT0Q7QUFFRDs7Ozs7OzREQUcrQ21DLE8sRUFBU08sWSxFQUFjdkIsUSxFQUFVO0FBQzlFO0FBQ0EzQixNQUFBQSxRQUFRLENBQUM0QyxnQkFBVCxHQUE0QjNDLElBQTVCLENBQWlDLFVBQUM0QyxXQUFELEVBQWlCO0FBQ2hELFlBQUlDLE9BQU8sR0FBR0QsV0FBZDs7QUFDQSxZQUFJRixPQUFPLElBQUksS0FBZixFQUFzQjtBQUFFO0FBQ3RCRyxVQUFBQSxPQUFPLEdBQUdBLE9BQU8sQ0FBQ0MsTUFBUixDQUFlLFVBQUFDLENBQUM7QUFBQSxtQkFBSUEsQ0FBQyxDQUFDQyxZQUFGLElBQWtCTixPQUF0QjtBQUFBLFdBQWhCLENBQVY7QUFDRDs7QUFDRCxZQUFJTyxZQUFZLElBQUksS0FBcEIsRUFBMkI7QUFBRTtBQUMzQkosVUFBQUEsT0FBTyxHQUFHQSxPQUFPLENBQUNDLE1BQVIsQ0FBZSxVQUFBQyxDQUFDO0FBQUEsbUJBQUlBLENBQUMsQ0FBQ0UsWUFBRixJQUFrQkEsWUFBdEI7QUFBQSxXQUFoQixDQUFWO0FBQ0Q7O0FBQ0R2QixRQUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPbUIsT0FBUCxDQUFSO0FBQ0QsT0FURCxFQVNHWixLQVRILENBU1MsVUFBQzFCLEtBQUQsRUFBVztBQUNsQm1CLFFBQUFBLFFBQVEsQ0FBQ25CLEtBQUQsRUFBUSxJQUFSLENBQVI7QUFDRCxPQVhEO0FBWUQ7QUFFRDs7Ozs7O3VDQUcwQm1CLFEsRUFBVTtBQUNsQztBQUNBM0IsTUFBQUEsUUFBUSxDQUFDNEMsZ0JBQVQsR0FBNEIzQyxJQUE1QixDQUFpQyxVQUFDNEMsV0FBRCxFQUFpQjtBQUNoRDtBQUNBLFlBQU1NLGFBQWEsR0FBR04sV0FBVyxDQUFDTyxHQUFaLENBQWdCLFVBQUNDLENBQUQsRUFBSUMsQ0FBSjtBQUFBLGlCQUFVVCxXQUFXLENBQUNTLENBQUQsQ0FBWCxDQUFlSixZQUF6QjtBQUFBLFNBQWhCLENBQXRCLENBRmdELENBR2hEOztBQUNBLFlBQU1LLG1CQUFtQixHQUFHSixhQUFhLENBQUNKLE1BQWQsQ0FBcUIsVUFBQ00sQ0FBRCxFQUFJQyxDQUFKO0FBQUEsaUJBQVVILGFBQWEsQ0FBQ0ssT0FBZCxDQUFzQkgsQ0FBdEIsS0FBNEJDLENBQXRDO0FBQUEsU0FBckIsQ0FBNUI7QUFDQTNCLFFBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU80QixtQkFBUCxDQUFSO0FBQ0QsT0FORCxFQU1HckIsS0FOSCxDQU1TLFVBQUMxQixLQUFELEVBQVc7QUFDbEJtQixRQUFBQSxRQUFRLENBQUNuQixLQUFELEVBQVEsSUFBUixDQUFSO0FBQ0QsT0FSRDtBQVNEO0FBRUQ7Ozs7OztrQ0FHcUJtQixRLEVBQVU7QUFDN0I7QUFDQTNCLE1BQUFBLFFBQVEsQ0FBQzRDLGdCQUFULEdBQTRCM0MsSUFBNUIsQ0FBaUMsVUFBQzRDLFdBQUQsRUFBaUI7QUFDaEQ7QUFDQSxZQUFNWSxRQUFRLEdBQUdaLFdBQVcsQ0FBQ08sR0FBWixDQUFnQixVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxpQkFBVVQsV0FBVyxDQUFDUyxDQUFELENBQVgsQ0FBZUwsWUFBekI7QUFBQSxTQUFoQixDQUFqQixDQUZnRCxDQUdoRDs7QUFDQSxZQUFNUyxjQUFjLEdBQUdELFFBQVEsQ0FBQ1YsTUFBVCxDQUFnQixVQUFDTSxDQUFELEVBQUlDLENBQUo7QUFBQSxpQkFBVUcsUUFBUSxDQUFDRCxPQUFULENBQWlCSCxDQUFqQixLQUF1QkMsQ0FBakM7QUFBQSxTQUFoQixDQUF2QjtBQUNBM0IsUUFBQUEsUUFBUSxDQUFDLElBQUQsRUFBTytCLGNBQVAsQ0FBUjtBQUNELE9BTkQsRUFNR3hCLEtBTkgsQ0FNUyxVQUFDMUIsS0FBRCxFQUFXO0FBQ2xCbUIsUUFBQUEsUUFBUSxDQUFDbkIsS0FBRCxFQUFRLElBQVIsQ0FBUjtBQUNELE9BUkQ7QUFTRDtBQUVEOzs7Ozs7cUNBR3dCZSxVLEVBQVk7QUFDbEMsNENBQWdDQSxVQUFVLENBQUNHLEVBQTNDO0FBQ0Q7QUFFRDs7Ozs7OzBDQUc2QkgsVSxFQUFZb0MsTyxFQUFTO0FBQ2hELFVBQUlBLE9BQUosRUFBYTtBQUNYLFlBQUlBLE9BQU8sQ0FBQ0MsSUFBUixLQUFpQixPQUFyQixFQUE4QjtBQUM1QiwrQkFBY3JDLFVBQVUsQ0FBQ3NDLG1CQUF6QixzQkFBd0R0QyxVQUFVLENBQUN1QyxtQkFBbkU7QUFDRDs7QUFBQyxZQUFJSCxPQUFPLENBQUNDLElBQVIsS0FBaUIsUUFBckIsRUFBK0I7QUFDL0IsK0JBQWNyQyxVQUFVLENBQUN3QyxvQkFBekIsc0JBQXlEeEMsVUFBVSxDQUFDeUMsb0JBQXBFO0FBQ0Q7O0FBQUMsWUFBSUwsT0FBTyxDQUFDQyxJQUFSLEtBQWlCLE9BQWpCLElBQTRCRCxPQUFPLENBQUNNLElBQXhDLEVBQThDO0FBQzlDLCtCQUFjMUMsVUFBVSxDQUFDMkMscUJBQXpCO0FBQ0Q7QUFDRjs7QUFDRCwyQkFBZTNDLFVBQVUsQ0FBQzRDLGdCQUExQjtBQUNEO0FBRUQ7Ozs7OzsyQ0FHOEI1QyxVLEVBQVk2QixHLEVBQUs7QUFDN0M7QUFDQSxVQUFNZ0IsTUFBTSxHQUFHLElBQUlDLENBQUMsQ0FBQ0QsTUFBTixDQUFhLENBQUM3QyxVQUFVLENBQUMrQyxNQUFYLENBQWtCQyxHQUFuQixFQUF3QmhELFVBQVUsQ0FBQytDLE1BQVgsQ0FBa0JFLEdBQTFDLENBQWIsRUFDYjtBQUNFQyxRQUFBQSxLQUFLLEVBQUVsRCxVQUFVLENBQUNtRCxJQURwQjtBQUVFQyxRQUFBQSxHQUFHLEVBQUVwRCxVQUFVLENBQUNtRCxJQUZsQjtBQUdFRSxRQUFBQSxHQUFHLEVBQUU1RSxRQUFRLENBQUM2RSxnQkFBVCxDQUEwQnRELFVBQTFCO0FBSFAsT0FEYSxDQUFmO0FBTUE2QyxNQUFBQSxNQUFNLENBQUNVLEtBQVAsQ0FBYUMsTUFBYjtBQUNBLGFBQU9YLE1BQVA7QUFDRDs7O2lEQUVtQ2pDLFksRUFBYzFCLE0sRUFBUWtCLFEsRUFBVTtBQUNsRSxVQUFNcUQscUJBQXFCLGFBQU1oRixRQUFRLENBQUNJLFlBQWYsMEJBQTJDK0IsWUFBM0MsMkJBQXdFMUIsTUFBeEUsQ0FBM0I7QUFDQUosTUFBQUEsS0FBSyxDQUFDMkUscUJBQUQsRUFBd0I7QUFBRUMsUUFBQUEsTUFBTSxFQUFFO0FBQVYsT0FBeEIsQ0FBTCxDQUFnRGhGLElBQWhELENBQXFELFVBQUNLLFFBQUQsRUFBYztBQUNqRSxZQUFJLENBQUNBLFFBQVEsQ0FBQ0MsRUFBZCxFQUFrQjtBQUNoQixpQkFBT0csT0FBTyxDQUFDQyxNQUFSLEVBQVA7QUFDRDs7QUFDRCxlQUFPTCxRQUFRLENBQUNNLElBQVQsRUFBUDtBQUNELE9BTEQsRUFLR1gsSUFMSCxDQUtRLFVBQUNpRixpQkFBRCxFQUF1QjtBQUM3QnBGLFFBQUFBLFNBQVMsQ0FBQ0csSUFBVixDQUFlLFVBQUNDLEVBQUQsRUFBUTtBQUNyQixjQUFNVyxLQUFLLEdBQUdYLEVBQUUsQ0FBQ1ksV0FBSCxDQUFlLGFBQWYsRUFBOEIsV0FBOUIsRUFBMkNDLFdBQTNDLENBQXVELGFBQXZELENBQWQ7QUFDQUYsVUFBQUEsS0FBSyxDQUFDVyxHQUFOLENBQVUwRCxpQkFBVjtBQUNELFNBSEQ7QUFJQXZELFFBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU91RCxpQkFBUCxDQUFSO0FBQ0QsT0FYRCxFQVdHaEQsS0FYSCxDQVdTLFVBQUMxQixLQUFELEVBQVc7QUFDbEJtQixRQUFBQSxRQUFRLENBQUNuQixLQUFELEVBQVEsSUFBUixDQUFSO0FBQ0QsT0FiRDtBQWNEOzs7OEJBRWdCMkIsWSxFQUFjdUMsSSxFQUFNUyxNLEVBQVFDLFEsRUFBVXpELFEsRUFBVTtBQUMvRCxVQUFNMEQsWUFBWSxhQUFNckYsUUFBUSxDQUFDSSxZQUFmLGFBQWxCO0FBQ0EsVUFBTWtGLElBQUksR0FBR0MsSUFBSSxDQUFDQyxTQUFMLENBQWU7QUFDMUJDLFFBQUFBLGFBQWEsRUFBRXRELFlBRFc7QUFFMUJ1QyxRQUFBQSxJQUFJLEVBQUpBLElBRjBCO0FBRzFCUyxRQUFBQSxNQUFNLEVBQU5BLE1BSDBCO0FBSTFCQyxRQUFBQSxRQUFRLEVBQVJBO0FBSjBCLE9BQWYsQ0FBYjtBQU1BL0UsTUFBQUEsS0FBSyxDQUFDZ0YsWUFBRCxFQUFlO0FBQUVKLFFBQUFBLE1BQU0sRUFBRSxNQUFWO0FBQWtCSyxRQUFBQSxJQUFJLEVBQUpBO0FBQWxCLE9BQWYsQ0FBTCxDQUE4Q3JGLElBQTlDLENBQW1ELFVBQUNLLFFBQUQsRUFBYztBQUMvRCxZQUFJLENBQUNBLFFBQVEsQ0FBQ0MsRUFBZCxFQUFrQjtBQUNoQixjQUFNQyxLQUFLLGdEQUEwQ0YsUUFBUSxDQUFDRyxNQUFuRCxDQUFYO0FBQ0EsaUJBQU9DLE9BQU8sQ0FBQ0MsTUFBUixDQUFlSCxLQUFmLENBQVA7QUFDRDs7QUFDRCxlQUFPRixRQUFRLENBQUNNLElBQVQsRUFBUDtBQUNELE9BTkQsRUFNR1gsSUFOSCxDQU1RLFVBQUN5RixTQUFELEVBQWU7QUFDckIvRCxRQUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPK0QsU0FBUCxDQUFSO0FBQ0QsT0FSRCxFQVFHeEQsS0FSSCxDQVFTLFVBQUMxQixLQUFELEVBQVc7QUFDbEJtQixRQUFBQSxRQUFRLENBQUNuQixLQUFELEVBQVEsSUFBUixDQUFSO0FBQ0QsT0FWRDtBQVdEOzs7cUNBRXVCMkIsWSxFQUFjUixRLEVBQVU7QUFDOUM3QixNQUFBQSxTQUFTLENBQUNHLElBQVYsQ0FBZSxVQUFDQyxFQUFELEVBQVE7QUFDckIsWUFBSSxDQUFDQSxFQUFMLEVBQVM7QUFDUCxjQUFNTSxLQUFLLEdBQUcsK0JBQWQ7QUFDQW1CLFVBQUFBLFFBQVEsQ0FBQ25CLEtBQUQsRUFBUSxJQUFSLENBQVI7QUFDQTtBQUNEOztBQUNELFlBQU1LLEtBQUssR0FBR1gsRUFBRSxDQUFDWSxXQUFILENBQWUsUUFBZixFQUF5QkMsV0FBekIsQ0FBcUMsUUFBckMsQ0FBZDtBQUNBLFlBQU1zQiwwQkFBMEIsR0FBR3hCLEtBQUssQ0FBQ3lCLEtBQU4sQ0FBWSxlQUFaLENBQW5DLENBUHFCLENBUXJCOztBQUNBRCxRQUFBQSwwQkFBMEIsQ0FBQ3JCLE1BQTNCLENBQWtDYyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JJLFlBQWhCLEVBQThCLEVBQTlCLENBQWxDLEVBQXFFbEMsSUFBckUsQ0FBMEUsVUFBQ3NDLFVBQUQsRUFBZ0I7QUFDeEZaLFVBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU9ZLFVBQVAsQ0FBUjtBQUNELFNBRkQ7QUFHRCxPQVpEO0FBYUQ7Ozs7QUFoVUQ7Ozs7d0JBSTBCO0FBQ3hCLFVBQU1vRCxJQUFJLEdBQUcsSUFBYixDQUR3QixDQUNMOztBQUNuQiwyQ0FBOEJBLElBQTlCO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBkYlByb21pc2UgPSBvcGVuRGF0YWJhc2UoKTtcblxuLyoqXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cbiAqL1xuY2xhc3MgREJIZWxwZXIge1xuICAvKipcbiAgICogRGF0YWJhc2UgVVJMLlxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcbiAgICBjb25zdCBwb3J0ID0gMTMzNzsgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxuICAgIHJldHVybiBgaHR0cDovLzE5Mi4xNjguMS4xMjoke3BvcnR9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgcmVzdGF1cmFudHMuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cygpIHtcbiAgICByZXR1cm4gZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCByZXN0YXVyYW50c1VSTCA9IGAke0RCSGVscGVyLkRBVEFCQVNFX1VSTH0vcmVzdGF1cmFudHNgO1xuXG4gICAgICBpZiAoIWRiKSB7XG4gICAgICAgIC8vIG1ha2UgcmVndWxhciBmZXRjaCBjYWxsXG4gICAgICAgIHJldHVybiBmZXRjaChyZXN0YXVyYW50c1VSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gcmVzdGF1cmFudHMgZnJvbSBJREJcbiAgICAgIGxldCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgcmV0dXJuIHN0b3JlLmdldEFsbCgpLnRoZW4oKGlkYlJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoUmVzcG9uc2UgPSBmZXRjaChyZXN0YXVyYW50c1VSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBJREIgcmVzdGF1cmFudHMgd2l0aCBmZXRjaCByZXNwb25zZSBldmVuIGlmIHZhbHVlcyBmcm9tIElEQiB3aWxsIGJlIHJldHVybmVkXG4gICAgICAgICAgICByZXNwb25zZUpTT04udGhlbigoZmV0Y2hlZFJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgICAgICAgICBmZXRjaGVkUmVzdGF1cmFudHMuZm9yRWFjaCgocmVzdGF1cmFudCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmIChpZGJSZXN0YXVyYW50cyAmJiBpZGJSZXN0YXVyYW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIGlkYlJlc3RhdXJhbnRzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIElEQi5yZXN0YXVyYW50cyBpcyBlbXB0eSwgcmV0dXJuIHRoZSBmZXRjaCByZXNwb25zZSBpbnN0ZWFkXG4gICAgICAgIHJldHVybiBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmVzdGF1cmFudEJ5SWRVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzLyR7aWR9YDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmVzdGF1cmFudEJ5SWRVUkwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIHJlc3RhdXJhbnQgZnJvbSBJREJcbiAgICAgIGxldCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgLy8gaWQgY29tZXMgYXMgYSBzdHJpbmcgZnJvbSB0aGUgdXJsLCBjb252ZXJ0IHRvIGEgbnVtYmVyIGJlZm9yZSBsb29rdXBcbiAgICAgIHJldHVybiBzdG9yZS5nZXQoTnVtYmVyLnBhcnNlSW50KGlkLCAxMCkpLnRoZW4oKGlkYlJlc3RhdXJhbnQpID0+IHtcbiAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGZldGNoKHJlc3RhdXJhbnRCeUlkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlSlNPTiA9IHJlc3BvbnNlLmNsb25lKCkuanNvbigpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIElEQiByZXN0YXVyYW50cyB3aXRoIGZldGNoIHJlc3BvbnNlIGV2ZW4gaWYgdmFsdWUgZnJvbSBJREIgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgICAgICAgcmVzcG9uc2VKU09OLnRoZW4oKGZldGNoZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuICAgICAgICAgICAgICBzdG9yZS5wdXQoZmV0Y2hlZFJlc3RhdXJhbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaWRiUmVzdGF1cmFudCB8fCBmZXRjaFJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSkudGhlbigocmVzdGF1cmFudCkgPT4geyBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTsgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHsgY2FsbGJhY2soZXJyb3IsIG51bGwpOyB9KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEZldGNoIHJldmlld3MgYnkgcmVzdGF1cmFudCBJRC5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZChyZXN0YXVyYW50SWQsIGNhbGxiYWNrKSB7XG4gICAgZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCByZXZpZXdzQnlSZXN0YXVyYW50SWRVUkwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jldmlld3MvP3Jlc3RhdXJhbnRfaWQ9JHtyZXN0YXVyYW50SWR9YDtcblxuICAgICAgaWYgKCFkYikge1xuICAgICAgICAvLyBtYWtlIHJlZ3VsYXIgZmV0Y2ggY2FsbFxuICAgICAgICByZXR1cm4gZmV0Y2gocmV2aWV3c0J5UmVzdGF1cmFudElkVVJMKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiByZXZpZXdzIGZyb20gSURCXG4gICAgICBsZXQgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmV2aWV3cycpLm9iamVjdFN0b3JlKCdyZXZpZXdzJyk7XG4gICAgICBjb25zdCByZXZpZXdzQnlSZXN0YXVyYW50SWRJbmRleCA9IHN0b3JlLmluZGV4KCdyZXN0YXVyYW50X2lkJyk7XG4gICAgICAvLyBpZCBjb21lcyBhcyBhIHN0cmluZyBmcm9tIHRoZSB1cmwsIGNvbnZlcnQgdG8gYSBudW1iZXIgYmVmb3JlIGxvb2t1cFxuICAgICAgcmV0dXJuIHJldmlld3NCeVJlc3RhdXJhbnRJZEluZGV4LmdldEFsbChOdW1iZXIucGFyc2VJbnQocmVzdGF1cmFudElkLCAxMCkpLnRoZW4oKGlkYlJldmlld3MpID0+IHtcbiAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGZldGNoKHJldmlld3NCeVJlc3RhdXJhbnRJZFVSTClcbiAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpTT04gPSByZXNwb25zZS5jbG9uZSgpLmpzb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBJREIgcmV2aWV3cyB3aXRoIGZldGNoIHJlc3BvbnNlIGV2ZW4gaWYgdmFsdWVzIGZyb20gSURCIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgICAgICAgIHJlc3BvbnNlSlNPTi50aGVuKChmZXRjaGVkUmV2aWV3cykgPT4ge1xuICAgICAgICAgICAgICBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXZpZXdzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXZpZXdzJyk7XG4gICAgICAgICAgICAgIGZldGNoZWRSZXZpZXdzLmZvckVhY2goKHJldmlldykgPT4ge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1dChyZXZpZXcpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlkYlJldmlld3MgJiYgaWRiUmV2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIGlkYlJldmlld3M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgSURCLnJldmlld3MgaXMgZW1wdHksIHJldHVybiB0aGUgZmV0Y2ggcmVzcG9uc2UgaW5zdGVhZFxuICAgICAgICByZXR1cm4gZmV0Y2hSZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKHJldmlld3MpID0+IHsgY2FsbGJhY2sobnVsbCwgcmV2aWV3cyk7IH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7IGNhbGxiYWNrKGVycm9yLCBudWxsKTsgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzICB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZ1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gbmVpZ2hib3Job29kXG4gICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSBhbmQgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHM7XG4gICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IG5laWdoYm9yaG9vZFxuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZCk7XG4gICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIG5laWdoYm9yaG9vZHNcbiAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlTmVpZ2hib3Job29kcyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoQ3Vpc2luZXMoY2FsbGJhY2spIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbigocmVzdGF1cmFudHMpID0+IHtcbiAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgIGNvbnN0IGN1aXNpbmVzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5jdWlzaW5lX3R5cGUpO1xuICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xuICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cbiAgICovXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXG4gICAqL1xuICBzdGF0aWMgaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMuc2l6ZSA9PT0gJ3NtYWxsJykge1xuICAgICAgICByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9zbWFsbF8xeH0gMXgsIGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9zbWFsbF8yeH0gMnhgO1xuICAgICAgfSBpZiAob3B0aW9ucy5zaXplID09PSAnbWVkaXVtJykge1xuICAgICAgICByZXR1cm4gYGltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaF9tZWRpdW1fMXh9IDF4LCBpbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGhfbWVkaXVtXzJ4fSAyeGA7XG4gICAgICB9IGlmIChvcHRpb25zLnNpemUgPT09ICdsYXJnZScgJiYgb3B0aW9ucy53aWRlKSB7XG4gICAgICAgIHJldHVybiBgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX2xhcmdlX3dpZGV9YDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChgaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBoX2xhcmdlfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cbiAgICovXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xuICAgIC8vIGh0dHBzOi8vbGVhZmxldGpzLmNvbS9yZWZlcmVuY2UtMS4zLjAuaHRtbCNtYXJrZXJcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgTC5tYXJrZXIoW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgICAgYWx0OiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcbiAgICAgIH0pO1xuICAgIG1hcmtlci5hZGRUbyhuZXdNYXApO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cblxuICBzdGF0aWMgc2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyhyZXN0YXVyYW50SWQsIHN0YXR1cywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBzZXRGYXZvdXJpdGVTdGF0dXNVcmwgPSBgJHtEQkhlbHBlci5EQVRBQkFTRV9VUkx9L3Jlc3RhdXJhbnRzLyR7cmVzdGF1cmFudElkfS8/aXNfZmF2b3JpdGU9JHtzdGF0dXN9YDtcbiAgICBmZXRjaChzZXRGYXZvdXJpdGVTdGF0dXNVcmwsIHsgbWV0aG9kOiAnUFVUJyB9KS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgfSkudGhlbigodXBkYXRlZFJlc3RhdXJhbnQpID0+IHtcbiAgICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgICBjb25zdCBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcbiAgICAgICAgc3RvcmUucHV0KHVwZGF0ZWRSZXN0YXVyYW50KTtcbiAgICAgIH0pO1xuICAgICAgY2FsbGJhY2sobnVsbCwgdXBkYXRlZFJlc3RhdXJhbnQpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGFkZFJldmlldyhyZXN0YXVyYW50SWQsIG5hbWUsIHJhdGluZywgY29tbWVudHMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgYWRkUmV2aWV3VXJsID0gYCR7REJIZWxwZXIuREFUQUJBU0VfVVJMfS9yZXZpZXdzYDtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzdGF1cmFudF9pZDogcmVzdGF1cmFudElkLFxuICAgICAgbmFtZSxcbiAgICAgIHJhdGluZyxcbiAgICAgIGNvbW1lbnRzLFxuICAgIH0pO1xuICAgIGZldGNoKGFkZFJldmlld1VybCwgeyBtZXRob2Q6ICdQT1NUJywgYm9keSB9KS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgfSkudGhlbigobmV3UmV2aWV3KSA9PiB7XG4gICAgICBjYWxsYmFjayhudWxsLCBuZXdSZXZpZXcpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldE91dGJveFJldmlld3MocmVzdGF1cmFudElkLCBjYWxsYmFjaykge1xuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgaWYgKCFkYikge1xuICAgICAgICBjb25zdCBlcnJvciA9ICdFcnJvciBjb25uZWN0aW5nIHRvIEluZGV4ZWREQic7XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RvcmUgPSBkYi50cmFuc2FjdGlvbignb3V0Ym94Jykub2JqZWN0U3RvcmUoJ291dGJveCcpO1xuICAgICAgY29uc3QgcmV2aWV3c0J5UmVzdGF1cmFudElkSW5kZXggPSBzdG9yZS5pbmRleCgncmVzdGF1cmFudF9pZCcpO1xuICAgICAgLy8gaWQgY29tZXMgYXMgYSBzdHJpbmcgZnJvbSB0aGUgdXJsLCBjb252ZXJ0IHRvIGEgbnVtYmVyIGJlZm9yZSBsb29rdXBcbiAgICAgIHJldmlld3NCeVJlc3RhdXJhbnRJZEluZGV4LmdldEFsbChOdW1iZXIucGFyc2VJbnQocmVzdGF1cmFudElkLCAxMCkpLnRoZW4oKGlkYlJldmlld3MpID0+IHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgaWRiUmV2aWV3cyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuIl0sImZpbGUiOiJkYmhlbHBlci5qcyJ9

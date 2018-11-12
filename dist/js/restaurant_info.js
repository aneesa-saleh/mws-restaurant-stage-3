"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var restaurant;
var reviews;
var outboxReviews;
var newMap;
var matchesMediaQuery;
var mediaQuery = '(min-width: 800px)';
var previouslyConnected;
/**
 * Initialize map as soon as the page is loaded.
 */

document.addEventListener('DOMContentLoaded', function (event) {
  previouslyConnected = navigator.onLine;
  initMap();
  fetchReviews();

  if (window.matchMedia) {
    matchesMediaQuery = window.matchMedia(mediaQuery).matches;
  }

  updateRestaurantContainerAria(); // set initial aria values

  registerServiceWorker();
  setInterval(cleanMapboxTilesCache, 5000);

  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', function (event) {
      var _event$data = event.data,
          type = _event$data.type,
          requestId = _event$data.requestId,
          review = _event$data.review,
          error = _event$data.error;

      if (type === 'update-review') {
        if (error) {
          enqueueToast('An error occurred while submitting your review', 'error');
          updateReviewHTML(true, requestId);
        } else {
          enqueueToast("".concat(review.name, "'s review has been saved"), 'success');
          updateReviewHTML(false, requestId, review);
        }
      }
    });
  }

  if ('onLine' in navigator) {
    window.addEventListener('online', showConnectionStatus);
    window.addEventListener('offline', showConnectionStatus);
    showConnectionStatus();
  }

  var toast = document.getElementById('toast');
});
/**
 * Initialize leaflet map
 */

var initMap = function initMap() {
  fetchRestaurantFromURL(function (error, restaurant) {
    var MAPBOX_API_KEY = 'pk.eyJ1IjoiYW5lZXNhLXNhbGVoIiwiYSI6ImNqa2xmZHVwMDFoYW4zdnAwYWplMm53bHEifQ.V11dDOtEnWSwTxY-C8mJLw';

    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: MAPBOX_API_KEY,
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};
/**
* Update aria-hidden values of the visible and accessible restaurant containers
*/


window.addEventListener('resize', function () {
  if (window.matchMedia) {
    var nextMatchesMediaQuery = window.matchMedia(mediaQuery).matches;

    if (nextMatchesMediaQuery !== matchesMediaQuery) {
      // only update aria when layout changes
      matchesMediaQuery = nextMatchesMediaQuery;
      updateRestaurantContainerAria();
    }
  }
});
/**
* Set aria-hidden values for visible and regular restaurant containers
* Accessible restaurant container is off screen
* It is required to maintain screen reading order when the layout shifts
*/

var updateRestaurantContainerAria = function updateRestaurantContainerAria() {
  var restaurantContainer = document.getElementById('restaurant-container');
  var accessibleRestaurantContainer = document.getElementById('accessible-restaurant-container');

  if (matchesMediaQuery) {
    // larger layout, screen reading order off
    restaurantContainer.setAttribute('aria-hidden', 'true');
    accessibleRestaurantContainer.setAttribute('aria-hidden', 'false');
  } else {
    // use regular reading order
    restaurantContainer.setAttribute('aria-hidden', 'false');
    accessibleRestaurantContainer.setAttribute('aria-hidden', 'true');
  }
};
/**
 * Get current restaurant from page URL.
 */


var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  var id = getUrlParam('id');

  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;

      if (!restaurant) {
        console.error(error);
        return;
      }

      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};
/**
 * Create restaurant HTML and add it to the webpage
 */


var fillRestaurantHTML = function fillRestaurantHTML() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;
  var name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  var address = document.getElementById('restaurant-address');
  address.innerHTML += restaurant.address;
  var picture = document.getElementById('restaurant-picture');
  var sourceLarge = document.createElement('source');
  sourceLarge.media = '(min-width: 800px)';
  sourceLarge.srcset = DBHelper.imageUrlForRestaurant(restaurant, {
    size: 'large',
    wide: true
  });
  sourceLarge.type = 'image/jpeg';
  picture.appendChild(sourceLarge);
  var sourceMedium = document.createElement('source');
  sourceMedium.media = '(min-width: 600px)';
  sourceMedium.srcset = DBHelper.imageUrlForRestaurant(restaurant, {
    size: 'medium'
  });
  sourceMedium.type = 'image/jpeg';
  picture.appendChild(sourceMedium);
  var sourceSmall = document.createElement('source');
  sourceSmall.srcset = DBHelper.imageUrlForRestaurant(restaurant, {
    size: 'small'
  });
  sourceSmall.type = 'image/jpeg';
  picture.appendChild(sourceSmall);
  var image = document.createElement('img');
  image.className = 'restaurant-img'; // set default size in case picture element is not supported

  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.alt;
  picture.appendChild(image);
  var accessibleRestaurantImage = document.getElementById('accessible-restaurant-img');
  accessibleRestaurantImage.setAttribute('aria-label', restaurant.alt);
  var cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = "Cuisine: ".concat(restaurant.cuisine_type);
  var accessibleRestaurantCuisine = document.getElementById('accessible-restaurant-cuisine');
  accessibleRestaurantCuisine.innerHTML = "Cuisine: ".concat(restaurant.cuisine_type);
  var addReviewButton = document.getElementById('add-review-button');
  addReviewButton.setAttribute('aria-label', "Add a review for ".concat(restaurant.name));
  addReviewButton.removeAttribute('disabled');
  var addReviewOverlayHeading = document.getElementById('add-review-overlay-heading');
  addReviewOverlayHeading.innerHTML = "Add review for ".concat(restaurant.name); // fill operating hours

  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  if (Object.hasOwnProperty.call(restaurant, 'is_favorite')) {
    fillMarkAsFavouriteHTML();
  }
};
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */


var fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;
  var hours = document.getElementById('restaurant-hours');

  for (var key in operatingHours) {
    if (Object.prototype.hasOwnProperty.call(operatingHours, key)) {
      var row = document.createElement('tr');
      var day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);
      var time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);
      hours.appendChild(row);
    }
  }
};

var markRestaurantAsFavourite = function markRestaurantAsFavourite(button) {
  var icon = button.querySelector('i');
  var text = button.querySelector('span');
  text.innerHTML = 'Unmark restaurant as favourite';
  icon.classList.add('fas', 'marked');
  icon.classList.remove('far', 'unmarked');
  icon.setAttribute('aria-label', 'Restaurant is currently marked as favourite');
};

var unmarkRestaurantAsFavourite = function unmarkRestaurantAsFavourite(button) {
  var icon = button.querySelector('i');
  var text = button.querySelector('span');
  text.innerHTML = 'Mark restaurant as favourite';
  icon.classList.add('far', 'unmarked');
  icon.classList.remove('fas', 'marked');
  icon.setAttribute('aria-label', 'Restaurant is not currently marked as favourite');
};
/**
 * Set state and text for mark as favourite button.
 */


var fillMarkAsFavouriteHTML = function fillMarkAsFavouriteHTML() {
  var isFavourite = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.is_favorite;
  var favouriteButton = document.getElementById('mark-as-favourite');

  if (stringToBoolean(isFavourite)) {
    markRestaurantAsFavourite(favouriteButton);
  } else {
    unmarkRestaurantAsFavourite(favouriteButton);
  }
};
/**
 * Get current restaurant from page URL.
 */


var fetchReviews = function fetchReviews() {
  var id = getUrlParam('id');

  if (!id) {
    // no id found in URL
    console.log('No restaurant id in URL');
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, function (error, reviews) {
      self.reviews = reviews;

      if (!reviews) {
        console.error(error);
        return;
      }

      fillReviewsHTML();
      DBHelper.getOutboxReviews(id, function (error, outboxReviews) {
        if (error) {
          console.log(error);
        } else {
          self.outboxReviews = outboxReviews;
          fillSendingReviewsHTML();
        }
      });
    });
  }
};
/**
 * Create all reviews HTML and add them to the webpage.
 */


var fillReviewsHTML = function fillReviewsHTML() {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.reviews;

  if (!reviews || reviews.length === 0) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  var ul = document.getElementById('reviews-list');
  reviews.forEach(function (review) {
    ul.insertBefore(createReviewHTML(review), ul.firstChild);
  });
};

var fillSendingReviewsHTML = function fillSendingReviewsHTML() {
  var outboxReviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.outboxReviews;
  if (!outboxReviews || outboxReviews.length === 0) return;
  var ul = document.getElementById('reviews-list');
  outboxReviews.forEach(function (outboxReview) {
    var request_id = outboxReview.request_id,
        review = _objectWithoutProperties(outboxReview, ["request_id"]);

    ul.insertBefore(createReviewHTML(review, true, request_id), ul.firstChild);
  });
};
/**
 * Create review HTML and add it to the webpage.
 */


var createReviewHTML = function createReviewHTML(review, sending, requestId) {
  var article = document.createElement('article');
  article.className = 'review';
  var headerSpan = document.createElement('span');
  headerSpan.className = 'review-header';
  var name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'review-name';
  headerSpan.appendChild(name);
  var date = document.createElement('p');

  if (sending) {
    var icon = document.createElement('i');
    icon.classList.add('far', 'fa-clock');
    var loadingText = document.createElement('span');
    loadingText.innerHTML = 'Sending';
    date.appendChild(icon);
    date.appendChild(loadingText);
  } else {
    var dateText = formatDate(new Date(review.updatedAt));
    date.innerHTML = dateText;
  }

  date.className = 'review-date';
  headerSpan.appendChild(date);
  article.appendChild(headerSpan);
  var contentSpan = document.createElement('span');
  contentSpan.className = 'review-content';
  var rating = document.createElement('p');
  rating.innerHTML = "Rating: ".concat(review.rating);
  rating.className = 'review-rating';
  contentSpan.appendChild(rating);
  var comments = document.createElement('p');
  comments.innerHTML = review.comments;
  contentSpan.appendChild(comments);
  article.appendChild(contentSpan);

  if (sending) {
    article.setAttribute('data-id', requestId);
    article.setAttribute('aria-busy', 'true');
    article.classList.add('sending');
  }

  return article;
};

var updateReviewHTML = function updateReviewHTML(error, requestId, review) {
  var reviewElement = document.querySelector("[data-id=\"".concat(requestId, "\"]"));

  if (error) {
    if (reviewElement) {
      // for error, no need to add to UI if it doesn't exist
      var date = reviewElement.querySelector('.review-date');
      date.innerHTML = '';
      var icon = document.createElement('i');
      icon.classList.add('fas', 'fa-exclamation-triangle');
      var errorText = document.createElement('span');
      errorText.innerHTML = 'Sending failed';
      date.appendChild(icon);
      date.appendChild(errorText);
      date.classList.add('error');
    }
  } else {
    var ul = document.getElementById('reviews-list');

    if (ul && self.restaurant) {
      // only update if the restaurant is loaded
      if (reviewElement) {
        reviewElement.classList.remove('sending');

        var _date = reviewElement.querySelector('.review-date');

        var dateText = formatDate(new Date(review.updatedAt));
        _date.innerHTML = dateText;
      } else {
        createReviewHTML(review, false);
      }
    }
  }
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */


var fillBreadcrumb = function fillBreadcrumb() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;
  var breadcrumb = document.getElementById('breadcrumb');
  var li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};
/**
 * Get a parameter by name from page URL.
 */


var getUrlParam = function getUrlParam(name, url) {
  url = url || window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp("[?&]".concat(name, "(=([^&#]*)|&|#|$)"));
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

var setMarkAsFavouriteFetchingState = function setMarkAsFavouriteFetchingState(button, spinner) {
  button.setAttribute('disabled', true);
  button.setAttribute('aria-busy', 'true');
  spinner.classList.add('show');
};

var removeMarkAsFavouriteFetchingState = function removeMarkAsFavouriteFetchingState(button, spinner) {
  button.removeAttribute('disabled');
  button.setAttribute('aria-busy', 'false');
  spinner.classList.remove('show');
};

var toggleRestaurantAsFavourite = function toggleRestaurantAsFavourite() {
  var isFavourite = stringToBoolean(self.restaurant.is_favorite);
  var newIsFavourite = !isFavourite && isFavourite !== 'false';
  var restaurantId = self.restaurant.id;
  var button = document.getElementById('mark-as-favourite');
  var spinner = document.getElementById('favourite-spinner');
  var failedUpdateCallback;

  if (newIsFavourite) {
    markRestaurantAsFavourite(button);
    failedUpdateCallback = unmarkRestaurantAsFavourite;
  } else {
    unmarkRestaurantAsFavourite(button);
    failedUpdateCallback = markRestaurantAsFavourite;
  }

  setMarkAsFavouriteFetchingState(button, spinner);
  DBHelper.setRestaurantFavouriteStatus(restaurantId, newIsFavourite, function (error, updatedRestaurant) {
    removeMarkAsFavouriteFetchingState(button, spinner);

    if (!updatedRestaurant) {
      console.error(error);
      failedUpdateCallback(button);
      return;
    }

    self.restaurant = updatedRestaurant;
  });
};

function showConnectionStatus() {
  var connectionStatus = document.getElementById('connectionStatus');

  if (navigator.onLine && !previouslyConnected) {
    // user came back online
    enqueueToast('You are back online', 'success');
  } else if (!navigator.onLine && previouslyConnected) {
    // user went offline
    enqueueToast('You are offline', 'error');
  }

  previouslyConnected = navigator.onLine;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Q29ubmVjdGVkIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJuYXZpZ2F0b3IiLCJvbkxpbmUiLCJpbml0TWFwIiwiZmV0Y2hSZXZpZXdzIiwid2luZG93IiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJ1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSIsInJlZ2lzdGVyU2VydmljZVdvcmtlciIsInNldEludGVydmFsIiwiY2xlYW5NYXBib3hUaWxlc0NhY2hlIiwic2VydmljZVdvcmtlciIsImRhdGEiLCJ0eXBlIiwicmVxdWVzdElkIiwicmV2aWV3IiwiZXJyb3IiLCJlbnF1ZXVlVG9hc3QiLCJ1cGRhdGVSZXZpZXdIVE1MIiwibmFtZSIsInNob3dDb25uZWN0aW9uU3RhdHVzIiwidG9hc3QiLCJnZXRFbGVtZW50QnlJZCIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJNQVBCT1hfQVBJX0tFWSIsImNvbnNvbGUiLCJzZWxmIiwiTCIsIm1hcCIsImNlbnRlciIsImxhdGxuZyIsImxhdCIsImxuZyIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXBib3hUb2tlbiIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImlkIiwiYWRkVG8iLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm5leHRNYXRjaGVzTWVkaWFRdWVyeSIsInJlc3RhdXJhbnRDb250YWluZXIiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciIsInNldEF0dHJpYnV0ZSIsImNhbGxiYWNrIiwiZ2V0VXJsUGFyYW0iLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiaW5uZXJIVE1MIiwiYWRkcmVzcyIsInBpY3R1cmUiLCJzb3VyY2VMYXJnZSIsImNyZWF0ZUVsZW1lbnQiLCJtZWRpYSIsInNyY3NldCIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsInNpemUiLCJ3aWRlIiwiYXBwZW5kQ2hpbGQiLCJzb3VyY2VNZWRpdW0iLCJzb3VyY2VTbWFsbCIsImltYWdlIiwiY2xhc3NOYW1lIiwic3JjIiwiYWx0IiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSIsImN1aXNpbmUiLCJjdWlzaW5lX3R5cGUiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUiLCJhZGRSZXZpZXdCdXR0b24iLCJyZW1vdmVBdHRyaWJ1dGUiLCJhZGRSZXZpZXdPdmVybGF5SGVhZGluZyIsIm9wZXJhdGluZ19ob3VycyIsImZpbGxSZXN0YXVyYW50SG91cnNIVE1MIiwiT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwiLCJvcGVyYXRpbmdIb3VycyIsImhvdXJzIiwia2V5IiwicHJvdG90eXBlIiwicm93IiwiZGF5IiwidGltZSIsIm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJidXR0b24iLCJpY29uIiwicXVlcnlTZWxlY3RvciIsInRleHQiLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJ1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJpc0Zhdm91cml0ZSIsImlzX2Zhdm9yaXRlIiwiZmF2b3VyaXRlQnV0dG9uIiwic3RyaW5nVG9Cb29sZWFuIiwibG9nIiwiZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQiLCJmaWxsUmV2aWV3c0hUTUwiLCJnZXRPdXRib3hSZXZpZXdzIiwiZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCIsImxlbmd0aCIsIm5vUmV2aWV3cyIsImNvbnRhaW5lciIsInVsIiwiZm9yRWFjaCIsImluc2VydEJlZm9yZSIsImNyZWF0ZVJldmlld0hUTUwiLCJmaXJzdENoaWxkIiwib3V0Ym94UmV2aWV3IiwicmVxdWVzdF9pZCIsInNlbmRpbmciLCJhcnRpY2xlIiwiaGVhZGVyU3BhbiIsImRhdGUiLCJsb2FkaW5nVGV4dCIsImRhdGVUZXh0IiwiZm9ybWF0RGF0ZSIsIkRhdGUiLCJ1cGRhdGVkQXQiLCJjb250ZW50U3BhbiIsInJhdGluZyIsImNvbW1lbnRzIiwicmV2aWV3RWxlbWVudCIsImVycm9yVGV4dCIsImJyZWFkY3J1bWIiLCJsaSIsInVybCIsImxvY2F0aW9uIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInNwaW5uZXIiLCJyZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwidG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwibmV3SXNGYXZvdXJpdGUiLCJyZXN0YXVyYW50SWQiLCJmYWlsZWRVcGRhdGVDYWxsYmFjayIsInNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMiLCJ1cGRhdGVkUmVzdGF1cmFudCIsImNvbm5lY3Rpb25TdGF0dXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUlBLFVBQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsYUFBSjtBQUNBLElBQUlDLE1BQUo7QUFDQSxJQUFJQyxpQkFBSjtBQUNBLElBQU1DLFVBQVUsR0FBRyxvQkFBbkI7QUFDQSxJQUFJQyxtQkFBSjtBQUVBOzs7O0FBR0FDLFFBQVEsQ0FBQ0MsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQUNDLEtBQUQsRUFBVztBQUN2REgsRUFBQUEsbUJBQW1CLEdBQUdJLFNBQVMsQ0FBQ0MsTUFBaEM7QUFFQUMsRUFBQUEsT0FBTztBQUNQQyxFQUFBQSxZQUFZOztBQUNaLE1BQUlDLE1BQU0sQ0FBQ0MsVUFBWCxFQUF1QjtBQUNyQlgsSUFBQUEsaUJBQWlCLEdBQUdVLE1BQU0sQ0FBQ0MsVUFBUCxDQUFrQlYsVUFBbEIsRUFBOEJXLE9BQWxEO0FBQ0Q7O0FBQ0RDLEVBQUFBLDZCQUE2QixHQVIwQixDQVF0Qjs7QUFDakNDLEVBQUFBLHFCQUFxQjtBQUNyQkMsRUFBQUEsV0FBVyxDQUFDQyxxQkFBRCxFQUF3QixJQUF4QixDQUFYOztBQUVBLE1BQUlWLFNBQVMsQ0FBQ1csYUFBZCxFQUE2QjtBQUMzQlgsSUFBQUEsU0FBUyxDQUFDVyxhQUFWLENBQXdCYixnQkFBeEIsQ0FBeUMsU0FBekMsRUFBb0QsVUFBQ0MsS0FBRCxFQUFXO0FBQUEsd0JBR3pEQSxLQUFLLENBQUNhLElBSG1EO0FBQUEsVUFFM0RDLElBRjJELGVBRTNEQSxJQUYyRDtBQUFBLFVBRXJEQyxTQUZxRCxlQUVyREEsU0FGcUQ7QUFBQSxVQUUxQ0MsTUFGMEMsZUFFMUNBLE1BRjBDO0FBQUEsVUFFbENDLEtBRmtDLGVBRWxDQSxLQUZrQzs7QUFJN0QsVUFBSUgsSUFBSSxLQUFLLGVBQWIsRUFBOEI7QUFDNUIsWUFBSUcsS0FBSixFQUFXO0FBQ1RDLFVBQUFBLFlBQVksQ0FBQyxnREFBRCxFQUFtRCxPQUFuRCxDQUFaO0FBQ0FDLFVBQUFBLGdCQUFnQixDQUFDLElBQUQsRUFBT0osU0FBUCxDQUFoQjtBQUNELFNBSEQsTUFHTztBQUNMRyxVQUFBQSxZQUFZLFdBQUlGLE1BQU0sQ0FBQ0ksSUFBWCwrQkFBMkMsU0FBM0MsQ0FBWjtBQUNBRCxVQUFBQSxnQkFBZ0IsQ0FBQyxLQUFELEVBQVFKLFNBQVIsRUFBbUJDLE1BQW5CLENBQWhCO0FBQ0Q7QUFDRjtBQUNGLEtBYkQ7QUFjRDs7QUFFRCxNQUFJLFlBQVlmLFNBQWhCLEVBQTJCO0FBQ3pCSSxJQUFBQSxNQUFNLENBQUNOLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDc0Isb0JBQWxDO0FBQ0FoQixJQUFBQSxNQUFNLENBQUNOLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1Dc0Isb0JBQW5DO0FBQ0FBLElBQUFBLG9CQUFvQjtBQUNyQjs7QUFFRCxNQUFNQyxLQUFLLEdBQUd4QixRQUFRLENBQUN5QixjQUFULENBQXdCLE9BQXhCLENBQWQ7QUFDRCxDQXBDRDtBQXNDQTs7OztBQUdBLElBQU1wQixPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFNO0FBQ3BCcUIsRUFBQUEsc0JBQXNCLENBQUMsVUFBQ1AsS0FBRCxFQUFRMUIsVUFBUixFQUF1QjtBQUM1QyxRQUFNa0MsY0FBYyxHQUFHLGtHQUF2Qjs7QUFDQSxRQUFJUixLQUFKLEVBQVc7QUFBRTtBQUNYUyxNQUFBQSxPQUFPLENBQUNULEtBQVIsQ0FBY0EsS0FBZDtBQUNELEtBRkQsTUFFTztBQUNMVSxNQUFBQSxJQUFJLENBQUNqQyxNQUFMLEdBQWNrQyxDQUFDLENBQUNDLEdBQUYsQ0FBTSxLQUFOLEVBQWE7QUFDekJDLFFBQUFBLE1BQU0sRUFBRSxDQUFDdkMsVUFBVSxDQUFDd0MsTUFBWCxDQUFrQkMsR0FBbkIsRUFBd0J6QyxVQUFVLENBQUN3QyxNQUFYLENBQWtCRSxHQUExQyxDQURpQjtBQUV6QkMsUUFBQUEsSUFBSSxFQUFFLEVBRm1CO0FBR3pCQyxRQUFBQSxlQUFlLEVBQUU7QUFIUSxPQUFiLENBQWQ7QUFLQVAsTUFBQUEsQ0FBQyxDQUFDUSxTQUFGLENBQVksbUZBQVosRUFBaUc7QUFDL0ZDLFFBQUFBLFdBQVcsRUFBRVosY0FEa0Y7QUFFL0ZhLFFBQUFBLE9BQU8sRUFBRSxFQUZzRjtBQUcvRkMsUUFBQUEsV0FBVyxFQUFFLDhGQUNULDBFQURTLEdBRVQsd0RBTDJGO0FBTS9GQyxRQUFBQSxFQUFFLEVBQUU7QUFOMkYsT0FBakcsRUFPR0MsS0FQSCxDQU9TL0MsTUFQVDtBQVFBZ0QsTUFBQUEsY0FBYztBQUNkQyxNQUFBQSxRQUFRLENBQUNDLHNCQUFULENBQWdDakIsSUFBSSxDQUFDcEMsVUFBckMsRUFBaURvQyxJQUFJLENBQUNqQyxNQUF0RDtBQUNEO0FBQ0YsR0FyQnFCLENBQXRCO0FBc0JELENBdkJEO0FBeUJBOzs7OztBQUdBVyxNQUFNLENBQUNOLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLFlBQU07QUFDdEMsTUFBSU0sTUFBTSxDQUFDQyxVQUFYLEVBQXVCO0FBQ3JCLFFBQU11QyxxQkFBcUIsR0FBR3hDLE1BQU0sQ0FBQ0MsVUFBUCxDQUFrQlYsVUFBbEIsRUFBOEJXLE9BQTVEOztBQUNBLFFBQUlzQyxxQkFBcUIsS0FBS2xELGlCQUE5QixFQUFpRDtBQUFFO0FBQ2pEQSxNQUFBQSxpQkFBaUIsR0FBR2tELHFCQUFwQjtBQUNBckMsTUFBQUEsNkJBQTZCO0FBQzlCO0FBQ0Y7QUFDRixDQVJEO0FBVUE7Ozs7OztBQUtBLElBQU1BLDZCQUE2QixHQUFHLFNBQWhDQSw2QkFBZ0MsR0FBTTtBQUMxQyxNQUFNc0MsbUJBQW1CLEdBQUdoRCxRQUFRLENBQUN5QixjQUFULENBQXdCLHNCQUF4QixDQUE1QjtBQUNBLE1BQU13Qiw2QkFBNkIsR0FBR2pELFFBQVEsQ0FBQ3lCLGNBQVQsQ0FBd0IsaUNBQXhCLENBQXRDOztBQUNBLE1BQUk1QixpQkFBSixFQUF1QjtBQUFFO0FBQ3ZCbUQsSUFBQUEsbUJBQW1CLENBQUNFLFlBQXBCLENBQWlDLGFBQWpDLEVBQWdELE1BQWhEO0FBQ0FELElBQUFBLDZCQUE2QixDQUFDQyxZQUE5QixDQUEyQyxhQUEzQyxFQUEwRCxPQUExRDtBQUNELEdBSEQsTUFHTztBQUFFO0FBQ1BGLElBQUFBLG1CQUFtQixDQUFDRSxZQUFwQixDQUFpQyxhQUFqQyxFQUFnRCxPQUFoRDtBQUNBRCxJQUFBQSw2QkFBNkIsQ0FBQ0MsWUFBOUIsQ0FBMkMsYUFBM0MsRUFBMEQsTUFBMUQ7QUFDRDtBQUNGLENBVkQ7QUFZQTs7Ozs7QUFHQSxJQUFNeEIsc0JBQXNCLEdBQUcsU0FBekJBLHNCQUF5QixDQUFDeUIsUUFBRCxFQUFjO0FBQzNDLE1BQUl0QixJQUFJLENBQUNwQyxVQUFULEVBQXFCO0FBQUU7QUFDckIwRCxJQUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPdEIsSUFBSSxDQUFDcEMsVUFBWixDQUFSO0FBQ0E7QUFDRDs7QUFDRCxNQUFNaUQsRUFBRSxHQUFHVSxXQUFXLENBQUMsSUFBRCxDQUF0Qjs7QUFDQSxNQUFJLENBQUNWLEVBQUwsRUFBUztBQUFFO0FBQ1R2QixJQUFBQSxLQUFLLEdBQUcseUJBQVI7QUFDQWdDLElBQUFBLFFBQVEsQ0FBQ2hDLEtBQUQsRUFBUSxJQUFSLENBQVI7QUFDRCxHQUhELE1BR087QUFDTDBCLElBQUFBLFFBQVEsQ0FBQ1EsbUJBQVQsQ0FBNkJYLEVBQTdCLEVBQWlDLFVBQUN2QixLQUFELEVBQVExQixVQUFSLEVBQXVCO0FBQ3REb0MsTUFBQUEsSUFBSSxDQUFDcEMsVUFBTCxHQUFrQkEsVUFBbEI7O0FBQ0EsVUFBSSxDQUFDQSxVQUFMLEVBQWlCO0FBQ2ZtQyxRQUFBQSxPQUFPLENBQUNULEtBQVIsQ0FBY0EsS0FBZDtBQUNBO0FBQ0Q7O0FBQ0RtQyxNQUFBQSxrQkFBa0I7QUFDbEJILE1BQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU8xRCxVQUFQLENBQVI7QUFDRCxLQVJEO0FBU0Q7QUFDRixDQXBCRDtBQXNCQTs7Ozs7QUFHQSxJQUFNNkQsa0JBQWtCLEdBQUcsU0FBckJBLGtCQUFxQixHQUFrQztBQUFBLE1BQWpDN0QsVUFBaUMsdUVBQXBCb0MsSUFBSSxDQUFDcEMsVUFBZTtBQUMzRCxNQUFNNkIsSUFBSSxHQUFHdEIsUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixpQkFBeEIsQ0FBYjtBQUNBSCxFQUFBQSxJQUFJLENBQUNpQyxTQUFMLEdBQWlCOUQsVUFBVSxDQUFDNkIsSUFBNUI7QUFFQSxNQUFNa0MsT0FBTyxHQUFHeEQsUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixvQkFBeEIsQ0FBaEI7QUFDQStCLEVBQUFBLE9BQU8sQ0FBQ0QsU0FBUixJQUFxQjlELFVBQVUsQ0FBQytELE9BQWhDO0FBRUEsTUFBTUMsT0FBTyxHQUFHekQsUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixvQkFBeEIsQ0FBaEI7QUFFQSxNQUFNaUMsV0FBVyxHQUFHMUQsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixRQUF2QixDQUFwQjtBQUNBRCxFQUFBQSxXQUFXLENBQUNFLEtBQVosR0FBb0Isb0JBQXBCO0FBQ0FGLEVBQUFBLFdBQVcsQ0FBQ0csTUFBWixHQUFxQmhCLFFBQVEsQ0FBQ2lCLHFCQUFULENBQStCckUsVUFBL0IsRUFBMkM7QUFBRXNFLElBQUFBLElBQUksRUFBRSxPQUFSO0FBQWlCQyxJQUFBQSxJQUFJLEVBQUU7QUFBdkIsR0FBM0MsQ0FBckI7QUFDQU4sRUFBQUEsV0FBVyxDQUFDMUMsSUFBWixHQUFtQixZQUFuQjtBQUNBeUMsRUFBQUEsT0FBTyxDQUFDUSxXQUFSLENBQW9CUCxXQUFwQjtBQUVBLE1BQU1RLFlBQVksR0FBR2xFLFFBQVEsQ0FBQzJELGFBQVQsQ0FBdUIsUUFBdkIsQ0FBckI7QUFDQU8sRUFBQUEsWUFBWSxDQUFDTixLQUFiLEdBQXFCLG9CQUFyQjtBQUNBTSxFQUFBQSxZQUFZLENBQUNMLE1BQWIsR0FBc0JoQixRQUFRLENBQUNpQixxQkFBVCxDQUErQnJFLFVBQS9CLEVBQTJDO0FBQUVzRSxJQUFBQSxJQUFJLEVBQUU7QUFBUixHQUEzQyxDQUF0QjtBQUNBRyxFQUFBQSxZQUFZLENBQUNsRCxJQUFiLEdBQW9CLFlBQXBCO0FBQ0F5QyxFQUFBQSxPQUFPLENBQUNRLFdBQVIsQ0FBb0JDLFlBQXBCO0FBRUEsTUFBTUMsV0FBVyxHQUFHbkUsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixRQUF2QixDQUFwQjtBQUNBUSxFQUFBQSxXQUFXLENBQUNOLE1BQVosR0FBcUJoQixRQUFRLENBQUNpQixxQkFBVCxDQUErQnJFLFVBQS9CLEVBQTJDO0FBQUVzRSxJQUFBQSxJQUFJLEVBQUU7QUFBUixHQUEzQyxDQUFyQjtBQUNBSSxFQUFBQSxXQUFXLENBQUNuRCxJQUFaLEdBQW1CLFlBQW5CO0FBQ0F5QyxFQUFBQSxPQUFPLENBQUNRLFdBQVIsQ0FBb0JFLFdBQXBCO0FBRUEsTUFBTUMsS0FBSyxHQUFHcEUsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixLQUF2QixDQUFkO0FBQ0FTLEVBQUFBLEtBQUssQ0FBQ0MsU0FBTixHQUFrQixnQkFBbEIsQ0EzQjJELENBNEIzRDs7QUFDQUQsRUFBQUEsS0FBSyxDQUFDRSxHQUFOLEdBQVl6QixRQUFRLENBQUNpQixxQkFBVCxDQUErQnJFLFVBQS9CLENBQVo7QUFDQTJFLEVBQUFBLEtBQUssQ0FBQ0csR0FBTixHQUFZOUUsVUFBVSxDQUFDOEUsR0FBdkI7QUFDQWQsRUFBQUEsT0FBTyxDQUFDUSxXQUFSLENBQW9CRyxLQUFwQjtBQUVBLE1BQU1JLHlCQUF5QixHQUFHeEUsUUFBUSxDQUFDeUIsY0FBVCxDQUF3QiwyQkFBeEIsQ0FBbEM7QUFDQStDLEVBQUFBLHlCQUF5QixDQUFDdEIsWUFBMUIsQ0FBdUMsWUFBdkMsRUFBcUR6RCxVQUFVLENBQUM4RSxHQUFoRTtBQUVBLE1BQU1FLE9BQU8sR0FBR3pFLFFBQVEsQ0FBQ3lCLGNBQVQsQ0FBd0Isb0JBQXhCLENBQWhCO0FBQ0FnRCxFQUFBQSxPQUFPLENBQUNsQixTQUFSLHNCQUFnQzlELFVBQVUsQ0FBQ2lGLFlBQTNDO0FBRUEsTUFBTUMsMkJBQTJCLEdBQUczRSxRQUFRLENBQUN5QixjQUFULENBQXdCLCtCQUF4QixDQUFwQztBQUNBa0QsRUFBQUEsMkJBQTJCLENBQUNwQixTQUE1QixzQkFBb0Q5RCxVQUFVLENBQUNpRixZQUEvRDtBQUVBLE1BQU1FLGVBQWUsR0FBRzVFLFFBQVEsQ0FBQ3lCLGNBQVQsQ0FBd0IsbUJBQXhCLENBQXhCO0FBQ0FtRCxFQUFBQSxlQUFlLENBQUMxQixZQUFoQixDQUE2QixZQUE3Qiw2QkFBK0R6RCxVQUFVLENBQUM2QixJQUExRTtBQUNBc0QsRUFBQUEsZUFBZSxDQUFDQyxlQUFoQixDQUFnQyxVQUFoQztBQUVBLE1BQU1DLHVCQUF1QixHQUFHOUUsUUFBUSxDQUFDeUIsY0FBVCxDQUF3Qiw0QkFBeEIsQ0FBaEM7QUFDQXFELEVBQUFBLHVCQUF1QixDQUFDdkIsU0FBeEIsNEJBQXNEOUQsVUFBVSxDQUFDNkIsSUFBakUsRUEvQzJELENBaUQzRDs7QUFDQSxNQUFJN0IsVUFBVSxDQUFDc0YsZUFBZixFQUFnQztBQUM5QkMsSUFBQUEsdUJBQXVCO0FBQ3hCOztBQUVELE1BQUlDLE1BQU0sQ0FBQ0MsY0FBUCxDQUFzQkMsSUFBdEIsQ0FBMkIxRixVQUEzQixFQUF1QyxhQUF2QyxDQUFKLEVBQTJEO0FBQ3pEMkYsSUFBQUEsdUJBQXVCO0FBQ3hCO0FBQ0YsQ0F6REQ7QUEyREE7Ozs7O0FBR0EsSUFBTUosdUJBQXVCLEdBQUcsU0FBMUJBLHVCQUEwQixHQUFzRDtBQUFBLE1BQXJESyxjQUFxRCx1RUFBcEN4RCxJQUFJLENBQUNwQyxVQUFMLENBQWdCc0YsZUFBb0I7QUFDcEYsTUFBTU8sS0FBSyxHQUFHdEYsUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixrQkFBeEIsQ0FBZDs7QUFDQSxPQUFLLElBQU04RCxHQUFYLElBQWtCRixjQUFsQixFQUFrQztBQUNoQyxRQUFJSixNQUFNLENBQUNPLFNBQVAsQ0FBaUJOLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQ0UsY0FBckMsRUFBcURFLEdBQXJELENBQUosRUFBK0Q7QUFDN0QsVUFBTUUsR0FBRyxHQUFHekYsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixJQUF2QixDQUFaO0FBRUEsVUFBTStCLEdBQUcsR0FBRzFGLFFBQVEsQ0FBQzJELGFBQVQsQ0FBdUIsSUFBdkIsQ0FBWjtBQUNBK0IsTUFBQUEsR0FBRyxDQUFDbkMsU0FBSixHQUFnQmdDLEdBQWhCO0FBQ0FFLE1BQUFBLEdBQUcsQ0FBQ3hCLFdBQUosQ0FBZ0J5QixHQUFoQjtBQUVBLFVBQU1DLElBQUksR0FBRzNGLFFBQVEsQ0FBQzJELGFBQVQsQ0FBdUIsSUFBdkIsQ0FBYjtBQUNBZ0MsTUFBQUEsSUFBSSxDQUFDcEMsU0FBTCxHQUFpQjhCLGNBQWMsQ0FBQ0UsR0FBRCxDQUEvQjtBQUNBRSxNQUFBQSxHQUFHLENBQUN4QixXQUFKLENBQWdCMEIsSUFBaEI7QUFFQUwsTUFBQUEsS0FBSyxDQUFDckIsV0FBTixDQUFrQndCLEdBQWxCO0FBQ0Q7QUFDRjtBQUNGLENBakJEOztBQW1CQSxJQUFNRyx5QkFBeUIsR0FBRyxTQUE1QkEseUJBQTRCLENBQUNDLE1BQUQsRUFBWTtBQUM1QyxNQUFNQyxJQUFJLEdBQUdELE1BQU0sQ0FBQ0UsYUFBUCxDQUFxQixHQUFyQixDQUFiO0FBQ0EsTUFBTUMsSUFBSSxHQUFHSCxNQUFNLENBQUNFLGFBQVAsQ0FBcUIsTUFBckIsQ0FBYjtBQUNBQyxFQUFBQSxJQUFJLENBQUN6QyxTQUFMLEdBQWlCLGdDQUFqQjtBQUNBdUMsRUFBQUEsSUFBSSxDQUFDRyxTQUFMLENBQWVDLEdBQWYsQ0FBbUIsS0FBbkIsRUFBMEIsUUFBMUI7QUFDQUosRUFBQUEsSUFBSSxDQUFDRyxTQUFMLENBQWVFLE1BQWYsQ0FBc0IsS0FBdEIsRUFBNkIsVUFBN0I7QUFDQUwsRUFBQUEsSUFBSSxDQUFDNUMsWUFBTCxDQUFrQixZQUFsQixFQUFnQyw2Q0FBaEM7QUFDRCxDQVBEOztBQVNBLElBQU1rRCwyQkFBMkIsR0FBRyxTQUE5QkEsMkJBQThCLENBQUNQLE1BQUQsRUFBWTtBQUM5QyxNQUFNQyxJQUFJLEdBQUdELE1BQU0sQ0FBQ0UsYUFBUCxDQUFxQixHQUFyQixDQUFiO0FBQ0EsTUFBTUMsSUFBSSxHQUFHSCxNQUFNLENBQUNFLGFBQVAsQ0FBcUIsTUFBckIsQ0FBYjtBQUNBQyxFQUFBQSxJQUFJLENBQUN6QyxTQUFMLEdBQWlCLDhCQUFqQjtBQUNBdUMsRUFBQUEsSUFBSSxDQUFDRyxTQUFMLENBQWVDLEdBQWYsQ0FBbUIsS0FBbkIsRUFBMEIsVUFBMUI7QUFDQUosRUFBQUEsSUFBSSxDQUFDRyxTQUFMLENBQWVFLE1BQWYsQ0FBc0IsS0FBdEIsRUFBNkIsUUFBN0I7QUFDQUwsRUFBQUEsSUFBSSxDQUFDNUMsWUFBTCxDQUFrQixZQUFsQixFQUFnQyxpREFBaEM7QUFDRCxDQVBEO0FBU0E7Ozs7O0FBR0EsSUFBTWtDLHVCQUF1QixHQUFHLFNBQTFCQSx1QkFBMEIsR0FBK0M7QUFBQSxNQUE5Q2lCLFdBQThDLHVFQUFoQ3hFLElBQUksQ0FBQ3BDLFVBQUwsQ0FBZ0I2RyxXQUFnQjtBQUM3RSxNQUFNQyxlQUFlLEdBQUd2RyxRQUFRLENBQUN5QixjQUFULENBQXdCLG1CQUF4QixDQUF4Qjs7QUFDQSxNQUFJK0UsZUFBZSxDQUFDSCxXQUFELENBQW5CLEVBQWtDO0FBQ2hDVCxJQUFBQSx5QkFBeUIsQ0FBQ1csZUFBRCxDQUF6QjtBQUNELEdBRkQsTUFFTztBQUNMSCxJQUFBQSwyQkFBMkIsQ0FBQ0csZUFBRCxDQUEzQjtBQUNEO0FBQ0YsQ0FQRDtBQVNBOzs7OztBQUdBLElBQU1qRyxZQUFZLEdBQUcsU0FBZkEsWUFBZSxHQUFNO0FBQ3pCLE1BQU1vQyxFQUFFLEdBQUdVLFdBQVcsQ0FBQyxJQUFELENBQXRCOztBQUNBLE1BQUksQ0FBQ1YsRUFBTCxFQUFTO0FBQUU7QUFDVGQsSUFBQUEsT0FBTyxDQUFDNkUsR0FBUixDQUFZLHlCQUFaO0FBQ0QsR0FGRCxNQUVPO0FBQ0w1RCxJQUFBQSxRQUFRLENBQUM2RCwwQkFBVCxDQUFvQ2hFLEVBQXBDLEVBQXdDLFVBQUN2QixLQUFELEVBQVF6QixPQUFSLEVBQW9CO0FBQzFEbUMsTUFBQUEsSUFBSSxDQUFDbkMsT0FBTCxHQUFlQSxPQUFmOztBQUNBLFVBQUksQ0FBQ0EsT0FBTCxFQUFjO0FBQ1prQyxRQUFBQSxPQUFPLENBQUNULEtBQVIsQ0FBY0EsS0FBZDtBQUNBO0FBQ0Q7O0FBQ0R3RixNQUFBQSxlQUFlO0FBQ2Y5RCxNQUFBQSxRQUFRLENBQUMrRCxnQkFBVCxDQUEwQmxFLEVBQTFCLEVBQThCLFVBQUN2QixLQUFELEVBQVF4QixhQUFSLEVBQTBCO0FBQ3RELFlBQUl3QixLQUFKLEVBQVc7QUFDVFMsVUFBQUEsT0FBTyxDQUFDNkUsR0FBUixDQUFZdEYsS0FBWjtBQUNELFNBRkQsTUFFTztBQUNMVSxVQUFBQSxJQUFJLENBQUNsQyxhQUFMLEdBQXFCQSxhQUFyQjtBQUNBa0gsVUFBQUEsc0JBQXNCO0FBQ3ZCO0FBQ0YsT0FQRDtBQVFELEtBZkQ7QUFnQkQ7QUFDRixDQXRCRDtBQXdCQTs7Ozs7QUFHQSxJQUFNRixlQUFlLEdBQUcsU0FBbEJBLGVBQWtCLEdBQTRCO0FBQUEsTUFBM0JqSCxPQUEyQix1RUFBakJtQyxJQUFJLENBQUNuQyxPQUFZOztBQUNsRCxNQUFJLENBQUNBLE9BQUQsSUFBWUEsT0FBTyxDQUFDb0gsTUFBUixLQUFtQixDQUFuQyxFQUFzQztBQUNwQyxRQUFNQyxTQUFTLEdBQUcvRyxRQUFRLENBQUMyRCxhQUFULENBQXVCLEdBQXZCLENBQWxCO0FBQ0FvRCxJQUFBQSxTQUFTLENBQUN4RCxTQUFWLEdBQXNCLGlCQUF0QjtBQUNBeUQsSUFBQUEsU0FBUyxDQUFDL0MsV0FBVixDQUFzQjhDLFNBQXRCO0FBQ0E7QUFDRDs7QUFDRCxNQUFNRSxFQUFFLEdBQUdqSCxRQUFRLENBQUN5QixjQUFULENBQXdCLGNBQXhCLENBQVg7QUFDQS9CLEVBQUFBLE9BQU8sQ0FBQ3dILE9BQVIsQ0FBZ0IsVUFBQ2hHLE1BQUQsRUFBWTtBQUMxQitGLElBQUFBLEVBQUUsQ0FBQ0UsWUFBSCxDQUFnQkMsZ0JBQWdCLENBQUNsRyxNQUFELENBQWhDLEVBQTBDK0YsRUFBRSxDQUFDSSxVQUE3QztBQUNELEdBRkQ7QUFHRCxDQVhEOztBQWFBLElBQU1SLHNCQUFzQixHQUFHLFNBQXpCQSxzQkFBeUIsR0FBd0M7QUFBQSxNQUF2Q2xILGFBQXVDLHVFQUF2QmtDLElBQUksQ0FBQ2xDLGFBQWtCO0FBQ3JFLE1BQUksQ0FBQ0EsYUFBRCxJQUFrQkEsYUFBYSxDQUFDbUgsTUFBZCxLQUF5QixDQUEvQyxFQUFrRDtBQUVsRCxNQUFNRyxFQUFFLEdBQUdqSCxRQUFRLENBQUN5QixjQUFULENBQXdCLGNBQXhCLENBQVg7QUFDQTlCLEVBQUFBLGFBQWEsQ0FBQ3VILE9BQWQsQ0FBc0IsVUFBQ0ksWUFBRCxFQUFrQjtBQUFBLFFBQzlCQyxVQUQ4QixHQUNKRCxZQURJLENBQzlCQyxVQUQ4QjtBQUFBLFFBQ2ZyRyxNQURlLDRCQUNKb0csWUFESTs7QUFFdENMLElBQUFBLEVBQUUsQ0FBQ0UsWUFBSCxDQUFnQkMsZ0JBQWdCLENBQUNsRyxNQUFELEVBQVMsSUFBVCxFQUFlcUcsVUFBZixDQUFoQyxFQUE0RE4sRUFBRSxDQUFDSSxVQUEvRDtBQUNELEdBSEQ7QUFJRCxDQVJEO0FBVUE7Ozs7O0FBR0EsSUFBTUQsZ0JBQWdCLEdBQUcsU0FBbkJBLGdCQUFtQixDQUFDbEcsTUFBRCxFQUFTc0csT0FBVCxFQUFrQnZHLFNBQWxCLEVBQWdDO0FBQ3ZELE1BQU13RyxPQUFPLEdBQUd6SCxRQUFRLENBQUMyRCxhQUFULENBQXVCLFNBQXZCLENBQWhCO0FBQ0E4RCxFQUFBQSxPQUFPLENBQUNwRCxTQUFSLEdBQW9CLFFBQXBCO0FBRUEsTUFBTXFELFVBQVUsR0FBRzFILFFBQVEsQ0FBQzJELGFBQVQsQ0FBdUIsTUFBdkIsQ0FBbkI7QUFDQStELEVBQUFBLFVBQVUsQ0FBQ3JELFNBQVgsR0FBdUIsZUFBdkI7QUFFQSxNQUFNL0MsSUFBSSxHQUFHdEIsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixHQUF2QixDQUFiO0FBQ0FyQyxFQUFBQSxJQUFJLENBQUNpQyxTQUFMLEdBQWlCckMsTUFBTSxDQUFDSSxJQUF4QjtBQUNBQSxFQUFBQSxJQUFJLENBQUMrQyxTQUFMLEdBQWlCLGFBQWpCO0FBQ0FxRCxFQUFBQSxVQUFVLENBQUN6RCxXQUFYLENBQXVCM0MsSUFBdkI7QUFFQSxNQUFNcUcsSUFBSSxHQUFHM0gsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixHQUF2QixDQUFiOztBQUVBLE1BQUk2RCxPQUFKLEVBQWE7QUFDWCxRQUFNMUIsSUFBSSxHQUFHOUYsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixHQUF2QixDQUFiO0FBQ0FtQyxJQUFBQSxJQUFJLENBQUNHLFNBQUwsQ0FBZUMsR0FBZixDQUFtQixLQUFuQixFQUEwQixVQUExQjtBQUNBLFFBQU0wQixXQUFXLEdBQUc1SCxRQUFRLENBQUMyRCxhQUFULENBQXVCLE1BQXZCLENBQXBCO0FBQ0FpRSxJQUFBQSxXQUFXLENBQUNyRSxTQUFaLEdBQXdCLFNBQXhCO0FBQ0FvRSxJQUFBQSxJQUFJLENBQUMxRCxXQUFMLENBQWlCNkIsSUFBakI7QUFDQTZCLElBQUFBLElBQUksQ0FBQzFELFdBQUwsQ0FBaUIyRCxXQUFqQjtBQUNELEdBUEQsTUFPTztBQUNMLFFBQU1DLFFBQVEsR0FBR0MsVUFBVSxDQUFDLElBQUlDLElBQUosQ0FBUzdHLE1BQU0sQ0FBQzhHLFNBQWhCLENBQUQsQ0FBM0I7QUFDQUwsSUFBQUEsSUFBSSxDQUFDcEUsU0FBTCxHQUFpQnNFLFFBQWpCO0FBQ0Q7O0FBRURGLEVBQUFBLElBQUksQ0FBQ3RELFNBQUwsR0FBaUIsYUFBakI7QUFDQXFELEVBQUFBLFVBQVUsQ0FBQ3pELFdBQVgsQ0FBdUIwRCxJQUF2QjtBQUNBRixFQUFBQSxPQUFPLENBQUN4RCxXQUFSLENBQW9CeUQsVUFBcEI7QUFFQSxNQUFNTyxXQUFXLEdBQUdqSSxRQUFRLENBQUMyRCxhQUFULENBQXVCLE1BQXZCLENBQXBCO0FBQ0FzRSxFQUFBQSxXQUFXLENBQUM1RCxTQUFaLEdBQXdCLGdCQUF4QjtBQUVBLE1BQU02RCxNQUFNLEdBQUdsSSxRQUFRLENBQUMyRCxhQUFULENBQXVCLEdBQXZCLENBQWY7QUFDQXVFLEVBQUFBLE1BQU0sQ0FBQzNFLFNBQVAscUJBQThCckMsTUFBTSxDQUFDZ0gsTUFBckM7QUFDQUEsRUFBQUEsTUFBTSxDQUFDN0QsU0FBUCxHQUFtQixlQUFuQjtBQUNBNEQsRUFBQUEsV0FBVyxDQUFDaEUsV0FBWixDQUF3QmlFLE1BQXhCO0FBRUEsTUFBTUMsUUFBUSxHQUFHbkksUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixHQUF2QixDQUFqQjtBQUNBd0UsRUFBQUEsUUFBUSxDQUFDNUUsU0FBVCxHQUFxQnJDLE1BQU0sQ0FBQ2lILFFBQTVCO0FBQ0FGLEVBQUFBLFdBQVcsQ0FBQ2hFLFdBQVosQ0FBd0JrRSxRQUF4QjtBQUNBVixFQUFBQSxPQUFPLENBQUN4RCxXQUFSLENBQW9CZ0UsV0FBcEI7O0FBRUEsTUFBSVQsT0FBSixFQUFhO0FBQ1hDLElBQUFBLE9BQU8sQ0FBQ3ZFLFlBQVIsQ0FBcUIsU0FBckIsRUFBZ0NqQyxTQUFoQztBQUNBd0csSUFBQUEsT0FBTyxDQUFDdkUsWUFBUixDQUFxQixXQUFyQixFQUFrQyxNQUFsQztBQUNBdUUsSUFBQUEsT0FBTyxDQUFDeEIsU0FBUixDQUFrQkMsR0FBbEIsQ0FBc0IsU0FBdEI7QUFDRDs7QUFFRCxTQUFPdUIsT0FBUDtBQUNELENBbEREOztBQW9EQSxJQUFNcEcsZ0JBQWdCLEdBQUcsU0FBbkJBLGdCQUFtQixDQUFDRixLQUFELEVBQVFGLFNBQVIsRUFBbUJDLE1BQW5CLEVBQThCO0FBQ3JELE1BQU1rSCxhQUFhLEdBQUdwSSxRQUFRLENBQUMrRixhQUFULHNCQUFvQzlFLFNBQXBDLFNBQXRCOztBQUNBLE1BQUlFLEtBQUosRUFBVztBQUNULFFBQUlpSCxhQUFKLEVBQW1CO0FBQUU7QUFDbkIsVUFBTVQsSUFBSSxHQUFHUyxhQUFhLENBQUNyQyxhQUFkLENBQTRCLGNBQTVCLENBQWI7QUFDQTRCLE1BQUFBLElBQUksQ0FBQ3BFLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxVQUFNdUMsSUFBSSxHQUFHOUYsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixHQUF2QixDQUFiO0FBQ0FtQyxNQUFBQSxJQUFJLENBQUNHLFNBQUwsQ0FBZUMsR0FBZixDQUFtQixLQUFuQixFQUEwQix5QkFBMUI7QUFDQSxVQUFNbUMsU0FBUyxHQUFHckksUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixNQUF2QixDQUFsQjtBQUNBMEUsTUFBQUEsU0FBUyxDQUFDOUUsU0FBVixHQUFzQixnQkFBdEI7QUFDQW9FLE1BQUFBLElBQUksQ0FBQzFELFdBQUwsQ0FBaUI2QixJQUFqQjtBQUNBNkIsTUFBQUEsSUFBSSxDQUFDMUQsV0FBTCxDQUFpQm9FLFNBQWpCO0FBQ0FWLE1BQUFBLElBQUksQ0FBQzFCLFNBQUwsQ0FBZUMsR0FBZixDQUFtQixPQUFuQjtBQUNEO0FBQ0YsR0FaRCxNQVlPO0FBQ0wsUUFBTWUsRUFBRSxHQUFHakgsUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixjQUF4QixDQUFYOztBQUNBLFFBQUl3RixFQUFFLElBQUlwRixJQUFJLENBQUNwQyxVQUFmLEVBQTJCO0FBQUU7QUFDM0IsVUFBSTJJLGFBQUosRUFBbUI7QUFDakJBLFFBQUFBLGFBQWEsQ0FBQ25DLFNBQWQsQ0FBd0JFLE1BQXhCLENBQStCLFNBQS9COztBQUNBLFlBQU13QixLQUFJLEdBQUdTLGFBQWEsQ0FBQ3JDLGFBQWQsQ0FBNEIsY0FBNUIsQ0FBYjs7QUFDQSxZQUFNOEIsUUFBUSxHQUFHQyxVQUFVLENBQUMsSUFBSUMsSUFBSixDQUFTN0csTUFBTSxDQUFDOEcsU0FBaEIsQ0FBRCxDQUEzQjtBQUNBTCxRQUFBQSxLQUFJLENBQUNwRSxTQUFMLEdBQWlCc0UsUUFBakI7QUFDRCxPQUxELE1BS087QUFDTFQsUUFBQUEsZ0JBQWdCLENBQUNsRyxNQUFELEVBQVMsS0FBVCxDQUFoQjtBQUNEO0FBQ0Y7QUFDRjtBQUNGLENBM0JEO0FBNkJBOzs7OztBQUdBLElBQU0wQixjQUFjLEdBQUcsU0FBakJBLGNBQWlCLEdBQWtDO0FBQUEsTUFBakNuRCxVQUFpQyx1RUFBcEJvQyxJQUFJLENBQUNwQyxVQUFlO0FBQ3ZELE1BQU02SSxVQUFVLEdBQUd0SSxRQUFRLENBQUN5QixjQUFULENBQXdCLFlBQXhCLENBQW5CO0FBQ0EsTUFBTThHLEVBQUUsR0FBR3ZJLFFBQVEsQ0FBQzJELGFBQVQsQ0FBdUIsSUFBdkIsQ0FBWDtBQUNBNEUsRUFBQUEsRUFBRSxDQUFDaEYsU0FBSCxHQUFlOUQsVUFBVSxDQUFDNkIsSUFBMUI7QUFDQWdILEVBQUFBLFVBQVUsQ0FBQ3JFLFdBQVgsQ0FBdUJzRSxFQUF2QjtBQUNELENBTEQ7QUFPQTs7Ozs7QUFHQSxJQUFNbkYsV0FBVyxHQUFHLFNBQWRBLFdBQWMsQ0FBQzlCLElBQUQsRUFBT2tILEdBQVAsRUFBZTtBQUNqQ0EsRUFBQUEsR0FBRyxHQUFHQSxHQUFHLElBQUlqSSxNQUFNLENBQUNrSSxRQUFQLENBQWdCQyxJQUE3QjtBQUNBcEgsRUFBQUEsSUFBSSxHQUFHQSxJQUFJLENBQUNxSCxPQUFMLENBQWEsU0FBYixFQUF3QixNQUF4QixDQUFQO0FBQ0EsTUFBTUMsS0FBSyxHQUFHLElBQUlDLE1BQUosZUFBa0J2SCxJQUFsQix1QkFBZDtBQUdBLE1BQU13SCxPQUFPLEdBQUdGLEtBQUssQ0FBQ0csSUFBTixDQUFXUCxHQUFYLENBQWhCO0FBQ0EsTUFBSSxDQUFDTSxPQUFMLEVBQWMsT0FBTyxJQUFQO0FBQ2QsTUFBSSxDQUFDQSxPQUFPLENBQUMsQ0FBRCxDQUFaLEVBQWlCLE9BQU8sRUFBUDtBQUNqQixTQUFPRSxrQkFBa0IsQ0FBQ0YsT0FBTyxDQUFDLENBQUQsQ0FBUCxDQUFXSCxPQUFYLENBQW1CLEtBQW5CLEVBQTBCLEdBQTFCLENBQUQsQ0FBekI7QUFDRCxDQVZEOztBQVlBLElBQU1NLCtCQUErQixHQUFHLFNBQWxDQSwrQkFBa0MsQ0FBQ3BELE1BQUQsRUFBU3FELE9BQVQsRUFBcUI7QUFDM0RyRCxFQUFBQSxNQUFNLENBQUMzQyxZQUFQLENBQW9CLFVBQXBCLEVBQWdDLElBQWhDO0FBQ0EyQyxFQUFBQSxNQUFNLENBQUMzQyxZQUFQLENBQW9CLFdBQXBCLEVBQWlDLE1BQWpDO0FBQ0FnRyxFQUFBQSxPQUFPLENBQUNqRCxTQUFSLENBQWtCQyxHQUFsQixDQUFzQixNQUF0QjtBQUNELENBSkQ7O0FBTUEsSUFBTWlELGtDQUFrQyxHQUFHLFNBQXJDQSxrQ0FBcUMsQ0FBQ3RELE1BQUQsRUFBU3FELE9BQVQsRUFBcUI7QUFDOURyRCxFQUFBQSxNQUFNLENBQUNoQixlQUFQLENBQXVCLFVBQXZCO0FBQ0FnQixFQUFBQSxNQUFNLENBQUMzQyxZQUFQLENBQW9CLFdBQXBCLEVBQWlDLE9BQWpDO0FBQ0FnRyxFQUFBQSxPQUFPLENBQUNqRCxTQUFSLENBQWtCRSxNQUFsQixDQUF5QixNQUF6QjtBQUNELENBSkQ7O0FBTUEsSUFBTWlELDJCQUEyQixHQUFHLFNBQTlCQSwyQkFBOEIsR0FBTTtBQUN4QyxNQUFNL0MsV0FBVyxHQUFHRyxlQUFlLENBQUMzRSxJQUFJLENBQUNwQyxVQUFMLENBQWdCNkcsV0FBakIsQ0FBbkM7QUFDQSxNQUFNK0MsY0FBYyxHQUFJLENBQUNoRCxXQUFGLElBQWtCQSxXQUFXLEtBQUssT0FBekQ7QUFDQSxNQUFNaUQsWUFBWSxHQUFHekgsSUFBSSxDQUFDcEMsVUFBTCxDQUFnQmlELEVBQXJDO0FBQ0EsTUFBTW1ELE1BQU0sR0FBRzdGLFFBQVEsQ0FBQ3lCLGNBQVQsQ0FBd0IsbUJBQXhCLENBQWY7QUFDQSxNQUFNeUgsT0FBTyxHQUFHbEosUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixtQkFBeEIsQ0FBaEI7QUFDQSxNQUFJOEgsb0JBQUo7O0FBQ0EsTUFBSUYsY0FBSixFQUFvQjtBQUNsQnpELElBQUFBLHlCQUF5QixDQUFDQyxNQUFELENBQXpCO0FBQ0EwRCxJQUFBQSxvQkFBb0IsR0FBR25ELDJCQUF2QjtBQUNELEdBSEQsTUFHTztBQUNMQSxJQUFBQSwyQkFBMkIsQ0FBQ1AsTUFBRCxDQUEzQjtBQUNBMEQsSUFBQUEsb0JBQW9CLEdBQUczRCx5QkFBdkI7QUFDRDs7QUFDRHFELEVBQUFBLCtCQUErQixDQUFDcEQsTUFBRCxFQUFTcUQsT0FBVCxDQUEvQjtBQUNBckcsRUFBQUEsUUFBUSxDQUFDMkcsNEJBQVQsQ0FBc0NGLFlBQXRDLEVBQW9ERCxjQUFwRCxFQUFvRSxVQUFDbEksS0FBRCxFQUFRc0ksaUJBQVIsRUFBOEI7QUFDaEdOLElBQUFBLGtDQUFrQyxDQUFDdEQsTUFBRCxFQUFTcUQsT0FBVCxDQUFsQzs7QUFDQSxRQUFJLENBQUNPLGlCQUFMLEVBQXdCO0FBQ3RCN0gsTUFBQUEsT0FBTyxDQUFDVCxLQUFSLENBQWNBLEtBQWQ7QUFDQW9JLE1BQUFBLG9CQUFvQixDQUFDMUQsTUFBRCxDQUFwQjtBQUNBO0FBQ0Q7O0FBQ0RoRSxJQUFBQSxJQUFJLENBQUNwQyxVQUFMLEdBQWtCZ0ssaUJBQWxCO0FBQ0QsR0FSRDtBQVNELENBeEJEOztBQTBCQSxTQUFTbEksb0JBQVQsR0FBZ0M7QUFDOUIsTUFBTW1JLGdCQUFnQixHQUFHMUosUUFBUSxDQUFDeUIsY0FBVCxDQUF3QixrQkFBeEIsQ0FBekI7O0FBRUEsTUFBSXRCLFNBQVMsQ0FBQ0MsTUFBVixJQUFvQixDQUFDTCxtQkFBekIsRUFBOEM7QUFBRTtBQUM5Q3FCLElBQUFBLFlBQVksQ0FBQyxxQkFBRCxFQUF3QixTQUF4QixDQUFaO0FBQ0QsR0FGRCxNQUVPLElBQUksQ0FBQ2pCLFNBQVMsQ0FBQ0MsTUFBWCxJQUFxQkwsbUJBQXpCLEVBQThDO0FBQUU7QUFDckRxQixJQUFBQSxZQUFZLENBQUMsaUJBQUQsRUFBb0IsT0FBcEIsQ0FBWjtBQUNEOztBQUVEckIsRUFBQUEsbUJBQW1CLEdBQUdJLFNBQVMsQ0FBQ0MsTUFBaEM7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImxldCByZXN0YXVyYW50O1xubGV0IHJldmlld3M7XG5sZXQgb3V0Ym94UmV2aWV3cztcbmxldCBuZXdNYXA7XG5sZXQgbWF0Y2hlc01lZGlhUXVlcnk7XG5jb25zdCBtZWRpYVF1ZXJ5ID0gJyhtaW4td2lkdGg6IDgwMHB4KSc7XG5sZXQgcHJldmlvdXNseUNvbm5lY3RlZDtcblxuLyoqXG4gKiBJbml0aWFsaXplIG1hcCBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cbiAqL1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xuICBwcmV2aW91c2x5Q29ubmVjdGVkID0gbmF2aWdhdG9yLm9uTGluZTtcblxuICBpbml0TWFwKCk7XG4gIGZldGNoUmV2aWV3cygpO1xuICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICBtYXRjaGVzTWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKG1lZGlhUXVlcnkpLm1hdGNoZXM7XG4gIH1cbiAgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEoKTsgLy8gc2V0IGluaXRpYWwgYXJpYSB2YWx1ZXNcbiAgcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCk7XG4gIHNldEludGVydmFsKGNsZWFuTWFwYm94VGlsZXNDYWNoZSwgNTAwMCk7XG5cbiAgaWYgKG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSB7XG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgY29uc3Qge1xuICAgICAgICB0eXBlLCByZXF1ZXN0SWQsIHJldmlldywgZXJyb3IsXG4gICAgICB9ID0gZXZlbnQuZGF0YTtcbiAgICAgIGlmICh0eXBlID09PSAndXBkYXRlLXJldmlldycpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgZW5xdWV1ZVRvYXN0KCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBzdWJtaXR0aW5nIHlvdXIgcmV2aWV3JywgJ2Vycm9yJyk7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTCh0cnVlLCByZXF1ZXN0SWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVucXVldWVUb2FzdChgJHtyZXZpZXcubmFtZX0ncyByZXZpZXcgaGFzIGJlZW4gc2F2ZWRgLCAnc3VjY2VzcycpO1xuICAgICAgICAgIHVwZGF0ZVJldmlld0hUTUwoZmFsc2UsIHJlcXVlc3RJZCwgcmV2aWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKCdvbkxpbmUnIGluIG5hdmlnYXRvcikge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvbmxpbmUnLCBzaG93Q29ubmVjdGlvblN0YXR1cyk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCBzaG93Q29ubmVjdGlvblN0YXR1cyk7XG4gICAgc2hvd0Nvbm5lY3Rpb25TdGF0dXMoKTtcbiAgfVxuXG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Jyk7XG59KTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGxlYWZsZXQgbWFwXG4gKi9cbmNvbnN0IGluaXRNYXAgPSAoKSA9PiB7XG4gIGZldGNoUmVzdGF1cmFudEZyb21VUkwoKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgY29uc3QgTUFQQk9YX0FQSV9LRVkgPSAncGsuZXlKMUlqb2lZVzVsWlhOaExYTmhiR1ZvSWl3aVlTSTZJbU5xYTJ4bVpIVndNREZvWVc0emRuQXdZV3BsTW01M2JIRWlmUS5WMTFkRE90RW5XU3dUeFktQzhtSkx3JztcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYubmV3TWFwID0gTC5tYXAoJ21hcCcsIHtcbiAgICAgICAgY2VudGVyOiBbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAgICB6b29tOiAxNixcbiAgICAgICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgICAgTC50aWxlTGF5ZXIoJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20vdjQve2lkfS97en0ve3h9L3t5fS5qcGc3MD9hY2Nlc3NfdG9rZW49e21hcGJveFRva2VufScsIHtcbiAgICAgICAgbWFwYm94VG9rZW46IE1BUEJPWF9BUElfS0VZLFxuICAgICAgICBtYXhab29tOiAxOCxcbiAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJ1xuICAgICAgICAgICsgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJ1xuICAgICAgICAgICsgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXG4gICAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnLFxuICAgICAgfSkuYWRkVG8obmV3TWFwKTtcbiAgICAgIGZpbGxCcmVhZGNydW1iKCk7XG4gICAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5uZXdNYXApO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiogVXBkYXRlIGFyaWEtaGlkZGVuIHZhbHVlcyBvZiB0aGUgdmlzaWJsZSBhbmQgYWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiovXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICBjb25zdCBuZXh0TWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICAgIGlmIChuZXh0TWF0Y2hlc01lZGlhUXVlcnkgIT09IG1hdGNoZXNNZWRpYVF1ZXJ5KSB7IC8vIG9ubHkgdXBkYXRlIGFyaWEgd2hlbiBsYXlvdXQgY2hhbmdlc1xuICAgICAgbWF0Y2hlc01lZGlhUXVlcnkgPSBuZXh0TWF0Y2hlc01lZGlhUXVlcnk7XG4gICAgICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpO1xuICAgIH1cbiAgfVxufSk7XG5cbi8qKlxuKiBTZXQgYXJpYS1oaWRkZW4gdmFsdWVzIGZvciB2aXNpYmxlIGFuZCByZWd1bGFyIHJlc3RhdXJhbnQgY29udGFpbmVyc1xuKiBBY2Nlc3NpYmxlIHJlc3RhdXJhbnQgY29udGFpbmVyIGlzIG9mZiBzY3JlZW5cbiogSXQgaXMgcmVxdWlyZWQgdG8gbWFpbnRhaW4gc2NyZWVuIHJlYWRpbmcgb3JkZXIgd2hlbiB0aGUgbGF5b3V0IHNoaWZ0c1xuKi9cbmNvbnN0IHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhID0gKCkgPT4ge1xuICBjb25zdCByZXN0YXVyYW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1jb250YWluZXInKTtcbiAgaWYgKG1hdGNoZXNNZWRpYVF1ZXJ5KSB7IC8vIGxhcmdlciBsYXlvdXQsIHNjcmVlbiByZWFkaW5nIG9yZGVyIG9mZlxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICB9IGVsc2UgeyAvLyB1c2UgcmVndWxhciByZWFkaW5nIG9yZGVyXG4gICAgcmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMID0gKGNhbGxiYWNrKSA9PiB7XG4gIGlmIChzZWxmLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXG4gICAgY2FsbGJhY2sobnVsbCwgc2VsZi5yZXN0YXVyYW50KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaWQgPSBnZXRVcmxQYXJhbSgnaWQnKTtcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcbiAgICBlcnJvciA9ICdObyByZXN0YXVyYW50IGlkIGluIFVSTCc7XG4gICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcbiAgICAgIGlmICghcmVzdGF1cmFudCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJlc3RhdXJhbnRIVE1MKCk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2VcbiAqL1xuY29uc3QgZmlsbFJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XG5cbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWFkZHJlc3MnKTtcbiAgYWRkcmVzcy5pbm5lckhUTUwgKz0gcmVzdGF1cmFudC5hZGRyZXNzO1xuXG4gIGNvbnN0IHBpY3R1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1waWN0dXJlJyk7XG5cbiAgY29uc3Qgc291cmNlTGFyZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTGFyZ2UubWVkaWEgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbiAgc291cmNlTGFyZ2Uuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ2xhcmdlJywgd2lkZTogdHJ1ZSB9KTtcbiAgc291cmNlTGFyZ2UudHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VMYXJnZSk7XG5cbiAgY29uc3Qgc291cmNlTWVkaXVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZU1lZGl1bS5tZWRpYSA9ICcobWluLXdpZHRoOiA2MDBweCknO1xuICBzb3VyY2VNZWRpdW0uc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ21lZGl1bScgfSk7XG4gIHNvdXJjZU1lZGl1bS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZU1lZGl1bSk7XG5cbiAgY29uc3Qgc291cmNlU21hbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlU21hbGwuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ3NtYWxsJyB9KTtcbiAgc291cmNlU21hbGwudHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VTbWFsbCk7XG5cbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcbiAgLy8gc2V0IGRlZmF1bHQgc2l6ZSBpbiBjYXNlIHBpY3R1cmUgZWxlbWVudCBpcyBub3Qgc3VwcG9ydGVkXG4gIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcbiAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5hbHQ7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoaW1hZ2UpO1xuXG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWltZycpO1xuICBhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHJlc3RhdXJhbnQuYWx0KTtcblxuICBjb25zdCBjdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY3Vpc2luZScpO1xuICBjdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZS5pbm5lckhUTUwgPSBgQ3Vpc2luZTogJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gO1xuXG4gIGNvbnN0IGFkZFJldmlld0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LWJ1dHRvbicpO1xuICBhZGRSZXZpZXdCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgYEFkZCBhIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XG4gIGFkZFJldmlld0J1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG5cbiAgY29uc3QgYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1vdmVybGF5LWhlYWRpbmcnKTtcbiAgYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmcuaW5uZXJIVE1MID0gYEFkZCByZXZpZXcgZm9yICR7cmVzdGF1cmFudC5uYW1lfWA7XG5cbiAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcbiAgaWYgKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XG4gICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChyZXN0YXVyYW50LCAnaXNfZmF2b3JpdGUnKSkge1xuICAgIGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MKCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgb3BlcmF0aW5nIGhvdXJzIEhUTUwgdGFibGUgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XG4gIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaG91cnMnKTtcbiAgZm9yIChjb25zdCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wZXJhdGluZ0hvdXJzLCBrZXkpKSB7XG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXG4gICAgICBjb25zdCBkYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgZGF5LmlubmVySFRNTCA9IGtleTtcbiAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xuXG4gICAgICBjb25zdCB0aW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcbiAgICAgIHJvdy5hcHBlbmRDaGlsZCh0aW1lKTtcblxuICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoYnV0dG9uKSA9PiB7XG4gIGNvbnN0IGljb24gPSBidXR0b24ucXVlcnlTZWxlY3RvcignaScpO1xuICBjb25zdCB0ZXh0ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcbiAgdGV4dC5pbm5lckhUTUwgPSAnVW5tYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmFyJywgJ3VubWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbmNvbnN0IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgY29uc3QgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIGNvbnN0IHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdNYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgbm90IGN1cnJlbnRseSBtYXJrZWQgYXMgZmF2b3VyaXRlJyk7XG59O1xuXG4vKipcbiAqIFNldCBzdGF0ZSBhbmQgdGV4dCBmb3IgbWFyayBhcyBmYXZvdXJpdGUgYnV0dG9uLlxuICovXG5jb25zdCBmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCA9IChpc0Zhdm91cml0ZSA9IHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSkgPT4ge1xuICBjb25zdCBmYXZvdXJpdGVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFyay1hcy1mYXZvdXJpdGUnKTtcbiAgaWYgKHN0cmluZ1RvQm9vbGVhbihpc0Zhdm91cml0ZSkpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBmZXRjaFJldmlld3MgPSAoKSA9PiB7XG4gIGNvbnN0IGlkID0gZ2V0VXJsUGFyYW0oJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgY29uc29sZS5sb2coJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJyk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQoaWQsIChlcnJvciwgcmV2aWV3cykgPT4ge1xuICAgICAgc2VsZi5yZXZpZXdzID0gcmV2aWV3cztcbiAgICAgIGlmICghcmV2aWV3cykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJldmlld3NIVE1MKCk7XG4gICAgICBEQkhlbHBlci5nZXRPdXRib3hSZXZpZXdzKGlkLCAoZXJyb3IsIG91dGJveFJldmlld3MpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYub3V0Ym94UmV2aWV3cyA9IG91dGJveFJldmlld3M7XG4gICAgICAgICAgZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXZpZXdzKSA9PiB7XG4gIGlmICghcmV2aWV3cyB8fCByZXZpZXdzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICByZXZpZXdzLmZvckVhY2goKHJldmlldykgPT4ge1xuICAgIHVsLmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldyksIHVsLmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbmNvbnN0IGZpbGxTZW5kaW5nUmV2aWV3c0hUTUwgPSAob3V0Ym94UmV2aWV3cyA9IHNlbGYub3V0Ym94UmV2aWV3cykgPT4ge1xuICBpZiAoIW91dGJveFJldmlld3MgfHwgb3V0Ym94UmV2aWV3cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgb3V0Ym94UmV2aWV3cy5mb3JFYWNoKChvdXRib3hSZXZpZXcpID0+IHtcbiAgICBjb25zdCB7IHJlcXVlc3RfaWQsIC4uLnJldmlldyB9ID0gb3V0Ym94UmV2aWV3O1xuICAgIHVsLmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgdHJ1ZSwgcmVxdWVzdF9pZCksIHVsLmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3LCBzZW5kaW5nLCByZXF1ZXN0SWQpID0+IHtcbiAgY29uc3QgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgYXJ0aWNsZS5jbGFzc05hbWUgPSAncmV2aWV3JztcblxuICBjb25zdCBoZWFkZXJTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBoZWFkZXJTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctaGVhZGVyJztcblxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xuICBuYW1lLmNsYXNzTmFtZSA9ICdyZXZpZXctbmFtZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQobmFtZSk7XG5cbiAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAnZmEtY2xvY2snKTtcbiAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsb2FkaW5nVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyc7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICBkYXRlLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkYXRlVGV4dCA9IGZvcm1hdERhdGUobmV3IERhdGUocmV2aWV3LnVwZGF0ZWRBdCkpO1xuICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gIH1cblxuICBkYXRlLmNsYXNzTmFtZSA9ICdyZXZpZXctZGF0ZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQoZGF0ZSk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoaGVhZGVyU3Bhbik7XG5cbiAgY29uc3QgY29udGVudFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGNvbnRlbnRTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctY29udGVudCc7XG5cbiAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XG4gIHJhdGluZy5jbGFzc05hbWUgPSAncmV2aWV3LXJhdGluZyc7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKHJhdGluZyk7XG5cbiAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGNvbnRlbnRTcGFuKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdkYXRhLWlkJywgcmVxdWVzdElkKTtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NlbmRpbmcnKTtcbiAgfVxuXG4gIHJldHVybiBhcnRpY2xlO1xufTtcblxuY29uc3QgdXBkYXRlUmV2aWV3SFRNTCA9IChlcnJvciwgcmVxdWVzdElkLCByZXZpZXcpID0+IHtcbiAgY29uc3QgcmV2aWV3RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtyZXF1ZXN0SWR9XCJdYCk7XG4gIGlmIChlcnJvcikge1xuICAgIGlmIChyZXZpZXdFbGVtZW50KSB7IC8vIGZvciBlcnJvciwgbm8gbmVlZCB0byBhZGQgdG8gVUkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICBkYXRlLmlubmVySFRNTCA9ICcnO1xuICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFzJywgJ2ZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyk7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBlcnJvclRleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcgZmFpbGVkJztcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICBkYXRlLmFwcGVuZENoaWxkKGVycm9yVGV4dCk7XG4gICAgICBkYXRlLmNsYXNzTGlzdC5hZGQoJ2Vycm9yJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICAgIGlmICh1bCAmJiBzZWxmLnJlc3RhdXJhbnQpIHsgLy8gb25seSB1cGRhdGUgaWYgdGhlIHJlc3RhdXJhbnQgaXMgbG9hZGVkXG4gICAgICBpZiAocmV2aWV3RWxlbWVudCkge1xuICAgICAgICByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbmRpbmcnKTtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICAgIGNvbnN0IGRhdGVUZXh0ID0gZm9ybWF0RGF0ZShuZXcgRGF0ZShyZXZpZXcudXBkYXRlZEF0KSk7XG4gICAgICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBBZGQgcmVzdGF1cmFudCBuYW1lIHRvIHRoZSBicmVhZGNydW1iIG5hdmlnYXRpb24gbWVudVxuICovXG5jb25zdCBmaWxsQnJlYWRjcnVtYiA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gIGNvbnN0IGJyZWFkY3J1bWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnJlYWRjcnVtYicpO1xuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gIGxpLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcbiAgYnJlYWRjcnVtYi5hcHBlbmRDaGlsZChsaSk7XG59O1xuXG4vKipcbiAqIEdldCBhIHBhcmFtZXRlciBieSBuYW1lIGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGdldFVybFBhcmFtID0gKG5hbWUsIHVybCkgPT4ge1xuICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKTtcbiAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBbPyZdJHtuYW1lfSg9KFteJiNdKil8JnwjfCQpYCk7XG5cblxuICBjb25zdCByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xuICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiAnJztcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbn07XG5cbmNvbnN0IHNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICd0cnVlJyk7XG4gIHNwaW5uZXIuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufTtcblxuY29uc3QgcmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ2ZhbHNlJyk7XG4gIHNwaW5uZXIuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufTtcblxuY29uc3QgdG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKCkgPT4ge1xuICBjb25zdCBpc0Zhdm91cml0ZSA9IHN0cmluZ1RvQm9vbGVhbihzZWxmLnJlc3RhdXJhbnQuaXNfZmF2b3JpdGUpO1xuICBjb25zdCBuZXdJc0Zhdm91cml0ZSA9ICghaXNGYXZvdXJpdGUpICYmIGlzRmF2b3VyaXRlICE9PSAnZmFsc2UnO1xuICBjb25zdCByZXN0YXVyYW50SWQgPSBzZWxmLnJlc3RhdXJhbnQuaWQ7XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zhdm91cml0ZS1zcGlubmVyJyk7XG4gIGxldCBmYWlsZWRVcGRhdGVDYWxsYmFjaztcbiAgaWYgKG5ld0lzRmF2b3VyaXRlKSB7XG4gICAgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICB9IGVsc2Uge1xuICAgIHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgfVxuICBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gIERCSGVscGVyLnNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMocmVzdGF1cmFudElkLCBuZXdJc0Zhdm91cml0ZSwgKGVycm9yLCB1cGRhdGVkUmVzdGF1cmFudCkgPT4ge1xuICAgIHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgICBpZiAoIXVwZGF0ZWRSZXN0YXVyYW50KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrKGJ1dHRvbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYucmVzdGF1cmFudCA9IHVwZGF0ZWRSZXN0YXVyYW50O1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIHNob3dDb25uZWN0aW9uU3RhdHVzKCkge1xuICBjb25zdCBjb25uZWN0aW9uU3RhdHVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nvbm5lY3Rpb25TdGF0dXMnKTtcblxuICBpZiAobmF2aWdhdG9yLm9uTGluZSAmJiAhcHJldmlvdXNseUNvbm5lY3RlZCkgeyAvLyB1c2VyIGNhbWUgYmFjayBvbmxpbmVcbiAgICBlbnF1ZXVlVG9hc3QoJ1lvdSBhcmUgYmFjayBvbmxpbmUnLCAnc3VjY2VzcycpO1xuICB9IGVsc2UgaWYgKCFuYXZpZ2F0b3Iub25MaW5lICYmIHByZXZpb3VzbHlDb25uZWN0ZWQpIHsgLy8gdXNlciB3ZW50IG9mZmxpbmVcbiAgICBlbnF1ZXVlVG9hc3QoJ1lvdSBhcmUgb2ZmbGluZScsICdlcnJvcicpO1xuICB9XG5cbiAgcHJldmlvdXNseUNvbm5lY3RlZCA9IG5hdmlnYXRvci5vbkxpbmU7XG59XG4iXSwiZmlsZSI6InJlc3RhdXJhbnRfaW5mby5qcyJ9

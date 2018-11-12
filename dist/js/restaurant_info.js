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
  var successMessage;
  var errorMessage;

  if (newIsFavourite) {
    markRestaurantAsFavourite(button);
    failedUpdateCallback = unmarkRestaurantAsFavourite;
    successMessage = 'Restaurant has been marked as favourite';
    errorMessage = 'An error occurred marking restaurant as favourite';
  } else {
    unmarkRestaurantAsFavourite(button);
    failedUpdateCallback = markRestaurantAsFavourite;
    successMessage = 'Restaurant has been unmarked as favourite';
    errorMessage = 'An error occurred unmarking restaurant as favourite';
  }

  setMarkAsFavouriteFetchingState(button, spinner);
  DBHelper.setRestaurantFavouriteStatus(restaurantId, newIsFavourite, function (error, updatedRestaurant) {
    removeMarkAsFavouriteFetchingState(button, spinner);

    if (!updatedRestaurant) {
      console.error(error);
      failedUpdateCallback(button);
      enqueueToast(errorMessage, 'error');
      return;
    }

    self.restaurant = updatedRestaurant;
    enqueueToast(successMessage, 'success');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Q29ubmVjdGVkIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJuYXZpZ2F0b3IiLCJvbkxpbmUiLCJpbml0TWFwIiwiZmV0Y2hSZXZpZXdzIiwid2luZG93IiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJ1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSIsInJlZ2lzdGVyU2VydmljZVdvcmtlciIsInNldEludGVydmFsIiwiY2xlYW5NYXBib3hUaWxlc0NhY2hlIiwic2VydmljZVdvcmtlciIsImRhdGEiLCJ0eXBlIiwicmVxdWVzdElkIiwicmV2aWV3IiwiZXJyb3IiLCJlbnF1ZXVlVG9hc3QiLCJ1cGRhdGVSZXZpZXdIVE1MIiwibmFtZSIsInNob3dDb25uZWN0aW9uU3RhdHVzIiwidG9hc3QiLCJnZXRFbGVtZW50QnlJZCIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJNQVBCT1hfQVBJX0tFWSIsImNvbnNvbGUiLCJzZWxmIiwiTCIsIm1hcCIsImNlbnRlciIsImxhdGxuZyIsImxhdCIsImxuZyIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXBib3hUb2tlbiIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImlkIiwiYWRkVG8iLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm5leHRNYXRjaGVzTWVkaWFRdWVyeSIsInJlc3RhdXJhbnRDb250YWluZXIiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciIsInNldEF0dHJpYnV0ZSIsImNhbGxiYWNrIiwiZ2V0VXJsUGFyYW0iLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiaW5uZXJIVE1MIiwiYWRkcmVzcyIsInBpY3R1cmUiLCJzb3VyY2VMYXJnZSIsImNyZWF0ZUVsZW1lbnQiLCJtZWRpYSIsInNyY3NldCIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsInNpemUiLCJ3aWRlIiwiYXBwZW5kQ2hpbGQiLCJzb3VyY2VNZWRpdW0iLCJzb3VyY2VTbWFsbCIsImltYWdlIiwiY2xhc3NOYW1lIiwic3JjIiwiYWx0IiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSIsImN1aXNpbmUiLCJjdWlzaW5lX3R5cGUiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUiLCJhZGRSZXZpZXdCdXR0b24iLCJyZW1vdmVBdHRyaWJ1dGUiLCJhZGRSZXZpZXdPdmVybGF5SGVhZGluZyIsIm9wZXJhdGluZ19ob3VycyIsImZpbGxSZXN0YXVyYW50SG91cnNIVE1MIiwiT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwiLCJvcGVyYXRpbmdIb3VycyIsImhvdXJzIiwia2V5IiwicHJvdG90eXBlIiwicm93IiwiZGF5IiwidGltZSIsIm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJidXR0b24iLCJpY29uIiwicXVlcnlTZWxlY3RvciIsInRleHQiLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJ1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJpc0Zhdm91cml0ZSIsImlzX2Zhdm9yaXRlIiwiZmF2b3VyaXRlQnV0dG9uIiwic3RyaW5nVG9Cb29sZWFuIiwibG9nIiwiZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQiLCJmaWxsUmV2aWV3c0hUTUwiLCJnZXRPdXRib3hSZXZpZXdzIiwiZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCIsImxlbmd0aCIsIm5vUmV2aWV3cyIsImNvbnRhaW5lciIsInVsIiwiZm9yRWFjaCIsImluc2VydEJlZm9yZSIsImNyZWF0ZVJldmlld0hUTUwiLCJmaXJzdENoaWxkIiwib3V0Ym94UmV2aWV3IiwicmVxdWVzdF9pZCIsInNlbmRpbmciLCJhcnRpY2xlIiwiaGVhZGVyU3BhbiIsImRhdGUiLCJsb2FkaW5nVGV4dCIsImRhdGVUZXh0IiwiZm9ybWF0RGF0ZSIsIkRhdGUiLCJ1cGRhdGVkQXQiLCJjb250ZW50U3BhbiIsInJhdGluZyIsImNvbW1lbnRzIiwicmV2aWV3RWxlbWVudCIsImVycm9yVGV4dCIsImJyZWFkY3J1bWIiLCJsaSIsInVybCIsImxvY2F0aW9uIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInNwaW5uZXIiLCJyZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwidG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwibmV3SXNGYXZvdXJpdGUiLCJyZXN0YXVyYW50SWQiLCJmYWlsZWRVcGRhdGVDYWxsYmFjayIsInN1Y2Nlc3NNZXNzYWdlIiwiZXJyb3JNZXNzYWdlIiwic2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyIsInVwZGF0ZWRSZXN0YXVyYW50IiwiY29ubmVjdGlvblN0YXR1cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBSUEsVUFBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxhQUFKO0FBQ0EsSUFBSUMsTUFBSjtBQUNBLElBQUlDLGlCQUFKO0FBQ0EsSUFBTUMsVUFBVSxHQUFHLG9CQUFuQjtBQUNBLElBQUlDLG1CQUFKO0FBRUE7Ozs7QUFHQUMsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3ZESCxFQUFBQSxtQkFBbUIsR0FBR0ksU0FBUyxDQUFDQyxNQUFoQztBQUVBQyxFQUFBQSxPQUFPO0FBQ1BDLEVBQUFBLFlBQVk7O0FBQ1osTUFBSUMsTUFBTSxDQUFDQyxVQUFYLEVBQXVCO0FBQ3JCWCxJQUFBQSxpQkFB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O0FBQ0Q1SCxJQUFBQSxJQUFJLENBQUNwQyxVQUFMLEdBQWtCa0ssaUJBQWxCO0FBQ0F2SSxJQUFBQSxZQUFZLENBQUNvSSxjQUFELEVBQWlCLFNBQWpCLENBQVo7QUFDRCxHQVZEO0FBV0QsQ0FoQ0Q7O0FBa0NBLFNBQVNqSSxvQkFBVCxHQUFnQztBQUM5QixNQUFNcUksZ0JBQWdCLEdBQUc1SixRQUFRLENBQUN5QixjQUFULENBQXdCLGtCQUF4QixDQUF6Qjs7QUFFQSxNQUFJdEIsU0FBUyxDQUFDQyxNQUFWLElBQW9CLENBQUNMLG1CQUF6QixFQUE4QztBQUFFO0FBQzlDcUIsSUFBQUEsWUFBWSxDQUFDLHFCQUFELEVBQXdCLFNBQXhCLENBQVo7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDakIsU0FBUyxDQUFDQyxNQUFYLElBQXFCTCxtQkFBekIsRUFBOEM7QUFBRTtBQUNyRHFCLElBQUFBLFlBQVksQ0FBQyxpQkFBRCxFQUFvQixPQUFwQixDQUFaO0FBQ0Q7O0FBRURyQixFQUFBQSxtQkFBbUIsR0FBR0ksU0FBUyxDQUFDQyxNQUFoQztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsibGV0IHJlc3RhdXJhbnQ7XG5sZXQgcmV2aWV3cztcbmxldCBvdXRib3hSZXZpZXdzO1xubGV0IG5ld01hcDtcbmxldCBtYXRjaGVzTWVkaWFRdWVyeTtcbmNvbnN0IG1lZGlhUXVlcnkgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbmxldCBwcmV2aW91c2x5Q29ubmVjdGVkO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWFwIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gIHByZXZpb3VzbHlDb25uZWN0ZWQgPSBuYXZpZ2F0b3Iub25MaW5lO1xuXG4gIGluaXRNYXAoKTtcbiAgZmV0Y2hSZXZpZXdzKCk7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgfVxuICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpOyAvLyBzZXQgaW5pdGlhbCBhcmlhIHZhbHVlc1xuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgc2V0SW50ZXJ2YWwoY2xlYW5NYXBib3hUaWxlc0NhY2hlLCA1MDAwKTtcblxuICBpZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHR5cGUsIHJlcXVlc3RJZCwgcmV2aWV3LCBlcnJvcixcbiAgICAgIH0gPSBldmVudC5kYXRhO1xuICAgICAgaWYgKHR5cGUgPT09ICd1cGRhdGUtcmV2aWV3Jykge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBlbnF1ZXVlVG9hc3QoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHN1Ym1pdHRpbmcgeW91ciByZXZpZXcnLCAnZXJyb3InKTtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKHRydWUsIHJlcXVlc3RJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW5xdWV1ZVRvYXN0KGAke3Jldmlldy5uYW1lfSdzIHJldmlldyBoYXMgYmVlbiBzYXZlZGAsICdzdWNjZXNzJyk7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTChmYWxzZSwgcmVxdWVzdElkLCByZXZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBpZiAoJ29uTGluZScgaW4gbmF2aWdhdG9yKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIHNob3dDb25uZWN0aW9uU3RhdHVzKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIHNob3dDb25uZWN0aW9uU3RhdHVzKTtcbiAgICBzaG93Q29ubmVjdGlvblN0YXR1cygpO1xuICB9XG5cbiAgY29uc3QgdG9hc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QnKTtcbn0pO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbGVhZmxldCBtYXBcbiAqL1xuY29uc3QgaW5pdE1hcCA9ICgpID0+IHtcbiAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCgoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcbiAgICBjb25zdCBNQVBCT1hfQVBJX0tFWSA9ICdway5leUoxSWpvaVlXNWxaWE5oTFhOaGJHVm9JaXdpWVNJNkltTnFhMnhtWkhWd01ERm9ZVzR6ZG5Bd1lXcGxNbTUzYkhFaWZRLlYxMWRET3RFbldTd1R4WS1DOG1KTHcnO1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5uZXdNYXAgPSBMLm1hcCgnbWFwJywge1xuICAgICAgICBjZW50ZXI6IFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXG4gICAgICAgIHpvb206IDE2LFxuICAgICAgICBzY3JvbGxXaGVlbFpvb206IGZhbHNlLFxuICAgICAgfSk7XG4gICAgICBMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LmpwZzcwP2FjY2Vzc190b2tlbj17bWFwYm94VG9rZW59Jywge1xuICAgICAgICBtYXBib3hUb2tlbjogTUFQQk9YX0FQSV9LRVksXG4gICAgICAgIG1heFpvb206IDE4LFxuICAgICAgICBhdHRyaWJ1dGlvbjogJ01hcCBkYXRhICZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAnXG4gICAgICAgICAgKyAnPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8yLjAvXCI+Q0MtQlktU0E8L2E+LCAnXG4gICAgICAgICAgKyAnSW1hZ2VyeSDCqSA8YSBocmVmPVwiaHR0cHM6Ly93d3cubWFwYm94LmNvbS9cIj5NYXBib3g8L2E+JyxcbiAgICAgICAgaWQ6ICdtYXBib3guc3RyZWV0cycsXG4gICAgICB9KS5hZGRUbyhuZXdNYXApO1xuICAgICAgZmlsbEJyZWFkY3J1bWIoKTtcbiAgICAgIERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQoc2VsZi5yZXN0YXVyYW50LCBzZWxmLm5ld01hcCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuKiBVcGRhdGUgYXJpYS1oaWRkZW4gdmFsdWVzIG9mIHRoZSB2aXNpYmxlIGFuZCBhY2Nlc3NpYmxlIHJlc3RhdXJhbnQgY29udGFpbmVyc1xuKi9cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIGNvbnN0IG5leHRNYXRjaGVzTWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKG1lZGlhUXVlcnkpLm1hdGNoZXM7XG4gICAgaWYgKG5leHRNYXRjaGVzTWVkaWFRdWVyeSAhPT0gbWF0Y2hlc01lZGlhUXVlcnkpIHsgLy8gb25seSB1cGRhdGUgYXJpYSB3aGVuIGxheW91dCBjaGFuZ2VzXG4gICAgICBtYXRjaGVzTWVkaWFRdWVyeSA9IG5leHRNYXRjaGVzTWVkaWFRdWVyeTtcbiAgICAgIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7XG4gICAgfVxuICB9XG59KTtcblxuLyoqXG4qIFNldCBhcmlhLWhpZGRlbiB2YWx1ZXMgZm9yIHZpc2libGUgYW5kIHJlZ3VsYXIgcmVzdGF1cmFudCBjb250YWluZXJzXG4qIEFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXIgaXMgb2ZmIHNjcmVlblxuKiBJdCBpcyByZXF1aXJlZCB0byBtYWludGFpbiBzY3JlZW4gcmVhZGluZyBvcmRlciB3aGVuIHRoZSBsYXlvdXQgc2hpZnRzXG4qL1xuY29uc3QgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEgPSAoKSA9PiB7XG4gIGNvbnN0IHJlc3RhdXJhbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jb250YWluZXInKTtcbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBpZiAobWF0Y2hlc01lZGlhUXVlcnkpIHsgLy8gbGFyZ2VyIGxheW91dCwgc2NyZWVuIHJlYWRpbmcgb3JkZXIgb2ZmXG4gICAgcmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gIH0gZWxzZSB7IC8vIHVzZSByZWd1bGFyIHJlYWRpbmcgb3JkZXJcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmVzdGF1cmFudEZyb21VUkwgPSAoY2FsbGJhY2spID0+IHtcbiAgaWYgKHNlbGYucmVzdGF1cmFudCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcbiAgICBjYWxsYmFjayhudWxsLCBzZWxmLnJlc3RhdXJhbnQpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpZCA9IGdldFVybFBhcmFtKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJztcbiAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgICBzZWxmLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xuICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcblxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xuICBhZGRyZXNzLmlubmVySFRNTCArPSByZXN0YXVyYW50LmFkZHJlc3M7XG5cbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LXBpY3R1cmUnKTtcblxuICBjb25zdCBzb3VyY2VMYXJnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VMYXJnZS5tZWRpYSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xuICBzb3VyY2VMYXJnZS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbGFyZ2UnLCB3aWRlOiB0cnVlIH0pO1xuICBzb3VyY2VMYXJnZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZUxhcmdlKTtcblxuICBjb25zdCBzb3VyY2VNZWRpdW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTWVkaXVtLm1lZGlhID0gJyhtaW4td2lkdGg6IDYwMHB4KSc7XG4gIHNvdXJjZU1lZGl1bS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbWVkaXVtJyB9KTtcbiAgc291cmNlTWVkaXVtLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTWVkaXVtKTtcblxuICBjb25zdCBzb3VyY2VTbWFsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VTbWFsbC5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnc21hbGwnIH0pO1xuICBzb3VyY2VTbWFsbC50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZVNtYWxsKTtcblxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xuICAvLyBzZXQgZGVmYXVsdCBzaXplIGluIGNhc2UgcGljdHVyZSBlbGVtZW50IGlzIG5vdCBzdXBwb3J0ZWRcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xuICBpbWFnZS5hbHQgPSByZXN0YXVyYW50LmFsdDtcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtaW1nJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgcmVzdGF1cmFudC5hbHQpO1xuXG4gIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctYnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgQWRkIGEgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcblxuICBjb25zdCBhZGRSZXZpZXdPdmVybGF5SGVhZGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LW92ZXJsYXktaGVhZGluZycpO1xuICBhZGRSZXZpZXdPdmVybGF5SGVhZGluZy5pbm5lckhUTUwgPSBgQWRkIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YDtcblxuICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xuICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcbiAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3RhdXJhbnQsICdpc19mYXZvcml0ZScpKSB7XG4gICAgZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcbiAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3BlcmF0aW5nSG91cnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XG5cbiAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xuXG4gICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgY29uc3QgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIGNvbnN0IHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdVbm1hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBjdXJyZW50bHkgbWFya2VkIGFzIGZhdm91cml0ZScpO1xufTtcblxuY29uc3QgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKGJ1dHRvbikgPT4ge1xuICBjb25zdCBpY29uID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgY29uc3QgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ01hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBub3QgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbi8qKlxuICogU2V0IHN0YXRlIGFuZCB0ZXh0IGZvciBtYXJrIGFzIGZhdm91cml0ZSBidXR0b24uXG4gKi9cbmNvbnN0IGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MID0gKGlzRmF2b3VyaXRlID0gc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKSA9PiB7XG4gIGNvbnN0IGZhdm91cml0ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBpZiAoc3RyaW5nVG9Cb29sZWFuKGlzRmF2b3VyaXRlKSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmV2aWV3cyA9ICgpID0+IHtcbiAgY29uc3QgaWQgPSBnZXRVcmxQYXJhbSgnaWQnKTtcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcbiAgICBjb25zb2xlLmxvZygnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnKTtcbiAgfSBlbHNlIHtcbiAgICBEQkhlbHBlci5mZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZChpZCwgKGVycm9yLCByZXZpZXdzKSA9PiB7XG4gICAgICBzZWxmLnJldmlld3MgPSByZXZpZXdzO1xuICAgICAgaWYgKCFyZXZpZXdzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmV2aWV3c0hUTUwoKTtcbiAgICAgIERCSGVscGVyLmdldE91dGJveFJldmlld3MoaWQsIChlcnJvciwgb3V0Ym94UmV2aWV3cykgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5vdXRib3hSZXZpZXdzID0gb3V0Ym94UmV2aWV3cztcbiAgICAgICAgICBmaWxsU2VuZGluZ1Jldmlld3NIVE1MKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbGwgcmV2aWV3cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgZmlsbFJldmlld3NIVE1MID0gKHJldmlld3MgPSBzZWxmLnJldmlld3MpID0+IHtcbiAgaWYgKCFyZXZpZXdzIHx8IHJldmlld3MubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIHJldmlld3MuZm9yRWFjaCgocmV2aWV3KSA9PiB7XG4gICAgdWwuaW5zZXJ0QmVmb3JlKGNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSwgdWwuZmlyc3RDaGlsZCk7XG4gIH0pO1xufTtcblxuY29uc3QgZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCA9IChvdXRib3hSZXZpZXdzID0gc2VsZi5vdXRib3hSZXZpZXdzKSA9PiB7XG4gIGlmICghb3V0Ym94UmV2aWV3cyB8fCBvdXRib3hSZXZpZXdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICBvdXRib3hSZXZpZXdzLmZvckVhY2goKG91dGJveFJldmlldykgPT4ge1xuICAgIGNvbnN0IHsgcmVxdWVzdF9pZCwgLi4ucmV2aWV3IH0gPSBvdXRib3hSZXZpZXc7XG4gICAgdWwuaW5zZXJ0QmVmb3JlKGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCB0cnVlLCByZXF1ZXN0X2lkKSwgdWwuZmlyc3RDaGlsZCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgcmV2aWV3IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgY3JlYXRlUmV2aWV3SFRNTCA9IChyZXZpZXcsIHNlbmRpbmcsIHJlcXVlc3RJZCkgPT4ge1xuICBjb25zdCBhcnRpY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXJ0aWNsZScpO1xuICBhcnRpY2xlLmNsYXNzTmFtZSA9ICdyZXZpZXcnO1xuXG4gIGNvbnN0IGhlYWRlclNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGhlYWRlclNwYW4uY2xhc3NOYW1lID0gJ3Jldmlldy1oZWFkZXInO1xuXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIG5hbWUuaW5uZXJIVE1MID0gcmV2aWV3Lm5hbWU7XG4gIG5hbWUuY2xhc3NOYW1lID0gJ3Jldmlldy1uYW1lJztcbiAgaGVhZGVyU3Bhbi5hcHBlbmRDaGlsZChuYW1lKTtcblxuICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXG4gIGlmIChzZW5kaW5nKSB7XG4gICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICdmYS1jbG9jaycpO1xuICAgIGNvbnN0IGxvYWRpbmdUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxvYWRpbmdUZXh0LmlubmVySFRNTCA9ICdTZW5kaW5nJztcbiAgICBkYXRlLmFwcGVuZENoaWxkKGljb24pO1xuICAgIGRhdGUuYXBwZW5kQ2hpbGQobG9hZGluZ1RleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRhdGVUZXh0ID0gZm9ybWF0RGF0ZShuZXcgRGF0ZShyZXZpZXcudXBkYXRlZEF0KSk7XG4gICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgfVxuXG4gIGRhdGUuY2xhc3NOYW1lID0gJ3Jldmlldy1kYXRlJztcbiAgaGVhZGVyU3Bhbi5hcHBlbmRDaGlsZChkYXRlKTtcbiAgYXJ0aWNsZS5hcHBlbmRDaGlsZChoZWFkZXJTcGFuKTtcblxuICBjb25zdCBjb250ZW50U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgY29udGVudFNwYW4uY2xhc3NOYW1lID0gJ3Jldmlldy1jb250ZW50JztcblxuICBjb25zdCByYXRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIHJhdGluZy5pbm5lckhUTUwgPSBgUmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcbiAgcmF0aW5nLmNsYXNzTmFtZSA9ICdyZXZpZXctcmF0aW5nJztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQocmF0aW5nKTtcblxuICBjb25zdCBjb21tZW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgY29tbWVudHMuaW5uZXJIVE1MID0gcmV2aWV3LmNvbW1lbnRzO1xuICBjb250ZW50U3Bhbi5hcHBlbmRDaGlsZChjb21tZW50cyk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoY29udGVudFNwYW4pO1xuXG4gIGlmIChzZW5kaW5nKSB7XG4gICAgYXJ0aWNsZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnLCByZXF1ZXN0SWQpO1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICAgIGFydGljbGUuY2xhc3NMaXN0LmFkZCgnc2VuZGluZycpO1xuICB9XG5cbiAgcmV0dXJuIGFydGljbGU7XG59O1xuXG5jb25zdCB1cGRhdGVSZXZpZXdIVE1MID0gKGVycm9yLCByZXF1ZXN0SWQsIHJldmlldykgPT4ge1xuICBjb25zdCByZXZpZXdFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke3JlcXVlc3RJZH1cIl1gKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgaWYgKHJldmlld0VsZW1lbnQpIHsgLy8gZm9yIGVycm9yLCBubyBuZWVkIHRvIGFkZCB0byBVSSBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgIGRhdGUuaW5uZXJIVE1MID0gJyc7XG4gICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnKTtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGVycm9yVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyBmYWlsZWQnO1xuICAgICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoZXJyb3JUZXh0KTtcbiAgICAgIGRhdGUuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgaWYgKHVsICYmIHNlbGYucmVzdGF1cmFudCkgeyAvLyBvbmx5IHVwZGF0ZSBpZiB0aGUgcmVzdGF1cmFudCBpcyBsb2FkZWRcbiAgICAgIGlmIChyZXZpZXdFbGVtZW50KSB7XG4gICAgICAgIHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VuZGluZycpO1xuICAgICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICAgICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cbmNvbnN0IGZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn07XG5cbi8qKlxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZ2V0VXJsUGFyYW0gPSAobmFtZSwgdXJsKSA9PiB7XG4gIHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKTtcblxuXG4gIGNvbnN0IHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XG4gIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csICcgJykpO1xufTtcblxuY29uc3Qgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59O1xuXG5jb25zdCByZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlID0gKGJ1dHRvbiwgc3Bpbm5lcikgPT4ge1xuICBidXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAnZmFsc2UnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG59O1xuXG5jb25zdCB0b2dnbGVSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoKSA9PiB7XG4gIGNvbnN0IGlzRmF2b3VyaXRlID0gc3RyaW5nVG9Cb29sZWFuKHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSk7XG4gIGNvbnN0IG5ld0lzRmF2b3VyaXRlID0gKCFpc0Zhdm91cml0ZSkgJiYgaXNGYXZvdXJpdGUgIT09ICdmYWxzZSc7XG4gIGNvbnN0IHJlc3RhdXJhbnRJZCA9IHNlbGYucmVzdGF1cmFudC5pZDtcbiAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcmstYXMtZmF2b3VyaXRlJyk7XG4gIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmF2b3VyaXRlLXNwaW5uZXInKTtcbiAgbGV0IGZhaWxlZFVwZGF0ZUNhbGxiYWNrO1xuICBsZXQgc3VjY2Vzc01lc3NhZ2U7XG4gIGxldCBlcnJvck1lc3NhZ2U7XG4gIGlmIChuZXdJc0Zhdm91cml0ZSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoYnV0dG9uKTtcbiAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayA9IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgICBzdWNjZXNzTWVzc2FnZSA9ICdSZXN0YXVyYW50IGhhcyBiZWVuIG1hcmtlZCBhcyBmYXZvdXJpdGUnO1xuICAgIGVycm9yTWVzc2FnZSA9ICdBbiBlcnJvciBvY2N1cnJlZCBtYXJraW5nIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoYnV0dG9uKTtcbiAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayA9IG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGU7XG4gICAgc3VjY2Vzc01lc3NhZ2UgPSAnUmVzdGF1cmFudCBoYXMgYmVlbiB1bm1hcmtlZCBhcyBmYXZvdXJpdGUnO1xuICAgIGVycm9yTWVzc2FnZSA9ICdBbiBlcnJvciBvY2N1cnJlZCB1bm1hcmtpbmcgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICB9XG4gIHNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgREJIZWxwZXIuc2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyhyZXN0YXVyYW50SWQsIG5ld0lzRmF2b3VyaXRlLCAoZXJyb3IsIHVwZGF0ZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgcmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZShidXR0b24sIHNwaW5uZXIpO1xuICAgIGlmICghdXBkYXRlZFJlc3RhdXJhbnQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2soYnV0dG9uKTtcbiAgICAgIGVucXVldWVUb2FzdChlcnJvck1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZWxmLnJlc3RhdXJhbnQgPSB1cGRhdGVkUmVzdGF1cmFudDtcbiAgICBlbnF1ZXVlVG9hc3Qoc3VjY2Vzc01lc3NhZ2UsICdzdWNjZXNzJyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gc2hvd0Nvbm5lY3Rpb25TdGF0dXMoKSB7XG4gIGNvbnN0IGNvbm5lY3Rpb25TdGF0dXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29ubmVjdGlvblN0YXR1cycpO1xuXG4gIGlmIChuYXZpZ2F0b3Iub25MaW5lICYmICFwcmV2aW91c2x5Q29ubmVjdGVkKSB7IC8vIHVzZXIgY2FtZSBiYWNrIG9ubGluZVxuICAgIGVucXVldWVUb2FzdCgnWW91IGFyZSBiYWNrIG9ubGluZScsICdzdWNjZXNzJyk7XG4gIH0gZWxzZSBpZiAoIW5hdmlnYXRvci5vbkxpbmUgJiYgcHJldmlvdXNseUNvbm5lY3RlZCkgeyAvLyB1c2VyIHdlbnQgb2ZmbGluZVxuICAgIGVucXVldWVUb2FzdCgnWW91IGFyZSBvZmZsaW5lJywgJ2Vycm9yJyk7XG4gIH1cblxuICBwcmV2aW91c2x5Q29ubmVjdGVkID0gbmF2aWdhdG9yLm9uTGluZTtcbn1cbiJdLCJmaWxlIjoicmVzdGF1cmFudF9pbmZvLmpzIn0=

"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var restaurant;
var reviews;
var outboxReviews;
var newMap;
var matchesMediaQuery = true;
var mediaQuery = '(min-width: 800px)';
var previouslyConnected;
/**
 * Initialize map as soon as the page is loaded.
 */

document.addEventListener('DOMContentLoaded', function (event) {
  previouslyConnected = navigator.onLine;
  initMap(); // if (window.matchMedia) {
  //   matchesMediaQuery = window.matchMedia(mediaQuery).matches;
  // }

  updateRestaurantContainerAria(); // set initial aria values

  registerServiceWorker();

  if (window.caches) {
    setInterval(cleanMapboxTilesCache, 5000);
  }

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
    var error = 'No restaurant id in URL';
    callback(error, null);
    document.getElementById('main-spinner').classList.remove('show');
    document.getElementById('main-error').classList.add('show');
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;

      if (!restaurant) {
        document.getElementById('main-spinner').classList.remove('show');
        document.getElementById('main-error').classList.add('show');
        return;
      }

      fetchReviews(id);
      fillRestaurantHTML();
      document.getElementById('main-spinner').classList.remove('show');
      document.getElementById('wrap-main-content').classList.remove('hide');
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


var fetchReviews = function fetchReviews(id) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Q29ubmVjdGVkIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJuYXZpZ2F0b3IiLCJvbkxpbmUiLCJpbml0TWFwIiwidXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJ3aW5kb3ciLCJjYWNoZXMiLCJzZXRJbnRlcnZhbCIsImNsZWFuTWFwYm94VGlsZXNDYWNoZSIsInNlcnZpY2VXb3JrZXIiLCJkYXRhIiwidHlwZSIsInJlcXVlc3RJZCIsInJldmlldyIsImVycm9yIiwiZW5xdWV1ZVRvYXN0IiwidXBkYXRlUmV2aWV3SFRNTCIsIm5hbWUiLCJzaG93Q29ubmVjdGlvblN0YXR1cyIsInRvYXN0IiwiZ2V0RWxlbWVudEJ5SWQiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiTUFQQk9YX0FQSV9LRVkiLCJjb25zb2xlIiwic2VsZiIsIkwiLCJtYXAiLCJjZW50ZXIiLCJsYXRsbmciLCJsYXQiLCJsbmciLCJ6b29tIiwic2Nyb2xsV2hlZWxab29tIiwidGlsZUxheWVyIiwibWFwYm94VG9rZW4iLCJtYXhab29tIiwiYXR0cmlidXRpb24iLCJpZCIsImFkZFRvIiwiZmlsbEJyZWFkY3J1bWIiLCJEQkhlbHBlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJtYXRjaE1lZGlhIiwibmV4dE1hdGNoZXNNZWRpYVF1ZXJ5IiwibWF0Y2hlcyIsInJlc3RhdXJhbnRDb250YWluZXIiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciIsInNldEF0dHJpYnV0ZSIsImNhbGxiYWNrIiwiZ2V0VXJsUGFyYW0iLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJhZGQiLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmV0Y2hSZXZpZXdzIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiaW5uZXJIVE1MIiwiYWRkcmVzcyIsInBpY3R1cmUiLCJzb3VyY2VMYXJnZSIsImNyZWF0ZUVsZW1lbnQiLCJtZWRpYSIsInNyY3NldCIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsInNpemUiLCJ3aWRlIiwiYXBwZW5kQ2hpbGQiLCJzb3VyY2VNZWRpdW0iLCJzb3VyY2VTbWFsbCIsImltYWdlIiwiY2xhc3NOYW1lIiwic3JjIiwiYWx0IiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSIsImN1aXNpbmUiLCJjdWlzaW5lX3R5cGUiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUiLCJhZGRSZXZpZXdCdXR0b24iLCJyZW1vdmVBdHRyaWJ1dGUiLCJhZGRSZXZpZXdPdmVybGF5SGVhZGluZyIsIm9wZXJhdGluZ19ob3VycyIsImZpbGxSZXN0YXVyYW50SG91cnNIVE1MIiwiT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwiLCJvcGVyYXRpbmdIb3VycyIsImhvdXJzIiwia2V5IiwicHJvdG90eXBlIiwicm93IiwiZGF5IiwidGltZSIsIm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJidXR0b24iLCJpY29uIiwicXVlcnlTZWxlY3RvciIsInRleHQiLCJ1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJpc0Zhdm91cml0ZSIsImlzX2Zhdm9yaXRlIiwiZmF2b3VyaXRlQnV0dG9uIiwic3RyaW5nVG9Cb29sZWFuIiwiZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQiLCJmaWxsUmV2aWV3c0hUTUwiLCJnZXRPdXRib3hSZXZpZXdzIiwibG9nIiwiZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCIsImxlbmd0aCIsIm5vUmV2aWV3cyIsImNvbnRhaW5lciIsInVsIiwiZm9yRWFjaCIsImluc2VydEJlZm9yZSIsImNyZWF0ZVJldmlld0hUTUwiLCJmaXJzdENoaWxkIiwib3V0Ym94UmV2aWV3IiwicmVxdWVzdF9pZCIsInNlbmRpbmciLCJhcnRpY2xlIiwiaGVhZGVyU3BhbiIsImRhdGUiLCJsb2FkaW5nVGV4dCIsImRhdGVUZXh0IiwiZm9ybWF0RGF0ZSIsIkRhdGUiLCJ1cGRhdGVkQXQiLCJjb250ZW50U3BhbiIsInJhdGluZyIsImNvbW1lbnRzIiwicmV2aWV3RWxlbWVudCIsImVycm9yVGV4dCIsImJyZWFkY3J1bWIiLCJsaSIsInVybCIsImxvY2F0aW9uIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInNwaW5uZXIiLCJyZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwidG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwibmV3SXNGYXZvdXJpdGUiLCJyZXN0YXVyYW50SWQiLCJmYWlsZWRVcGRhdGVDYWxsYmFjayIsInN1Y2Nlc3NNZXNzYWdlIiwiZXJyb3JNZXNzYWdlIiwic2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyIsInVwZGF0ZWRSZXN0YXVyYW50IiwiY29ubmVjdGlvblN0YXR1cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBSUEsVUFBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxhQUFKO0FBQ0EsSUFBSUMsTUFBSjtBQUNBLElBQUlDLGlCQUFpQixHQUFHLElBQXhCO0FBQ0EsSUFBTUMsVUFBVSxHQUFHLG9CQUFuQjtBQUNBLElBQUlDLG1CQUFKO0FBRUE7Ozs7QUFHQUMsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3ZESCxFQUFBQSxtQkFBbUIsR0FBR0ksU0FBUyxDQUFDQyxNQUFoQztBQUVBQyxFQUFBQSxPQUFPLEdBSGdELENBSXZEO0FBQ0E7QUFDQTs7QUFDQUMsRUFBQUEsNkJBQTZCLEdBUDBC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QUFTa0QsT0FBVCxDQUEvQjtBQUNBeEcsRUFBQUEsUUFBUSxDQUFDZ0gsNEJBQVQsQ0FBc0NKLFlBQXRDLEVBQW9ERCxjQUFwRCxFQUFvRSxVQUFDckksS0FBRCxFQUFRMkksaUJBQVIsRUFBOEI7QUFDaEdSLElBQUFBLGtDQUFrQyxDQUFDbkQsTUFBRCxFQUFTa0QsT0FBVCxDQUFsQzs7QUFDQSxRQUFJLENBQUNTLGlCQUFMLEVBQXdCO0FBQ3RCbEksTUFBQUEsT0FBTyxDQUFDVCxLQUFSLENBQWNBLEtBQWQ7QUFDQXVJLE1BQUFBLG9CQUFvQixDQUFDdkQsTUFBRCxDQUFwQjtBQUNBL0UsTUFBQUEsWUFBWSxDQUFDd0ksWUFBRCxFQUFlLE9BQWYsQ0FBWjtBQUNBO0FBQ0Q7O0FBQ0QvSCxJQUFBQSxJQUFJLENBQUNsQyxVQUFMLEdBQWtCbUssaUJBQWxCO0FBQ0ExSSxJQUFBQSxZQUFZLENBQUN1SSxjQUFELEVBQWlCLFNBQWpCLENBQVo7QUFDRCxHQVZEO0FBV0QsQ0FoQ0Q7O0FBa0NBLFNBQVNwSSxvQkFBVCxHQUFnQztBQUM5QixNQUFNd0ksZ0JBQWdCLEdBQUc3SixRQUFRLENBQUN1QixjQUFULENBQXdCLGtCQUF4QixDQUF6Qjs7QUFFQSxNQUFJcEIsU0FBUyxDQUFDQyxNQUFWLElBQW9CLENBQUNMLG1CQUF6QixFQUE4QztBQUFFO0FBQzlDbUIsSUFBQUEsWUFBWSxDQUFDLHFCQUFELEVBQXdCLFNBQXhCLENBQVo7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDZixTQUFTLENBQUNDLE1BQVgsSUFBcUJMLG1CQUF6QixFQUE4QztBQUFFO0FBQ3JEbUIsSUFBQUEsWUFBWSxDQUFDLGlCQUFELEVBQW9CLE9BQXBCLENBQVo7QUFDRDs7QUFFRG5CLEVBQUFBLG1CQUFtQixHQUFHSSxTQUFTLENBQUNDLE1BQWhDO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgcmVzdGF1cmFudDtcbmxldCByZXZpZXdzO1xubGV0IG91dGJveFJldmlld3M7XG5sZXQgbmV3TWFwO1xubGV0IG1hdGNoZXNNZWRpYVF1ZXJ5ID0gdHJ1ZTtcbmNvbnN0IG1lZGlhUXVlcnkgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbmxldCBwcmV2aW91c2x5Q29ubmVjdGVkO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWFwIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gIHByZXZpb3VzbHlDb25uZWN0ZWQgPSBuYXZpZ2F0b3Iub25MaW5lO1xuXG4gIGluaXRNYXAoKTtcbiAgLy8gaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gIC8vICAgbWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICAvLyB9XG4gIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7IC8vIHNldCBpbml0aWFsIGFyaWEgdmFsdWVzXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuXG4gIGlmICh3aW5kb3cuY2FjaGVzKSB7XG4gICAgc2V0SW50ZXJ2YWwoY2xlYW5NYXBib3hUaWxlc0NhY2hlLCA1MDAwKTtcbiAgfVxuXG4gIGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgdHlwZSwgcmVxdWVzdElkLCByZXZpZXcsIGVycm9yLFxuICAgICAgfSA9IGV2ZW50LmRhdGE7XG4gICAgICBpZiAodHlwZSA9PT0gJ3VwZGF0ZS1yZXZpZXcnKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGVucXVldWVUb2FzdCgnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgc3VibWl0dGluZyB5b3VyIHJldmlldycsICdlcnJvcicpO1xuICAgICAgICAgIHVwZGF0ZVJldmlld0hUTUwodHJ1ZSwgcmVxdWVzdElkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnF1ZXVlVG9hc3QoYCR7cmV2aWV3Lm5hbWV9J3MgcmV2aWV3IGhhcyBiZWVuIHNhdmVkYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKGZhbHNlLCByZXF1ZXN0SWQsIHJldmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmICgnb25MaW5lJyBpbiBuYXZpZ2F0b3IpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgc2hvd0Nvbm5lY3Rpb25TdGF0dXMpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgc2hvd0Nvbm5lY3Rpb25TdGF0dXMpO1xuICAgIHNob3dDb25uZWN0aW9uU3RhdHVzKCk7XG4gIH1cblxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xufSk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBsZWFmbGV0IG1hcFxuICovXG5jb25zdCBpbml0TWFwID0gKCkgPT4ge1xuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgIGNvbnN0IE1BUEJPWF9BUElfS0VZID0gJ3BrLmV5SjFJam9pWVc1bFpYTmhMWE5oYkdWb0lpd2lZU0k2SW1OcWEyeG1aSFZ3TURGb1lXNHpkbkF3WVdwbE1tNTNiSEVpZlEuVjExZERPdEVuV1N3VHhZLUM4bUpMdyc7XG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgICAgIGNlbnRlcjogW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgICAgem9vbTogMTYsXG4gICAgICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2UsXG4gICAgICB9KTtcbiAgICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XG4gICAgICAgIG1hcGJveFRva2VuOiBNQVBCT1hfQVBJX0tFWSxcbiAgICAgICAgbWF4Wm9vbTogMTgsXG4gICAgICAgIGF0dHJpYnV0aW9uOiAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMsICdcbiAgICAgICAgICArICc8YSBocmVmPVwiaHR0cHM6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzIuMC9cIj5DQy1CWS1TQTwvYT4sICdcbiAgICAgICAgICArICdJbWFnZXJ5IMKpIDxhIGhyZWY9XCJodHRwczovL3d3dy5tYXBib3guY29tL1wiPk1hcGJveDwvYT4nLFxuICAgICAgICBpZDogJ21hcGJveC5zdHJlZXRzJyxcbiAgICAgIH0pLmFkZFRvKG5ld01hcCk7XG4gICAgICBmaWxsQnJlYWRjcnVtYigpO1xuICAgICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubmV3TWFwKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4qIFVwZGF0ZSBhcmlhLWhpZGRlbiB2YWx1ZXMgb2YgdGhlIHZpc2libGUgYW5kIGFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXJzXG4qL1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgY29uc3QgbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgICBpZiAobmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ICE9PSBtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBvbmx5IHVwZGF0ZSBhcmlhIHdoZW4gbGF5b3V0IGNoYW5nZXNcbiAgICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5O1xuICAgICAgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKipcbiogU2V0IGFyaWEtaGlkZGVuIHZhbHVlcyBmb3IgdmlzaWJsZSBhbmQgcmVndWxhciByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiogQWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lciBpcyBvZmYgc2NyZWVuXG4qIEl0IGlzIHJlcXVpcmVkIHRvIG1haW50YWluIHNjcmVlbiByZWFkaW5nIG9yZGVyIHdoZW4gdGhlIGxheW91dCBzaGlmdHNcbiovXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSA9ICgpID0+IHtcbiAgY29uc3QgcmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGlmIChtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBsYXJnZXIgbGF5b3V0LCBzY3JlZW4gcmVhZGluZyBvcmRlciBvZmZcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgfSBlbHNlIHsgLy8gdXNlIHJlZ3VsYXIgcmVhZGluZyBvcmRlclxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xuICBpZiAoc2VsZi5yZXN0YXVyYW50KSB7IC8vIHJlc3RhdXJhbnQgYWxyZWFkeSBmZXRjaGVkIVxuICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlkID0gZ2V0VXJsUGFyYW0oJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgY29uc3QgZXJyb3IgPSAnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnO1xuICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi1zcGlubmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWVycm9yJykuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICB9IGVsc2Uge1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcbiAgICAgIGlmICghcmVzdGF1cmFudCkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi1zcGlubmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi1lcnJvcicpLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmV0Y2hSZXZpZXdzKGlkKTtcbiAgICAgIGZpbGxSZXN0YXVyYW50SFRNTCgpO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4tc3Bpbm5lcicpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3cmFwLW1haW4tY29udGVudCcpLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGUnKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcblxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xuICBhZGRyZXNzLmlubmVySFRNTCArPSByZXN0YXVyYW50LmFkZHJlc3M7XG5cbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LXBpY3R1cmUnKTtcblxuICBjb25zdCBzb3VyY2VMYXJnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VMYXJnZS5tZWRpYSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xuICBzb3VyY2VMYXJnZS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbGFyZ2UnLCB3aWRlOiB0cnVlIH0pO1xuICBzb3VyY2VMYXJnZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZUxhcmdlKTtcblxuICBjb25zdCBzb3VyY2VNZWRpdW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTWVkaXVtLm1lZGlhID0gJyhtaW4td2lkdGg6IDYwMHB4KSc7XG4gIHNvdXJjZU1lZGl1bS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbWVkaXVtJyB9KTtcbiAgc291cmNlTWVkaXVtLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTWVkaXVtKTtcblxuICBjb25zdCBzb3VyY2VTbWFsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VTbWFsbC5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnc21hbGwnIH0pO1xuICBzb3VyY2VTbWFsbC50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZVNtYWxsKTtcblxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xuICAvLyBzZXQgZGVmYXVsdCBzaXplIGluIGNhc2UgcGljdHVyZSBlbGVtZW50IGlzIG5vdCBzdXBwb3J0ZWRcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xuICBpbWFnZS5hbHQgPSByZXN0YXVyYW50LmFsdDtcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtaW1nJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgcmVzdGF1cmFudC5hbHQpO1xuXG4gIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctYnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgQWRkIGEgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcblxuICBjb25zdCBhZGRSZXZpZXdPdmVybGF5SGVhZGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LW92ZXJsYXktaGVhZGluZycpO1xuICBhZGRSZXZpZXdPdmVybGF5SGVhZGluZy5pbm5lckhUTUwgPSBgQWRkIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YDtcblxuICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xuICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcbiAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3RhdXJhbnQsICdpc19mYXZvcml0ZScpKSB7XG4gICAgZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcbiAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3BlcmF0aW5nSG91cnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XG5cbiAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xuXG4gICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgY29uc3QgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIGNvbnN0IHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdVbm1hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBjdXJyZW50bHkgbWFya2VkIGFzIGZhdm91cml0ZScpO1xufTtcblxuY29uc3QgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKGJ1dHRvbikgPT4ge1xuICBjb25zdCBpY29uID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgY29uc3QgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ01hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBub3QgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbi8qKlxuICogU2V0IHN0YXRlIGFuZCB0ZXh0IGZvciBtYXJrIGFzIGZhdm91cml0ZSBidXR0b24uXG4gKi9cbmNvbnN0IGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MID0gKGlzRmF2b3VyaXRlID0gc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKSA9PiB7XG4gIGNvbnN0IGZhdm91cml0ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBpZiAoc3RyaW5nVG9Cb29sZWFuKGlzRmF2b3VyaXRlKSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmV2aWV3cyA9IChpZCkgPT4ge1xuICBEQkhlbHBlci5mZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZChpZCwgKGVycm9yLCByZXZpZXdzKSA9PiB7XG4gICAgc2VsZi5yZXZpZXdzID0gcmV2aWV3cztcbiAgICBpZiAoIXJldmlld3MpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaWxsUmV2aWV3c0hUTUwoKTtcbiAgICBEQkhlbHBlci5nZXRPdXRib3hSZXZpZXdzKGlkLCAoZXJyb3IsIG91dGJveFJldmlld3MpID0+IHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLm91dGJveFJldmlld3MgPSBvdXRib3hSZXZpZXdzO1xuICAgICAgICBmaWxsU2VuZGluZ1Jldmlld3NIVE1MKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXZpZXdzKSA9PiB7XG4gIGlmICghcmV2aWV3cyB8fCByZXZpZXdzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICByZXZpZXdzLmZvckVhY2goKHJldmlldykgPT4ge1xuICAgIHVsLmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldyksIHVsLmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbmNvbnN0IGZpbGxTZW5kaW5nUmV2aWV3c0hUTUwgPSAob3V0Ym94UmV2aWV3cyA9IHNlbGYub3V0Ym94UmV2aWV3cykgPT4ge1xuICBpZiAoIW91dGJveFJldmlld3MgfHwgb3V0Ym94UmV2aWV3cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgb3V0Ym94UmV2aWV3cy5mb3JFYWNoKChvdXRib3hSZXZpZXcpID0+IHtcbiAgICBjb25zdCB7IHJlcXVlc3RfaWQsIC4uLnJldmlldyB9ID0gb3V0Ym94UmV2aWV3O1xuICAgIHVsLmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgdHJ1ZSwgcmVxdWVzdF9pZCksIHVsLmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3LCBzZW5kaW5nLCByZXF1ZXN0SWQpID0+IHtcbiAgY29uc3QgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgYXJ0aWNsZS5jbGFzc05hbWUgPSAncmV2aWV3JztcblxuICBjb25zdCBoZWFkZXJTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBoZWFkZXJTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctaGVhZGVyJztcblxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xuICBuYW1lLmNsYXNzTmFtZSA9ICdyZXZpZXctbmFtZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQobmFtZSk7XG5cbiAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAnZmEtY2xvY2snKTtcbiAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsb2FkaW5nVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyc7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICBkYXRlLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkYXRlVGV4dCA9IGZvcm1hdERhdGUobmV3IERhdGUocmV2aWV3LnVwZGF0ZWRBdCkpO1xuICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gIH1cblxuICBkYXRlLmNsYXNzTmFtZSA9ICdyZXZpZXctZGF0ZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQoZGF0ZSk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoaGVhZGVyU3Bhbik7XG5cbiAgY29uc3QgY29udGVudFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGNvbnRlbnRTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctY29udGVudCc7XG5cbiAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XG4gIHJhdGluZy5jbGFzc05hbWUgPSAncmV2aWV3LXJhdGluZyc7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKHJhdGluZyk7XG5cbiAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGNvbnRlbnRTcGFuKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdkYXRhLWlkJywgcmVxdWVzdElkKTtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NlbmRpbmcnKTtcbiAgfVxuXG4gIHJldHVybiBhcnRpY2xlO1xufTtcblxuY29uc3QgdXBkYXRlUmV2aWV3SFRNTCA9IChlcnJvciwgcmVxdWVzdElkLCByZXZpZXcpID0+IHtcbiAgY29uc3QgcmV2aWV3RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtyZXF1ZXN0SWR9XCJdYCk7XG4gIGlmIChlcnJvcikge1xuICAgIGlmIChyZXZpZXdFbGVtZW50KSB7IC8vIGZvciBlcnJvciwgbm8gbmVlZCB0byBhZGQgdG8gVUkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICBkYXRlLmlubmVySFRNTCA9ICcnO1xuICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFzJywgJ2ZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyk7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBlcnJvclRleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcgZmFpbGVkJztcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICBkYXRlLmFwcGVuZENoaWxkKGVycm9yVGV4dCk7XG4gICAgICBkYXRlLmNsYXNzTGlzdC5hZGQoJ2Vycm9yJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICAgIGlmICh1bCAmJiBzZWxmLnJlc3RhdXJhbnQpIHsgLy8gb25seSB1cGRhdGUgaWYgdGhlIHJlc3RhdXJhbnQgaXMgbG9hZGVkXG4gICAgICBpZiAocmV2aWV3RWxlbWVudCkge1xuICAgICAgICByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbmRpbmcnKTtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICAgIGNvbnN0IGRhdGVUZXh0ID0gZm9ybWF0RGF0ZShuZXcgRGF0ZShyZXZpZXcudXBkYXRlZEF0KSk7XG4gICAgICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBBZGQgcmVzdGF1cmFudCBuYW1lIHRvIHRoZSBicmVhZGNydW1iIG5hdmlnYXRpb24gbWVudVxuICovXG5jb25zdCBmaWxsQnJlYWRjcnVtYiA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gIGNvbnN0IGJyZWFkY3J1bWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnJlYWRjcnVtYicpO1xuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gIGxpLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcbiAgYnJlYWRjcnVtYi5hcHBlbmRDaGlsZChsaSk7XG59O1xuXG4vKipcbiAqIEdldCBhIHBhcmFtZXRlciBieSBuYW1lIGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGdldFVybFBhcmFtID0gKG5hbWUsIHVybCkgPT4ge1xuICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKTtcbiAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBbPyZdJHtuYW1lfSg9KFteJiNdKil8JnwjfCQpYCk7XG5cblxuICBjb25zdCByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xuICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiAnJztcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbn07XG5cbmNvbnN0IHNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICd0cnVlJyk7XG4gIHNwaW5uZXIuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufTtcblxuY29uc3QgcmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ2ZhbHNlJyk7XG4gIHNwaW5uZXIuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufTtcblxuY29uc3QgdG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKCkgPT4ge1xuICBjb25zdCBpc0Zhdm91cml0ZSA9IHN0cmluZ1RvQm9vbGVhbihzZWxmLnJlc3RhdXJhbnQuaXNfZmF2b3JpdGUpO1xuICBjb25zdCBuZXdJc0Zhdm91cml0ZSA9ICghaXNGYXZvdXJpdGUpICYmIGlzRmF2b3VyaXRlICE9PSAnZmFsc2UnO1xuICBjb25zdCByZXN0YXVyYW50SWQgPSBzZWxmLnJlc3RhdXJhbnQuaWQ7XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zhdm91cml0ZS1zcGlubmVyJyk7XG4gIGxldCBmYWlsZWRVcGRhdGVDYWxsYmFjaztcbiAgbGV0IHN1Y2Nlc3NNZXNzYWdlO1xuICBsZXQgZXJyb3JNZXNzYWdlO1xuICBpZiAobmV3SXNGYXZvdXJpdGUpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGJ1dHRvbik7XG4gICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2sgPSB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGU7XG4gICAgc3VjY2Vzc01lc3NhZ2UgPSAnUmVzdGF1cmFudCBoYXMgYmVlbiBtYXJrZWQgYXMgZmF2b3VyaXRlJztcbiAgICBlcnJvck1lc3NhZ2UgPSAnQW4gZXJyb3Igb2NjdXJyZWQgbWFya2luZyByZXN0YXVyYW50IGFzIGZhdm91cml0ZSc7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGJ1dHRvbik7XG4gICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2sgPSBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICAgIHN1Y2Nlc3NNZXNzYWdlID0gJ1Jlc3RhdXJhbnQgaGFzIGJlZW4gdW5tYXJrZWQgYXMgZmF2b3VyaXRlJztcbiAgICBlcnJvck1lc3NhZ2UgPSAnQW4gZXJyb3Igb2NjdXJyZWQgdW5tYXJraW5nIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgfVxuICBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gIERCSGVscGVyLnNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMocmVzdGF1cmFudElkLCBuZXdJc0Zhdm91cml0ZSwgKGVycm9yLCB1cGRhdGVkUmVzdGF1cmFudCkgPT4ge1xuICAgIHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgICBpZiAoIXVwZGF0ZWRSZXN0YXVyYW50KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrKGJ1dHRvbik7XG4gICAgICBlbnF1ZXVlVG9hc3QoZXJyb3JNZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi5yZXN0YXVyYW50ID0gdXBkYXRlZFJlc3RhdXJhbnQ7XG4gICAgZW5xdWV1ZVRvYXN0KHN1Y2Nlc3NNZXNzYWdlLCAnc3VjY2VzcycpO1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIHNob3dDb25uZWN0aW9uU3RhdHVzKCkge1xuICBjb25zdCBjb25uZWN0aW9uU3RhdHVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nvbm5lY3Rpb25TdGF0dXMnKTtcblxuICBpZiAobmF2aWdhdG9yLm9uTGluZSAmJiAhcHJldmlvdXNseUNvbm5lY3RlZCkgeyAvLyB1c2VyIGNhbWUgYmFjayBvbmxpbmVcbiAgICBlbnF1ZXVlVG9hc3QoJ1lvdSBhcmUgYmFjayBvbmxpbmUnLCAnc3VjY2VzcycpO1xuICB9IGVsc2UgaWYgKCFuYXZpZ2F0b3Iub25MaW5lICYmIHByZXZpb3VzbHlDb25uZWN0ZWQpIHsgLy8gdXNlciB3ZW50IG9mZmxpbmVcbiAgICBlbnF1ZXVlVG9hc3QoJ1lvdSBhcmUgb2ZmbGluZScsICdlcnJvcicpO1xuICB9XG5cbiAgcHJldmlvdXNseUNvbm5lY3RlZCA9IG5hdmlnYXRvci5vbkxpbmU7XG59XG4iXSwiZmlsZSI6InJlc3RhdXJhbnRfaW5mby5qcyJ9

"use strict";

/** **** modal ****** */
var previouslyFocusedElement;

function openModal() {
  previouslyFocusedElement = document.activeElement;
  var overlay = document.querySelector('.overlay');
  var interactiveElements = overlay.querySelectorAll('button, input, textarea');
  overlay.classList.add('show');
  document.body.classList.add('has-open-modal');
  document.addEventListener('keydown', trapTabKey); // focus the first element in the overlay. timeout is needed because of CSS transition

  setTimeout(function () {
    interactiveElements[0].focus();
  }, 100);
}

function closeModal() {
  clearFormErrors();
  document.querySelector('.overlay').classList.remove('show');
  document.body.classList.remove('has-open-modal');
  document.removeEventListener('keydown', trapTabKey);

  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}

function trapTabKey(event) {
  var overlay = document.querySelector('.overlay');
  var interactiveElements = overlay.querySelectorAll('button, input');
  var firstElement = interactiveElements[0];
  var lastElement = interactiveElements[interactiveElements.length - 1];

  if (event.key && event.key === 'Tab') {
    if (event.shiftKey && event.target === firstElement) {
      // shift + tab
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && event.target === lastElement) {
      // tab
      event.preventDefault();
      firstElement.focus();
    }
  }
}
/** **** handle errors ****** */


function setNameInputError() {
  var nameInput = document.getElementById('name');
  var nameInputError = document.getElementById('name-error');
  nameInput.classList.add('has-error');
  nameInput.setAttribute('aria-invalid', 'true');
  nameInput.setAttribute('aria-describedby', 'name-error');
  nameInputError.classList.add('show');
}

function clearNameInputError() {
  var nameInput = document.getElementById('name');
  var nameInputError = document.getElementById('name-error');
  nameInput.classList.remove('has-error');
  nameInput.removeAttribute('aria-invalid');
  nameInput.removeAttribute('aria-describedby');
  nameInputError.classList.remove('show');
}

function setRatingInputError() {
  var ratingInput = document.getElementById('rating');
  var ratingInputError = document.getElementById('rating-error');
  ratingInput.classList.add('has-error');
  ratingInput.setAttribute('aria-invalid', 'true');
  ratingInput.setAttribute('aria-describedby', 'rating-error');
  ratingInputError.classList.add('show');
}

function clearRatingInputError() {
  var ratingInput = document.getElementById('rating');
  var ratingInputError = document.getElementById('rating-error');
  ratingInput.classList.remove('has-error');
  ratingInput.removeAttribute('aria-invalid');
  ratingInput.removeAttribute('aria-describedby');
  ratingInputError.classList.remove('show');
}

function setCommentInputError() {
  var commentInput = document.getElementById('comments');
  var commentInputError = document.getElementById('comments-error');
  commentInput.classList.add('has-error');
  commentInput.setAttribute('aria-invalid', 'true');
  commentInput.setAttribute('aria-describedby', 'comments-error');
  commentInputError.classList.add('show');
}

function clearCommentInputError() {
  var commentInput = document.getElementById('comments');
  var commentInputError = document.getElementById('comments-error');
  commentInput.classList.remove('has-error');
  commentInput.removeAttribute('aria-invalid');
  commentInput.removeAttribute('aria-describedby');
  commentInputError.classList.remove('show');
}

var errorFunctions = {
  name: {
    setError: setNameInputError,
    clearError: clearNameInputError
  },
  rating: {
    setError: setRatingInputError,
    clearError: clearRatingInputError
  },
  comments: {
    setError: setCommentInputError,
    clearError: clearCommentInputError
  }
};
/** **** validation ****** */

function validateInput(id, value) {
  var input = document.getElementById(id).cloneNode();
  var inputValue;

  if (value !== undefined) {
    inputValue = value;
  } else {
    inputValue = input.value;
  }

  inputValue = id === 'rating' ? Number.parseInt(inputValue, 10) : inputValue;

  if (inputValue) {
    errorFunctions[id].clearError();
    return true;
  }

  requestAnimationFrame(errorFunctions[id].setError);
  return false;
}

function validateAllInputs() {
  var error = false;
  var inputIds = ['name', 'rating', 'comments'];
  var invalidInputs = [];
  inputIds.forEach(function (id) {
    var inputValid = validateInput(id);

    if (!inputValid) {
      invalidInputs.push(id);
      error = true;
    }
  });
  return {
    error: error,
    invalidInputs: invalidInputs
  };
}
/** **** handle events ****** */


function handleRangeChange(event) {
  var ratingValue = document.querySelector('.rating-value');
  ratingValue.innerHTML = "".concat(event.target.value, "/5");
  validateInput(event.target.name, event.target.value);
}

function handleInputKeyUp(event) {
  if (!(event.key && event.key === 'Tab')) {
    // when tab is used, allow the onblur handler to perform validation
    // when the tab key is pressed, focus is already on the next input when the event fires
    // so the wrong input is validated
    validateInput(event.target.name, event.target.value);
  }
}

function handleInputBlur(event) {
  validateInput(event.target.name, event.target.value);
}

function getFormInputValues() {
  var inputIds = ['name', 'rating', 'comments'];
  var values = {};
  inputIds.forEach(function (id) {
    values[id] = document.getElementById(id).value;
  });
  return values;
}

function clearForm() {
  document.getElementById('name').value = '';
  document.getElementById('rating').value = '0';
  document.querySelector('.rating-value').innerHTML = '0/5';
  document.getElementById('comments').value = '';
}

function clearFormErrors() {
  document.getElementById('name-error').classList.remove('show');
  document.getElementById('rating-error').classList.remove('show');
  document.getElementById('comments-error').classList.remove('show');
  document.getElementById('add-review-form-error').classList.remove('show');
  document.getElementById('add-review-form-error').innerHTML = '';
  document.getElementById('name').classList.remove('has-error');
  document.getElementById('rating').classList.remove('has-error');
  document.getElementById('comments').classList.remove('has-error');
}

function handleAddReviewSubmit() {
  var _validateAllInputs = validateAllInputs(),
      error = _validateAllInputs.error,
      invalidInputs = _validateAllInputs.invalidInputs;

  if (!error) {
    var _getFormInputValues = getFormInputValues(),
        name = _getFormInputValues.name,
        rating = _getFormInputValues.rating,
        comments = _getFormInputValues.comments;

    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      // perform regular fetch and regular updates
      var submitButton = document.getElementById('add-review-submit');
      submitButton.setAttribute('disabled', true);
      submitButton.setAttribute('aria-busy', 'true');
      DBHelper.addReview(self.restaurant.id, name, rating, comments, function (error, newReview) {
        submitButton.removeAttribute('disabled');
        submitButton.setAttribute('aria-busy', 'false');

        if (error) {
          enqueueToast('An error occurred. Please try again', 'error');
          console.log(error);
        } else {
          enqueueToast("".concat(name, "'s review has been saved"), 'success');
          var ul = document.getElementById('reviews-list');
          ul.insertBefore(createReviewHTML(newReview), ul.firstChild);
          closeModal();
          clearForm();
        }
      });
    } else {
      var requestId = "".concat(self.restaurant.id, "-").concat(Date.now());
      var newReview = {
        name: name,
        rating: rating,
        comments: comments,
        restaurant_id: self.restaurant.id
      };
      var ul = document.getElementById('reviews-list');
      ul.insertBefore(createReviewHTML(newReview, true, requestId), ul.firstChild);

      if ('onLine' in navigator && !navigator.onLine) {
        enqueueToast('Your review will be submitted when you are back online');
      }

      closeModal();
      clearForm();
      navigator.serviceWorker.controller.postMessage({
        type: 'post-review',
        review: newReview,
        requestId: requestId
      });
    }
  } else {
    // form errors not cleared
    var formError = document.getElementById('add-review-form-error');
    var errorText = "Invalid input for: ".concat(invalidInputs.join(', '));
    formError.innerHTML = errorText;
    formError.classList.add('show');
    document.getElementById(invalidInputs[0]).focus();
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkZFJldmlld01vZGFsLmpzIl0sIm5hbWVzIjpbInByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCIsIm9wZW5Nb2RhbCIsImRvY3VtZW50IiwiYWN0aXZlRWxlbWVudCIsIm92ZXJsYXkiLCJxdWVyeVNlbGVjdG9yIiwiaW50ZXJhY3RpdmVFbGVtZW50cyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJjbGFzc0xpc3QiLCJhZGQiLCJib2R5IiwiYWRkRXZlbnRMaXN0ZW5lciIsInRyYXBUYWJLZXkiLCJzZXRUaW1lb3V0IiwiZm9jdXMiLCJjbG9zZU1vZGFsIiwiY2xlYXJGb3JtRXJyb3JzIiwicmVtb3ZlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiZmlyc3RFbGVtZW50IiwibGFzdEVsZW1lbnQiLCJsZW5ndGgiLCJrZXkiLCJzaGlmdEtleSIsInRhcmdldCIsInByZXZlbnREZWZhdWx0Iiwic2V0TmFtZUlucHV0RXJyb3IiLCJuYW1lSW5wdXQiLCJnZXRFbGVtZW50QnlJZCIsIm5hbWVJbnB1dEVycm9yIiwic2V0QXR0cmlidXRlIiwiY2xlYXJOYW1lSW5wdXRFcnJvciIsInJlbW92ZUF0dHJpYnV0ZSIsInNldFJhdGluZ0lucHV0RXJyb3IiLCJyYXRpbmdJbnB1dCIsInJhdGluZ0lucHV0RXJyb3IiLCJjbGVhclJhdGluZ0lucHV0RXJyb3IiLCJzZXRDb21tZW50SW5wdXRFcnJvciIsImNvbW1lbnRJbnB1dCIsImNvbW1lbnRJbnB1dEVycm9yIiwiY2xlYXJDb21tZW50SW5wdXRFcnJvciIsImVycm9yRnVuY3Rpb25zIiwibmFtZSIsInNldEVycm9yIiwiY2xlYXJFcnJvciIsInJhdGluZyIsImNvbW1lbnRzIiwidmFsaWRhdGVJbnB1dCIsImlkIiwidmFsdWUiLCJpbnB1dCIsImNsb25lTm9kZSIsImlucHV0VmFsdWUiLCJ1bmRlZmluZWQiLCJOdW1iZXIiLCJwYXJzZUludCIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZhbGlkYXRlQWxsSW5wdXRzIiwiZXJyb3IiLCJpbnB1dElkcyIsImludmFsaWRJbnB1dHMiLCJmb3JFYWNoIiwiaW5wdXRWYWxpZCIsInB1c2giLCJoYW5kbGVSYW5nZUNoYW5nZSIsInJhdGluZ1ZhbHVlIiwiaW5uZXJIVE1MIiwiaGFuZGxlSW5wdXRLZXlVcCIsImhhbmRsZUlucHV0Qmx1ciIsImdldEZvcm1JbnB1dFZhbHVlcyIsInZhbHVlcyIsImNsZWFyRm9ybSIsImhhbmRsZUFkZFJldmlld1N1Ym1pdCIsIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJjb250cm9sbGVyIiwic3VibWl0QnV0dG9uIiwiREJIZWxwZXIiLCJhZGRSZXZpZXciLCJzZWxmIiwicmVzdGF1cmFudCIsIm5ld1JldmlldyIsImVucXVldWVUb2FzdCIsImNvbnNvbGUiLCJsb2ciLCJ1bCIsImluc2VydEJlZm9yZSIsImNyZWF0ZVJldmlld0hUTUwiLCJmaXJzdENoaWxkIiwicmVxdWVzdElkIiwiRGF0ZSIsIm5vdyIsInJlc3RhdXJhbnRfaWQiLCJvbkxpbmUiLCJwb3N0TWVzc2FnZSIsInR5cGUiLCJyZXZpZXciLCJmb3JtRXJyb3IiLCJlcnJvclRleHQiLCJqb2luIiwiaGFuZGxlRm9ybVN1Ym1pdCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUVBLElBQUlBLHdCQUFKOztBQUVBLFNBQVNDLFNBQVQsR0FBcUI7QUFDbkJELEVBQUFBLHdCQUF3QixHQUFHRSxRQUFRLENBQUNDLGFBQXBDO0FBQ0EsTUFBTUMsT0FBTyxHQUFHRixRQUFRLENBQUNHLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBaEI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBR0YsT0FBTyxDQUFDRyxnQkFBUixDQUF5Qix5QkFBekIsQ0FBNUI7QUFDQUgsRUFBQUEsT0FBTyxDQUFDSSxTQUFSLENBQWtCQyxHQUFsQixDQUFzQixNQUF0QjtBQUNBUCxFQUFBQSxRQUFRLENBQUNRLElBQVQsQ0FBY0YsU0FBZCxDQUF3QkMsR0FBeEIsQ0FBNEIsZ0JBQTVCO0FBQ0FQLEVBQUFBLFFBQVEsQ0FB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QUFJLEVBQUUsYUFEdUM7QUFFN0NDLFFBQUFBLE1BQU0sRUFBRWYsU0FGcUM7QUFHN0NRLFFBQUFBLFNBQVMsRUFBVEE7QUFINkMsT0FBL0M7QUFLRDtBQUNGLEdBekNELE1BeUNPO0FBQUU7QUFDUCxRQUFNUSxTQUFTLEdBQUdoRyxRQUFRLENBQUMyQixjQUFULENBQXdCLHVCQUF4QixDQUFsQjtBQUNBLFFBQU1zRSxTQUFTLGdDQUF5QnRDLGFBQWEsQ0FBQ3VDLElBQWQsQ0FBbUIsSUFBbkIsQ0FBekIsQ0FBZjtBQUNBRixJQUFBQSxTQUFTLENBQUMvQixTQUFWLEdBQXNCZ0MsU0FBdEI7QUFDQUQsSUFBQUEsU0FBUyxDQUFDMUYsU0FBVixDQUFvQkMsR0FBcEIsQ0FBd0IsTUFBeEI7QUFDQVAsSUFBQUEsUUFBUSxDQUFDMkIsY0FBVCxDQUF3QmdDLGFBQWEsQ0FBQyxDQUFELENBQXJDLEVBQTBDL0MsS0FBMUM7QUFDRDtBQUNGOztBQUVELFNBQVN1RixnQkFBVCxDQUEwQmxGLEtBQTFCLEVBQWlDO0FBQy9CQSxFQUFBQSxLQUFLLENBQUNPLGNBQU47QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKiAqKioqIG1vZGFsICoqKioqKiAqL1xuXG5sZXQgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50O1xuXG5mdW5jdGlvbiBvcGVuTW9kYWwoKSB7XG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3ZlcmxheScpO1xuICBjb25zdCBpbnRlcmFjdGl2ZUVsZW1lbnRzID0gb3ZlcmxheS5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24sIGlucHV0LCB0ZXh0YXJlYScpO1xuICBvdmVybGF5LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdoYXMtb3Blbi1tb2RhbCcpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdHJhcFRhYktleSk7XG4gIC8vIGZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBvdmVybGF5LiB0aW1lb3V0IGlzIG5lZWRlZCBiZWNhdXNlIG9mIENTUyB0cmFuc2l0aW9uXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGludGVyYWN0aXZlRWxlbWVudHNbMF0uZm9jdXMoKTtcbiAgfSwgMTAwKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VNb2RhbCgpIHtcbiAgY2xlYXJGb3JtRXJyb3JzKCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5JykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1vcGVuLW1vZGFsJyk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0cmFwVGFiS2V5KTtcbiAgaWYgKHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xuICAgIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyYXBUYWJLZXkoZXZlbnQpIHtcbiAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5Jyk7XG4gIGNvbnN0IGludGVyYWN0aXZlRWxlbWVudHMgPSBvdmVybGF5LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbiwgaW5wdXQnKTtcbiAgY29uc3QgZmlyc3RFbGVtZW50ID0gaW50ZXJhY3RpdmVFbGVtZW50c1swXTtcbiAgY29uc3QgbGFzdEVsZW1lbnQgPSBpbnRlcmFjdGl2ZUVsZW1lbnRzW2ludGVyYWN0aXZlRWxlbWVudHMubGVuZ3RoIC0gMV07XG4gIGlmIChldmVudC5rZXkgJiYgZXZlbnQua2V5ID09PSAnVGFiJykge1xuICAgIGlmIChldmVudC5zaGlmdEtleSAmJiBldmVudC50YXJnZXQgPT09IGZpcnN0RWxlbWVudCkgeyAvLyBzaGlmdCArIHRhYlxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxhc3RFbGVtZW50LmZvY3VzKCk7XG4gICAgfSBlbHNlIGlmICghZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQudGFyZ2V0ID09PSBsYXN0RWxlbWVudCkgeyAvLyB0YWJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBmaXJzdEVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqICoqKiogaGFuZGxlIGVycm9ycyAqKioqKiogKi9cblxuZnVuY3Rpb24gc2V0TmFtZUlucHV0RXJyb3IoKSB7XG4gIGNvbnN0IG5hbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJyk7XG4gIGNvbnN0IG5hbWVJbnB1dEVycm9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hbWUtZXJyb3InKTtcbiAgbmFtZUlucHV0LmNsYXNzTGlzdC5hZGQoJ2hhcy1lcnJvcicpO1xuICBuYW1lSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWludmFsaWQnLCAndHJ1ZScpO1xuICBuYW1lSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5JywgJ25hbWUtZXJyb3InKTtcbiAgbmFtZUlucHV0RXJyb3IuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBjbGVhck5hbWVJbnB1dEVycm9yKCkge1xuICBjb25zdCBuYW1lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZScpO1xuICBjb25zdCBuYW1lSW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lLWVycm9yJyk7XG4gIG5hbWVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtZXJyb3InKTtcbiAgbmFtZUlucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJyk7XG4gIG5hbWVJbnB1dC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknKTtcbiAgbmFtZUlucHV0RXJyb3IuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzZXRSYXRpbmdJbnB1dEVycm9yKCkge1xuICBjb25zdCByYXRpbmdJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmcnKTtcbiAgY29uc3QgcmF0aW5nSW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmctZXJyb3InKTtcbiAgcmF0aW5nSW5wdXQuY2xhc3NMaXN0LmFkZCgnaGFzLWVycm9yJyk7XG4gIHJhdGluZ0lucHV0LnNldEF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJywgJ3RydWUnKTtcbiAgcmF0aW5nSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5JywgJ3JhdGluZy1lcnJvcicpO1xuICByYXRpbmdJbnB1dEVycm9yLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJSYXRpbmdJbnB1dEVycm9yKCkge1xuICBjb25zdCByYXRpbmdJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmcnKTtcbiAgY29uc3QgcmF0aW5nSW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmctZXJyb3InKTtcbiAgcmF0aW5nSW5wdXQuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG4gIHJhdGluZ0lucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJyk7XG4gIHJhdGluZ0lucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpO1xuICByYXRpbmdJbnB1dEVycm9yLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn1cblxuZnVuY3Rpb24gc2V0Q29tbWVudElucHV0RXJyb3IoKSB7XG4gIGNvbnN0IGNvbW1lbnRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cycpO1xuICBjb25zdCBjb21tZW50SW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cy1lcnJvcicpO1xuICBjb21tZW50SW5wdXQuY2xhc3NMaXN0LmFkZCgnaGFzLWVycm9yJyk7XG4gIGNvbW1lbnRJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaW52YWxpZCcsICd0cnVlJyk7XG4gIGNvbW1lbnRJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknLCAnY29tbWVudHMtZXJyb3InKTtcbiAgY29tbWVudElucHV0RXJyb3IuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBjbGVhckNvbW1lbnRJbnB1dEVycm9yKCkge1xuICBjb25zdCBjb21tZW50SW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29tbWVudHMnKTtcbiAgY29uc3QgY29tbWVudElucHV0RXJyb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29tbWVudHMtZXJyb3InKTtcbiAgY29tbWVudElucHV0LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1lcnJvcicpO1xuICBjb21tZW50SW5wdXQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWludmFsaWQnKTtcbiAgY29tbWVudElucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpO1xuICBjb21tZW50SW5wdXRFcnJvci5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG59XG5cbmNvbnN0IGVycm9yRnVuY3Rpb25zID0ge1xuICBuYW1lOiB7XG4gICAgc2V0RXJyb3I6IHNldE5hbWVJbnB1dEVycm9yLFxuICAgIGNsZWFyRXJyb3I6IGNsZWFyTmFtZUlucHV0RXJyb3IsXG4gIH0sXG4gIHJhdGluZzoge1xuICAgIHNldEVycm9yOiBzZXRSYXRpbmdJbnB1dEVycm9yLFxuICAgIGNsZWFyRXJyb3I6IGNsZWFyUmF0aW5nSW5wdXRFcnJvcixcbiAgfSxcbiAgY29tbWVudHM6IHtcbiAgICBzZXRFcnJvcjogc2V0Q29tbWVudElucHV0RXJyb3IsXG4gICAgY2xlYXJFcnJvcjogY2xlYXJDb21tZW50SW5wdXRFcnJvcixcbiAgfSxcbn07XG5cbi8qKiAqKioqIHZhbGlkYXRpb24gKioqKioqICovXG5cbmZ1bmN0aW9uIHZhbGlkYXRlSW5wdXQoaWQsIHZhbHVlKSB7XG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNsb25lTm9kZSgpO1xuICBsZXQgaW5wdXRWYWx1ZTtcbiAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICBpbnB1dFZhbHVlID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgaW5wdXRWYWx1ZSA9IGlucHV0LnZhbHVlO1xuICB9XG4gIGlucHV0VmFsdWUgPSBpZCA9PT0gJ3JhdGluZycgPyBOdW1iZXIucGFyc2VJbnQoaW5wdXRWYWx1ZSwgMTApIDogaW5wdXRWYWx1ZTtcbiAgaWYgKGlucHV0VmFsdWUpIHtcbiAgICBlcnJvckZ1bmN0aW9uc1tpZF0uY2xlYXJFcnJvcigpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShlcnJvckZ1bmN0aW9uc1tpZF0uc2V0RXJyb3IpO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQWxsSW5wdXRzKCkge1xuICBsZXQgZXJyb3IgPSBmYWxzZTtcbiAgY29uc3QgaW5wdXRJZHMgPSBbJ25hbWUnLCAncmF0aW5nJywgJ2NvbW1lbnRzJ107XG4gIGNvbnN0IGludmFsaWRJbnB1dHMgPSBbXTtcbiAgaW5wdXRJZHMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICBjb25zdCBpbnB1dFZhbGlkID0gdmFsaWRhdGVJbnB1dChpZCk7XG4gICAgaWYgKCFpbnB1dFZhbGlkKSB7XG4gICAgICBpbnZhbGlkSW5wdXRzLnB1c2goaWQpO1xuICAgICAgZXJyb3IgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB7IGVycm9yLCBpbnZhbGlkSW5wdXRzIH07XG59XG5cbi8qKiAqKioqIGhhbmRsZSBldmVudHMgKioqKioqICovXG5cbmZ1bmN0aW9uIGhhbmRsZVJhbmdlQ2hhbmdlKGV2ZW50KSB7XG4gIGNvbnN0IHJhdGluZ1ZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJhdGluZy12YWx1ZScpO1xuICByYXRpbmdWYWx1ZS5pbm5lckhUTUwgPSBgJHtldmVudC50YXJnZXQudmFsdWV9LzVgO1xuICB2YWxpZGF0ZUlucHV0KGV2ZW50LnRhcmdldC5uYW1lLCBldmVudC50YXJnZXQudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVJbnB1dEtleVVwKGV2ZW50KSB7XG4gIGlmICghKGV2ZW50LmtleSAmJiBldmVudC5rZXkgPT09ICdUYWInKSkge1xuICAgIC8vIHdoZW4gdGFiIGlzIHVzZWQsIGFsbG93IHRoZSBvbmJsdXIgaGFuZGxlciB0byBwZXJmb3JtIHZhbGlkYXRpb25cbiAgICAvLyB3aGVuIHRoZSB0YWIga2V5IGlzIHByZXNzZWQsIGZvY3VzIGlzIGFscmVhZHkgb24gdGhlIG5leHQgaW5wdXQgd2hlbiB0aGUgZXZlbnQgZmlyZXNcbiAgICAvLyBzbyB0aGUgd3JvbmcgaW5wdXQgaXMgdmFsaWRhdGVkXG4gICAgdmFsaWRhdGVJbnB1dChldmVudC50YXJnZXQubmFtZSwgZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVJbnB1dEJsdXIoZXZlbnQpIHtcbiAgdmFsaWRhdGVJbnB1dChldmVudC50YXJnZXQubmFtZSwgZXZlbnQudGFyZ2V0LnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybUlucHV0VmFsdWVzKCkge1xuICBjb25zdCBpbnB1dElkcyA9IFsnbmFtZScsICdyYXRpbmcnLCAnY29tbWVudHMnXTtcbiAgY29uc3QgdmFsdWVzID0ge307XG4gIGlucHV0SWRzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgdmFsdWVzW2lkXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS52YWx1ZTtcbiAgfSk7XG4gIHJldHVybiB2YWx1ZXM7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRm9ybSgpIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hbWUnKS52YWx1ZSA9ICcnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmF0aW5nJykudmFsdWUgPSAnMCc7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yYXRpbmctdmFsdWUnKS5pbm5lckhUTUwgPSAnMC81JztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzJykudmFsdWUgPSAnJztcbn1cblxuZnVuY3Rpb24gY2xlYXJGb3JtRXJyb3JzKCkge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZS1lcnJvcicpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZy1lcnJvcicpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzLWVycm9yJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1mb3JtLWVycm9yJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1mb3JtLWVycm9yJykuaW5uZXJIVE1MID0gJyc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmcnKS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtZXJyb3InKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFkZFJldmlld1N1Ym1pdCgpIHtcbiAgY29uc3QgeyBlcnJvciwgaW52YWxpZElucHV0cyB9ID0gdmFsaWRhdGVBbGxJbnB1dHMoKTtcbiAgaWYgKCFlcnJvcikge1xuICAgIGNvbnN0IHsgbmFtZSwgcmF0aW5nLCBjb21tZW50cyB9ID0gZ2V0Rm9ybUlucHV0VmFsdWVzKCk7XG4gICAgaWYgKCghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHx8ICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikpIHtcbiAgICAgIC8vIHBlcmZvcm0gcmVndWxhciBmZXRjaCBhbmQgcmVndWxhciB1cGRhdGVzXG4gICAgICBjb25zdCBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1zdWJtaXQnKTtcbiAgICAgIHN1Ym1pdEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICBzdWJtaXRCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICAgICAgREJIZWxwZXIuYWRkUmV2aWV3KHNlbGYucmVzdGF1cmFudC5pZCwgbmFtZSwgcmF0aW5nLCBjb21tZW50cywgKGVycm9yLCBuZXdSZXZpZXcpID0+IHtcbiAgICAgICAgc3VibWl0QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgc3VibWl0QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ2ZhbHNlJyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGVucXVldWVUb2FzdCgnQW4gZXJyb3Igb2NjdXJyZWQuIFBsZWFzZSB0cnkgYWdhaW4nLCAnZXJyb3InKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW5xdWV1ZVRvYXN0KGAke25hbWV9J3MgcmV2aWV3IGhhcyBiZWVuIHNhdmVkYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgICAgICAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChuZXdSZXZpZXcpLCB1bC5maXJzdENoaWxkKTtcbiAgICAgICAgICBjbG9zZU1vZGFsKCk7XG4gICAgICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXF1ZXN0SWQgPSBgJHtzZWxmLnJlc3RhdXJhbnQuaWR9LSR7RGF0ZS5ub3coKX1gO1xuICAgICAgY29uc3QgbmV3UmV2aWV3ID0ge1xuICAgICAgICBuYW1lLCByYXRpbmcsIGNvbW1lbnRzLCByZXN0YXVyYW50X2lkOiBzZWxmLnJlc3RhdXJhbnQuaWQsXG4gICAgICB9O1xuICAgICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChuZXdSZXZpZXcsIHRydWUsIHJlcXVlc3RJZCksIHVsLmZpcnN0Q2hpbGQpO1xuXG4gICAgICBpZiAoKCdvbkxpbmUnIGluIG5hdmlnYXRvcikgJiYgIW5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgZW5xdWV1ZVRvYXN0KCdZb3VyIHJldmlldyB3aWxsIGJlIHN1Ym1pdHRlZCB3aGVuIHlvdSBhcmUgYmFjayBvbmxpbmUnKTtcbiAgICAgIH1cblxuICAgICAgY2xvc2VNb2RhbCgpO1xuICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ3Bvc3QtcmV2aWV3JyxcbiAgICAgICAgcmV2aWV3OiBuZXdSZXZpZXcsXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHsgLy8gZm9ybSBlcnJvcnMgbm90IGNsZWFyZWRcbiAgICBjb25zdCBmb3JtRXJyb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1mb3JtLWVycm9yJyk7XG4gICAgY29uc3QgZXJyb3JUZXh0ID0gYEludmFsaWQgaW5wdXQgZm9yOiAke2ludmFsaWRJbnB1dHMuam9pbignLCAnKX1gO1xuICAgIGZvcm1FcnJvci5pbm5lckhUTUwgPSBlcnJvclRleHQ7XG4gICAgZm9ybUVycm9yLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpbnZhbGlkSW5wdXRzWzBdKS5mb2N1cygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUZvcm1TdWJtaXQoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn1cbiJdLCJmaWxlIjoiYWRkUmV2aWV3TW9kYWwuanMifQ==

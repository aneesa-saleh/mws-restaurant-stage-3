"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var restaurant;
var reviews;
var outboxReviews;
var newMap;
var matchesMediaQuery;
var mediaQuery = '(min-width: 800px)';
var previouslyFocusedElement;
var toastTimer = null;
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
          showToast('An error occurred while submitting your review', 'error');
          updateReviewHTML(true, requestId);
        } else {
          showToast("".concat(review.name, "'s review has been saved"), 'success');
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
          return;
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

function clearToastTimer() {
  clearTimeout(toastTimer);
  toastTimer = null;
}

function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  toast.classList.remove('show');
  setTimeout(function () {
    toastText.setAttribute('aria-live', 'polite');
  }, 0);
}

function showToast(message, type) {
  if (!message) return;
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  var toastIcon = document.getElementById('toast-icon');
  toastText.setAttribute('aria-live', 'polite');
  toastText.innerHTML = message;

  if (type === 'error') {
    toast.className = 'toast show error';
  } else if (type === 'success') {
    toast.className = 'toast show success';
  } else {
    toast.className = 'toast show';
  }

  clearTimeout(toastTimer);
  setTimeout(function () {
    toastText.setAttribute('aria-live', 'off');
  }, 0);
  toastTimer = setTimeout(hideToast, 10000);
}

function showConnectionStatus() {
  var connectionStatus = document.getElementById('connectionStatus');

  if (navigator.onLine && !previouslyConnected) {
    // user came back online
    showToast('You are back online', 'success');
  } else if (!navigator.onLine && previouslyConnected) {
    // user went offline
    showToast('You are offline', 'error');
  }

  previouslyConnected = navigator.onLine;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQiLCJ0b2FzdFRpbWVyIiwicHJldmlvdXNseUNvbm5lY3RlZCIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwibmF2aWdhdG9yIiwib25MaW5lIiwiaW5pdE1hcCIsImZldGNoUmV2aWV3cyIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwidXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJzZXRJbnRlcnZhbCIsImNsZWFuTWFwYm94VGlsZXNDYWNoZSIsInNlcnZpY2VXb3JrZXIiLCJkYXRhIiwidHlwZSIsInJlcXVlc3RJZCIsInJldmlldyIsImVycm9yIiwic2hvd1RvYXN0IiwidXBkYXRlUmV2aWV3SFRNTCIsIm5hbWUiLCJzaG93Q29ubmVjdGlvblN0YXR1cyIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJNQVBCT1hfQVBJX0tFWSIsImNvbnNvbGUiLCJzZWxmIiwiTCIsIm1hcCIsImNlbnRlciIsImxhdGxuZyIsImxhdCIsImxuZyIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXBib3hUb2tlbiIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImlkIiwiYWRkVG8iLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm5leHRNYXRjaGVzTWVkaWFRdWVyeSIsInJlc3RhdXJhbnRDb250YWluZXIiLCJnZXRFbGVtZW50QnlJZCIsImFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyIiwic2V0QXR0cmlidXRlIiwiY2FsbGJhY2siLCJnZXRVcmxQYXJhbSIsImZldGNoUmVzdGF1cmFudEJ5SWQiLCJmaWxsUmVzdGF1cmFudEhUTUwiLCJpbm5lckhUTUwiLCJhZGRyZXNzIiwicGljdHVyZSIsInNvdXJjZUxhcmdlIiwiY3JlYXRlRWxlbWVudCIsIm1lZGlhIiwic3Jjc2V0IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50Iiwic2l6ZSIsIndpZGUiLCJhcHBlbmRDaGlsZCIsInNvdXJjZU1lZGl1bSIsInNvdXJjZVNtYWxsIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJzcmMiLCJhbHQiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlIiwiY3Vpc2luZSIsImN1aXNpbmVfdHlwZSIsImFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZSIsImFkZFJldmlld0J1dHRvbiIsInJlbW92ZUF0dHJpYnV0ZSIsImFkZFJldmlld092ZXJsYXlIZWFkaW5nIiwib3BlcmF0aW5nX2hvdXJzIiwiZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwiLCJPYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJwcm90b3R5cGUiLCJyb3ciLCJkYXkiLCJ0aW1lIiwibWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSIsImJ1dHRvbiIsImljb24iLCJxdWVyeVNlbGVjdG9yIiwidGV4dCIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSIsInVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSIsImlzRmF2b3VyaXRlIiwiaXNfZmF2b3JpdGUiLCJmYXZvdXJpdGVCdXR0b24iLCJzdHJpbmdUb0Jvb2xlYW4iLCJsb2ciLCJmZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZCIsImZpbGxSZXZpZXdzSFRNTCIsImdldE91dGJveFJldmlld3MiLCJmaWxsU2VuZGluZ1Jldmlld3NIVE1MIiwibGVuZ3RoIiwibm9SZXZpZXdzIiwiY29udGFpbmVyIiwidWwiLCJmb3JFYWNoIiwiaW5zZXJ0QmVmb3JlIiwiY3JlYXRlUmV2aWV3SFRNTCIsImZpcnN0Q2hpbGQiLCJvdXRib3hSZXZpZXciLCJyZXF1ZXN0X2lkIiwic2VuZGluZyIsImFydGljbGUiLCJoZWFkZXJTcGFuIiwiZGF0ZSIsImxvYWRpbmdUZXh0IiwiZGF0ZVRleHQiLCJmb3JtYXREYXRlIiwiRGF0ZSIsInVwZGF0ZWRBdCIsImNvbnRlbnRTcGFuIiwicmF0aW5nIiwiY29tbWVudHMiLCJyZXZpZXdFbGVtZW50IiwiZXJyb3JUZXh0IiwiYnJlYWRjcnVtYiIsImxpIiwidXJsIiwibG9jYXRpb24iLCJocmVmIiwicmVwbGFjZSIsInJlZ2V4IiwiUmVnRXhwIiwicmVzdWx0cyIsImV4ZWMiLCJkZWNvZGVVUklDb21wb25lbnQiLCJzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwic3Bpbm5lciIsInJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUiLCJ0b2dnbGVSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJuZXdJc0Zhdm91cml0ZSIsInJlc3RhdXJhbnRJZCIsImZhaWxlZFVwZGF0ZUNhbGxiYWNrIiwic2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyIsInVwZGF0ZWRSZXN0YXVyYW50IiwiY2xlYXJUb2FzdFRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiaGlkZVRvYXN0IiwidG9hc3QiLCJ0b2FzdFRleHQiLCJzZXRUaW1lb3V0IiwibWVzc2FnZSIsInRvYXN0SWNvbiIsImNvbm5lY3Rpb25TdGF0dXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUlBLFVBQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsYUFBSjtBQUNBLElBQUlDLE1BQUo7QUFDQSxJQUFJQyxpQkFBSjtBQUNBLElBQU1DLFVBQVUsR0FBRyxvQkFBbkI7QUFDQSxJQUFJQyx3QkFBSjtBQUNBLElBQUlDLFVBQVUsR0FBRyxJQUFqQjtBQUNBLElBQUlDLG1CQUFKO0FBRUE7Ozs7QUFHQUMsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFB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NEksSUFBQUEsS0FBSyxDQUFDeEYsU0FBTixHQUFrQixvQkFBbEI7QUFDRCxHQUZNLE1BRUE7QUFDTHdGLElBQUFBLEtBQUssQ0FBQ3hGLFNBQU4sR0FBa0IsWUFBbEI7QUFDRDs7QUFFRHNGLEVBQUFBLFlBQVksQ0FBQzVKLFVBQUQsQ0FBWjtBQUNBZ0ssRUFBQUEsVUFBVSxDQUFDLFlBQVc7QUFDcEJELElBQUFBLFNBQVMsQ0FBQzVHLFlBQVYsQ0FBdUIsV0FBdkIsRUFBb0MsS0FBcEM7QUFDRCxHQUZTLEVBRVAsQ0FGTyxDQUFWO0FBR0FuRCxFQUFBQSxVQUFVLEdBQUdnSyxVQUFVLENBQUNILFNBQUQsRUFBWSxLQUFaLENBQXZCO0FBQ0Q7O0FBRUQsU0FBU3BJLG9CQUFULEdBQWdDO0FBQzlCLE1BQUkwSSxnQkFBZ0IsR0FBR2pLLFFBQVEsQ0FBQytDLGNBQVQsQ0FBd0Isa0JBQXhCLENBQXZCOztBQUVBLE1BQUk1QyxTQUFTLENBQUNDLE1BQVYsSUFBb0IsQ0FBQ0wsbUJBQXpCLEVBQThDO0FBQUU7QUFDOUNxQixJQUFBQSxTQUFTLENBQUMscUJBQUQsRUFBd0IsU0FBeEIsQ0FBVDtBQUNELEdBRkQsTUFFTyxJQUFJLENBQUNqQixTQUFTLENBQUNDLE1BQVgsSUFBcUJMLG1CQUF6QixFQUE4QztBQUFFO0FBQ3JEcUIsSUFBQUEsU0FBUyxDQUFDLGlCQUFELEVBQW9CLE9BQXBCLENBQVQ7QUFDRDs7QUFFRHJCLEVBQUFBLG1CQUFtQixHQUFHSSxTQUFTLENBQUNDLE1BQWhDO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgcmVzdGF1cmFudDtcbmxldCByZXZpZXdzO1xubGV0IG91dGJveFJldmlld3M7XG5sZXQgbmV3TWFwO1xubGV0IG1hdGNoZXNNZWRpYVF1ZXJ5O1xuY29uc3QgbWVkaWFRdWVyeSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xubGV0IHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDtcbmxldCB0b2FzdFRpbWVyID0gbnVsbDtcbmxldCBwcmV2aW91c2x5Q29ubmVjdGVkO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWFwIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gIHByZXZpb3VzbHlDb25uZWN0ZWQgPSBuYXZpZ2F0b3Iub25MaW5lO1xuXG4gIGluaXRNYXAoKTtcbiAgZmV0Y2hSZXZpZXdzKCk7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgfVxuICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpOyAvLyBzZXQgaW5pdGlhbCBhcmlhIHZhbHVlc1xuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgc2V0SW50ZXJ2YWwoY2xlYW5NYXBib3hUaWxlc0NhY2hlLCA1MDAwKTtcblxuICBpZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCB7IHR5cGUsIHJlcXVlc3RJZCwgcmV2aWV3LCBlcnJvciB9ID0gZXZlbnQuZGF0YTtcbiAgICAgIGlmICh0eXBlID09PSAndXBkYXRlLXJldmlldycpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgc2hvd1RvYXN0KCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBzdWJtaXR0aW5nIHlvdXIgcmV2aWV3JywgJ2Vycm9yJyk7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTCh0cnVlLCByZXF1ZXN0SWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNob3dUb2FzdChgJHtyZXZpZXcubmFtZX0ncyByZXZpZXcgaGFzIGJlZW4gc2F2ZWRgLCAnc3VjY2VzcycpO1xuICAgICAgICAgIHVwZGF0ZVJldmlld0hUTUwoZmFsc2UsIHJlcXVlc3RJZCwgcmV2aWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBpZiAoJ29uTGluZScgaW4gbmF2aWdhdG9yKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIHNob3dDb25uZWN0aW9uU3RhdHVzKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIHNob3dDb25uZWN0aW9uU3RhdHVzKTtcbiAgICBzaG93Q29ubmVjdGlvblN0YXR1cygpO1xuICB9XG59KTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGxlYWZsZXQgbWFwXG4gKi9cbmNvbnN0IGluaXRNYXAgPSAoKSA9PiB7XG4gIGZldGNoUmVzdGF1cmFudEZyb21VUkwoKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgY29uc3QgTUFQQk9YX0FQSV9LRVkgPSAncGsuZXlKMUlqb2lZVzVsWlhOaExYTmhiR1ZvSWl3aVlTSTZJbU5xYTJ4bVpIVndNREZvWVc0emRuQXdZV3BsTW01M2JIRWlmUS5WMTFkRE90RW5XU3dUeFktQzhtSkx3JztcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYubmV3TWFwID0gTC5tYXAoJ21hcCcsIHtcbiAgICAgICAgY2VudGVyOiBbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAgICB6b29tOiAxNixcbiAgICAgICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgICAgTC50aWxlTGF5ZXIoJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20vdjQve2lkfS97en0ve3h9L3t5fS5qcGc3MD9hY2Nlc3NfdG9rZW49e21hcGJveFRva2VufScsIHtcbiAgICAgICAgbWFwYm94VG9rZW46IE1BUEJPWF9BUElfS0VZLFxuICAgICAgICBtYXhab29tOiAxOCxcbiAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJ1xuICAgICAgICAgICsgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJ1xuICAgICAgICAgICsgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXG4gICAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnLFxuICAgICAgfSkuYWRkVG8obmV3TWFwKTtcbiAgICAgIGZpbGxCcmVhZGNydW1iKCk7XG4gICAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5uZXdNYXApO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiogVXBkYXRlIGFyaWEtaGlkZGVuIHZhbHVlcyBvZiB0aGUgdmlzaWJsZSBhbmQgYWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiovXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICBjb25zdCBuZXh0TWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICAgIGlmIChuZXh0TWF0Y2hlc01lZGlhUXVlcnkgIT09IG1hdGNoZXNNZWRpYVF1ZXJ5KSB7IC8vIG9ubHkgdXBkYXRlIGFyaWEgd2hlbiBsYXlvdXQgY2hhbmdlc1xuICAgICAgbWF0Y2hlc01lZGlhUXVlcnkgPSBuZXh0TWF0Y2hlc01lZGlhUXVlcnk7XG4gICAgICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpO1xuICAgIH1cbiAgfVxufSk7XG5cbi8qKlxuKiBTZXQgYXJpYS1oaWRkZW4gdmFsdWVzIGZvciB2aXNpYmxlIGFuZCByZWd1bGFyIHJlc3RhdXJhbnQgY29udGFpbmVyc1xuKiBBY2Nlc3NpYmxlIHJlc3RhdXJhbnQgY29udGFpbmVyIGlzIG9mZiBzY3JlZW5cbiogSXQgaXMgcmVxdWlyZWQgdG8gbWFpbnRhaW4gc2NyZWVuIHJlYWRpbmcgb3JkZXIgd2hlbiB0aGUgbGF5b3V0IHNoaWZ0c1xuKi9cbmNvbnN0IHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhID0gKCkgPT4ge1xuICBjb25zdCByZXN0YXVyYW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1jb250YWluZXInKTtcbiAgaWYgKG1hdGNoZXNNZWRpYVF1ZXJ5KSB7IC8vIGxhcmdlciBsYXlvdXQsIHNjcmVlbiByZWFkaW5nIG9yZGVyIG9mZlxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICB9IGVsc2UgeyAvLyB1c2UgcmVndWxhciByZWFkaW5nIG9yZGVyXG4gICAgcmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMID0gKGNhbGxiYWNrKSA9PiB7XG4gIGlmIChzZWxmLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXG4gICAgY2FsbGJhY2sobnVsbCwgc2VsZi5yZXN0YXVyYW50KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaWQgPSBnZXRVcmxQYXJhbSgnaWQnKTtcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcbiAgICBlcnJvciA9ICdObyByZXN0YXVyYW50IGlkIGluIFVSTCc7XG4gICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcbiAgICAgIGlmICghcmVzdGF1cmFudCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJlc3RhdXJhbnRIVE1MKCk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2VcbiAqL1xuY29uc3QgZmlsbFJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XG5cbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWFkZHJlc3MnKTtcbiAgYWRkcmVzcy5pbm5lckhUTUwgKz0gcmVzdGF1cmFudC5hZGRyZXNzO1xuXG4gIGNvbnN0IHBpY3R1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1waWN0dXJlJyk7XG5cbiAgY29uc3Qgc291cmNlTGFyZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTGFyZ2UubWVkaWEgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbiAgc291cmNlTGFyZ2Uuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ2xhcmdlJywgd2lkZTogdHJ1ZSB9KTtcbiAgc291cmNlTGFyZ2UudHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VMYXJnZSk7XG5cbiAgY29uc3Qgc291cmNlTWVkaXVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZU1lZGl1bS5tZWRpYSA9ICcobWluLXdpZHRoOiA2MDBweCknO1xuICBzb3VyY2VNZWRpdW0uc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ21lZGl1bScgfSk7XG4gIHNvdXJjZU1lZGl1bS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZU1lZGl1bSk7XG5cbiAgY29uc3Qgc291cmNlU21hbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlU21hbGwuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ3NtYWxsJyB9KTtcbiAgc291cmNlU21hbGwudHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VTbWFsbCk7XG5cbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcbiAgLy8gc2V0IGRlZmF1bHQgc2l6ZSBpbiBjYXNlIHBpY3R1cmUgZWxlbWVudCBpcyBub3Qgc3VwcG9ydGVkXG4gIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcbiAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5hbHQ7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoaW1hZ2UpO1xuXG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWltZycpO1xuICBhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHJlc3RhdXJhbnQuYWx0KTtcblxuICBjb25zdCBjdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY3Vpc2luZScpO1xuICBjdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZS5pbm5lckhUTUwgPSBgQ3Vpc2luZTogJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gO1xuXG4gIGNvbnN0IGFkZFJldmlld0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LWJ1dHRvbicpO1xuICBhZGRSZXZpZXdCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgYEFkZCBhIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XG4gIGFkZFJldmlld0J1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG5cbiAgY29uc3QgYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1vdmVybGF5LWhlYWRpbmcnKTtcbiAgYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmcuaW5uZXJIVE1MID0gYEFkZCByZXZpZXcgZm9yICR7cmVzdGF1cmFudC5uYW1lfWA7XG5cbiAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcbiAgaWYgKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XG4gICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChyZXN0YXVyYW50LCAnaXNfZmF2b3JpdGUnKSkge1xuICAgIGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MKCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgb3BlcmF0aW5nIGhvdXJzIEhUTUwgdGFibGUgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XG4gIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaG91cnMnKTtcbiAgZm9yIChjb25zdCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wZXJhdGluZ0hvdXJzLCBrZXkpKSB7XG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXG4gICAgICBjb25zdCBkYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgZGF5LmlubmVySFRNTCA9IGtleTtcbiAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xuXG4gICAgICBjb25zdCB0aW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcbiAgICAgIHJvdy5hcHBlbmRDaGlsZCh0aW1lKTtcblxuICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoYnV0dG9uKSA9PiB7XG4gIHZhciBpY29uID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgdmFyIHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdVbm1hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBjdXJyZW50bHkgbWFya2VkIGFzIGZhdm91cml0ZScpO1xufTtcblxuY29uc3QgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKGJ1dHRvbikgPT4ge1xuICB2YXIgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIHZhciB0ZXh0ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcbiAgdGV4dC5pbm5lckhUTUwgPSAnTWFyayByZXN0YXVyYW50IGFzIGZhdm91cml0ZSc7XG4gIGljb24uY2xhc3NMaXN0LmFkZCgnZmFyJywgJ3VubWFya2VkJyk7XG4gIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmFzJywgJ21hcmtlZCcpO1xuICBpY29uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdSZXN0YXVyYW50IGlzIG5vdCBjdXJyZW50bHkgbWFya2VkIGFzIGZhdm91cml0ZScpO1xufTtcblxuLyoqXG4gKiBTZXQgc3RhdGUgYW5kIHRleHQgZm9yIG1hcmsgYXMgZmF2b3VyaXRlIGJ1dHRvbi5cbiAqL1xuY29uc3QgZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwgPSAoaXNGYXZvdXJpdGUgPSBzZWxmLnJlc3RhdXJhbnQuaXNfZmF2b3JpdGUpID0+IHtcbiAgY29uc3QgZmF2b3VyaXRlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcmstYXMtZmF2b3VyaXRlJyk7XG4gIGlmIChzdHJpbmdUb0Jvb2xlYW4oaXNGYXZvdXJpdGUpKSB7XG4gICAgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShmYXZvdXJpdGVCdXR0b24pO1xuICB9IGVsc2Uge1xuICAgIHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShmYXZvdXJpdGVCdXR0b24pO1xuICB9XG5cbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBmZXRjaFJldmlld3MgPSAoKSA9PiB7XG4gIGNvbnN0IGlkID0gZ2V0VXJsUGFyYW0oJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgY29uc29sZS5sb2coJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJyk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQoaWQsIChlcnJvciwgcmV2aWV3cykgPT4ge1xuICAgICAgc2VsZi5yZXZpZXdzID0gcmV2aWV3cztcbiAgICAgIGlmICghcmV2aWV3cykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJldmlld3NIVE1MKCk7XG4gICAgICBEQkhlbHBlci5nZXRPdXRib3hSZXZpZXdzKGlkLCAoZXJyb3IsIG91dGJveFJldmlld3MpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLm91dGJveFJldmlld3MgPSBvdXRib3hSZXZpZXdzO1xuICAgICAgICAgIGZpbGxTZW5kaW5nUmV2aWV3c0hUTUwoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXZpZXdzKSA9PiB7XG4gIGlmICghcmV2aWV3cyB8fCByZXZpZXdzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICByZXZpZXdzLmZvckVhY2goKHJldmlldykgPT4ge1xuICAgIHVsLmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldyksIHVsLmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbmNvbnN0IGZpbGxTZW5kaW5nUmV2aWV3c0hUTUwgPSAob3V0Ym94UmV2aWV3cyA9IHNlbGYub3V0Ym94UmV2aWV3cykgPT4ge1xuICBpZiAoIW91dGJveFJldmlld3MgfHwgb3V0Ym94UmV2aWV3cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgb3V0Ym94UmV2aWV3cy5mb3JFYWNoKChvdXRib3hSZXZpZXcpID0+IHtcbiAgICBjb25zdCB7IHJlcXVlc3RfaWQsIC4uLnJldmlldyB9ID0gb3V0Ym94UmV2aWV3O1xuICAgIHVsLmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgdHJ1ZSwgcmVxdWVzdF9pZCksIHVsLmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3LCBzZW5kaW5nLCByZXF1ZXN0SWQpID0+IHtcbiAgY29uc3QgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgYXJ0aWNsZS5jbGFzc05hbWUgPSAncmV2aWV3JztcblxuICBjb25zdCBoZWFkZXJTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBoZWFkZXJTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctaGVhZGVyJztcblxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xuICBuYW1lLmNsYXNzTmFtZSA9ICdyZXZpZXctbmFtZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQobmFtZSk7XG5cbiAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAnZmEtY2xvY2snKTtcbiAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsb2FkaW5nVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyc7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICBkYXRlLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkYXRlVGV4dCA9IGZvcm1hdERhdGUobmV3IERhdGUocmV2aWV3LnVwZGF0ZWRBdCkpO1xuICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gIH1cblxuICBkYXRlLmNsYXNzTmFtZSA9ICdyZXZpZXctZGF0ZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQoZGF0ZSk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoaGVhZGVyU3Bhbik7XG5cbiAgY29uc3QgY29udGVudFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGNvbnRlbnRTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctY29udGVudCc7XG5cbiAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XG4gIHJhdGluZy5jbGFzc05hbWUgPSAncmV2aWV3LXJhdGluZyc7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKHJhdGluZyk7XG5cbiAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGNvbnRlbnRTcGFuKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdkYXRhLWlkJywgcmVxdWVzdElkKTtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NlbmRpbmcnKTtcbiAgfVxuXG4gIHJldHVybiBhcnRpY2xlO1xufTtcblxuY29uc3QgdXBkYXRlUmV2aWV3SFRNTCA9IChlcnJvciwgcmVxdWVzdElkLCByZXZpZXcpID0+IHtcbiAgY29uc3QgcmV2aWV3RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtyZXF1ZXN0SWR9XCJdYCk7XG4gIGlmIChlcnJvcikge1xuICAgIGlmIChyZXZpZXdFbGVtZW50KSB7IC8vIGZvciBlcnJvciwgbm8gbmVlZCB0byBhZGQgdG8gVUkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICBkYXRlLmlubmVySFRNTCA9ICcnO1xuICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFzJywgJ2ZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyk7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBlcnJvclRleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcgZmFpbGVkJztcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICBkYXRlLmFwcGVuZENoaWxkKGVycm9yVGV4dCk7XG4gICAgICBkYXRlLmNsYXNzTGlzdC5hZGQoJ2Vycm9yJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICAgIGlmICh1bCAmJiBzZWxmLnJlc3RhdXJhbnQpIHsgLy8gb25seSB1cGRhdGUgaWYgdGhlIHJlc3RhdXJhbnQgaXMgbG9hZGVkXG4gICAgICBpZiAocmV2aWV3RWxlbWVudCkge1xuICAgICAgICByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbmRpbmcnKTtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICAgIGNvbnN0IGRhdGVUZXh0ID0gZm9ybWF0RGF0ZShuZXcgRGF0ZShyZXZpZXcudXBkYXRlZEF0KSk7XG4gICAgICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cbmNvbnN0IGZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn07XG5cbi8qKlxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZ2V0VXJsUGFyYW0gPSAobmFtZSwgdXJsKSA9PiB7XG4gIHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKTtcblxuXG4gIGNvbnN0IHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XG4gIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csICcgJykpO1xufTtcblxuY29uc3Qgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59XG5cbmNvbnN0IHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICdmYWxzZScpO1xuICBzcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn1cblxuY29uc3QgdG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKCkgPT4ge1xuICBjb25zdCBpc0Zhdm91cml0ZSA9IHN0cmluZ1RvQm9vbGVhbihzZWxmLnJlc3RhdXJhbnQuaXNfZmF2b3JpdGUpO1xuICBjb25zdCBuZXdJc0Zhdm91cml0ZSA9ICghaXNGYXZvdXJpdGUpICYmIGlzRmF2b3VyaXRlICE9PSAnZmFsc2UnO1xuICBjb25zdCByZXN0YXVyYW50SWQgPSBzZWxmLnJlc3RhdXJhbnQuaWQ7XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zhdm91cml0ZS1zcGlubmVyJyk7XG4gIGxldCBmYWlsZWRVcGRhdGVDYWxsYmFjaztcbiAgaWYgKG5ld0lzRmF2b3VyaXRlKSB7XG4gICAgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICB9IGVsc2Uge1xuICAgIHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgfVxuICBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gIERCSGVscGVyLnNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMocmVzdGF1cmFudElkLCBuZXdJc0Zhdm91cml0ZSwgKGVycm9yLCB1cGRhdGVkUmVzdGF1cmFudCkgPT4ge1xuICAgIHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgICBpZiAoIXVwZGF0ZWRSZXN0YXVyYW50KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrKGJ1dHRvbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYucmVzdGF1cmFudCA9IHVwZGF0ZWRSZXN0YXVyYW50O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY2xlYXJUb2FzdFRpbWVyKCkge1xuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBoaWRlVG9hc3QoKSB7XG4gIGNsZWFyVGltZW91dCh0b2FzdFRpbWVyKTtcbiAgdG9hc3RUaW1lciA9IG51bGw7XG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Jyk7XG4gIGNvbnN0IHRvYXN0VGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC10ZXh0Jyk7XG4gIHRvYXN0LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICB0b2FzdFRleHQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG4gIH0sIDApO1xufVxuXG5mdW5jdGlvbiBzaG93VG9hc3QobWVzc2FnZSwgdHlwZSkge1xuICBpZiAoIW1lc3NhZ2UpIHJldHVybjtcblxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xuICBjb25zdCB0b2FzdFRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtdGV4dCcpO1xuICBjb25zdCB0b2FzdEljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtaWNvbicpO1xuXG4gIHRvYXN0VGV4dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcbiAgdG9hc3RUZXh0LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICB0b2FzdC5jbGFzc05hbWUgPSAndG9hc3Qgc2hvdyBlcnJvcic7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgdG9hc3QuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cgc3VjY2Vzcyc7XG4gIH0gZWxzZSB7XG4gICAgdG9hc3QuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cnO1xuICB9XG5cbiAgY2xlYXJUaW1lb3V0KHRvYXN0VGltZXIpO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHRvYXN0VGV4dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdvZmYnKTtcbiAgfSwgMCk7XG4gIHRvYXN0VGltZXIgPSBzZXRUaW1lb3V0KGhpZGVUb2FzdCwgMTAwMDApO1xufVxuXG5mdW5jdGlvbiBzaG93Q29ubmVjdGlvblN0YXR1cygpIHtcbiAgdmFyIGNvbm5lY3Rpb25TdGF0dXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29ubmVjdGlvblN0YXR1cycpO1xuXG4gIGlmIChuYXZpZ2F0b3Iub25MaW5lICYmICFwcmV2aW91c2x5Q29ubmVjdGVkKSB7IC8vIHVzZXIgY2FtZSBiYWNrIG9ubGluZVxuICAgIHNob3dUb2FzdCgnWW91IGFyZSBiYWNrIG9ubGluZScsICdzdWNjZXNzJyk7XG4gIH0gZWxzZSBpZiAoIW5hdmlnYXRvci5vbkxpbmUgJiYgcHJldmlvdXNseUNvbm5lY3RlZCkgeyAvLyB1c2VyIHdlbnQgb2ZmbGluZVxuICAgIHNob3dUb2FzdCgnWW91IGFyZSBvZmZsaW5lJywgJ2Vycm9yJyk7XG4gIH1cblxuICBwcmV2aW91c2x5Q29ubmVjdGVkID0gbmF2aWdhdG9yLm9uTGluZTtcbn1cbiJdLCJmaWxlIjoicmVzdGF1cmFudF9pbmZvLmpzIn0=

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

function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;
  document.getElementById('toast').classList.remove('show');
}

function showToast(message, type) {
  if (!message) return;
  var toast = document.getElementById('toast');
  var toastText = toast.querySelector('.toast-text');
  toastText.innerHTML = message;

  if (type === 'error') {
    toast.className = 'toast show error';
  } else if (type === 'success') {
    toast.className = 'toast show success';
  } else {
    toast.className = 'toast show';
  }

  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 5000);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQiLCJ0b2FzdFRpbWVyIiwicHJldmlvdXNseUNvbm5lY3RlZCIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwibmF2aWdhdG9yIiwib25MaW5lIiwiaW5pdE1hcCIsImZldGNoUmV2aWV3cyIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwidXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJzZXRJbnRlcnZhbCIsImNsZWFuTWFwYm94VGlsZXNDYWNoZSIsInNlcnZpY2VXb3JrZXIiLCJkYXRhIiwidHlwZSIsInJlcXVlc3RJZCIsInJldmlldyIsImVycm9yIiwic2hvd1RvYXN0IiwidXBkYXRlUmV2aWV3SFRNTCIsIm5hbWUiLCJzaG93Q29ubmVjdGlvblN0YXR1cyIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJNQVBCT1hfQVBJX0tFWSIsImNvbnNvbGUiLCJzZWxmIiwiTCIsIm1hcCIsImNlbnRlciIsImxhdGxuZyIsImxhdCIsImxuZyIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXBib3hUb2tlbiIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImlkIiwiYWRkVG8iLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm5leHRNYXRjaGVzTWVkaWFRdWVyeSIsInJlc3RhdXJhbnRDb250YWluZXIiLCJnZXRFbGVtZW50QnlJZCIsImFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyIiwic2V0QXR0cmlidXRlIiwiY2FsbGJhY2siLCJnZXRVcmxQYXJhbSIsImZldGNoUmVzdGF1cmFudEJ5SWQiLCJmaWxsUmVzdGF1cmFudEhUTUwiLCJpbm5lckhUTUwiLCJhZGRyZXNzIiwicGljdHVyZSIsInNvdXJjZUxhcmdlIiwiY3JlYXRlRWxlbWVudCIsIm1lZGlhIiwic3Jjc2V0IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50Iiwic2l6ZSIsIndpZGUiLCJhcHBlbmRDaGlsZCIsInNvdXJjZU1lZGl1bSIsInNvdXJjZVNtYWxsIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJzcmMiLCJhbHQiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlIiwiY3Vpc2luZSIsImN1aXNpbmVfdHlwZSIsImFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZSIsImFkZFJldmlld0J1dHRvbiIsInJlbW92ZUF0dHJpYnV0ZSIsImFkZFJldmlld092ZXJsYXlIZWFkaW5nIiwib3BlcmF0aW5nX2hvdXJzIiwiZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwiLCJPYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJwcm90b3R5cGUiLCJyb3ciLCJkYXkiLCJ0aW1lIiwibWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSIsImJ1dHRvbiIsImljb24iLCJxdWVyeVNlbGVjdG9yIiwidGV4dCIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSIsInVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSIsImlzRmF2b3VyaXRlIiwiaXNfZmF2b3JpdGUiLCJmYXZvdXJpdGVCdXR0b24iLCJzdHJpbmdUb0Jvb2xlYW4iLCJsb2ciLCJmZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZCIsImZpbGxSZXZpZXdzSFRNTCIsImdldE91dGJveFJldmlld3MiLCJmaWxsU2VuZGluZ1Jldmlld3NIVE1MIiwibGVuZ3RoIiwibm9SZXZpZXdzIiwiY29udGFpbmVyIiwidWwiLCJmb3JFYWNoIiwiaW5zZXJ0QmVmb3JlIiwiY3JlYXRlUmV2aWV3SFRNTCIsImZpcnN0Q2hpbGQiLCJvdXRib3hSZXZpZXciLCJyZXF1ZXN0X2lkIiwic2VuZGluZyIsImFydGljbGUiLCJoZWFkZXJTcGFuIiwiZGF0ZSIsImxvYWRpbmdUZXh0IiwiZGF0ZVRleHQiLCJmb3JtYXREYXRlIiwiRGF0ZSIsInVwZGF0ZWRBdCIsImNvbnRlbnRTcGFuIiwicmF0aW5nIiwiY29tbWVudHMiLCJyZXZpZXdFbGVtZW50IiwiZXJyb3JUZXh0IiwiYnJlYWRjcnVtYiIsImxpIiwidXJsIiwibG9jYXRpb24iLCJocmVmIiwicmVwbGFjZSIsInJlZ2V4IiwiUmVnRXhwIiwicmVzdWx0cyIsImV4ZWMiLCJkZWNvZGVVUklDb21wb25lbnQiLCJzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwic3Bpbm5lciIsInJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUiLCJ0b2dnbGVSZXN0YXVyYW50QXNGYXZvdXJpdGUiLCJuZXdJc0Zhdm91cml0ZSIsInJlc3RhdXJhbnRJZCIsImZhaWxlZFVwZGF0ZUNhbGxiYWNrIiwic2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyIsInVwZGF0ZWRSZXN0YXVyYW50IiwiaGlkZVRvYXN0IiwiY2xlYXJUaW1lb3V0IiwibWVzc2FnZSIsInRvYXN0IiwidG9hc3RUZXh0Iiwic2V0VGltZW91dCIsImNvbm5lY3Rpb25TdGF0dXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUlBLFVBQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsYUFBSjtBQUNBLElBQUlDLE1BQUo7QUFDQSxJQUFJQyxpQkFBSjtBQUNBLElBQU1DLFVBQVUsR0FBRyxvQkFBbkI7QUFDQSxJQUFJQyx3QkFBSjtBQUNBLElBQUlDLFVBQVUsR0FBRyxJQUFqQjtBQUNBLElBQUlDLG1CQUFKO0FBRUE7Ozs7QUFHQUMsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3ZESCxFQUFBQSxtQkFB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LElBQXFCTCxtQkFBekIsRUFBOEM7QUFBRTtBQUNyRHFCLElBQUFBLFNBQVMsQ0FBQyxpQkFBRCxFQUFvQixPQUFwQixDQUFUO0FBQ0Q7O0FBRURyQixFQUFBQSxtQkFBbUIsR0FBR0ksU0FBUyxDQUFDQyxNQUFoQztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsibGV0IHJlc3RhdXJhbnQ7XG5sZXQgcmV2aWV3cztcbmxldCBvdXRib3hSZXZpZXdzO1xubGV0IG5ld01hcDtcbmxldCBtYXRjaGVzTWVkaWFRdWVyeTtcbmNvbnN0IG1lZGlhUXVlcnkgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbmxldCBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XG5sZXQgdG9hc3RUaW1lciA9IG51bGw7XG5sZXQgcHJldmlvdXNseUNvbm5lY3RlZDtcblxuLyoqXG4gKiBJbml0aWFsaXplIG1hcCBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cbiAqL1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xuICBwcmV2aW91c2x5Q29ubmVjdGVkID0gbmF2aWdhdG9yLm9uTGluZTtcblxuICBpbml0TWFwKCk7XG4gIGZldGNoUmV2aWV3cygpO1xuICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICBtYXRjaGVzTWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKG1lZGlhUXVlcnkpLm1hdGNoZXM7XG4gIH1cbiAgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEoKTsgLy8gc2V0IGluaXRpYWwgYXJpYSB2YWx1ZXNcbiAgcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCk7XG4gIHNldEludGVydmFsKGNsZWFuTWFwYm94VGlsZXNDYWNoZSwgNTAwMCk7XG5cbiAgaWYgKG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSB7XG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgY29uc3QgeyB0eXBlLCByZXF1ZXN0SWQsIHJldmlldywgZXJyb3IgfSA9IGV2ZW50LmRhdGE7XG4gICAgICBpZiAodHlwZSA9PT0gJ3VwZGF0ZS1yZXZpZXcnKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIHNob3dUb2FzdCgnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgc3VibWl0dGluZyB5b3VyIHJldmlldycsICdlcnJvcicpO1xuICAgICAgICAgIHVwZGF0ZVJldmlld0hUTUwodHJ1ZSwgcmVxdWVzdElkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaG93VG9hc3QoYCR7cmV2aWV3Lm5hbWV9J3MgcmV2aWV3IGhhcyBiZWVuIHNhdmVkYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKGZhbHNlLCByZXF1ZXN0SWQsIHJldmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgaWYgKCdvbkxpbmUnIGluIG5hdmlnYXRvcikge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvbmxpbmUnLCBzaG93Q29ubmVjdGlvblN0YXR1cyk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCBzaG93Q29ubmVjdGlvblN0YXR1cyk7XG4gICAgc2hvd0Nvbm5lY3Rpb25TdGF0dXMoKTtcbiAgfVxufSk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBsZWFmbGV0IG1hcFxuICovXG5jb25zdCBpbml0TWFwID0gKCkgPT4ge1xuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgIGNvbnN0IE1BUEJPWF9BUElfS0VZID0gJ3BrLmV5SjFJam9pWVc1bFpYTmhMWE5oYkdWb0lpd2lZU0k2SW1OcWEyeG1aSFZ3TURGb1lXNHpkbkF3WVdwbE1tNTNiSEVpZlEuVjExZERPdEVuV1N3VHhZLUM4bUpMdyc7XG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgICAgIGNlbnRlcjogW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgICAgem9vbTogMTYsXG4gICAgICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2UsXG4gICAgICB9KTtcbiAgICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XG4gICAgICAgIG1hcGJveFRva2VuOiBNQVBCT1hfQVBJX0tFWSxcbiAgICAgICAgbWF4Wm9vbTogMTgsXG4gICAgICAgIGF0dHJpYnV0aW9uOiAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMsICdcbiAgICAgICAgICArICc8YSBocmVmPVwiaHR0cHM6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzIuMC9cIj5DQy1CWS1TQTwvYT4sICdcbiAgICAgICAgICArICdJbWFnZXJ5IMKpIDxhIGhyZWY9XCJodHRwczovL3d3dy5tYXBib3guY29tL1wiPk1hcGJveDwvYT4nLFxuICAgICAgICBpZDogJ21hcGJveC5zdHJlZXRzJyxcbiAgICAgIH0pLmFkZFRvKG5ld01hcCk7XG4gICAgICBmaWxsQnJlYWRjcnVtYigpO1xuICAgICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubmV3TWFwKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4qIFVwZGF0ZSBhcmlhLWhpZGRlbiB2YWx1ZXMgb2YgdGhlIHZpc2libGUgYW5kIGFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXJzXG4qL1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgY29uc3QgbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgICBpZiAobmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ICE9PSBtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBvbmx5IHVwZGF0ZSBhcmlhIHdoZW4gbGF5b3V0IGNoYW5nZXNcbiAgICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5O1xuICAgICAgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKipcbiogU2V0IGFyaWEtaGlkZGVuIHZhbHVlcyBmb3IgdmlzaWJsZSBhbmQgcmVndWxhciByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiogQWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lciBpcyBvZmYgc2NyZWVuXG4qIEl0IGlzIHJlcXVpcmVkIHRvIG1haW50YWluIHNjcmVlbiByZWFkaW5nIG9yZGVyIHdoZW4gdGhlIGxheW91dCBzaGlmdHNcbiovXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSA9ICgpID0+IHtcbiAgY29uc3QgcmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGlmIChtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBsYXJnZXIgbGF5b3V0LCBzY3JlZW4gcmVhZGluZyBvcmRlciBvZmZcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgfSBlbHNlIHsgLy8gdXNlIHJlZ3VsYXIgcmVhZGluZyBvcmRlclxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xuICBpZiAoc2VsZi5yZXN0YXVyYW50KSB7IC8vIHJlc3RhdXJhbnQgYWxyZWFkeSBmZXRjaGVkIVxuICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlkID0gZ2V0VXJsUGFyYW0oJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgZXJyb3IgPSAnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnO1xuICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCAoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcbiAgICAgIHNlbGYucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XG4gICAgICBpZiAoIXJlc3RhdXJhbnQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZpbGxSZXN0YXVyYW50SFRNTCgpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlXG4gKi9cbmNvbnN0IGZpbGxSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1uYW1lJyk7XG4gIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuXG4gIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XG4gIGFkZHJlc3MuaW5uZXJIVE1MICs9IHJlc3RhdXJhbnQuYWRkcmVzcztcblxuICBjb25zdCBwaWN0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtcGljdHVyZScpO1xuXG4gIGNvbnN0IHNvdXJjZUxhcmdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZUxhcmdlLm1lZGlhID0gJyhtaW4td2lkdGg6IDgwMHB4KSc7XG4gIHNvdXJjZUxhcmdlLnNyY3NldCA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB7IHNpemU6ICdsYXJnZScsIHdpZGU6IHRydWUgfSk7XG4gIHNvdXJjZUxhcmdlLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTGFyZ2UpO1xuXG4gIGNvbnN0IHNvdXJjZU1lZGl1bSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VNZWRpdW0ubWVkaWEgPSAnKG1pbi13aWR0aDogNjAwcHgpJztcbiAgc291cmNlTWVkaXVtLnNyY3NldCA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB7IHNpemU6ICdtZWRpdW0nIH0pO1xuICBzb3VyY2VNZWRpdW0udHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VNZWRpdW0pO1xuXG4gIGNvbnN0IHNvdXJjZVNtYWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZVNtYWxsLnNyY3NldCA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB7IHNpemU6ICdzbWFsbCcgfSk7XG4gIHNvdXJjZVNtYWxsLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlU21hbGwpO1xuXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XG4gIC8vIHNldCBkZWZhdWx0IHNpemUgaW4gY2FzZSBwaWN0dXJlIGVsZW1lbnQgaXMgbm90IHN1cHBvcnRlZFxuICBpbWFnZS5zcmMgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XG4gIGltYWdlLmFsdCA9IHJlc3RhdXJhbnQuYWx0O1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKGltYWdlKTtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1pbWcnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCByZXN0YXVyYW50LmFsdCk7XG5cbiAgY29uc3QgY3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgY3Vpc2luZS5pbm5lckhUTUwgPSBgQ3Vpc2luZTogJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gO1xuXG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtY3Vpc2luZScpO1xuICBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhZGRSZXZpZXdCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1idXR0b24nKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGBBZGQgYSByZXZpZXcgZm9yICR7cmVzdGF1cmFudC5uYW1lfWApO1xuICBhZGRSZXZpZXdCdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuXG4gIGNvbnN0IGFkZFJldmlld092ZXJsYXlIZWFkaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctb3ZlcmxheS1oZWFkaW5nJyk7XG4gIGFkZFJldmlld092ZXJsYXlIZWFkaW5nLmlubmVySFRNTCA9IGBBZGQgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gO1xuXG4gIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXG4gIGlmIChyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycykge1xuICAgIGZpbGxSZXN0YXVyYW50SG91cnNIVE1MKCk7XG4gIH1cblxuICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwocmVzdGF1cmFudCwgJ2lzX2Zhdm9yaXRlJykpIHtcbiAgICBmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCgpO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IG9wZXJhdGluZyBob3VycyBIVE1MIHRhYmxlIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGZpbGxSZXN0YXVyYW50SG91cnNIVE1MID0gKG9wZXJhdGluZ0hvdXJzID0gc2VsZi5yZXN0YXVyYW50Lm9wZXJhdGluZ19ob3VycykgPT4ge1xuICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XG4gIGZvciAoY29uc3Qga2V5IGluIG9wZXJhdGluZ0hvdXJzKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcGVyYXRpbmdIb3Vycywga2V5KSkge1xuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblxuICAgICAgY29uc3QgZGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XG4gICAgICByb3cuYXBwZW5kQ2hpbGQoZGF5KTtcblxuICAgICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICB0aW1lLmlubmVySFRNTCA9IG9wZXJhdGluZ0hvdXJzW2tleV07XG4gICAgICByb3cuYXBwZW5kQ2hpbGQodGltZSk7XG5cbiAgICAgIGhvdXJzLmFwcGVuZENoaWxkKHJvdyk7XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKGJ1dHRvbikgPT4ge1xuICB2YXIgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIHZhciB0ZXh0ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcbiAgdGV4dC5pbm5lckhUTUwgPSAnVW5tYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmFyJywgJ3VubWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbmNvbnN0IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgdmFyIGljb24gPSBidXR0b24ucXVlcnlTZWxlY3RvcignaScpO1xuICB2YXIgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ01hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBub3QgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbi8qKlxuICogU2V0IHN0YXRlIGFuZCB0ZXh0IGZvciBtYXJrIGFzIGZhdm91cml0ZSBidXR0b24uXG4gKi9cbmNvbnN0IGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MID0gKGlzRmF2b3VyaXRlID0gc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKSA9PiB7XG4gIGNvbnN0IGZhdm91cml0ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBpZiAoc3RyaW5nVG9Cb29sZWFuKGlzRmF2b3VyaXRlKSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfVxuXG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZmV0Y2hSZXZpZXdzID0gKCkgPT4ge1xuICBjb25zdCBpZCA9IGdldFVybFBhcmFtKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGNvbnNvbGUubG9nKCdObyByZXN0YXVyYW50IGlkIGluIFVSTCcpO1xuICB9IGVsc2Uge1xuICAgIERCSGVscGVyLmZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkKGlkLCAoZXJyb3IsIHJldmlld3MpID0+IHtcbiAgICAgIHNlbGYucmV2aWV3cyA9IHJldmlld3M7XG4gICAgICBpZiAoIXJldmlld3MpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZpbGxSZXZpZXdzSFRNTCgpO1xuICAgICAgREJIZWxwZXIuZ2V0T3V0Ym94UmV2aWV3cyhpZCwgKGVycm9yLCBvdXRib3hSZXZpZXdzKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5vdXRib3hSZXZpZXdzID0gb3V0Ym94UmV2aWV3cztcbiAgICAgICAgICBmaWxsU2VuZGluZ1Jldmlld3NIVE1MKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIGFsbCByZXZpZXdzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmV2aWV3c0hUTUwgPSAocmV2aWV3cyA9IHNlbGYucmV2aWV3cykgPT4ge1xuICBpZiAoIXJldmlld3MgfHwgcmV2aWV3cy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgbm9SZXZpZXdzLmlubmVySFRNTCA9ICdObyByZXZpZXdzIHlldCEnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgcmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpLCB1bC5maXJzdENoaWxkKTtcbiAgfSk7XG59O1xuXG5jb25zdCBmaWxsU2VuZGluZ1Jldmlld3NIVE1MID0gKG91dGJveFJldmlld3MgPSBzZWxmLm91dGJveFJldmlld3MpID0+IHtcbiAgaWYgKCFvdXRib3hSZXZpZXdzIHx8IG91dGJveFJldmlld3MubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIG91dGJveFJldmlld3MuZm9yRWFjaCgob3V0Ym94UmV2aWV3KSA9PiB7XG4gICAgY29uc3QgeyByZXF1ZXN0X2lkLCAuLi5yZXZpZXcgfSA9IG91dGJveFJldmlldztcbiAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcsIHRydWUsIHJlcXVlc3RfaWQpLCB1bC5maXJzdENoaWxkKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBjcmVhdGVSZXZpZXdIVE1MID0gKHJldmlldywgc2VuZGluZywgcmVxdWVzdElkKSA9PiB7XG4gIGNvbnN0IGFydGljbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhcnRpY2xlJyk7XG4gIGFydGljbGUuY2xhc3NOYW1lID0gJ3Jldmlldyc7XG5cbiAgY29uc3QgaGVhZGVyU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgaGVhZGVyU3Bhbi5jbGFzc05hbWUgPSAncmV2aWV3LWhlYWRlcic7XG5cbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSByZXZpZXcubmFtZTtcbiAgbmFtZS5jbGFzc05hbWUgPSAncmV2aWV3LW5hbWUnO1xuICBoZWFkZXJTcGFuLmFwcGVuZENoaWxkKG5hbWUpO1xuXG4gIGNvbnN0IGRhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cbiAgaWYgKHNlbmRpbmcpIHtcbiAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFyJywgJ2ZhLWNsb2NrJyk7XG4gICAgY29uc3QgbG9hZGluZ1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbG9hZGluZ1RleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcnO1xuICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChsb2FkaW5nVGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICBkYXRlLmlubmVySFRNTCA9IGRhdGVUZXh0O1xuICB9XG5cbiAgZGF0ZS5jbGFzc05hbWUgPSAncmV2aWV3LWRhdGUnO1xuICBoZWFkZXJTcGFuLmFwcGVuZENoaWxkKGRhdGUpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGhlYWRlclNwYW4pO1xuXG4gIGNvbnN0IGNvbnRlbnRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBjb250ZW50U3Bhbi5jbGFzc05hbWUgPSAncmV2aWV3LWNvbnRlbnQnO1xuXG4gIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcmF0aW5nLmlubmVySFRNTCA9IGBSYXRpbmc6ICR7cmV2aWV3LnJhdGluZ31gO1xuICByYXRpbmcuY2xhc3NOYW1lID0gJ3Jldmlldy1yYXRpbmcnO1xuICBjb250ZW50U3Bhbi5hcHBlbmRDaGlsZChyYXRpbmcpO1xuXG4gIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKGNvbW1lbnRzKTtcbiAgYXJ0aWNsZS5hcHBlbmRDaGlsZChjb250ZW50U3Bhbik7XG5cbiAgaWYgKHNlbmRpbmcpIHtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnZGF0YS1pZCcsIHJlcXVlc3RJZCk7XG4gICAgYXJ0aWNsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICd0cnVlJyk7XG4gICAgYXJ0aWNsZS5jbGFzc0xpc3QuYWRkKCdzZW5kaW5nJyk7XG4gIH1cblxuICByZXR1cm4gYXJ0aWNsZTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJldmlld0hUTUwgPSAoZXJyb3IsIHJlcXVlc3RJZCwgcmV2aWV3KSA9PiB7XG4gIGNvbnN0IHJldmlld0VsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7cmVxdWVzdElkfVwiXWApO1xuICBpZiAoZXJyb3IpIHtcbiAgICBpZiAocmV2aWV3RWxlbWVudCkgeyAvLyBmb3IgZXJyb3IsIG5vIG5lZWQgdG8gYWRkIHRvIFVJIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgIGNvbnN0IGRhdGUgPSByZXZpZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZXZpZXctZGF0ZScpO1xuICAgICAgZGF0ZS5pbm5lckhUTUwgPSAnJztcbiAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcycsICdmYS1leGNsYW1hdGlvbi10cmlhbmdsZScpO1xuICAgICAgY29uc3QgZXJyb3JUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgZXJyb3JUZXh0LmlubmVySFRNTCA9ICdTZW5kaW5nIGZhaWxlZCc7XG4gICAgICBkYXRlLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgZGF0ZS5hcHBlbmRDaGlsZChlcnJvclRleHQpO1xuICAgICAgZGF0ZS5jbGFzc0xpc3QuYWRkKCdlcnJvcicpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgICBpZiAodWwgJiYgc2VsZi5yZXN0YXVyYW50KSB7IC8vIG9ubHkgdXBkYXRlIGlmIHRoZSByZXN0YXVyYW50IGlzIGxvYWRlZFxuICAgICAgaWYgKHJldmlld0VsZW1lbnQpIHtcbiAgICAgICAgcmV2aWV3RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdzZW5kaW5nJyk7XG4gICAgICAgIGNvbnN0IGRhdGUgPSByZXZpZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZXZpZXctZGF0ZScpO1xuICAgICAgICBjb25zdCBkYXRlVGV4dCA9IGZvcm1hdERhdGUobmV3IERhdGUocmV2aWV3LnVwZGF0ZWRBdCkpO1xuICAgICAgICBkYXRlLmlubmVySFRNTCA9IGRhdGVUZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgcmVzdGF1cmFudCBuYW1lIHRvIHRoZSBicmVhZGNydW1iIG5hdmlnYXRpb24gbWVudVxuICovXG5jb25zdCBmaWxsQnJlYWRjcnVtYiA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gIGNvbnN0IGJyZWFkY3J1bWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnJlYWRjcnVtYicpO1xuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gIGxpLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcbiAgYnJlYWRjcnVtYi5hcHBlbmRDaGlsZChsaSk7XG59O1xuXG4vKipcbiAqIEdldCBhIHBhcmFtZXRlciBieSBuYW1lIGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGdldFVybFBhcmFtID0gKG5hbWUsIHVybCkgPT4ge1xuICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKTtcbiAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBbPyZdJHtuYW1lfSg9KFteJiNdKil8JnwjfCQpYCk7XG5cblxuICBjb25zdCByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xuICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiAnJztcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbn07XG5cbmNvbnN0IHNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICd0cnVlJyk7XG4gIHNwaW5uZXIuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufVxuXG5jb25zdCByZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlID0gKGJ1dHRvbiwgc3Bpbm5lcikgPT4ge1xuICBidXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAnZmFsc2UnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG59XG5cbmNvbnN0IHRvZ2dsZVJlc3RhdXJhbnRBc0Zhdm91cml0ZSA9ICgpID0+IHtcbiAgY29uc3QgaXNGYXZvdXJpdGUgPSBzdHJpbmdUb0Jvb2xlYW4oc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKTtcbiAgY29uc3QgbmV3SXNGYXZvdXJpdGUgPSAoIWlzRmF2b3VyaXRlKSAmJiBpc0Zhdm91cml0ZSAhPT0gJ2ZhbHNlJztcbiAgY29uc3QgcmVzdGF1cmFudElkID0gc2VsZi5yZXN0YXVyYW50LmlkO1xuICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFyay1hcy1mYXZvdXJpdGUnKTtcbiAgY29uc3Qgc3Bpbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYXZvdXJpdGUtc3Bpbm5lcicpO1xuICBsZXQgZmFpbGVkVXBkYXRlQ2FsbGJhY2s7XG4gIGlmIChuZXdJc0Zhdm91cml0ZSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoYnV0dG9uKTtcbiAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayA9IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoYnV0dG9uKTtcbiAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayA9IG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGU7XG4gIH1cbiAgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZShidXR0b24sIHNwaW5uZXIpO1xuICBEQkhlbHBlci5zZXRSZXN0YXVyYW50RmF2b3VyaXRlU3RhdHVzKHJlc3RhdXJhbnRJZCwgbmV3SXNGYXZvdXJpdGUsIChlcnJvciwgdXBkYXRlZFJlc3RhdXJhbnQpID0+IHtcbiAgICByZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gICAgaWYgKCF1cGRhdGVkUmVzdGF1cmFudCkge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayhidXR0b24pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZWxmLnJlc3RhdXJhbnQgPSB1cGRhdGVkUmVzdGF1cmFudDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGhpZGVUb2FzdCgpIHtcbiAgY2xlYXJUaW1lb3V0KHRvYXN0VGltZXIpO1xuICB0b2FzdFRpbWVyID0gbnVsbDtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0JykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzaG93VG9hc3QobWVzc2FnZSwgdHlwZSkge1xuICBpZiAoIW1lc3NhZ2UpIHJldHVybjtcblxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xuICBjb25zdCB0b2FzdFRleHQgPSB0b2FzdC5xdWVyeVNlbGVjdG9yKCcudG9hc3QtdGV4dCcpO1xuICB0b2FzdFRleHQuaW5uZXJIVE1MID0gbWVzc2FnZTtcblxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIHRvYXN0LmNsYXNzTmFtZSA9ICd0b2FzdCBzaG93IGVycm9yJztcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICB0b2FzdC5jbGFzc05hbWUgPSAndG9hc3Qgc2hvdyBzdWNjZXNzJztcbiAgfSBlbHNlIHtcbiAgICB0b2FzdC5jbGFzc05hbWUgPSAndG9hc3Qgc2hvdyc7XG4gIH1cblxuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBzZXRUaW1lb3V0KGhpZGVUb2FzdCwgNTAwMCk7XG59XG5cbmZ1bmN0aW9uIHNob3dDb25uZWN0aW9uU3RhdHVzKCkge1xuICB2YXIgY29ubmVjdGlvblN0YXR1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25uZWN0aW9uU3RhdHVzJyk7XG5cbiAgaWYgKG5hdmlnYXRvci5vbkxpbmUgJiYgIXByZXZpb3VzbHlDb25uZWN0ZWQpIHsgLy8gdXNlciBjYW1lIGJhY2sgb25saW5lXG4gICAgc2hvd1RvYXN0KCdZb3UgYXJlIGJhY2sgb25saW5lJywgJ3N1Y2Nlc3MnKTtcbiAgfSBlbHNlIGlmICghbmF2aWdhdG9yLm9uTGluZSAmJiBwcmV2aW91c2x5Q29ubmVjdGVkKSB7IC8vIHVzZXIgd2VudCBvZmZsaW5lXG4gICAgc2hvd1RvYXN0KCdZb3UgYXJlIG9mZmxpbmUnLCAnZXJyb3InKTtcbiAgfVxuXG4gIHByZXZpb3VzbHlDb25uZWN0ZWQgPSBuYXZpZ2F0b3Iub25MaW5lO1xufVxuIl0sImZpbGUiOiJyZXN0YXVyYW50X2luZm8uanMifQ==

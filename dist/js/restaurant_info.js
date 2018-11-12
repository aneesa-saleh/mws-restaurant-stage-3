"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var restaurant;
var reviews;
var outboxReviews;
var newMap;
var matchesMediaQuery;
var mediaQuery = '(min-width: 800px)';
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
    var error = 'No restaurant id in URL';
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
  var list = document.getElementById('reviews-list');

  if (!reviews || reviews.length === 0) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    list.appendChild(noReviews);
    return;
  }

  reviews.forEach(function (review) {
    list.insertBefore(createReviewHTML(review), list.firstChild);
  });
};

var fillSendingReviewsHTML = function fillSendingReviewsHTML() {
  var outboxReviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.outboxReviews;
  if (!outboxReviews || outboxReviews.length === 0) return;
  var list = document.getElementById('reviews-list');
  outboxReviews.forEach(function (outboxReview) {
    var requestId = outboxReview.request_id,
        review = _objectWithoutProperties(outboxReview, ["request_id"]);

    list.insertBefore(createReviewHTML(review, true, requestId), list.firstChild);
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
    var list = document.getElementById('reviews-list');

    if (list && self.restaurant) {
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


var getUrlParam = function getUrlParam(name) {
  var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.location.href;
  var paramName = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp("[?&]".concat(paramName, "(=([^&#]*)|&|#|$)"));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJ0b2FzdFRpbWVyIiwicHJldmlvdXNseUNvbm5lY3RlZCIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwibmF2aWdhdG9yIiwib25MaW5lIiwiaW5pdE1hcCIsImZldGNoUmV2aWV3cyIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwidXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJzZXRJbnRlcnZhbCIsImNsZWFuTWFwYm94VGlsZXNDYWNoZSIsInNlcnZpY2VXb3JrZXIiLCJkYXRhIiwidHlwZSIsInJlcXVlc3RJZCIsInJldmlldyIsImVycm9yIiwic2hvd1RvYXN0IiwidXBkYXRlUmV2aWV3SFRNTCIsIm5hbWUiLCJzaG93Q29ubmVjdGlvblN0YXR1cyIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJNQVBCT1hfQVBJX0tFWSIsImNvbnNvbGUiLCJzZWxmIiwiTCIsIm1hcCIsImNlbnRlciIsImxhdGxuZyIsImxhdCIsImxuZyIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXBib3hUb2tlbiIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImlkIiwiYWRkVG8iLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm5leHRNYXRjaGVzTWVkaWFRdWVyeSIsInJlc3RhdXJhbnRDb250YWluZXIiLCJnZXRFbGVtZW50QnlJZCIsImFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyIiwic2V0QXR0cmlidXRlIiwiY2FsbGJhY2siLCJnZXRVcmxQYXJhbSIsImZldGNoUmVzdGF1cmFudEJ5SWQiLCJmaWxsUmVzdGF1cmFudEhUTUwiLCJpbm5lckhUTUwiLCJhZGRyZXNzIiwicGljdHVyZSIsInNvdXJjZUxhcmdlIiwiY3JlYXRlRWxlbWVudCIsIm1lZGlhIiwic3Jjc2V0IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50Iiwic2l6ZSIsIndpZGUiLCJhcHBlbmRDaGlsZCIsInNvdXJjZU1lZGl1bSIsInNvdXJjZVNtYWxsIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJzcmMiLCJhbHQiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlIiwiY3Vpc2luZSIsImN1aXNpbmVfdHlwZSIsImFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZSIsImFkZFJldmlld0J1dHRvbiIsInJlbW92ZUF0dHJpYnV0ZSIsImFkZFJldmlld092ZXJsYXlIZWFkaW5nIiwib3BlcmF0aW5nX2hvdXJzIiwiZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwiLCJPYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJwcm90b3R5cGUiLCJyb3ciLCJkYXkiLCJ0aW1lIiwibWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSIsImJ1dHRvbiIsImljb24iLCJxdWVyeVNlbGVjdG9yIiwidGV4dCIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSIsInVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSIsImlzRmF2b3VyaXRlIiwiaXNfZmF2b3JpdGUiLCJmYXZvdXJpdGVCdXR0b24iLCJzdHJpbmdUb0Jvb2xlYW4iLCJsb2ciLCJmZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZCIsImZpbGxSZXZpZXdzSFRNTCIsImdldE91dGJveFJldmlld3MiLCJmaWxsU2VuZGluZ1Jldmlld3NIVE1MIiwibGlzdCIsImxlbmd0aCIsIm5vUmV2aWV3cyIsImZvckVhY2giLCJpbnNlcnRCZWZvcmUiLCJjcmVhdGVSZXZpZXdIVE1MIiwiZmlyc3RDaGlsZCIsIm91dGJveFJldmlldyIsInJlcXVlc3RfaWQiLCJzZW5kaW5nIiwiYXJ0aWNsZSIsImhlYWRlclNwYW4iLCJkYXRlIiwibG9hZGluZ1RleHQiLCJkYXRlVGV4dCIsImZvcm1hdERhdGUiLCJEYXRlIiwidXBkYXRlZEF0IiwiY29udGVudFNwYW4iLCJyYXRpbmciLCJjb21tZW50cyIsInJldmlld0VsZW1lbnQiLCJlcnJvclRleHQiLCJicmVhZGNydW1iIiwibGkiLCJ1cmwiLCJsb2NhdGlvbiIsImhyZWYiLCJwYXJhbU5hbWUiLCJyZXBsYWNlIiwicmVnZXgiLCJSZWdFeHAiLCJyZXN1bHRzIiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsInNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUiLCJzcGlubmVyIiwicmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInRvZ2dsZVJlc3RhdXJhbnRBc0Zhdm91cml0ZSIsIm5ld0lzRmF2b3VyaXRlIiwicmVzdGF1cmFudElkIiwiZmFpbGVkVXBkYXRlQ2FsbGJhY2siLCJzZXRSZXN0YXVyYW50RmF2b3VyaXRlU3RhdHVzIiwidXBkYXRlZFJlc3RhdXJhbnQiLCJjbGVhclRvYXN0VGltZXIiLCJjbGVhclRpbWVvdXQiLCJoaWRlVG9hc3QiLCJ0b2FzdCIsInRvYXN0VGV4dCIsInNldFRpbWVvdXQiLCJtZXNzYWdlIiwidG9hc3RJY29uIiwiY29ubmVjdGlvblN0YXR1cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBSUEsVUFBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxhQUFKO0FBQ0EsSUFBSUMsTUFBSjtBQUNBLElBQUlDLGlCQUFKO0FBQ0EsSUFBTUMsVUFBVSxHQUFHLG9CQUFuQjtBQUNBLElBQUlDLFVBQVUsR0FBRyxJQUFqQjtBQUNBLElBQUlDLG1CQUFKO0FBRUE7Ozs7QUFHQUMsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3ZESCxFQUFBQSxtQkFBbUIsR0FBR0ksU0FB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SyxDQUFDeEYsU0FBTixHQUFrQixZQUFsQjtBQUNEOztBQUVEc0YsRUFBQUEsWUFBWSxDQUFDNUosVUFBRCxDQUFaO0FBQ0FnSyxFQUFBQSxVQUFVLENBQUMsWUFBTTtBQUNmRCxJQUFBQSxTQUFTLENBQUM1RyxZQUFWLENBQXVCLFdBQXZCLEVBQW9DLEtBQXBDO0FBQ0QsR0FGUyxFQUVQLENBRk8sQ0FBVjtBQUdBbkQsRUFBQUEsVUFBVSxHQUFHZ0ssVUFBVSxDQUFDSCxTQUFELEVBQVksS0FBWixDQUF2QjtBQUNEOztBQUVELFNBQVNwSSxvQkFBVCxHQUFnQztBQUM5QixNQUFNMEksZ0JBQWdCLEdBQUdqSyxRQUFRLENBQUMrQyxjQUFULENBQXdCLGtCQUF4QixDQUF6Qjs7QUFFQSxNQUFJNUMsU0FBUyxDQUFDQyxNQUFWLElBQW9CLENBQUNMLG1CQUF6QixFQUE4QztBQUFFO0FBQzlDcUIsSUFBQUEsU0FBUyxDQUFDLHFCQUFELEVBQXdCLFNBQXhCLENBQVQ7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDakIsU0FBUyxDQUFDQyxNQUFYLElBQXFCTCxtQkFBekIsRUFBOEM7QUFBRTtBQUNyRHFCLElBQUFBLFNBQVMsQ0FBQyxpQkFBRCxFQUFvQixPQUFwQixDQUFUO0FBQ0Q7O0FBRURyQixFQUFBQSxtQkFBbUIsR0FBR0ksU0FBUyxDQUFDQyxNQUFoQztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsibGV0IHJlc3RhdXJhbnQ7XG5sZXQgcmV2aWV3cztcbmxldCBvdXRib3hSZXZpZXdzO1xubGV0IG5ld01hcDtcbmxldCBtYXRjaGVzTWVkaWFRdWVyeTtcbmNvbnN0IG1lZGlhUXVlcnkgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbmxldCB0b2FzdFRpbWVyID0gbnVsbDtcbmxldCBwcmV2aW91c2x5Q29ubmVjdGVkO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWFwIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gIHByZXZpb3VzbHlDb25uZWN0ZWQgPSBuYXZpZ2F0b3Iub25MaW5lO1xuXG4gIGluaXRNYXAoKTtcbiAgZmV0Y2hSZXZpZXdzKCk7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgfVxuICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpOyAvLyBzZXQgaW5pdGlhbCBhcmlhIHZhbHVlc1xuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgc2V0SW50ZXJ2YWwoY2xlYW5NYXBib3hUaWxlc0NhY2hlLCA1MDAwKTtcblxuICBpZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHR5cGUsIHJlcXVlc3RJZCwgcmV2aWV3LCBlcnJvcixcbiAgICAgIH0gPSBldmVudC5kYXRhO1xuICAgICAgaWYgKHR5cGUgPT09ICd1cGRhdGUtcmV2aWV3Jykge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBzaG93VG9hc3QoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHN1Ym1pdHRpbmcgeW91ciByZXZpZXcnLCAnZXJyb3InKTtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKHRydWUsIHJlcXVlc3RJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2hvd1RvYXN0KGAke3Jldmlldy5uYW1lfSdzIHJldmlldyBoYXMgYmVlbiBzYXZlZGAsICdzdWNjZXNzJyk7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTChmYWxzZSwgcmVxdWVzdElkLCByZXZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBpZiAoJ29uTGluZScgaW4gbmF2aWdhdG9yKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIHNob3dDb25uZWN0aW9uU3RhdHVzKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIHNob3dDb25uZWN0aW9uU3RhdHVzKTtcbiAgICBzaG93Q29ubmVjdGlvblN0YXR1cygpO1xuICB9XG59KTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGxlYWZsZXQgbWFwXG4gKi9cbmNvbnN0IGluaXRNYXAgPSAoKSA9PiB7XG4gIGZldGNoUmVzdGF1cmFudEZyb21VUkwoKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgY29uc3QgTUFQQk9YX0FQSV9LRVkgPSAncGsuZXlKMUlqb2lZVzVsWlhOaExYTmhiR1ZvSWl3aVlTSTZJbU5xYTJ4bVpIVndNREZvWVc0emRuQXdZV3BsTW01M2JIRWlmUS5WMTFkRE90RW5XU3dUeFktQzhtSkx3JztcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYubmV3TWFwID0gTC5tYXAoJ21hcCcsIHtcbiAgICAgICAgY2VudGVyOiBbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAgICB6b29tOiAxNixcbiAgICAgICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgICAgTC50aWxlTGF5ZXIoJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20vdjQve2lkfS97en0ve3h9L3t5fS5qcGc3MD9hY2Nlc3NfdG9rZW49e21hcGJveFRva2VufScsIHtcbiAgICAgICAgbWFwYm94VG9rZW46IE1BUEJPWF9BUElfS0VZLFxuICAgICAgICBtYXhab29tOiAxOCxcbiAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJ1xuICAgICAgICAgICsgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJ1xuICAgICAgICAgICsgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXG4gICAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnLFxuICAgICAgfSkuYWRkVG8obmV3TWFwKTtcbiAgICAgIGZpbGxCcmVhZGNydW1iKCk7XG4gICAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5uZXdNYXApO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiogVXBkYXRlIGFyaWEtaGlkZGVuIHZhbHVlcyBvZiB0aGUgdmlzaWJsZSBhbmQgYWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiovXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICBjb25zdCBuZXh0TWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICAgIGlmIChuZXh0TWF0Y2hlc01lZGlhUXVlcnkgIT09IG1hdGNoZXNNZWRpYVF1ZXJ5KSB7IC8vIG9ubHkgdXBkYXRlIGFyaWEgd2hlbiBsYXlvdXQgY2hhbmdlc1xuICAgICAgbWF0Y2hlc01lZGlhUXVlcnkgPSBuZXh0TWF0Y2hlc01lZGlhUXVlcnk7XG4gICAgICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpO1xuICAgIH1cbiAgfVxufSk7XG5cbi8qKlxuKiBTZXQgYXJpYS1oaWRkZW4gdmFsdWVzIGZvciB2aXNpYmxlIGFuZCByZWd1bGFyIHJlc3RhdXJhbnQgY29udGFpbmVyc1xuKiBBY2Nlc3NpYmxlIHJlc3RhdXJhbnQgY29udGFpbmVyIGlzIG9mZiBzY3JlZW5cbiogSXQgaXMgcmVxdWlyZWQgdG8gbWFpbnRhaW4gc2NyZWVuIHJlYWRpbmcgb3JkZXIgd2hlbiB0aGUgbGF5b3V0IHNoaWZ0c1xuKi9cbmNvbnN0IHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhID0gKCkgPT4ge1xuICBjb25zdCByZXN0YXVyYW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1jb250YWluZXInKTtcbiAgaWYgKG1hdGNoZXNNZWRpYVF1ZXJ5KSB7IC8vIGxhcmdlciBsYXlvdXQsIHNjcmVlbiByZWFkaW5nIG9yZGVyIG9mZlxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICB9IGVsc2UgeyAvLyB1c2UgcmVndWxhciByZWFkaW5nIG9yZGVyXG4gICAgcmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMID0gKGNhbGxiYWNrKSA9PiB7XG4gIGlmIChzZWxmLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXG4gICAgY2FsbGJhY2sobnVsbCwgc2VsZi5yZXN0YXVyYW50KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaWQgPSBnZXRVcmxQYXJhbSgnaWQnKTtcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcbiAgICBjb25zdCBlcnJvciA9ICdObyByZXN0YXVyYW50IGlkIGluIFVSTCc7XG4gICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcbiAgICAgIGlmICghcmVzdGF1cmFudCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJlc3RhdXJhbnRIVE1MKCk7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2VcbiAqL1xuY29uc3QgZmlsbFJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XG5cbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWFkZHJlc3MnKTtcbiAgYWRkcmVzcy5pbm5lckhUTUwgKz0gcmVzdGF1cmFudC5hZGRyZXNzO1xuXG4gIGNvbnN0IHBpY3R1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1waWN0dXJlJyk7XG5cbiAgY29uc3Qgc291cmNlTGFyZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTGFyZ2UubWVkaWEgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbiAgc291cmNlTGFyZ2Uuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ2xhcmdlJywgd2lkZTogdHJ1ZSB9KTtcbiAgc291cmNlTGFyZ2UudHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VMYXJnZSk7XG5cbiAgY29uc3Qgc291cmNlTWVkaXVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZU1lZGl1bS5tZWRpYSA9ICcobWluLXdpZHRoOiA2MDBweCknO1xuICBzb3VyY2VNZWRpdW0uc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ21lZGl1bScgfSk7XG4gIHNvdXJjZU1lZGl1bS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZU1lZGl1bSk7XG5cbiAgY29uc3Qgc291cmNlU21hbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlU21hbGwuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHsgc2l6ZTogJ3NtYWxsJyB9KTtcbiAgc291cmNlU21hbGwudHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VTbWFsbCk7XG5cbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcbiAgLy8gc2V0IGRlZmF1bHQgc2l6ZSBpbiBjYXNlIHBpY3R1cmUgZWxlbWVudCBpcyBub3Qgc3VwcG9ydGVkXG4gIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcbiAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5hbHQ7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoaW1hZ2UpO1xuXG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWltZycpO1xuICBhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHJlc3RhdXJhbnQuYWx0KTtcblxuICBjb25zdCBjdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY3Vpc2luZScpO1xuICBjdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZS5pbm5lckhUTUwgPSBgQ3Vpc2luZTogJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gO1xuXG4gIGNvbnN0IGFkZFJldmlld0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LWJ1dHRvbicpO1xuICBhZGRSZXZpZXdCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgYEFkZCBhIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XG4gIGFkZFJldmlld0J1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG5cbiAgY29uc3QgYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1vdmVybGF5LWhlYWRpbmcnKTtcbiAgYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmcuaW5uZXJIVE1MID0gYEFkZCByZXZpZXcgZm9yICR7cmVzdGF1cmFudC5uYW1lfWA7XG5cbiAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcbiAgaWYgKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XG4gICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChyZXN0YXVyYW50LCAnaXNfZmF2b3JpdGUnKSkge1xuICAgIGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MKCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgb3BlcmF0aW5nIGhvdXJzIEhUTUwgdGFibGUgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XG4gIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaG91cnMnKTtcbiAgZm9yIChjb25zdCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wZXJhdGluZ0hvdXJzLCBrZXkpKSB7XG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXG4gICAgICBjb25zdCBkYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgZGF5LmlubmVySFRNTCA9IGtleTtcbiAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xuXG4gICAgICBjb25zdCB0aW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcbiAgICAgIHJvdy5hcHBlbmRDaGlsZCh0aW1lKTtcblxuICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoYnV0dG9uKSA9PiB7XG4gIGNvbnN0IGljb24gPSBidXR0b24ucXVlcnlTZWxlY3RvcignaScpO1xuICBjb25zdCB0ZXh0ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcbiAgdGV4dC5pbm5lckhUTUwgPSAnVW5tYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmFyJywgJ3VubWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbmNvbnN0IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgY29uc3QgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIGNvbnN0IHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdNYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgbm90IGN1cnJlbnRseSBtYXJrZWQgYXMgZmF2b3VyaXRlJyk7XG59O1xuXG4vKipcbiAqIFNldCBzdGF0ZSBhbmQgdGV4dCBmb3IgbWFyayBhcyBmYXZvdXJpdGUgYnV0dG9uLlxuICovXG5jb25zdCBmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCA9IChpc0Zhdm91cml0ZSA9IHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSkgPT4ge1xuICBjb25zdCBmYXZvdXJpdGVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFyay1hcy1mYXZvdXJpdGUnKTtcbiAgaWYgKHN0cmluZ1RvQm9vbGVhbihpc0Zhdm91cml0ZSkpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBmZXRjaFJldmlld3MgPSAoKSA9PiB7XG4gIGNvbnN0IGlkID0gZ2V0VXJsUGFyYW0oJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgY29uc29sZS5sb2coJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJyk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQoaWQsIChlcnJvciwgcmV2aWV3cykgPT4ge1xuICAgICAgc2VsZi5yZXZpZXdzID0gcmV2aWV3cztcbiAgICAgIGlmICghcmV2aWV3cykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJldmlld3NIVE1MKCk7XG4gICAgICBEQkhlbHBlci5nZXRPdXRib3hSZXZpZXdzKGlkLCAoZXJyb3IsIG91dGJveFJldmlld3MpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYub3V0Ym94UmV2aWV3cyA9IG91dGJveFJldmlld3M7XG4gICAgICAgICAgZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXZpZXdzKSA9PiB7XG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG5cbiAgaWYgKCFyZXZpZXdzIHx8IHJldmlld3MubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcbiAgICBsaXN0LmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldmlld3MuZm9yRWFjaCgocmV2aWV3KSA9PiB7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpLCBsaXN0LmZpcnN0Q2hpbGQpO1xuICB9KTtcbn07XG5cbmNvbnN0IGZpbGxTZW5kaW5nUmV2aWV3c0hUTUwgPSAob3V0Ym94UmV2aWV3cyA9IHNlbGYub3V0Ym94UmV2aWV3cykgPT4ge1xuICBpZiAoIW91dGJveFJldmlld3MgfHwgb3V0Ym94UmV2aWV3cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICBvdXRib3hSZXZpZXdzLmZvckVhY2goKG91dGJveFJldmlldykgPT4ge1xuICAgIGNvbnN0IHsgcmVxdWVzdF9pZDogcmVxdWVzdElkLCAuLi5yZXZpZXcgfSA9IG91dGJveFJldmlldztcbiAgICBsaXN0Lmluc2VydEJlZm9yZShjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgdHJ1ZSwgcmVxdWVzdElkKSwgbGlzdC5maXJzdENoaWxkKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBjcmVhdGVSZXZpZXdIVE1MID0gKHJldmlldywgc2VuZGluZywgcmVxdWVzdElkKSA9PiB7XG4gIGNvbnN0IGFydGljbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhcnRpY2xlJyk7XG4gIGFydGljbGUuY2xhc3NOYW1lID0gJ3Jldmlldyc7XG5cbiAgY29uc3QgaGVhZGVyU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgaGVhZGVyU3Bhbi5jbGFzc05hbWUgPSAncmV2aWV3LWhlYWRlcic7XG5cbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSByZXZpZXcubmFtZTtcbiAgbmFtZS5jbGFzc05hbWUgPSAncmV2aWV3LW5hbWUnO1xuICBoZWFkZXJTcGFuLmFwcGVuZENoaWxkKG5hbWUpO1xuXG4gIGNvbnN0IGRhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cbiAgaWYgKHNlbmRpbmcpIHtcbiAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFyJywgJ2ZhLWNsb2NrJyk7XG4gICAgY29uc3QgbG9hZGluZ1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbG9hZGluZ1RleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcnO1xuICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChsb2FkaW5nVGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICBkYXRlLmlubmVySFRNTCA9IGRhdGVUZXh0O1xuICB9XG5cbiAgZGF0ZS5jbGFzc05hbWUgPSAncmV2aWV3LWRhdGUnO1xuICBoZWFkZXJTcGFuLmFwcGVuZENoaWxkKGRhdGUpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGhlYWRlclNwYW4pO1xuXG4gIGNvbnN0IGNvbnRlbnRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBjb250ZW50U3Bhbi5jbGFzc05hbWUgPSAncmV2aWV3LWNvbnRlbnQnO1xuXG4gIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcmF0aW5nLmlubmVySFRNTCA9IGBSYXRpbmc6ICR7cmV2aWV3LnJhdGluZ31gO1xuICByYXRpbmcuY2xhc3NOYW1lID0gJ3Jldmlldy1yYXRpbmcnO1xuICBjb250ZW50U3Bhbi5hcHBlbmRDaGlsZChyYXRpbmcpO1xuXG4gIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKGNvbW1lbnRzKTtcbiAgYXJ0aWNsZS5hcHBlbmRDaGlsZChjb250ZW50U3Bhbik7XG5cbiAgaWYgKHNlbmRpbmcpIHtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnZGF0YS1pZCcsIHJlcXVlc3RJZCk7XG4gICAgYXJ0aWNsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICd0cnVlJyk7XG4gICAgYXJ0aWNsZS5jbGFzc0xpc3QuYWRkKCdzZW5kaW5nJyk7XG4gIH1cblxuICByZXR1cm4gYXJ0aWNsZTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJldmlld0hUTUwgPSAoZXJyb3IsIHJlcXVlc3RJZCwgcmV2aWV3KSA9PiB7XG4gIGNvbnN0IHJldmlld0VsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7cmVxdWVzdElkfVwiXWApO1xuICBpZiAoZXJyb3IpIHtcbiAgICBpZiAocmV2aWV3RWxlbWVudCkgeyAvLyBmb3IgZXJyb3IsIG5vIG5lZWQgdG8gYWRkIHRvIFVJIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgIGNvbnN0IGRhdGUgPSByZXZpZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZXZpZXctZGF0ZScpO1xuICAgICAgZGF0ZS5pbm5lckhUTUwgPSAnJztcbiAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcycsICdmYS1leGNsYW1hdGlvbi10cmlhbmdsZScpO1xuICAgICAgY29uc3QgZXJyb3JUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgZXJyb3JUZXh0LmlubmVySFRNTCA9ICdTZW5kaW5nIGZhaWxlZCc7XG4gICAgICBkYXRlLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgZGF0ZS5hcHBlbmRDaGlsZChlcnJvclRleHQpO1xuICAgICAgZGF0ZS5jbGFzc0xpc3QuYWRkKCdlcnJvcicpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICAgIGlmIChsaXN0ICYmIHNlbGYucmVzdGF1cmFudCkgeyAvLyBvbmx5IHVwZGF0ZSBpZiB0aGUgcmVzdGF1cmFudCBpcyBsb2FkZWRcbiAgICAgIGlmIChyZXZpZXdFbGVtZW50KSB7XG4gICAgICAgIHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VuZGluZycpO1xuICAgICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICAgICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cbmNvbnN0IGZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn07XG5cbi8qKlxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZ2V0VXJsUGFyYW0gPSAobmFtZSwgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYpID0+IHtcbiAgY29uc3QgcGFyYW1OYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCAnXFxcXCQmJyk7XG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWz8mXSR7cGFyYW1OYW1lfSg9KFteJiNdKil8JnwjfCQpYCk7XG5cbiAgY29uc3QgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcbiAgaWYgKCFyZXN1bHRzKSByZXR1cm4gbnVsbDtcbiAgaWYgKCFyZXN1bHRzWzJdKSByZXR1cm4gJyc7XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG59O1xuXG5jb25zdCBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlID0gKGJ1dHRvbiwgc3Bpbm5lcikgPT4ge1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICBzcGlubmVyLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbn07XG5cbmNvbnN0IHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICdmYWxzZScpO1xuICBzcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn07XG5cbmNvbnN0IHRvZ2dsZVJlc3RhdXJhbnRBc0Zhdm91cml0ZSA9ICgpID0+IHtcbiAgY29uc3QgaXNGYXZvdXJpdGUgPSBzdHJpbmdUb0Jvb2xlYW4oc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKTtcbiAgY29uc3QgbmV3SXNGYXZvdXJpdGUgPSAoIWlzRmF2b3VyaXRlKSAmJiBpc0Zhdm91cml0ZSAhPT0gJ2ZhbHNlJztcbiAgY29uc3QgcmVzdGF1cmFudElkID0gc2VsZi5yZXN0YXVyYW50LmlkO1xuICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFyay1hcy1mYXZvdXJpdGUnKTtcbiAgY29uc3Qgc3Bpbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYXZvdXJpdGUtc3Bpbm5lcicpO1xuICBsZXQgZmFpbGVkVXBkYXRlQ2FsbGJhY2s7XG4gIGlmIChuZXdJc0Zhdm91cml0ZSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoYnV0dG9uKTtcbiAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayA9IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoYnV0dG9uKTtcbiAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayA9IG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGU7XG4gIH1cbiAgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZShidXR0b24sIHNwaW5uZXIpO1xuICBEQkhlbHBlci5zZXRSZXN0YXVyYW50RmF2b3VyaXRlU3RhdHVzKFxuICAgIHJlc3RhdXJhbnRJZCxcbiAgICBuZXdJc0Zhdm91cml0ZSxcbiAgICAoZXJyb3IsIHVwZGF0ZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgICByZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gICAgICBpZiAoIXVwZGF0ZWRSZXN0YXVyYW50KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICBmYWlsZWRVcGRhdGVDYWxsYmFjayhidXR0b24pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWxmLnJlc3RhdXJhbnQgPSB1cGRhdGVkUmVzdGF1cmFudDtcbiAgICB9LFxuICApO1xufTtcblxuZnVuY3Rpb24gY2xlYXJUb2FzdFRpbWVyKCkge1xuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBoaWRlVG9hc3QoKSB7XG4gIGNsZWFyVGltZW91dCh0b2FzdFRpbWVyKTtcbiAgdG9hc3RUaW1lciA9IG51bGw7XG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Jyk7XG4gIGNvbnN0IHRvYXN0VGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC10ZXh0Jyk7XG4gIHRvYXN0LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdG9hc3RUZXh0LnNldEF0dHJpYnV0ZSgnYXJpYS1saXZlJywgJ3BvbGl0ZScpO1xuICB9LCAwKTtcbn1cblxuZnVuY3Rpb24gc2hvd1RvYXN0KG1lc3NhZ2UsIHR5cGUpIHtcbiAgaWYgKCFtZXNzYWdlKSByZXR1cm47XG5cbiAgY29uc3QgdG9hc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QnKTtcbiAgY29uc3QgdG9hc3RUZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0LXRleHQnKTtcbiAgY29uc3QgdG9hc3RJY29uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0LWljb24nKTtcblxuICB0b2FzdFRleHQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG4gIHRvYXN0VGV4dC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgdG9hc3QuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cgZXJyb3InO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgIHRvYXN0LmNsYXNzTmFtZSA9ICd0b2FzdCBzaG93IHN1Y2Nlc3MnO1xuICB9IGVsc2Uge1xuICAgIHRvYXN0LmNsYXNzTmFtZSA9ICd0b2FzdCBzaG93JztcbiAgfVxuXG4gIGNsZWFyVGltZW91dCh0b2FzdFRpbWVyKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdG9hc3RUZXh0LnNldEF0dHJpYnV0ZSgnYXJpYS1saXZlJywgJ29mZicpO1xuICB9LCAwKTtcbiAgdG9hc3RUaW1lciA9IHNldFRpbWVvdXQoaGlkZVRvYXN0LCAxMDAwMCk7XG59XG5cbmZ1bmN0aW9uIHNob3dDb25uZWN0aW9uU3RhdHVzKCkge1xuICBjb25zdCBjb25uZWN0aW9uU3RhdHVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nvbm5lY3Rpb25TdGF0dXMnKTtcblxuICBpZiAobmF2aWdhdG9yLm9uTGluZSAmJiAhcHJldmlvdXNseUNvbm5lY3RlZCkgeyAvLyB1c2VyIGNhbWUgYmFjayBvbmxpbmVcbiAgICBzaG93VG9hc3QoJ1lvdSBhcmUgYmFjayBvbmxpbmUnLCAnc3VjY2VzcycpO1xuICB9IGVsc2UgaWYgKCFuYXZpZ2F0b3Iub25MaW5lICYmIHByZXZpb3VzbHlDb25uZWN0ZWQpIHsgLy8gdXNlciB3ZW50IG9mZmxpbmVcbiAgICBzaG93VG9hc3QoJ1lvdSBhcmUgb2ZmbGluZScsICdlcnJvcicpO1xuICB9XG5cbiAgcHJldmlvdXNseUNvbm5lY3RlZCA9IG5hdmlnYXRvci5vbkxpbmU7XG59XG4iXSwiZmlsZSI6InJlc3RhdXJhbnRfaW5mby5qcyJ9

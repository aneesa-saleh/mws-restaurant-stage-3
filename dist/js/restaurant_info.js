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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Q29ubmVjdGVkIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJuYXZpZ2F0b3IiLCJvbkxpbmUiLCJpbml0TWFwIiwiZmV0Y2hSZXZpZXdzIiwid2luZG93IiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJ1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSIsInJlZ2lzdGVyU2VydmljZVdvcmtlciIsInNldEludGVydmFsIiwiY2xlYW5NYXBib3hUaWxlc0NhY2hlIiwic2VydmljZVdvcmtlciIsImRhdGEiLCJ0eXBlIiwicmVxdWVzdElkIiwicmV2aWV3IiwiZXJyb3IiLCJlbnF1ZXVlVG9hc3QiLCJ1cGRhdGVSZXZpZXdIVE1MIiwibmFtZSIsInNob3dDb25uZWN0aW9uU3RhdHVzIiwiZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCIsIk1BUEJPWF9BUElfS0VZIiwiY29uc29sZSIsInNlbGYiLCJMIiwibWFwIiwiY2VudGVyIiwibGF0bG5nIiwibGF0IiwibG5nIiwiem9vbSIsInNjcm9sbFdoZWVsWm9vbSIsInRpbGVMYXllciIsIm1hcGJveFRva2VuIiwibWF4Wm9vbSIsImF0dHJpYnV0aW9uIiwiaWQiLCJhZGRUbyIsImZpbGxCcmVhZGNydW1iIiwiREJIZWxwZXIiLCJtYXBNYXJrZXJGb3JSZXN0YXVyYW50IiwibmV4dE1hdGNoZXNNZWRpYVF1ZXJ5IiwicmVzdGF1cmFudENvbnRhaW5lciIsImdldEVsZW1lbnRCeUlkIiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIiLCJzZXRBdHRyaWJ1dGUiLCJjYWxsYmFjayIsImdldFVybFBhcmFtIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsImZpbGxSZXN0YXVyYW50SFRNTCIsImlubmVySFRNTCIsImFkZHJlc3MiLCJwaWN0dXJlIiwic291cmNlTGFyZ2UiLCJjcmVhdGVFbGVtZW50IiwibWVkaWEiLCJzcmNzZXQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJzaXplIiwid2lkZSIsImFwcGVuZENoaWxkIiwic291cmNlTWVkaXVtIiwic291cmNlU21hbGwiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsImFsdCIsImFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UiLCJjdWlzaW5lIiwiY3Vpc2luZV90eXBlIiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lIiwiYWRkUmV2aWV3QnV0dG9uIiwicmVtb3ZlQXR0cmlidXRlIiwiYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmciLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsIk9iamVjdCIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInByb3RvdHlwZSIsInJvdyIsImRheSIsInRpbWUiLCJtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiYnV0dG9uIiwiaWNvbiIsInF1ZXJ5U2VsZWN0b3IiLCJ0ZXh0IiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwidW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiaXNGYXZvdXJpdGUiLCJpc19mYXZvcml0ZSIsImZhdm91cml0ZUJ1dHRvbiIsInN0cmluZ1RvQm9vbGVhbiIsImxvZyIsImZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkIiwiZmlsbFJldmlld3NIVE1MIiwiZ2V0T3V0Ym94UmV2aWV3cyIsImZpbGxTZW5kaW5nUmV2aWV3c0hUTUwiLCJsZW5ndGgiLCJub1Jldmlld3MiLCJjb250YWluZXIiLCJ1bCIsImZvckVhY2giLCJpbnNlcnRCZWZvcmUiLCJjcmVhdGVSZXZpZXdIVE1MIiwiZmlyc3RDaGlsZCIsIm91dGJveFJldmlldyIsInJlcXVlc3RfaWQiLCJzZW5kaW5nIiwiYXJ0aWNsZSIsImhlYWRlclNwYW4iLCJkYXRlIiwibG9hZGluZ1RleHQiLCJkYXRlVGV4dCIsImZvcm1hdERhdGUiLCJEYXRlIiwidXBkYXRlZEF0IiwiY29udGVudFNwYW4iLCJyYXRpbmciLCJjb21tZW50cyIsInJldmlld0VsZW1lbnQiLCJlcnJvclRleHQiLCJicmVhZGNydW1iIiwibGkiLCJ1cmwiLCJsb2NhdGlvbiIsImhyZWYiLCJyZXBsYWNlIiwicmVnZXgiLCJSZWdFeHAiLCJyZXN1bHRzIiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsInNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUiLCJzcGlubmVyIiwicmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInRvZ2dsZVJlc3RhdXJhbnRBc0Zhdm91cml0ZSIsIm5ld0lzRmF2b3VyaXRlIiwicmVzdGF1cmFudElkIiwiZmFpbGVkVXBkYXRlQ2FsbGJhY2siLCJzZXRSZXN0YXVyYW50RmF2b3VyaXRlU3RhdHVzIiwidXBkYXRlZFJlc3RhdXJhbnQiLCJjb25uZWN0aW9uU3RhdHVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFJQSxVQUFKO0FBQ0EsSUFBSUMsT0FBSjtBQUNBLElBQUlDLGFBQUo7QUFDQSxJQUFJQyxNQUFKO0FBQ0EsSUFBSUMsaUJBQUo7QUFDQSxJQUFNQyxVQUFVLEdBQUcsb0JBQW5CO0FBQ0EsSUFBSUMsbUJBQUo7QUFFQTs7OztBQUdBQyxRQUFRLENBQUNDLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxVQUFDQyxLQUFELEVBQVc7QUFDdkRILEVBQUFBLG1CQUFtQixHQUFHSSxTQUFTLENBQUNDLE1BQWhDO0FBRUFDLEVBQUFBLE9BQU87QUFDUEMsRUFBQUEsWUFBWTs7QUFDWixNQUFJQyxNQUFNLENBQUNDLFVBQVgsRUFBdUI7QUFDckJYLElBQUFBLGlCQUFpQixHQUFHVSxNQUFNLENBQUNDLFVBQVAsQ0FBa0JWLFVBQWxCLEVB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LENBQUNDLE1BQVgsSUFBcUJMLG1CQUF6QixFQUE4QztBQUFFO0FBQ3JEcUIsSUFBQUEsWUFBWSxDQUFDLGlCQUFELEVBQW9CLE9BQXBCLENBQVo7QUFDRDs7QUFFRHJCLEVBQUFBLG1CQUFtQixHQUFHSSxTQUFTLENBQUNDLE1BQWhDO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgcmVzdGF1cmFudDtcbmxldCByZXZpZXdzO1xubGV0IG91dGJveFJldmlld3M7XG5sZXQgbmV3TWFwO1xubGV0IG1hdGNoZXNNZWRpYVF1ZXJ5O1xuY29uc3QgbWVkaWFRdWVyeSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xubGV0IHByZXZpb3VzbHlDb25uZWN0ZWQ7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBtYXAgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXG4gKi9cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcbiAgcHJldmlvdXNseUNvbm5lY3RlZCA9IG5hdmlnYXRvci5vbkxpbmU7XG5cbiAgaW5pdE1hcCgpO1xuICBmZXRjaFJldmlld3MoKTtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgbWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICB9XG4gIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7IC8vIHNldCBpbml0aWFsIGFyaWEgdmFsdWVzXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICBzZXRJbnRlcnZhbChjbGVhbk1hcGJveFRpbGVzQ2FjaGUsIDUwMDApO1xuXG4gIGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgdHlwZSwgcmVxdWVzdElkLCByZXZpZXcsIGVycm9yLFxuICAgICAgfSA9IGV2ZW50LmRhdGE7XG4gICAgICBpZiAodHlwZSA9PT0gJ3VwZGF0ZS1yZXZpZXcnKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGVucXVldWVUb2FzdCgnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgc3VibWl0dGluZyB5b3VyIHJldmlldycsICdlcnJvcicpO1xuICAgICAgICAgIHVwZGF0ZVJldmlld0hUTUwodHJ1ZSwgcmVxdWVzdElkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnF1ZXVlVG9hc3QoYCR7cmV2aWV3Lm5hbWV9J3MgcmV2aWV3IGhhcyBiZWVuIHNhdmVkYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKGZhbHNlLCByZXF1ZXN0SWQsIHJldmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmICgnb25MaW5lJyBpbiBuYXZpZ2F0b3IpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgc2hvd0Nvbm5lY3Rpb25TdGF0dXMpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgc2hvd0Nvbm5lY3Rpb25TdGF0dXMpO1xuICAgIHNob3dDb25uZWN0aW9uU3RhdHVzKCk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbGVhZmxldCBtYXBcbiAqL1xuY29uc3QgaW5pdE1hcCA9ICgpID0+IHtcbiAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCgoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcbiAgICBjb25zdCBNQVBCT1hfQVBJX0tFWSA9ICdway5leUoxSWpvaVlXNWxaWE5oTFhOaGJHVm9JaXdpWVNJNkltTnFhMnhtWkhWd01ERm9ZVzR6ZG5Bd1lXcGxNbTUzYkhFaWZRLlYxMWRET3RFbldTd1R4WS1DOG1KTHcnO1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5uZXdNYXAgPSBMLm1hcCgnbWFwJywge1xuICAgICAgICBjZW50ZXI6IFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXG4gICAgICAgIHpvb206IDE2LFxuICAgICAgICBzY3JvbGxXaGVlbFpvb206IGZhbHNlLFxuICAgICAgfSk7XG4gICAgICBMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LmpwZzcwP2FjY2Vzc190b2tlbj17bWFwYm94VG9rZW59Jywge1xuICAgICAgICBtYXBib3hUb2tlbjogTUFQQk9YX0FQSV9LRVksXG4gICAgICAgIG1heFpvb206IDE4LFxuICAgICAgICBhdHRyaWJ1dGlvbjogJ01hcCBkYXRhICZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAnXG4gICAgICAgICAgKyAnPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8yLjAvXCI+Q0MtQlktU0E8L2E+LCAnXG4gICAgICAgICAgKyAnSW1hZ2VyeSDCqSA8YSBocmVmPVwiaHR0cHM6Ly93d3cubWFwYm94LmNvbS9cIj5NYXBib3g8L2E+JyxcbiAgICAgICAgaWQ6ICdtYXBib3guc3RyZWV0cycsXG4gICAgICB9KS5hZGRUbyhuZXdNYXApO1xuICAgICAgZmlsbEJyZWFkY3J1bWIoKTtcbiAgICAgIERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQoc2VsZi5yZXN0YXVyYW50LCBzZWxmLm5ld01hcCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuKiBVcGRhdGUgYXJpYS1oaWRkZW4gdmFsdWVzIG9mIHRoZSB2aXNpYmxlIGFuZCBhY2Nlc3NpYmxlIHJlc3RhdXJhbnQgY29udGFpbmVyc1xuKi9cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIGNvbnN0IG5leHRNYXRjaGVzTWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKG1lZGlhUXVlcnkpLm1hdGNoZXM7XG4gICAgaWYgKG5leHRNYXRjaGVzTWVkaWFRdWVyeSAhPT0gbWF0Y2hlc01lZGlhUXVlcnkpIHsgLy8gb25seSB1cGRhdGUgYXJpYSB3aGVuIGxheW91dCBjaGFuZ2VzXG4gICAgICBtYXRjaGVzTWVkaWFRdWVyeSA9IG5leHRNYXRjaGVzTWVkaWFRdWVyeTtcbiAgICAgIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7XG4gICAgfVxuICB9XG59KTtcblxuLyoqXG4qIFNldCBhcmlhLWhpZGRlbiB2YWx1ZXMgZm9yIHZpc2libGUgYW5kIHJlZ3VsYXIgcmVzdGF1cmFudCBjb250YWluZXJzXG4qIEFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXIgaXMgb2ZmIHNjcmVlblxuKiBJdCBpcyByZXF1aXJlZCB0byBtYWludGFpbiBzY3JlZW4gcmVhZGluZyBvcmRlciB3aGVuIHRoZSBsYXlvdXQgc2hpZnRzXG4qL1xuY29uc3QgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEgPSAoKSA9PiB7XG4gIGNvbnN0IHJlc3RhdXJhbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jb250YWluZXInKTtcbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBpZiAobWF0Y2hlc01lZGlhUXVlcnkpIHsgLy8gbGFyZ2VyIGxheW91dCwgc2NyZWVuIHJlYWRpbmcgb3JkZXIgb2ZmXG4gICAgcmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gIH0gZWxzZSB7IC8vIHVzZSByZWd1bGFyIHJlYWRpbmcgb3JkZXJcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmVzdGF1cmFudEZyb21VUkwgPSAoY2FsbGJhY2spID0+IHtcbiAgaWYgKHNlbGYucmVzdGF1cmFudCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcbiAgICBjYWxsYmFjayhudWxsLCBzZWxmLnJlc3RhdXJhbnQpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpZCA9IGdldFVybFBhcmFtKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJztcbiAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgICBzZWxmLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xuICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcblxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xuICBhZGRyZXNzLmlubmVySFRNTCArPSByZXN0YXVyYW50LmFkZHJlc3M7XG5cbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LXBpY3R1cmUnKTtcblxuICBjb25zdCBzb3VyY2VMYXJnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VMYXJnZS5tZWRpYSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xuICBzb3VyY2VMYXJnZS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbGFyZ2UnLCB3aWRlOiB0cnVlIH0pO1xuICBzb3VyY2VMYXJnZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZUxhcmdlKTtcblxuICBjb25zdCBzb3VyY2VNZWRpdW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTWVkaXVtLm1lZGlhID0gJyhtaW4td2lkdGg6IDYwMHB4KSc7XG4gIHNvdXJjZU1lZGl1bS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbWVkaXVtJyB9KTtcbiAgc291cmNlTWVkaXVtLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTWVkaXVtKTtcblxuICBjb25zdCBzb3VyY2VTbWFsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VTbWFsbC5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnc21hbGwnIH0pO1xuICBzb3VyY2VTbWFsbC50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZVNtYWxsKTtcblxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xuICAvLyBzZXQgZGVmYXVsdCBzaXplIGluIGNhc2UgcGljdHVyZSBlbGVtZW50IGlzIG5vdCBzdXBwb3J0ZWRcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xuICBpbWFnZS5hbHQgPSByZXN0YXVyYW50LmFsdDtcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtaW1nJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgcmVzdGF1cmFudC5hbHQpO1xuXG4gIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctYnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgQWRkIGEgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcblxuICBjb25zdCBhZGRSZXZpZXdPdmVybGF5SGVhZGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LW92ZXJsYXktaGVhZGluZycpO1xuICBhZGRSZXZpZXdPdmVybGF5SGVhZGluZy5pbm5lckhUTUwgPSBgQWRkIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YDtcblxuICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xuICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcbiAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3RhdXJhbnQsICdpc19mYXZvcml0ZScpKSB7XG4gICAgZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcbiAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3BlcmF0aW5nSG91cnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XG5cbiAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xuXG4gICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgY29uc3QgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIGNvbnN0IHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdVbm1hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBjdXJyZW50bHkgbWFya2VkIGFzIGZhdm91cml0ZScpO1xufTtcblxuY29uc3QgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKGJ1dHRvbikgPT4ge1xuICBjb25zdCBpY29uID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgY29uc3QgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ01hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBub3QgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbi8qKlxuICogU2V0IHN0YXRlIGFuZCB0ZXh0IGZvciBtYXJrIGFzIGZhdm91cml0ZSBidXR0b24uXG4gKi9cbmNvbnN0IGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MID0gKGlzRmF2b3VyaXRlID0gc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKSA9PiB7XG4gIGNvbnN0IGZhdm91cml0ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBpZiAoc3RyaW5nVG9Cb29sZWFuKGlzRmF2b3VyaXRlKSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmV2aWV3cyA9ICgpID0+IHtcbiAgY29uc3QgaWQgPSBnZXRVcmxQYXJhbSgnaWQnKTtcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcbiAgICBjb25zb2xlLmxvZygnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnKTtcbiAgfSBlbHNlIHtcbiAgICBEQkhlbHBlci5mZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZChpZCwgKGVycm9yLCByZXZpZXdzKSA9PiB7XG4gICAgICBzZWxmLnJldmlld3MgPSByZXZpZXdzO1xuICAgICAgaWYgKCFyZXZpZXdzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmV2aWV3c0hUTUwoKTtcbiAgICAgIERCSGVscGVyLmdldE91dGJveFJldmlld3MoaWQsIChlcnJvciwgb3V0Ym94UmV2aWV3cykgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5vdXRib3hSZXZpZXdzID0gb3V0Ym94UmV2aWV3cztcbiAgICAgICAgICBmaWxsU2VuZGluZ1Jldmlld3NIVE1MKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbGwgcmV2aWV3cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgZmlsbFJldmlld3NIVE1MID0gKHJldmlld3MgPSBzZWxmLnJldmlld3MpID0+IHtcbiAgaWYgKCFyZXZpZXdzIHx8IHJldmlld3MubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIHJldmlld3MuZm9yRWFjaCgocmV2aWV3KSA9PiB7XG4gICAgdWwuaW5zZXJ0QmVmb3JlKGNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSwgdWwuZmlyc3RDaGlsZCk7XG4gIH0pO1xufTtcblxuY29uc3QgZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCA9IChvdXRib3hSZXZpZXdzID0gc2VsZi5vdXRib3hSZXZpZXdzKSA9PiB7XG4gIGlmICghb3V0Ym94UmV2aWV3cyB8fCBvdXRib3hSZXZpZXdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICBvdXRib3hSZXZpZXdzLmZvckVhY2goKG91dGJveFJldmlldykgPT4ge1xuICAgIGNvbnN0IHsgcmVxdWVzdF9pZCwgLi4ucmV2aWV3IH0gPSBvdXRib3hSZXZpZXc7XG4gICAgdWwuaW5zZXJ0QmVmb3JlKGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCB0cnVlLCByZXF1ZXN0X2lkKSwgdWwuZmlyc3RDaGlsZCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgcmV2aWV3IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgY3JlYXRlUmV2aWV3SFRNTCA9IChyZXZpZXcsIHNlbmRpbmcsIHJlcXVlc3RJZCkgPT4ge1xuICBjb25zdCBhcnRpY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXJ0aWNsZScpO1xuICBhcnRpY2xlLmNsYXNzTmFtZSA9ICdyZXZpZXcnO1xuXG4gIGNvbnN0IGhlYWRlclNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGhlYWRlclNwYW4uY2xhc3NOYW1lID0gJ3Jldmlldy1oZWFkZXInO1xuXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIG5hbWUuaW5uZXJIVE1MID0gcmV2aWV3Lm5hbWU7XG4gIG5hbWUuY2xhc3NOYW1lID0gJ3Jldmlldy1uYW1lJztcbiAgaGVhZGVyU3Bhbi5hcHBlbmRDaGlsZChuYW1lKTtcblxuICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXG4gIGlmIChzZW5kaW5nKSB7XG4gICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICdmYS1jbG9jaycpO1xuICAgIGNvbnN0IGxvYWRpbmdUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxvYWRpbmdUZXh0LmlubmVySFRNTCA9ICdTZW5kaW5nJztcbiAgICBkYXRlLmFwcGVuZENoaWxkKGljb24pO1xuICAgIGRhdGUuYXBwZW5kQ2hpbGQobG9hZGluZ1RleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRhdGVUZXh0ID0gZm9ybWF0RGF0ZShuZXcgRGF0ZShyZXZpZXcudXBkYXRlZEF0KSk7XG4gICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgfVxuXG4gIGRhdGUuY2xhc3NOYW1lID0gJ3Jldmlldy1kYXRlJztcbiAgaGVhZGVyU3Bhbi5hcHBlbmRDaGlsZChkYXRlKTtcbiAgYXJ0aWNsZS5hcHBlbmRDaGlsZChoZWFkZXJTcGFuKTtcblxuICBjb25zdCBjb250ZW50U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgY29udGVudFNwYW4uY2xhc3NOYW1lID0gJ3Jldmlldy1jb250ZW50JztcblxuICBjb25zdCByYXRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIHJhdGluZy5pbm5lckhUTUwgPSBgUmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcbiAgcmF0aW5nLmNsYXNzTmFtZSA9ICdyZXZpZXctcmF0aW5nJztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQocmF0aW5nKTtcblxuICBjb25zdCBjb21tZW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgY29tbWVudHMuaW5uZXJIVE1MID0gcmV2aWV3LmNvbW1lbnRzO1xuICBjb250ZW50U3Bhbi5hcHBlbmRDaGlsZChjb21tZW50cyk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoY29udGVudFNwYW4pO1xuXG4gIGlmIChzZW5kaW5nKSB7XG4gICAgYXJ0aWNsZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnLCByZXF1ZXN0SWQpO1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICAgIGFydGljbGUuY2xhc3NMaXN0LmFkZCgnc2VuZGluZycpO1xuICB9XG5cbiAgcmV0dXJuIGFydGljbGU7XG59O1xuXG5jb25zdCB1cGRhdGVSZXZpZXdIVE1MID0gKGVycm9yLCByZXF1ZXN0SWQsIHJldmlldykgPT4ge1xuICBjb25zdCByZXZpZXdFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke3JlcXVlc3RJZH1cIl1gKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgaWYgKHJldmlld0VsZW1lbnQpIHsgLy8gZm9yIGVycm9yLCBubyBuZWVkIHRvIGFkZCB0byBVSSBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgIGRhdGUuaW5uZXJIVE1MID0gJyc7XG4gICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnKTtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGVycm9yVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyBmYWlsZWQnO1xuICAgICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoZXJyb3JUZXh0KTtcbiAgICAgIGRhdGUuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgaWYgKHVsICYmIHNlbGYucmVzdGF1cmFudCkgeyAvLyBvbmx5IHVwZGF0ZSBpZiB0aGUgcmVzdGF1cmFudCBpcyBsb2FkZWRcbiAgICAgIGlmIChyZXZpZXdFbGVtZW50KSB7XG4gICAgICAgIHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VuZGluZycpO1xuICAgICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICAgICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cbmNvbnN0IGZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn07XG5cbi8qKlxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZ2V0VXJsUGFyYW0gPSAobmFtZSwgdXJsKSA9PiB7XG4gIHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKTtcblxuXG4gIGNvbnN0IHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XG4gIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csICcgJykpO1xufTtcblxuY29uc3Qgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59O1xuXG5jb25zdCByZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlID0gKGJ1dHRvbiwgc3Bpbm5lcikgPT4ge1xuICBidXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAnZmFsc2UnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG59O1xuXG5jb25zdCB0b2dnbGVSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoKSA9PiB7XG4gIGNvbnN0IGlzRmF2b3VyaXRlID0gc3RyaW5nVG9Cb29sZWFuKHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSk7XG4gIGNvbnN0IG5ld0lzRmF2b3VyaXRlID0gKCFpc0Zhdm91cml0ZSkgJiYgaXNGYXZvdXJpdGUgIT09ICdmYWxzZSc7XG4gIGNvbnN0IHJlc3RhdXJhbnRJZCA9IHNlbGYucmVzdGF1cmFudC5pZDtcbiAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcmstYXMtZmF2b3VyaXRlJyk7XG4gIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmF2b3VyaXRlLXNwaW5uZXInKTtcbiAgbGV0IGZhaWxlZFVwZGF0ZUNhbGxiYWNrO1xuICBpZiAobmV3SXNGYXZvdXJpdGUpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGJ1dHRvbik7XG4gICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2sgPSB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGU7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGJ1dHRvbik7XG4gICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2sgPSBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICB9XG4gIHNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgREJIZWxwZXIuc2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyhyZXN0YXVyYW50SWQsIG5ld0lzRmF2b3VyaXRlLCAoZXJyb3IsIHVwZGF0ZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgcmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZShidXR0b24sIHNwaW5uZXIpO1xuICAgIGlmICghdXBkYXRlZFJlc3RhdXJhbnQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2soYnV0dG9uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi5yZXN0YXVyYW50ID0gdXBkYXRlZFJlc3RhdXJhbnQ7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gc2hvd0Nvbm5lY3Rpb25TdGF0dXMoKSB7XG4gIGNvbnN0IGNvbm5lY3Rpb25TdGF0dXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29ubmVjdGlvblN0YXR1cycpO1xuXG4gIGlmIChuYXZpZ2F0b3Iub25MaW5lICYmICFwcmV2aW91c2x5Q29ubmVjdGVkKSB7IC8vIHVzZXIgY2FtZSBiYWNrIG9ubGluZVxuICAgIGVucXVldWVUb2FzdCgnWW91IGFyZSBiYWNrIG9ubGluZScsICdzdWNjZXNzJyk7XG4gIH0gZWxzZSBpZiAoIW5hdmlnYXRvci5vbkxpbmUgJiYgcHJldmlvdXNseUNvbm5lY3RlZCkgeyAvLyB1c2VyIHdlbnQgb2ZmbGluZVxuICAgIGVucXVldWVUb2FzdCgnWW91IGFyZSBvZmZsaW5lJywgJ2Vycm9yJyk7XG4gIH1cblxuICBwcmV2aW91c2x5Q29ubmVjdGVkID0gbmF2aWdhdG9yLm9uTGluZTtcbn1cbiJdLCJmaWxlIjoicmVzdGF1cmFudF9pbmZvLmpzIn0=

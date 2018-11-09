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
/**
 * Initialize map as soon as the page is loaded.
 */

document.addEventListener('DOMContentLoaded', function (event) {
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
          updateReviewHTML(true, requestId);
        } else {
          updateReviewHTML(false, requestId, review);
        }
      }
    });
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
    ul.appendChild(createReviewHTML(review));
  });
};

var fillSendingReviewsHTML = function fillSendingReviewsHTML() {
  var outboxReviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.outboxReviews;
  if (!outboxReviews || outboxReviews.length === 0) return;
  var ul = document.getElementById('reviews-list');
  outboxReviews.forEach(function (outboxReview) {
    var request_id = outboxReview.request_id,
        review = _objectWithoutProperties(outboxReview, ["request_id"]);

    ul.appendChild(createReviewHTML(review, true, request_id));
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
      reviewElement.classList.remove('sending');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsImluaXRNYXAiLCJmZXRjaFJldmlld3MiLCJ3aW5kb3ciLCJtYXRjaE1lZGlhIiwibWF0Y2hlcyIsInVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhIiwicmVnaXN0ZXJTZXJ2aWNlV29ya2VyIiwic2V0SW50ZXJ2YWwiLCJjbGVhbk1hcGJveFRpbGVzQ2FjaGUiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwiZGF0YSIsInR5cGUiLCJyZXF1ZXN0SWQiLCJyZXZpZXciLCJlcnJvciIsInVwZGF0ZVJldmlld0hUTUwiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiTUFQQk9YX0FQSV9LRVkiLCJjb25zb2xlIiwic2VsZiIsIkwiLCJtYXAiLCJjZW50ZXIiLCJsYXRsbmciLCJsYXQiLCJsbmciLCJ6b29tIiwic2Nyb2xsV2hlZWxab29tIiwidGlsZUxheWVyIiwibWFwYm94VG9rZW4iLCJtYXhab29tIiwiYXR0cmlidXRpb24iLCJpZCIsImFkZFRvIiwiZmlsbEJyZWFkY3J1bWIiLCJEQkhlbHBlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJuZXh0TWF0Y2hlc01lZGlhUXVlcnkiLCJyZXN0YXVyYW50Q29udGFpbmVyIiwiZ2V0RWxlbWVudEJ5SWQiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciIsInNldEF0dHJpYnV0ZSIsImNhbGxiYWNrIiwiZ2V0VXJsUGFyYW0iLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwibmFtZSIsImlubmVySFRNTCIsImFkZHJlc3MiLCJwaWN0dXJlIiwic291cmNlTGFyZ2UiLCJjcmVhdGVFbGVtZW50IiwibWVkaWEiLCJzcmNzZXQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJzaXplIiwid2lkZSIsImFwcGVuZENoaWxkIiwic291cmNlTWVkaXVtIiwic291cmNlU21hbGwiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsImFsdCIsImFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UiLCJjdWlzaW5lIiwiY3Vpc2luZV90eXBlIiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lIiwiYWRkUmV2aWV3QnV0dG9uIiwicmVtb3ZlQXR0cmlidXRlIiwiYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmciLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsIk9iamVjdCIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInByb3RvdHlwZSIsInJvdyIsImRheSIsInRpbWUiLCJtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiYnV0dG9uIiwiaWNvbiIsInF1ZXJ5U2VsZWN0b3IiLCJ0ZXh0IiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwidW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiaXNGYXZvdXJpdGUiLCJpc19mYXZvcml0ZSIsImZhdm91cml0ZUJ1dHRvbiIsInN0cmluZ1RvQm9vbGVhbiIsImxvZyIsImZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkIiwiZmlsbFJldmlld3NIVE1MIiwiZ2V0T3V0Ym94UmV2aWV3cyIsImZpbGxTZW5kaW5nUmV2aWV3c0hUTUwiLCJsZW5ndGgiLCJub1Jldmlld3MiLCJjb250YWluZXIiLCJ1bCIsImZvckVhY2giLCJjcmVhdGVSZXZpZXdIVE1MIiwib3V0Ym94UmV2aWV3IiwicmVxdWVzdF9pZCIsInNlbmRpbmciLCJhcnRpY2xlIiwiaGVhZGVyU3BhbiIsImRhdGUiLCJsb2FkaW5nVGV4dCIsImRhdGVUZXh0IiwiZm9ybWF0RGF0ZSIsIkRhdGUiLCJ1cGRhdGVkQXQiLCJjb250ZW50U3BhbiIsInJhdGluZyIsImNvbW1lbnRzIiwicmV2aWV3RWxlbWVudCIsImVycm9yVGV4dCIsImJyZWFkY3J1bWIiLCJsaSIsInVybCIsImxvY2F0aW9uIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInNwaW5uZXIiLCJyZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwidG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwibmV3SXNGYXZvdXJpdGUiLCJyZXN0YXVyYW50SWQiLCJmYWlsZWRVcGRhdGVDYWxsYmFjayIsInNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMiLCJ1cGRhdGVkUmVzdGF1cmFudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBSUEsVUFBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxhQUFKO0FBQ0EsSUFBSUMsTUFBSjtBQUNBLElBQUlDLGlCQUFKO0FBQ0EsSUFBTUMsVUFBVSxHQUFHLG9CQUFuQjtBQUNBLElBQUlDLHdCQUFKO0FBRUE7Ozs7QUFHQUMsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3ZEQyxFQUFBQSxPQUFPO0FBQ1BDLEVBQUFBLFlBQVk7O0FBQ1osTUFBSUMsTUFBTSxDQUFDQyxVQUFYLEVBQXVCO0FBQ3JCVCxJQUFBQSxpQkFBaUIsR0FBR1EsTUFBTSxDQUFDQyxVQUFQLENBQWtCUixVQUFsQixFQUE4QlMsT0FBbEQ7QUFDRDs7QUFDREMsRUFBQUEsNkJBQTZCLEdBTjBCLENBTXRCOztBQUNqQ0MsRUFBQUEscUJBQXFCO0FBQ3JCQyxFQUFBQSxXQUFXLENBQUNDLHFCQUFELEVBQXdCLElBQXhCLENBQVg7O0FBRUEsTUFBSUMsU0FB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Y0FBcEQsRUFBb0UsVUFBQzdILEtBQUQsRUFBUWlJLGlCQUFSLEVBQThCO0FBQ2hHTixJQUFBQSxrQ0FBa0MsQ0FBQ3BELE1BQUQsRUFBU21ELE9BQVQsQ0FBbEM7O0FBQ0EsUUFBSSxDQUFDTyxpQkFBTCxFQUF3QjtBQUN0QjdILE1BQUFBLE9BQU8sQ0FBQ0osS0FBUixDQUFjQSxLQUFkO0FBQ0ErSCxNQUFBQSxvQkFBb0IsQ0FBQ3hELE1BQUQsQ0FBcEI7QUFDQTtBQUNEOztBQUNEbEUsSUFBQUEsSUFBSSxDQUFDOUIsVUFBTCxHQUFrQjBKLGlCQUFsQjtBQUNELEdBUkQ7QUFTRCxDQXhCRCIsInNvdXJjZXNDb250ZW50IjpbImxldCByZXN0YXVyYW50O1xubGV0IHJldmlld3M7XG5sZXQgb3V0Ym94UmV2aWV3cztcbmxldCBuZXdNYXA7XG5sZXQgbWF0Y2hlc01lZGlhUXVlcnk7XG5jb25zdCBtZWRpYVF1ZXJ5ID0gJyhtaW4td2lkdGg6IDgwMHB4KSc7XG5sZXQgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50O1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWFwIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gIGluaXRNYXAoKTtcbiAgZmV0Y2hSZXZpZXdzKCk7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgfVxuICB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSgpOyAvLyBzZXQgaW5pdGlhbCBhcmlhIHZhbHVlc1xuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgc2V0SW50ZXJ2YWwoY2xlYW5NYXBib3hUaWxlc0NhY2hlLCA1MDAwKTtcblxuICBpZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCB7IHR5cGUsIHJlcXVlc3RJZCwgcmV2aWV3LCBlcnJvciB9ID0gZXZlbnQuZGF0YTtcbiAgICAgIGlmICh0eXBlID09PSAndXBkYXRlLXJldmlldycpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTCh0cnVlLCByZXF1ZXN0SWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZVJldmlld0hUTUwoZmFsc2UsIHJlcXVlc3RJZCwgcmV2aWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn0pO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbGVhZmxldCBtYXBcbiAqL1xuY29uc3QgaW5pdE1hcCA9ICgpID0+IHtcbiAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCgoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcbiAgICBjb25zdCBNQVBCT1hfQVBJX0tFWSA9ICdway5leUoxSWpvaVlXNWxaWE5oTFhOaGJHVm9JaXdpWVNJNkltTnFhMnhtWkhWd01ERm9ZVzR6ZG5Bd1lXcGxNbTUzYkhFaWZRLlYxMWRET3RFbldTd1R4WS1DOG1KTHcnO1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5uZXdNYXAgPSBMLm1hcCgnbWFwJywge1xuICAgICAgICBjZW50ZXI6IFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXG4gICAgICAgIHpvb206IDE2LFxuICAgICAgICBzY3JvbGxXaGVlbFpvb206IGZhbHNlLFxuICAgICAgfSk7XG4gICAgICBMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LmpwZzcwP2FjY2Vzc190b2tlbj17bWFwYm94VG9rZW59Jywge1xuICAgICAgICBtYXBib3hUb2tlbjogTUFQQk9YX0FQSV9LRVksXG4gICAgICAgIG1heFpvb206IDE4LFxuICAgICAgICBhdHRyaWJ1dGlvbjogJ01hcCBkYXRhICZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAnXG4gICAgICAgICAgKyAnPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8yLjAvXCI+Q0MtQlktU0E8L2E+LCAnXG4gICAgICAgICAgKyAnSW1hZ2VyeSDCqSA8YSBocmVmPVwiaHR0cHM6Ly93d3cubWFwYm94LmNvbS9cIj5NYXBib3g8L2E+JyxcbiAgICAgICAgaWQ6ICdtYXBib3guc3RyZWV0cycsXG4gICAgICB9KS5hZGRUbyhuZXdNYXApO1xuICAgICAgZmlsbEJyZWFkY3J1bWIoKTtcbiAgICAgIERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQoc2VsZi5yZXN0YXVyYW50LCBzZWxmLm5ld01hcCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuKiBVcGRhdGUgYXJpYS1oaWRkZW4gdmFsdWVzIG9mIHRoZSB2aXNpYmxlIGFuZCBhY2Nlc3NpYmxlIHJlc3RhdXJhbnQgY29udGFpbmVyc1xuKi9cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgIGNvbnN0IG5leHRNYXRjaGVzTWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKG1lZGlhUXVlcnkpLm1hdGNoZXM7XG4gICAgaWYgKG5leHRNYXRjaGVzTWVkaWFRdWVyeSAhPT0gbWF0Y2hlc01lZGlhUXVlcnkpIHsgLy8gb25seSB1cGRhdGUgYXJpYSB3aGVuIGxheW91dCBjaGFuZ2VzXG4gICAgICBtYXRjaGVzTWVkaWFRdWVyeSA9IG5leHRNYXRjaGVzTWVkaWFRdWVyeTtcbiAgICAgIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7XG4gICAgfVxuICB9XG59KTtcblxuLyoqXG4qIFNldCBhcmlhLWhpZGRlbiB2YWx1ZXMgZm9yIHZpc2libGUgYW5kIHJlZ3VsYXIgcmVzdGF1cmFudCBjb250YWluZXJzXG4qIEFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXIgaXMgb2ZmIHNjcmVlblxuKiBJdCBpcyByZXF1aXJlZCB0byBtYWludGFpbiBzY3JlZW4gcmVhZGluZyBvcmRlciB3aGVuIHRoZSBsYXlvdXQgc2hpZnRzXG4qL1xuY29uc3QgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEgPSAoKSA9PiB7XG4gIGNvbnN0IHJlc3RhdXJhbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jb250YWluZXInKTtcbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBpZiAobWF0Y2hlc01lZGlhUXVlcnkpIHsgLy8gbGFyZ2VyIGxheW91dCwgc2NyZWVuIHJlYWRpbmcgb3JkZXIgb2ZmXG4gICAgcmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gIH0gZWxzZSB7IC8vIHVzZSByZWd1bGFyIHJlYWRpbmcgb3JkZXJcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmVzdGF1cmFudEZyb21VUkwgPSAoY2FsbGJhY2spID0+IHtcbiAgaWYgKHNlbGYucmVzdGF1cmFudCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcbiAgICBjYWxsYmFjayhudWxsLCBzZWxmLnJlc3RhdXJhbnQpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpZCA9IGdldFVybFBhcmFtKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJztcbiAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgICBzZWxmLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xuICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcblxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xuICBhZGRyZXNzLmlubmVySFRNTCArPSByZXN0YXVyYW50LmFkZHJlc3M7XG5cbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LXBpY3R1cmUnKTtcblxuICBjb25zdCBzb3VyY2VMYXJnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VMYXJnZS5tZWRpYSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xuICBzb3VyY2VMYXJnZS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbGFyZ2UnLCB3aWRlOiB0cnVlIH0pO1xuICBzb3VyY2VMYXJnZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZUxhcmdlKTtcblxuICBjb25zdCBzb3VyY2VNZWRpdW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTWVkaXVtLm1lZGlhID0gJyhtaW4td2lkdGg6IDYwMHB4KSc7XG4gIHNvdXJjZU1lZGl1bS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbWVkaXVtJyB9KTtcbiAgc291cmNlTWVkaXVtLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTWVkaXVtKTtcblxuICBjb25zdCBzb3VyY2VTbWFsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VTbWFsbC5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnc21hbGwnIH0pO1xuICBzb3VyY2VTbWFsbC50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZVNtYWxsKTtcblxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xuICAvLyBzZXQgZGVmYXVsdCBzaXplIGluIGNhc2UgcGljdHVyZSBlbGVtZW50IGlzIG5vdCBzdXBwb3J0ZWRcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xuICBpbWFnZS5hbHQgPSByZXN0YXVyYW50LmFsdDtcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtaW1nJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgcmVzdGF1cmFudC5hbHQpO1xuXG4gIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctYnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgQWRkIGEgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcblxuICBjb25zdCBhZGRSZXZpZXdPdmVybGF5SGVhZGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LW92ZXJsYXktaGVhZGluZycpO1xuICBhZGRSZXZpZXdPdmVybGF5SGVhZGluZy5pbm5lckhUTUwgPSBgQWRkIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YDtcblxuICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xuICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcbiAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3RhdXJhbnQsICdpc19mYXZvcml0ZScpKSB7XG4gICAgZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcbiAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3BlcmF0aW5nSG91cnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XG5cbiAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xuXG4gICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgdmFyIGljb24gPSBidXR0b24ucXVlcnlTZWxlY3RvcignaScpO1xuICB2YXIgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ1VubWFyayByZXN0YXVyYW50IGFzIGZhdm91cml0ZSc7XG4gIGljb24uY2xhc3NMaXN0LmFkZCgnZmFzJywgJ21hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdSZXN0YXVyYW50IGlzIGN1cnJlbnRseSBtYXJrZWQgYXMgZmF2b3VyaXRlJyk7XG59O1xuXG5jb25zdCB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoYnV0dG9uKSA9PiB7XG4gIHZhciBpY29uID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgdmFyIHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdNYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgbm90IGN1cnJlbnRseSBtYXJrZWQgYXMgZmF2b3VyaXRlJyk7XG59O1xuXG4vKipcbiAqIFNldCBzdGF0ZSBhbmQgdGV4dCBmb3IgbWFyayBhcyBmYXZvdXJpdGUgYnV0dG9uLlxuICovXG5jb25zdCBmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCA9IChpc0Zhdm91cml0ZSA9IHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSkgPT4ge1xuICBjb25zdCBmYXZvdXJpdGVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFyay1hcy1mYXZvdXJpdGUnKTtcbiAgaWYgKHN0cmluZ1RvQm9vbGVhbihpc0Zhdm91cml0ZSkpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH1cblxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmV2aWV3cyA9ICgpID0+IHtcbiAgY29uc3QgaWQgPSBnZXRVcmxQYXJhbSgnaWQnKTtcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcbiAgICBjb25zb2xlLmxvZygnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnKTtcbiAgfSBlbHNlIHtcbiAgICBEQkhlbHBlci5mZXRjaFJldmlld3NCeVJlc3RhdXJhbnRJZChpZCwgKGVycm9yLCByZXZpZXdzKSA9PiB7XG4gICAgICBzZWxmLnJldmlld3MgPSByZXZpZXdzO1xuICAgICAgaWYgKCFyZXZpZXdzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmV2aWV3c0hUTUwoKTtcbiAgICAgIERCSGVscGVyLmdldE91dGJveFJldmlld3MoaWQsIChlcnJvciwgb3V0Ym94UmV2aWV3cykgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYub3V0Ym94UmV2aWV3cyA9IG91dGJveFJldmlld3M7XG4gICAgICAgICAgZmlsbFNlbmRpbmdSZXZpZXdzSFRNTCgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbGwgcmV2aWV3cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cbiAqL1xuY29uc3QgZmlsbFJldmlld3NIVE1MID0gKHJldmlld3MgPSBzZWxmLnJldmlld3MpID0+IHtcbiAgaWYgKCFyZXZpZXdzIHx8IHJldmlld3MubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIHJldmlld3MuZm9yRWFjaCgocmV2aWV3KSA9PiB7XG4gICAgdWwuYXBwZW5kQ2hpbGQoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpKTtcbiAgfSk7XG59O1xuXG5jb25zdCBmaWxsU2VuZGluZ1Jldmlld3NIVE1MID0gKG91dGJveFJldmlld3MgPSBzZWxmLm91dGJveFJldmlld3MpID0+IHtcbiAgaWYgKCFvdXRib3hSZXZpZXdzIHx8IG91dGJveFJldmlld3MubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIG91dGJveFJldmlld3MuZm9yRWFjaCgob3V0Ym94UmV2aWV3KSA9PiB7XG4gICAgY29uc3QgeyByZXF1ZXN0X2lkLCAuLi5yZXZpZXcgfSA9IG91dGJveFJldmlldztcbiAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgdHJ1ZSwgcmVxdWVzdF9pZCkpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3LCBzZW5kaW5nLCByZXF1ZXN0SWQpID0+IHtcbiAgY29uc3QgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgYXJ0aWNsZS5jbGFzc05hbWUgPSAncmV2aWV3JztcblxuICBjb25zdCBoZWFkZXJTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBoZWFkZXJTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctaGVhZGVyJztcblxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xuICBuYW1lLmNsYXNzTmFtZSA9ICdyZXZpZXctbmFtZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQobmFtZSk7XG5cbiAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAnZmEtY2xvY2snKTtcbiAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsb2FkaW5nVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyc7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICBkYXRlLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkYXRlVGV4dCA9IGZvcm1hdERhdGUobmV3IERhdGUocmV2aWV3LnVwZGF0ZWRBdCkpO1xuICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gIH1cblxuICBkYXRlLmNsYXNzTmFtZSA9ICdyZXZpZXctZGF0ZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQoZGF0ZSk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoaGVhZGVyU3Bhbik7XG5cbiAgY29uc3QgY29udGVudFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGNvbnRlbnRTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctY29udGVudCc7XG5cbiAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XG4gIHJhdGluZy5jbGFzc05hbWUgPSAncmV2aWV3LXJhdGluZyc7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKHJhdGluZyk7XG5cbiAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGNvbnRlbnRTcGFuKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdkYXRhLWlkJywgcmVxdWVzdElkKTtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NlbmRpbmcnKTtcbiAgfVxuXG4gIHJldHVybiBhcnRpY2xlO1xufTtcblxuY29uc3QgdXBkYXRlUmV2aWV3SFRNTCA9IChlcnJvciwgcmVxdWVzdElkLCByZXZpZXcpID0+IHtcbiAgY29uc3QgcmV2aWV3RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtyZXF1ZXN0SWR9XCJdYCk7XG4gIGlmIChlcnJvcikge1xuICAgIGlmIChyZXZpZXdFbGVtZW50KSB7IC8vIGZvciBlcnJvciwgbm8gbmVlZCB0byBhZGQgdG8gVUkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgcmV2aWV3RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdzZW5kaW5nJyk7XG4gICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgIGRhdGUuaW5uZXJIVE1MID0gJyc7XG4gICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnKTtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGVycm9yVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyBmYWlsZWQnO1xuICAgICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoZXJyb3JUZXh0KTtcbiAgICAgIGRhdGUuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgaWYgKHVsICYmIHNlbGYucmVzdGF1cmFudCkgeyAvLyBvbmx5IHVwZGF0ZSBpZiB0aGUgcmVzdGF1cmFudCBpcyBsb2FkZWRcbiAgICAgIGlmIChyZXZpZXdFbGVtZW50KSB7XG4gICAgICAgIHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VuZGluZycpO1xuICAgICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICAgICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWRkIHJlc3RhdXJhbnQgbmFtZSB0byB0aGUgYnJlYWRjcnVtYiBuYXZpZ2F0aW9uIG1lbnVcbiAqL1xuY29uc3QgZmlsbEJyZWFkY3J1bWIgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBicmVhZGNydW1iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWInKTtcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICBsaS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XG4gIGJyZWFkY3J1bWIuYXBwZW5kQ2hpbGQobGkpO1xufTtcblxuLyoqXG4gKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBnZXRVcmxQYXJhbSA9IChuYW1lLCB1cmwpID0+IHtcbiAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCAnXFxcXCQmJyk7XG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWz8mXSR7bmFtZX0oPShbXiYjXSopfCZ8I3wkKWApO1xuXG5cbiAgY29uc3QgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcbiAgaWYgKCFyZXN1bHRzKSByZXR1cm4gbnVsbDtcbiAgaWYgKCFyZXN1bHRzWzJdKSByZXR1cm4gJyc7XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG59O1xuXG5jb25zdCBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlID0gKGJ1dHRvbiwgc3Bpbm5lcikgPT4ge1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICBzcGlubmVyLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbn1cblxuY29uc3QgcmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ2ZhbHNlJyk7XG4gIHNwaW5uZXIuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufVxuXG5jb25zdCB0b2dnbGVSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoKSA9PiB7XG4gIGNvbnN0IGlzRmF2b3VyaXRlID0gc3RyaW5nVG9Cb29sZWFuKHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSk7XG4gIGNvbnN0IG5ld0lzRmF2b3VyaXRlID0gKCFpc0Zhdm91cml0ZSkgJiYgaXNGYXZvdXJpdGUgIT09ICdmYWxzZSc7XG4gIGNvbnN0IHJlc3RhdXJhbnRJZCA9IHNlbGYucmVzdGF1cmFudC5pZDtcbiAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcmstYXMtZmF2b3VyaXRlJyk7XG4gIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmF2b3VyaXRlLXNwaW5uZXInKTtcbiAgbGV0IGZhaWxlZFVwZGF0ZUNhbGxiYWNrO1xuICBpZiAobmV3SXNGYXZvdXJpdGUpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGJ1dHRvbik7XG4gICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2sgPSB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGU7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGJ1dHRvbik7XG4gICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2sgPSBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICB9XG4gIHNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgREJIZWxwZXIuc2V0UmVzdGF1cmFudEZhdm91cml0ZVN0YXR1cyhyZXN0YXVyYW50SWQsIG5ld0lzRmF2b3VyaXRlLCAoZXJyb3IsIHVwZGF0ZWRSZXN0YXVyYW50KSA9PiB7XG4gICAgcmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZShidXR0b24sIHNwaW5uZXIpO1xuICAgIGlmICghdXBkYXRlZFJlc3RhdXJhbnQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgZmFpbGVkVXBkYXRlQ2FsbGJhY2soYnV0dG9uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi5yZXN0YXVyYW50ID0gdXBkYXRlZFJlc3RhdXJhbnQ7XG4gIH0pO1xufVxuIl0sImZpbGUiOiJyZXN0YXVyYW50X2luZm8uanMifQ==

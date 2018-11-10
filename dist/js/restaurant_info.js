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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm91dGJveFJldmlld3MiLCJuZXdNYXAiLCJtYXRjaGVzTWVkaWFRdWVyeSIsIm1lZGlhUXVlcnkiLCJwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsImluaXRNYXAiLCJmZXRjaFJldmlld3MiLCJ3aW5kb3ciLCJtYXRjaE1lZGlhIiwibWF0Y2hlcyIsInVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhIiwicmVnaXN0ZXJTZXJ2aWNlV29ya2VyIiwic2V0SW50ZXJ2YWwiLCJjbGVhbk1hcGJveFRpbGVzQ2FjaGUiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwiZGF0YSIsInR5cGUiLCJyZXF1ZXN0SWQiLCJyZXZpZXciLCJlcnJvciIsInVwZGF0ZVJldmlld0hUTUwiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiTUFQQk9YX0FQSV9LRVkiLCJjb25zb2xlIiwic2VsZiIsIkwiLCJtYXAiLCJjZW50ZXIiLCJsYXRsbmciLCJsYXQiLCJsbmciLCJ6b29tIiwic2Nyb2xsV2hlZWxab29tIiwidGlsZUxheWVyIiwibWFwYm94VG9rZW4iLCJtYXhab29tIiwiYXR0cmlidXRpb24iLCJpZCIsImFkZFRvIiwiZmlsbEJyZWFkY3J1bWIiLCJEQkhlbHBlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJuZXh0TWF0Y2hlc01lZGlhUXVlcnkiLCJyZXN0YXVyYW50Q29udGFpbmVyIiwiZ2V0RWxlbWVudEJ5SWQiLCJhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciIsInNldEF0dHJpYnV0ZSIsImNhbGxiYWNrIiwiZ2V0VXJsUGFyYW0iLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwibmFtZSIsImlubmVySFRNTCIsImFkZHJlc3MiLCJwaWN0dXJlIiwic291cmNlTGFyZ2UiLCJjcmVhdGVFbGVtZW50IiwibWVkaWEiLCJzcmNzZXQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJzaXplIiwid2lkZSIsImFwcGVuZENoaWxkIiwic291cmNlTWVkaXVtIiwic291cmNlU21hbGwiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsImFsdCIsImFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UiLCJjdWlzaW5lIiwiY3Vpc2luZV90eXBlIiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lIiwiYWRkUmV2aWV3QnV0dG9uIiwicmVtb3ZlQXR0cmlidXRlIiwiYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmciLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsIk9iamVjdCIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInByb3RvdHlwZSIsInJvdyIsImRheSIsInRpbWUiLCJtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiYnV0dG9uIiwiaWNvbiIsInF1ZXJ5U2VsZWN0b3IiLCJ0ZXh0IiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwidW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiaXNGYXZvdXJpdGUiLCJpc19mYXZvcml0ZSIsImZhdm91cml0ZUJ1dHRvbiIsInN0cmluZ1RvQm9vbGVhbiIsImxvZyIsImZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkIiwiZmlsbFJldmlld3NIVE1MIiwiZ2V0T3V0Ym94UmV2aWV3cyIsImZpbGxTZW5kaW5nUmV2aWV3c0hUTUwiLCJsZW5ndGgiLCJub1Jldmlld3MiLCJjb250YWluZXIiLCJ1bCIsImZvckVhY2giLCJpbnNlcnRCZWZvcmUiLCJjcmVhdGVSZXZpZXdIVE1MIiwiZmlyc3RDaGlsZCIsIm91dGJveFJldmlldyIsInJlcXVlc3RfaWQiLCJzZW5kaW5nIiwiYXJ0aWNsZSIsImhlYWRlclNwYW4iLCJkYXRlIiwibG9hZGluZ1RleHQiLCJkYXRlVGV4dCIsImZvcm1hdERhdGUiLCJEYXRlIiwidXBkYXRlZEF0IiwiY29udGVudFNwYW4iLCJyYXRpbmciLCJjb21tZW50cyIsInJldmlld0VsZW1lbnQiLCJlcnJvclRleHQiLCJicmVhZGNydW1iIiwibGkiLCJ1cmwiLCJsb2NhdGlvbiIsImhyZWYiLCJyZXBsYWNlIiwicmVnZXgiLCJSZWdFeHAiLCJyZXN1bHRzIiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsInNldE1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUiLCJzcGlubmVyIiwicmVtb3ZlTWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInRvZ2dsZVJlc3RhdXJhbnRBc0Zhdm91cml0ZSIsIm5ld0lzRmF2b3VyaXRlIiwicmVzdGF1cmFudElkIiwiZmFpbGVkVXBkYXRlQ2FsbGJhY2siLCJzZXRSZXN0YXVyYW50RmF2b3VyaXRlU3RhdHVzIiwidXBkYXRlZFJlc3RhdXJhbnQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUlBLFVBQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsYUFBSjtBQUNBLElBQUlDLE1BQUo7QUFDQSxJQUFJQyxpQkFBSjtBQUNBLElBQU1DLFVBQVUsR0FBRyxvQkFBbkI7QUFDQSxJQUFJQyx3QkFBSjtBQUVBOzs7O0FBR0FDLFFBQVEsQ0FBQ0MsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQUNDLEtBQUQsRUFBVztBQUN2REMsRUFBQUEsT0FBTztBQUNQQyxFQUFBQSxZQUFZOztBQUNaLE1BQUlDLE1BQU0sQ0FBQ0MsVUFBWCxFQUF1QjtBQUNyQlQsSUFBQUEsaUJBQWlCLEdBQUdRLE1BQU0sQ0FBQ0MsVUFBUCxDQUFrQlIsVUFBbEIsRUFBOEJTLE9BQWxEO0FBQ0Q7O0FBQ0RDLEVBQUFBLDZCQUE2QixHQU4wQixDQU10Qjs7QUFDakNDLEVBQUFBLHFCQUFxQjtBQUNyQkMsRUFBQUEsV0FBVyxDQUFDQyxxQkFBRCxFQUF3QixJQUF4QixDQUFYOztBQUVBLE1BQUlDLFNBQVMsQ0FBQ0MsYUFBZCxFQUE2QjtBQUMzQkQsSUFBQUEsU0FBUyxDQUFDQyxhQUFWLENBQXdCWixnQkFBeEIsQ0FBeUMsU0FBekMsRUFBb0QsVUFBQ0MsS0FBRCxFQUFXO0FBQUEsd0JBQ2xCQSxLQUFLLENBQUNZLElBRFk7QUFBQSxVQUNyREMsSUFEcUQsZUFDckRBLElBRHFEO0FBQUEsVUFDL0NDLFNBRCtDLGVBQy9DQSxTQUQrQztBQUFBLFVBQ3BDQyxNQURvQyxlQUNwQ0EsTUFEb0M7QUFBQSxVQUM1QkMsS0FENEIsZUFDNUJBLEtBRDRCOztBQUU3RCxVQUFJSCxJQUFJLEtBQUssZUFBYixFQUE4QjtBQUM1QixZQUFJRyxLQUFKLEVBQVc7QUFDVEMsVUFBQUEsZ0JBQWdCLENBQUMsSUFBRCxFQUFPSCxTQUFQLENBQWhCO0FBQ0QsU0FGRCxNQUVPO0FBQ0xHLFVBQUFBLGdCQUFnQixDQUFDLEtBQUQsRUFBUUgsU0FBUixFQUFtQkMsTUFBbkIsQ0FBaEI7QUFDRDtBQUNGO0FBQ0YsS0FURDtBQVVEO0FBQ0YsQ0F0QkQ7QUF3QkE7Ozs7QUFHQSxJQUFNZCxPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFNO0FBQ3BCaUIsRUFBQUEsc0JBQXNCLENBQUMsVUFBQ0YsS0FBRCxFQUFRekIsVUFBUixFQUF1QjtBQUM1QyxRQUFNNEIsY0FBYyxHQUFHLGtHQUF2Qjs7QUFDQSxRQUFJSCxLQUFKLEVBQVc7QUFBRTtBQUNYSSxNQUFBQSxPQUFPLENBQUNKLEtBQVIsQ0FBY0EsS0FBZDtBQUNELEtBRkQsTUFFTztBQUNMSyxNQUFBQSxJQUFJLENBQUMzQixNQUFMLEdBQWM0QixDQUFDLENBQUNDLEdBQUYsQ0FBTSxLQUFOLEVBQWE7QUFDekJDLFFBQUFBLE1BQU0sRUFBRSxDQUFDakMsVUFBVSxDQUFDa0MsTUFBWCxDQUFrQkMsR0FBbkIsRUFBd0JuQyxVQUFVLENBQUNrQyxNQUFYLENBQWtCRSxHQUExQyxDQURpQjtBQUV6QkMsUUFBQUEsSUFBSSxFQUFFLEVBRm1CO0FBR3pCQyxRQUFBQSxlQUFlLEVBQUU7QUFIUSxPQUFiLENBQWQ7QUFLQVAsTUFBQUEsQ0FBQyxDQUFDUSxTQUFGLENBQVksbUZBQVosRUFBaUc7QUFDL0ZDLFFBQUFBLFdBQVcsRUFBRVosY0FEa0Y7QUFFL0ZhLFFBQUFBLE9BQU8sRUFBRSxFQUZzRjtBQUcvRkMsUUFBQUEsV0FBVyxFQUFFLDhGQUNULDBFQURTLEdBRVQsd0RBTDJGO0FBTS9GQyxRQUFBQSxFQUFFLEVBQUU7QUFOMkYsT0FBakcsRUFPR0MsS0FQSCxDQU9TekMsTUFQVDtBQVFBMEMsTUFBQUEsY0FBYztBQUNkQyxNQUFBQSxRQUFRLENBQUNDLHNCQUFULENBQWdDakIsSUFBSSxDQUFDOUIsVUFBckMsRUFBaUQ4QixJQUFJLENBQUMzQixNQUF0RDtBQUNEO0FBQ0YsR0FyQnFCLENBQXRCO0FBc0JELENBdkJEO0FBeUJBOzs7OztBQUdBUyxNQUFNLENBQUNKLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLFlBQU07QUFDdEMsTUFBSUksTUFBTSxDQUFDQyxVQUFYLEVBQXVCO0FBQ3JCLFFBQU1tQyxxQkFBcUIsR0FBR3BDLE1BQU0sQ0FBQ0MsVUFBUCxDQUFrQlIsVUFBbEIsRUFBOEJTLE9BQTVEOztBQUNBLFFBQUlrQyxxQkFBcUIsS0FBSzVDLGlCQUE5QixFQUFpRDtBQUFFO0FBQ2pEQSxNQUFBQSxpQkFBaUIsR0FBRzRDLHFCQUFwQjtBQUNBakMsTUFBQUEsNkJBQTZCO0FBQzlCO0FBQ0Y7QUFDRixDQVJEO0FBVUE7Ozs7OztBQUtBLElBQU1BLDZCQUE2QixHQUFHLFNBQWhDQSw2QkFBZ0MsR0FBTTtBQUMxQyxNQUFNa0MsbUJBQW1CLEdBQUcxQyxRQUFRLENBQUMyQyxjQUFULENBQXdCLHNCQUF4QixDQUE1QjtBQUNBLE1BQU1DLDZCQUE2QixHQUFHNUMsUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixpQ0FBeEIsQ0FBdEM7O0FBQ0EsTUFBSTlDLGlCQUFKLEVBQXVCO0FBQUU7QUFDdkI2QyxJQUFBQSxtQkFBbUIsQ0FBQ0csWUFBcEIsQ0FBaUMsYUFBakMsRUFBZ0QsTUFBaEQ7QUFDQUQsSUFBQUEsNkJBQTZCLENBQUNDLFlBQTlCLENBQTJDLGFBQTNDLEVBQTBELE9BQTFEO0FBQ0QsR0FIRCxNQUdPO0FBQUU7QUFDUEgsSUFBQUEsbUJBQW1CLENBQUNHLFlBQXBCLENBQWlDLGFBQWpDLEVBQWdELE9BQWhEO0FBQ0FELElBQUFBLDZCQUE2QixDQUFDQyxZQUE5QixDQUEyQyxhQUEzQyxFQUEwRCxNQUExRDtBQUNEO0FBQ0YsQ0FWRDtBQVlBOzs7OztBQUdBLElBQU16QixzQkFBc0IsR0FBRyxTQUF6QkEsc0JBQXlCLENBQUMwQixRQUFELEVBQWM7QUFDM0MsTUFBSXZCLElBQUksQ0FBQzlCLFVBQVQsRUFBcUI7QUFBRTtBQUNyQnFELElBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU92QixJQUFJLENBQUM5QixVQUFaLENBQVI7QUFDQTtBQUNEOztBQUNELE1BQU0yQyxFQUFFLEdBQUdXLFdBQVcsQ0FBQyxJQUFELENBQXRCOztBQUNBLE1BQUksQ0FBQ1gsRUFBTCxFQUFTO0FBQUU7QUFDVGxCLElBQUFBLEtBQUssR0FBRyx5QkFBUjtBQUNBNEIsSUFBQUEsUUFBUSxDQUFDNUIsS0FBRCxFQUFRLElBQVIsQ0FBUjtBQUNELEdBSEQsTUFHTztBQUNMcUIsSUFBQUEsUUFBUSxDQUFDUyxtQkFBVCxDQUE2QlosRUFBN0IsRUFBaUMsVUFBQ2xCLEtBQUQsRUFBUXpCLFVBQVIsRUFBdUI7QUFDdEQ4QixNQUFBQSxJQUFJLENBQUM5QixVQUFMLEdBQWtCQSxVQUFsQjs7QUFDQSxVQUFJLENBQUNBLFVBQUwsRUFBaUI7QUFDZjZCLFFBQUFBLE9BQU8sQ0FBQ0osS0FBUixDQUFjQSxLQUFkO0FBQ0E7QUFDRDs7QUFDRCtCLE1BQUFBLGtCQUFrQjtBQUNsQkgsTUFBQUEsUUFBUSxDQUFDLElBQUQsRUFBT3JELFVBQVAsQ0FBUjtBQUNELEtBUkQ7QUFTRDtBQUNGLENBcEJEO0FBc0JBOzs7OztBQUdBLElBQU13RCxrQkFBa0IsR0FBRyxTQUFyQkEsa0JBQXFCLEdBQWtDO0FBQUEsTUFBakN4RCxVQUFpQyx1RUFBcEI4QixJQUFJLENBQUM5QixVQUFlO0FBQzNELE1BQU15RCxJQUFJLEdBQUdsRCxRQUFRLENBQUMyQyxjQUFULENBQXdCLGlCQUF4QixDQUFiO0FBQ0FPLEVBQUFBLElBQUksQ0FBQ0MsU0FBTCxHQUFpQjFELFVBQVUsQ0FBQ3lELElBQTVCO0FBRUEsTUFBTUUsT0FBTyxHQUFHcEQsUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixvQkFBeEIsQ0FBaEI7QUFDQVMsRUFBQUEsT0FBTyxDQUFDRCxTQUFSLElBQXFCMUQsVUFBVSxDQUFDMkQsT0FBaEM7QUFFQSxNQUFNQyxPQUFPLEdBQUdyRCxRQUFRLENBQUMyQyxjQUFULENBQXdCLG9CQUF4QixDQUFoQjtBQUVBLE1BQU1XLFdBQVcsR0FBR3RELFFBQVEsQ0FBQ3VELGFBQVQsQ0FBdUIsUUFBdkIsQ0FBcEI7QUFDQUQsRUFBQUEsV0FBVyxDQUFDRSxLQUFaLEdBQW9CLG9CQUFwQjtBQUNBRixFQUFBQSxXQUFXLENBQUNHLE1BQVosR0FBcUJsQixRQUFRLENBQUNtQixxQkFBVCxDQUErQmpFLFVBQS9CLEVBQTJDO0FBQUVrRSxJQUFBQSxJQUFJLEVBQUUsT0FBUjtBQUFpQkMsSUFBQUEsSUFBSSxFQUFFO0FBQXZCLEdBQTNDLENBQXJCO0FBQ0FOLEVBQUFBLFdBQVcsQ0FBQ3ZDLElBQVosR0FBbUIsWUFBbkI7QUFDQXNDLEVBQUFBLE9BQU8sQ0FBQ1EsV0FBUixDQUFvQlAsV0FBcEI7QUFFQSxNQUFNUSxZQUFZLEdBQUc5RCxRQUFRLENBQUN1RCxhQUFULENBQXVCLFFBQXZCLENBQXJCO0FBQ0FPLEVBQUFBLFlBQVksQ0FBQ04sS0FBYixHQUFxQixvQkFBckI7QUFDQU0sRUFBQUEsWUFBWSxDQUFDTCxNQUFiLEdBQXNCbEIsUUFBUSxDQUFDbUIscUJBQVQsQ0FBK0JqRSxVQUEvQixFQUEyQztBQUFFa0UsSUFBQUEsSUFBSSxFQUFFO0FBQVIsR0FBM0MsQ0FBdEI7QUFDQUcsRUFBQUEsWUFBWSxDQUFDL0MsSUFBYixHQUFvQixZQUFwQjtBQUNBc0MsRUFBQUEsT0FBTyxDQUFDUSxXQUFSLENBQW9CQyxZQUFwQjtBQUVBLE1BQU1DLFdBQVcsR0FBRy9ELFFBQVEsQ0FBQ3VELGFBQVQsQ0FBdUIsUUFBdkIsQ0FBcEI7QUFDQVEsRUFBQUEsV0FBVyxDQUFDTixNQUFaLEdBQXFCbEIsUUFBUSxDQUFDbUIscUJBQVQsQ0FBK0JqRSxVQUEvQixFQUEyQztBQUFFa0UsSUFBQUEsSUFBSSxFQUFFO0FBQVIsR0FBM0MsQ0FBckI7QUFDQUksRUFBQUEsV0FBVyxDQUFDaEQsSUFBWixHQUFtQixZQUFuQjtBQUNBc0MsRUFBQUEsT0FBTyxDQUFDUSxXQUFSLENBQW9CRSxXQUFwQjtBQUVBLE1BQU1DLEtBQUssR0FBR2hFLFFBQVEsQ0FBQ3VELGFBQVQsQ0FBdUIsS0FBdkIsQ0FBZDtBQUNBUyxFQUFBQSxLQUFLLENBQUNDLFNBQU4sR0FBa0IsZ0JBQWxCLENBM0IyRCxDQTRCM0Q7O0FBQ0FELEVBQUFBLEtBQUssQ0FBQ0UsR0FBTixHQUFZM0IsUUFBUSxDQUFDbUIscUJBQVQsQ0FBK0JqRSxVQUEvQixDQUFaO0FBQ0F1RSxFQUFBQSxLQUFLLENBQUNHLEdBQU4sR0FBWTFFLFVBQVUsQ0FBQzBFLEdBQXZCO0FBQ0FkLEVBQUFBLE9BQU8sQ0FBQ1EsV0FBUixDQUFvQkcsS0FBcEI7QUFFQSxNQUFNSSx5QkFBeUIsR0FBR3BFLFFBQVEsQ0FBQzJDLGNBQVQsQ0FBd0IsMkJBQXhCLENBQWxDO0FBQ0F5QixFQUFBQSx5QkFBeUIsQ0FBQ3ZCLFlBQTFCLENBQXVDLFlBQXZDLEVBQXFEcEQsVUFBVSxDQUFDMEUsR0FBaEU7QUFFQSxNQUFNRSxPQUFPLEdBQUdyRSxRQUFRLENBQUMyQyxjQUFULENBQXdCLG9CQUF4QixDQUFoQjtBQUNBMEIsRUFBQUEsT0FBTyxDQUFDbEIsU0FBUixzQkFBZ0MxRCxVQUFVLENBQUM2RSxZQUEzQztBQUVBLE1BQU1DLDJCQUEyQixHQUFHdkUsUUFBUSxDQUFDMkMsY0FBVCxDQUF3QiwrQkFBeEIsQ0FBcEM7QUFDQTRCLEVBQUFBLDJCQUEyQixDQUFDcEIsU0FBNUIsc0JBQW9EMUQsVUFBVSxDQUFDNkUsWUFBL0Q7QUFFQSxNQUFNRSxlQUFlLEdBQUd4RSxRQUFRLENBQUMyQyxjQUFULENBQXdCLG1CQUF4QixDQUF4QjtBQUNBNkIsRUFBQUEsZUFBZSxDQUFDM0IsWUFBaEIsQ0FBNkIsWUFBN0IsNkJBQStEcEQsVUFBVSxDQUFDeUQsSUFBMUU7QUFDQXNCLEVBQUFBLGVBQWUsQ0FBQ0MsZUFBaEIsQ0FBZ0MsVUFBaEM7QUFFQSxNQUFNQyx1QkFBdUIsR0FBRzFFLFFBQVEsQ0FBQzJDLGNBQVQsQ0FBd0IsNEJBQXhCLENBQWhDO0FBQ0ErQixFQUFBQSx1QkFBdUIsQ0FBQ3ZCLFNBQXhCLDRCQUFzRDFELFVBQVUsQ0FBQ3lELElBQWpFLEVBL0MyRCxDQWlEM0Q7O0FBQ0EsTUFBSXpELFVBQVUsQ0FBQ2tGLGVBQWYsRUFBZ0M7QUFDOUJDLElBQUFBLHVCQUF1QjtBQUN4Qjs7QUFFRCxNQUFJQyxNQUFNLENBQUNDLGNBQVAsQ0FBc0JDLElBQXRCLENBQTJCdEYsVUFBM0IsRUFBdUMsYUFBdkMsQ0FBSixFQUEyRDtBQUN6RHVGLElBQUFBLHVCQUF1QjtBQUN4QjtBQUNGLENBekREO0FBMkRBOzs7OztBQUdBLElBQU1KLHVCQUF1QixHQUFHLFNBQTFCQSx1QkFBMEIsR0FBc0Q7QUFBQSxNQUFyREssY0FBcUQsdUVBQXBDMUQsSUFBSSxDQUFDOUIsVUFBTCxDQUFnQmtGLGVBQW9CO0FBQ3BGLE1BQU1PLEtBQUssR0FBR2xGLFFBQVEsQ0FBQzJDLGNBQVQsQ0FBd0Isa0JBQXhCLENBQWQ7O0FBQ0EsT0FBSyxJQUFNd0MsR0FBWCxJQUFrQkYsY0FBbEIsRUFBa0M7QUFDaEMsUUFBSUosTUFBTSxDQUFDTyxTQUFQLENBQWlCTixjQUFqQixDQUFnQ0MsSUFBaEMsQ0FBcUNFLGNBQXJDLEVBQXFERSxHQUFyRCxDQUFKLEVBQStEO0FBQzdELFVBQU1FLEdBQUcsR0FBR3JGLFFBQVEsQ0FBQ3VELGFBQVQsQ0FBdUIsSUFBdkIsQ0FBWjtBQUVBLFVBQU0rQixHQUFHLEdBQUd0RixRQUFRLENBQUN1RCxhQUFULENBQXVCLElBQXZCLENBQVo7QUFDQStCLE1BQUFBLEdBQUcsQ0FBQ25DLFNBQUosR0FBZ0JnQyxHQUFoQjtBQUNBRSxNQUFBQSxHQUFHLENBQUN4QixXQUFKLENBQWdCeUIsR0FBaEI7QUFFQSxVQUFNQyxJQUFJLEdBQUd2RixRQUFRLENBQUN1RCxhQUFULENBQXVCLElBQXZCLENBQWI7QUFDQWdDLE1BQUFBLElBQUksQ0FBQ3BDLFNBQUwsR0FBaUI4QixjQUFjLENBQUNFLEdBQUQsQ0FBL0I7QUFDQUUsTUFBQUEsR0FBRyxDQUFDeEIsV0FBSixDQUFnQjBCLElBQWhCO0FBRUFMLE1BQUFBLEtBQUssQ0FBQ3JCLFdBQU4sQ0FBa0J3QixHQUFsQjtBQUNEO0FBQ0Y7QUFDRixDQWpCRDs7QUFtQkEsSUFBTUcseUJBQXlCLEdBQUcsU0FBNUJBLHlCQUE0QixDQUFDQyxNQUFELEVBQVk7QUFDNUMsTUFBSUMsSUFBSSxHQUFHRCxNQUFNLENBQUNFLGFBQVAsQ0FBcUIsR0FBckIsQ0FBWDtBQUNBLE1BQUlDLElBQUksR0FBR0gsTUFBTSxDQUFDRSxhQUFQLENBQXFCLE1BQXJCLENBQVg7QUFDQUMsRUFBQUEsSUFBSSxDQUFDekMsU0FBTCxHQUFpQixnQ0FBakI7QUFDQXVDLEVBQUFBLElBQUksQ0FBQ0csU0FBTCxDQUFlQyxHQUFmLENBQW1CLEtBQW5CLEVBQTBCLFFBQTFCO0FBQ0FKLEVBQUFBLElBQUksQ0FBQ0csU0FBTCxDQUFlRSxNQUFmLENBQXNCLEtBQXRCLEVBQTZCLFVBQTdCO0FBQ0FMLEVBQUFBLElBQUksQ0FBQzdDLFlBQUwsQ0FBa0IsWUFBbEIsRUFBZ0MsNkNBQWhDO0FBQ0QsQ0FQRDs7QUFTQSxJQUFNbUQsMkJBQTJCLEdBQUcsU0FBOUJBLDJCQUE4QixDQUFDUCxNQUFELEVBQVk7QUFDOUMsTUFBSUMsSUFBSSxHQUFHRCxNQUFNLENBQUNFLGFBQVAsQ0FBcUIsR0FBckIsQ0FBWDtBQUNBLE1BQUlDLElBQUksR0FBR0gsTUFBTSxDQUFDRSxhQUFQLENBQXFCLE1BQXJCLENBQVg7QUFDQUMsRUFBQUEsSUFBSSxDQUFDekMsU0FBTCxHQUFpQiw4QkFBakI7QUFDQXVDLEVBQUFBLElBQUksQ0FBQ0csU0FBTCxDQUFlQyxHQUFmLENBQW1CLEtBQW5CLEVBQTBCLFVBQTFCO0FBQ0FKLEVBQUFBLElBQUksQ0FBQ0csU0FBTCxDQUFlRSxNQUFmLENBQXNCLEtBQXRCLEVBQTZCLFFBQTdCO0FBQ0FMLEVBQUFBLElBQUksQ0FBQzdDLFlBQUwsQ0FBa0IsWUFBbEIsRUFBZ0MsaURBQWhDO0FBQ0QsQ0FQRDtBQVNBOzs7OztBQUdBLElBQU1tQyx1QkFBdUIsR0FBRyxTQUExQkEsdUJBQTBCLEdBQStDO0FBQUEsTUFBOUNpQixXQUE4Qyx1RUFBaEMxRSxJQUFJLENBQUM5QixVQUFMLENBQWdCeUcsV0FBZ0I7QUFDN0UsTUFBTUMsZUFBZSxHQUFHbkcsUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixtQkFBeEIsQ0FBeEI7O0FBQ0EsTUFBSXlELGVBQWUsQ0FBQ0gsV0FBRCxDQUFuQixFQUFrQztBQUNoQ1QsSUFBQUEseUJBQXlCLENBQUNXLGVBQUQsQ0FBekI7QUFDRCxHQUZELE1BRU87QUFDTEgsSUFBQUEsMkJBQTJCLENBQUNHLGVBQUQsQ0FBM0I7QUFDRDtBQUVGLENBUkQ7QUFVQTs7Ozs7QUFHQSxJQUFNL0YsWUFBWSxHQUFHLFNBQWZBLFlBQWUsR0FBTTtBQUN6QixNQUFNZ0MsRUFBRSxHQUFHVyxXQUFXLENBQUMsSUFBRCxDQUF0Qjs7QUFDQSxNQUFJLENBQUNYLEVBQUwsRUFBUztBQUFFO0FBQ1RkLElBQUFBLE9BQU8sQ0FBQytFLEdBQVIsQ0FBWSx5QkFBWjtBQUNELEdBRkQsTUFFTztBQUNMOUQsSUFBQUEsUUFBUSxDQUFDK0QsMEJBQVQsQ0FBb0NsRSxFQUFwQyxFQUF3QyxVQUFDbEIsS0FBRCxFQUFReEIsT0FBUixFQUFvQjtBQUMxRDZCLE1BQUFBLElBQUksQ0FBQzdCLE9BQUwsR0FBZUEsT0FBZjs7QUFDQSxVQUFJLENBQUNBLE9BQUwsRUFBYztBQUNaNEIsUUFBQUEsT0FBTyxDQUFDSixLQUFSLENBQWNBLEtBQWQ7QUFDQTtBQUNEOztBQUNEcUYsTUFBQUEsZUFBZTtBQUNmaEUsTUFBQUEsUUFBUSxDQUFDaUUsZ0JBQVQsQ0FBMEJwRSxFQUExQixFQUE4QixVQUFDbEIsS0FBRCxFQUFRdkIsYUFBUixFQUEwQjtBQUN0RCxZQUFJdUIsS0FBSixFQUFXO0FBQ1RJLFVBQUFBLE9BQU8sQ0FBQytFLEdBQVIsQ0FBWW5GLEtBQVo7QUFDQTtBQUNELFNBSEQsTUFHTztBQUNMSyxVQUFBQSxJQUFJLENBQUM1QixhQUFMLEdBQXFCQSxhQUFyQjtBQUNBOEcsVUFBQUEsc0JBQXNCO0FBQ3ZCO0FBQ0YsT0FSRDtBQVNELEtBaEJEO0FBaUJEO0FBQ0YsQ0F2QkQ7QUF5QkE7Ozs7O0FBR0EsSUFBTUYsZUFBZSxHQUFHLFNBQWxCQSxlQUFrQixHQUE0QjtBQUFBLE1BQTNCN0csT0FBMkIsdUVBQWpCNkIsSUFBSSxDQUFDN0IsT0FBWTs7QUFDbEQsTUFBSSxDQUFDQSxPQUFELElBQVlBLE9BQU8sQ0FBQ2dILE1BQVIsS0FBbUIsQ0FBbkMsRUFBc0M7QUFDcEMsUUFBTUMsU0FBUyxHQUFHM0csUUFBUSxDQUFDdUQsYUFBVCxDQUF1QixHQUF2QixDQUFsQjtBQUNBb0QsSUFBQUEsU0FBUyxDQUFDeEQsU0FBVixHQUFzQixpQkFBdEI7QUFDQXlELElBQUFBLFNBQVMsQ0FBQy9DLFdBQVYsQ0FBc0I4QyxTQUF0QjtBQUNBO0FBQ0Q7O0FBQ0QsTUFBTUUsRUFBRSxHQUFHN0csUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixjQUF4QixDQUFYO0FBQ0FqRCxFQUFBQSxPQUFPLENBQUNvSCxPQUFSLENBQWdCLFVBQUM3RixNQUFELEVBQVk7QUFDMUI0RixJQUFBQSxFQUFFLENBQUNFLFlBQUgsQ0FBZ0JDLGdCQUFnQixDQUFDL0YsTUFBRCxDQUFoQyxFQUEwQzRGLEVBQUUsQ0FBQ0ksVUFBN0M7QUFDRCxHQUZEO0FBR0QsQ0FYRDs7QUFhQSxJQUFNUixzQkFBc0IsR0FBRyxTQUF6QkEsc0JBQXlCLEdBQXdDO0FBQUEsTUFBdkM5RyxhQUF1Qyx1RUFBdkI0QixJQUFJLENBQUM1QixhQUFrQjtBQUNyRSxNQUFJLENBQUNBLGFBQUQsSUFBa0JBLGFBQWEsQ0FBQytHLE1BQWQsS0FBeUIsQ0FBL0MsRUFBa0Q7QUFFbEQsTUFBTUcsRUFBRSxHQUFHN0csUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixjQUF4QixDQUFYO0FBQ0FoRCxFQUFBQSxhQUFhLENBQUNtSCxPQUFkLENBQXNCLFVBQUNJLFlBQUQsRUFBa0I7QUFBQSxRQUM5QkMsVUFEOEIsR0FDSkQsWUFESSxDQUM5QkMsVUFEOEI7QUFBQSxRQUNmbEcsTUFEZSw0QkFDSmlHLFlBREk7O0FBRXRDTCxJQUFBQSxFQUFFLENBQUNFLFlBQUgsQ0FBZ0JDLGdCQUFnQixDQUFDL0YsTUFBRCxFQUFTLElBQVQsRUFBZWtHLFVBQWYsQ0FBaEMsRUFBNEROLEVBQUUsQ0FBQ0ksVUFBL0Q7QUFDRCxHQUhEO0FBSUQsQ0FSRDtBQVVBOzs7OztBQUdBLElBQU1ELGdCQUFnQixHQUFHLFNBQW5CQSxnQkFBbUIsQ0FBQy9GLE1BQUQsRUFBU21HLE9BQVQsRUFBa0JwRyxTQUFsQixFQUFnQztBQUN2RCxNQUFNcUcsT0FBTyxHQUFHckgsUUFBUSxDQUFDdUQsYUFBVCxDQUF1QixTQUF2QixDQUFoQjtBQUNBOEQsRUFBQUEsT0FBTyxDQUFDcEQsU0FBUixHQUFvQixRQUFwQjtBQUVBLE1BQU1xRCxVQUFVLEdBQUd0SCxRQUFRLENBQUN1RCxhQUFULENBQXVCLE1BQXZCLENBQW5CO0FBQ0ErRCxFQUFBQSxVQUFVLENBQUNyRCxTQUFYLEdBQXVCLGVBQXZCO0FBRUEsTUFBTWYsSUFBSSxHQUFHbEQsUUFBUSxDQUFDdUQsYUFBVCxDQUF1QixHQUF2QixDQUFiO0FBQ0FMLEVBQUFBLElBQUksQ0FBQ0MsU0FBTCxHQUFpQmxDLE1BQU0sQ0FBQ2lDLElBQXhCO0FBQ0FBLEVBQUFBLElBQUksQ0FBQ2UsU0FBTCxHQUFpQixhQUFqQjtBQUNBcUQsRUFBQUEsVUFBVSxDQUFDekQsV0FBWCxDQUF1QlgsSUFBdkI7QUFFQSxNQUFNcUUsSUFBSSxHQUFHdkgsUUFBUSxDQUFDdUQsYUFBVCxDQUF1QixHQUF2QixDQUFiOztBQUVBLE1BQUk2RCxPQUFKLEVBQWE7QUFDWCxRQUFNMUIsSUFBSSxHQUFHMUYsUUFBUSxDQUFDdUQsYUFBVCxDQUF1QixHQUF2QixDQUFiO0FBQ0FtQyxJQUFBQSxJQUFJLENBQUNHLFNBQUwsQ0FBZUMsR0FBZixDQUFtQixLQUFuQixFQUEwQixVQUExQjtBQUNBLFFBQU0wQixXQUFXLEdBQUd4SCxRQUFRLENBQUN1RCxhQUFULENBQXVCLE1BQXZCLENBQXBCO0FBQ0FpRSxJQUFBQSxXQUFXLENBQUNyRSxTQUFaLEdBQXdCLFNBQXhCO0FBQ0FvRSxJQUFBQSxJQUFJLENBQUMxRCxXQUFMLENBQWlCNkIsSUFBakI7QUFDQTZCLElBQUFBLElBQUksQ0FBQzFELFdBQUwsQ0FBaUIyRCxXQUFqQjtBQUNELEdBUEQsTUFPTztBQUNMLFFBQU1DLFFBQVEsR0FBR0MsVUFBVSxDQUFDLElBQUlDLElBQUosQ0FBUzFHLE1BQU0sQ0FBQzJHLFNBQWhCLENBQUQsQ0FBM0I7QUFDQUwsSUFBQUEsSUFBSSxDQUFDcEUsU0FBTCxHQUFpQnNFLFFBQWpCO0FBQ0Q7O0FBRURGLEVBQUFBLElBQUksQ0FBQ3RELFNBQUwsR0FBaUIsYUFBakI7QUFDQXFELEVBQUFBLFVBQVUsQ0FBQ3pELFdBQVgsQ0FBdUIwRCxJQUF2QjtBQUNBRixFQUFBQSxPQUFPLENBQUN4RCxXQUFSLENBQW9CeUQsVUFBcEI7QUFFQSxNQUFNTyxXQUFXLEdBQUc3SCxRQUFRLENBQUN1RCxhQUFULENBQXVCLE1BQXZCLENBQXBCO0FBQ0FzRSxFQUFBQSxXQUFXLENBQUM1RCxTQUFaLEdBQXdCLGdCQUF4QjtBQUVBLE1BQU02RCxNQUFNLEdBQUc5SCxRQUFRLENBQUN1RCxhQUFULENBQXVCLEdBQXZCLENBQWY7QUFDQXVFLEVBQUFBLE1BQU0sQ0FBQzNFLFNBQVAscUJBQThCbEMsTUFBTSxDQUFDNkcsTUFBckM7QUFDQUEsRUFBQUEsTUFBTSxDQUFDN0QsU0FBUCxHQUFtQixlQUFuQjtBQUNBNEQsRUFBQUEsV0FBVyxDQUFDaEUsV0FBWixDQUF3QmlFLE1BQXhCO0FBRUEsTUFBTUMsUUFBUSxHQUFHL0gsUUFBUSxDQUFDdUQsYUFBVCxDQUF1QixHQUF2QixDQUFqQjtBQUNBd0UsRUFBQUEsUUFBUSxDQUFDNUUsU0FBVCxHQUFxQmxDLE1BQU0sQ0FBQzhHLFFBQTVCO0FBQ0FGLEVBQUFBLFdBQVcsQ0FBQ2hFLFdBQVosQ0FBd0JrRSxRQUF4QjtBQUNBVixFQUFBQSxPQUFPLENBQUN4RCxXQUFSLENBQW9CZ0UsV0FBcEI7O0FBRUEsTUFBSVQsT0FBSixFQUFhO0FBQ1hDLElBQUFBLE9BQU8sQ0FBQ3hFLFlBQVIsQ0FBcUIsU0FBckIsRUFBZ0M3QixTQUFoQztBQUNBcUcsSUFBQUEsT0FBTyxDQUFDeEUsWUFBUixDQUFxQixXQUFyQixFQUFrQyxNQUFsQztBQUNBd0UsSUFBQUEsT0FBTyxDQUFDeEIsU0FBUixDQUFrQkMsR0FBbEIsQ0FBc0IsU0FBdEI7QUFDRDs7QUFFRCxTQUFPdUIsT0FBUDtBQUNELENBbEREOztBQW9EQSxJQUFNbEcsZ0JBQWdCLEdBQUcsU0FBbkJBLGdCQUFtQixDQUFDRCxLQUFELEVBQVFGLFNBQVIsRUFBbUJDLE1BQW5CLEVBQThCO0FBQ3JELE1BQU0rRyxhQUFhLEdBQUdoSSxRQUFRLENBQUMyRixhQUFULHNCQUFvQzNFLFNBQXBDLFNBQXRCOztBQUNBLE1BQUlFLEtBQUosRUFBVztBQUNULFFBQUk4RyxhQUFKLEVBQW1CO0FBQUU7QUFDbkJBLE1BQUFBLGFBQWEsQ0FBQ25DLFNBQWQsQ0FBd0JFLE1BQXhCLENBQStCLFNBQS9CO0FBQ0EsVUFBTXdCLElBQUksR0FBR1MsYUFBYSxDQUFDckMsYUFBZCxDQUE0QixjQUE1QixDQUFiO0FBQ0E0QixNQUFBQSxJQUFJLENBQUNwRSxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsVUFBTXVDLElBQUksR0FBRzFGLFFBQVEsQ0FBQ3VELGFBQVQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBbUMsTUFBQUEsSUFBSSxDQUFDRyxTQUFMLENBQWVDLEdBQWYsQ0FBbUIsS0FBbkIsRUFBMEIseUJBQTFCO0FBQ0EsVUFBTW1DLFNBQVMsR0FBR2pJLFFBQVEsQ0FBQ3VELGFBQVQsQ0FBdUIsTUFBdkIsQ0FBbEI7QUFDQTBFLE1BQUFBLFNBQVMsQ0FBQzlFLFNBQVYsR0FBc0IsZ0JBQXRCO0FBQ0FvRSxNQUFBQSxJQUFJLENBQUMxRCxXQUFMLENBQWlCNkIsSUFBakI7QUFDQTZCLE1BQUFBLElBQUksQ0FBQzFELFdBQUwsQ0FBaUJvRSxTQUFqQjtBQUNBVixNQUFBQSxJQUFJLENBQUMxQixTQUFMLENBQWVDLEdBQWYsQ0FBbUIsT0FBbkI7QUFDRDtBQUNGLEdBYkQsTUFhTztBQUNMLFFBQU1lLEVBQUUsR0FBRzdHLFFBQVEsQ0FBQzJDLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBWDs7QUFDQSxRQUFJa0UsRUFBRSxJQUFJdEYsSUFBSSxDQUFDOUIsVUFBZixFQUEyQjtBQUFFO0FBQzNCLFVBQUl1SSxhQUFKLEVBQW1CO0FBQ2pCQSxRQUFBQSxhQUFhLENBQUNuQyxTQUFkLENBQXdCRSxNQUF4QixDQUErQixTQUEvQjs7QUFDQSxZQUFNd0IsS0FBSSxHQUFHUyxhQUFhLENBQUNyQyxhQUFkLENBQTRCLGNBQTVCLENBQWI7O0FBQ0EsWUFBTThCLFFBQVEsR0FBR0MsVUFBVSxDQUFDLElBQUlDLElBQUosQ0FBUzFHLE1BQU0sQ0FBQzJHLFNBQWhCLENBQUQsQ0FBM0I7QUFDQUwsUUFBQUEsS0FBSSxDQUFDcEUsU0FBTCxHQUFpQnNFLFFBQWpCO0FBQ0QsT0FMRCxNQUtPO0FBQ0xULFFBQUFBLGdCQUFnQixDQUFDL0YsTUFBRCxFQUFTLEtBQVQsQ0FBaEI7QUFDRDtBQUNGO0FBQ0Y7QUFDRixDQTVCRDtBQThCQTs7Ozs7QUFHQSxJQUFNcUIsY0FBYyxHQUFHLFNBQWpCQSxjQUFpQixHQUFrQztBQUFBLE1BQWpDN0MsVUFBaUMsdUVBQXBCOEIsSUFBSSxDQUFDOUIsVUFBZTtBQUN2RCxNQUFNeUksVUFBVSxHQUFHbEksUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixZQUF4QixDQUFuQjtBQUNBLE1BQU13RixFQUFFLEdBQUduSSxRQUFRLENBQUN1RCxhQUFULENBQXVCLElBQXZCLENBQVg7QUFDQTRFLEVBQUFBLEVBQUUsQ0FBQ2hGLFNBQUgsR0FBZTFELFVBQVUsQ0FBQ3lELElBQTFCO0FBQ0FnRixFQUFBQSxVQUFVLENBQUNyRSxXQUFYLENBQXVCc0UsRUFBdkI7QUFDRCxDQUxEO0FBT0E7Ozs7O0FBR0EsSUFBTXBGLFdBQVcsR0FBRyxTQUFkQSxXQUFjLENBQUNHLElBQUQsRUFBT2tGLEdBQVAsRUFBZTtBQUNqQ0EsRUFBQUEsR0FBRyxHQUFHQSxHQUFHLElBQUkvSCxNQUFNLENBQUNnSSxRQUFQLENBQWdCQyxJQUE3QjtBQUNBcEYsRUFBQUEsSUFBSSxHQUFHQSxJQUFJLENBQUNxRixPQUFMLENBQWEsU0FBYixFQUF3QixNQUF4QixDQUFQO0FBQ0EsTUFBTUMsS0FBSyxHQUFHLElBQUlDLE1BQUosZUFBa0J2RixJQUFsQix1QkFBZDtBQUdBLE1BQU13RixPQUFPLEdBQUdGLEtBQUssQ0FBQ0csSUFBTixDQUFXUCxHQUFYLENBQWhCO0FBQ0EsTUFBSSxDQUFDTSxPQUFMLEVBQWMsT0FBTyxJQUFQO0FBQ2QsTUFBSSxDQUFDQSxPQUFPLENBQUMsQ0FBRCxDQUFaLEVBQWlCLE9BQU8sRUFBUDtBQUNqQixTQUFPRSxrQkFBa0IsQ0FBQ0YsT0FBTyxDQUFDLENBQUQsQ0FBUCxDQUFXSCxPQUFYLENBQW1CLEtBQW5CLEVBQTBCLEdBQTFCLENBQUQsQ0FBekI7QUFDRCxDQVZEOztBQVlBLElBQU1NLCtCQUErQixHQUFHLFNBQWxDQSwrQkFBa0MsQ0FBQ3BELE1BQUQsRUFBU3FELE9BQVQsRUFBcUI7QUFDM0RyRCxFQUFBQSxNQUFNLENBQUM1QyxZQUFQLENBQW9CLFVBQXBCLEVBQWdDLElBQWhDO0FBQ0E0QyxFQUFBQSxNQUFNLENBQUM1QyxZQUFQLENBQW9CLFdBQXBCLEVBQWlDLE1BQWpDO0FBQ0FpRyxFQUFBQSxPQUFPLENBQUNqRCxTQUFSLENBQWtCQyxHQUFsQixDQUFzQixNQUF0QjtBQUNELENBSkQ7O0FBTUEsSUFBTWlELGtDQUFrQyxHQUFHLFNBQXJDQSxrQ0FBcUMsQ0FBQ3RELE1BQUQsRUFBU3FELE9BQVQsRUFBcUI7QUFDOURyRCxFQUFBQSxNQUFNLENBQUNoQixlQUFQLENBQXVCLFVBQXZCO0FBQ0FnQixFQUFBQSxNQUFNLENBQUM1QyxZQUFQLENBQW9CLFdBQXBCLEVBQWlDLE9BQWpDO0FBQ0FpRyxFQUFBQSxPQUFPLENBQUNqRCxTQUFSLENBQWtCRSxNQUFsQixDQUF5QixNQUF6QjtBQUNELENBSkQ7O0FBTUEsSUFBTWlELDJCQUEyQixHQUFHLFNBQTlCQSwyQkFBOEIsR0FBTTtBQUN4QyxNQUFNL0MsV0FBVyxHQUFHRyxlQUFlLENBQUM3RSxJQUFJLENBQUM5QixVQUFMLENBQWdCeUcsV0FBakIsQ0FBbkM7QUFDQSxNQUFNK0MsY0FBYyxHQUFJLENBQUNoRCxXQUFGLElBQWtCQSxXQUFXLEtBQUssT0FBekQ7QUFDQSxNQUFNaUQsWUFBWSxHQUFHM0gsSUFBSSxDQUFDOUIsVUFBTCxDQUFnQjJDLEVBQXJDO0FBQ0EsTUFBTXFELE1BQU0sR0FBR3pGLFFBQVEsQ0FBQzJDLGNBQVQsQ0FBd0IsbUJBQXhCLENBQWY7QUFDQSxNQUFNbUcsT0FBTyxHQUFHOUksUUFBUSxDQUFDMkMsY0FBVCxDQUF3QixtQkFBeEIsQ0FBaEI7QUFDQSxNQUFJd0csb0JBQUo7O0FBQ0EsTUFBSUYsY0FBSixFQUFvQjtBQUNsQnpELElBQUFBLHlCQUF5QixDQUFDQyxNQUFELENBQXpCO0FBQ0EwRCxJQUFBQSxvQkFBb0IsR0FBR25ELDJCQUF2QjtBQUNELEdBSEQsTUFHTztBQUNMQSxJQUFBQSwyQkFBMkIsQ0FBQ1AsTUFBRCxDQUEzQjtBQUNBMEQsSUFBQUEsb0JBQW9CLEdBQUczRCx5QkFBdkI7QUFDRDs7QUFDRHFELEVBQUFBLCtCQUErQixDQUFDcEQsTUFBRCxFQUFTcUQsT0FBVCxDQUEvQjtBQUNBdkcsRUFBQUEsUUFBUSxDQUFDNkcsNEJBQVQsQ0FBc0NGLFlBQXRDLEVBQW9ERCxjQUFwRCxFQUFvRSxVQUFDL0gsS0FBRCxFQUFRbUksaUJBQVIsRUFBOEI7QUFDaEdOLElBQUFBLGtDQUFrQyxDQUFDdEQsTUFBRCxFQUFTcUQsT0FBVCxDQUFsQzs7QUFDQSxRQUFJLENBQUNPLGlCQUFMLEVBQXdCO0FBQ3RCL0gsTUFBQUEsT0FBTyxDQUFDSixLQUFSLENBQWNBLEtBQWQ7QUFDQWlJLE1BQUFBLG9CQUFvQixDQUFDMUQsTUFBRCxDQUFwQjtBQUNBO0FBQ0Q7O0FBQ0RsRSxJQUFBQSxJQUFJLENBQUM5QixVQUFMLEdBQWtCNEosaUJBQWxCO0FBQ0QsR0FSRDtBQVNELENBeEJEIiwic291cmNlc0NvbnRlbnQiOlsibGV0IHJlc3RhdXJhbnQ7XG5sZXQgcmV2aWV3cztcbmxldCBvdXRib3hSZXZpZXdzO1xubGV0IG5ld01hcDtcbmxldCBtYXRjaGVzTWVkaWFRdWVyeTtcbmNvbnN0IG1lZGlhUXVlcnkgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbmxldCBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBtYXAgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXG4gKi9cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcbiAgaW5pdE1hcCgpO1xuICBmZXRjaFJldmlld3MoKTtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgbWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICB9XG4gIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7IC8vIHNldCBpbml0aWFsIGFyaWEgdmFsdWVzXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICBzZXRJbnRlcnZhbChjbGVhbk1hcGJveFRpbGVzQ2FjaGUsIDUwMDApO1xuXG4gIGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHsgdHlwZSwgcmVxdWVzdElkLCByZXZpZXcsIGVycm9yIH0gPSBldmVudC5kYXRhO1xuICAgICAgaWYgKHR5cGUgPT09ICd1cGRhdGUtcmV2aWV3Jykge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKHRydWUsIHJlcXVlc3RJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTChmYWxzZSwgcmVxdWVzdElkLCByZXZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxufSk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBsZWFmbGV0IG1hcFxuICovXG5jb25zdCBpbml0TWFwID0gKCkgPT4ge1xuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgIGNvbnN0IE1BUEJPWF9BUElfS0VZID0gJ3BrLmV5SjFJam9pWVc1bFpYTmhMWE5oYkdWb0lpd2lZU0k2SW1OcWEyeG1aSFZ3TURGb1lXNHpkbkF3WVdwbE1tNTNiSEVpZlEuVjExZERPdEVuV1N3VHhZLUM4bUpMdyc7XG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgICAgIGNlbnRlcjogW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgICAgem9vbTogMTYsXG4gICAgICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2UsXG4gICAgICB9KTtcbiAgICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XG4gICAgICAgIG1hcGJveFRva2VuOiBNQVBCT1hfQVBJX0tFWSxcbiAgICAgICAgbWF4Wm9vbTogMTgsXG4gICAgICAgIGF0dHJpYnV0aW9uOiAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMsICdcbiAgICAgICAgICArICc8YSBocmVmPVwiaHR0cHM6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzIuMC9cIj5DQy1CWS1TQTwvYT4sICdcbiAgICAgICAgICArICdJbWFnZXJ5IMKpIDxhIGhyZWY9XCJodHRwczovL3d3dy5tYXBib3guY29tL1wiPk1hcGJveDwvYT4nLFxuICAgICAgICBpZDogJ21hcGJveC5zdHJlZXRzJyxcbiAgICAgIH0pLmFkZFRvKG5ld01hcCk7XG4gICAgICBmaWxsQnJlYWRjcnVtYigpO1xuICAgICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubmV3TWFwKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4qIFVwZGF0ZSBhcmlhLWhpZGRlbiB2YWx1ZXMgb2YgdGhlIHZpc2libGUgYW5kIGFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXJzXG4qL1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgY29uc3QgbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgICBpZiAobmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ICE9PSBtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBvbmx5IHVwZGF0ZSBhcmlhIHdoZW4gbGF5b3V0IGNoYW5nZXNcbiAgICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5O1xuICAgICAgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKipcbiogU2V0IGFyaWEtaGlkZGVuIHZhbHVlcyBmb3IgdmlzaWJsZSBhbmQgcmVndWxhciByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiogQWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lciBpcyBvZmYgc2NyZWVuXG4qIEl0IGlzIHJlcXVpcmVkIHRvIG1haW50YWluIHNjcmVlbiByZWFkaW5nIG9yZGVyIHdoZW4gdGhlIGxheW91dCBzaGlmdHNcbiovXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSA9ICgpID0+IHtcbiAgY29uc3QgcmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGlmIChtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBsYXJnZXIgbGF5b3V0LCBzY3JlZW4gcmVhZGluZyBvcmRlciBvZmZcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgfSBlbHNlIHsgLy8gdXNlIHJlZ3VsYXIgcmVhZGluZyBvcmRlclxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xuICBpZiAoc2VsZi5yZXN0YXVyYW50KSB7IC8vIHJlc3RhdXJhbnQgYWxyZWFkeSBmZXRjaGVkIVxuICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlkID0gZ2V0VXJsUGFyYW0oJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgZXJyb3IgPSAnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnO1xuICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCAoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcbiAgICAgIHNlbGYucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XG4gICAgICBpZiAoIXJlc3RhdXJhbnQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZpbGxSZXN0YXVyYW50SFRNTCgpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlXG4gKi9cbmNvbnN0IGZpbGxSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1uYW1lJyk7XG4gIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuXG4gIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XG4gIGFkZHJlc3MuaW5uZXJIVE1MICs9IHJlc3RhdXJhbnQuYWRkcmVzcztcblxuICBjb25zdCBwaWN0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtcGljdHVyZScpO1xuXG4gIGNvbnN0IHNvdXJjZUxhcmdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZUxhcmdlLm1lZGlhID0gJyhtaW4td2lkdGg6IDgwMHB4KSc7XG4gIHNvdXJjZUxhcmdlLnNyY3NldCA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB7IHNpemU6ICdsYXJnZScsIHdpZGU6IHRydWUgfSk7XG4gIHNvdXJjZUxhcmdlLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTGFyZ2UpO1xuXG4gIGNvbnN0IHNvdXJjZU1lZGl1bSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VNZWRpdW0ubWVkaWEgPSAnKG1pbi13aWR0aDogNjAwcHgpJztcbiAgc291cmNlTWVkaXVtLnNyY3NldCA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB7IHNpemU6ICdtZWRpdW0nIH0pO1xuICBzb3VyY2VNZWRpdW0udHlwZSA9ICdpbWFnZS9qcGVnJztcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChzb3VyY2VNZWRpdW0pO1xuXG4gIGNvbnN0IHNvdXJjZVNtYWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gIHNvdXJjZVNtYWxsLnNyY3NldCA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB7IHNpemU6ICdzbWFsbCcgfSk7XG4gIHNvdXJjZVNtYWxsLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlU21hbGwpO1xuXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XG4gIC8vIHNldCBkZWZhdWx0IHNpemUgaW4gY2FzZSBwaWN0dXJlIGVsZW1lbnQgaXMgbm90IHN1cHBvcnRlZFxuICBpbWFnZS5zcmMgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XG4gIGltYWdlLmFsdCA9IHJlc3RhdXJhbnQuYWx0O1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKGltYWdlKTtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjY2Vzc2libGUtcmVzdGF1cmFudC1pbWcnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCByZXN0YXVyYW50LmFsdCk7XG5cbiAgY29uc3QgY3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgY3Vpc2luZS5pbm5lckhUTUwgPSBgQ3Vpc2luZTogJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gO1xuXG4gIGNvbnN0IGFjY2Vzc2libGVSZXN0YXVyYW50Q3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtY3Vpc2luZScpO1xuICBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhZGRSZXZpZXdCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1idXR0b24nKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGBBZGQgYSByZXZpZXcgZm9yICR7cmVzdGF1cmFudC5uYW1lfWApO1xuICBhZGRSZXZpZXdCdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuXG4gIGNvbnN0IGFkZFJldmlld092ZXJsYXlIZWFkaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctb3ZlcmxheS1oZWFkaW5nJyk7XG4gIGFkZFJldmlld092ZXJsYXlIZWFkaW5nLmlubmVySFRNTCA9IGBBZGQgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gO1xuXG4gIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXG4gIGlmIChyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycykge1xuICAgIGZpbGxSZXN0YXVyYW50SG91cnNIVE1MKCk7XG4gIH1cblxuICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwocmVzdGF1cmFudCwgJ2lzX2Zhdm9yaXRlJykpIHtcbiAgICBmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCgpO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IG9wZXJhdGluZyBob3VycyBIVE1MIHRhYmxlIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGZpbGxSZXN0YXVyYW50SG91cnNIVE1MID0gKG9wZXJhdGluZ0hvdXJzID0gc2VsZi5yZXN0YXVyYW50Lm9wZXJhdGluZ19ob3VycykgPT4ge1xuICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XG4gIGZvciAoY29uc3Qga2V5IGluIG9wZXJhdGluZ0hvdXJzKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcGVyYXRpbmdIb3Vycywga2V5KSkge1xuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblxuICAgICAgY29uc3QgZGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XG4gICAgICByb3cuYXBwZW5kQ2hpbGQoZGF5KTtcblxuICAgICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICB0aW1lLmlubmVySFRNTCA9IG9wZXJhdGluZ0hvdXJzW2tleV07XG4gICAgICByb3cuYXBwZW5kQ2hpbGQodGltZSk7XG5cbiAgICAgIGhvdXJzLmFwcGVuZENoaWxkKHJvdyk7XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKGJ1dHRvbikgPT4ge1xuICB2YXIgaWNvbiA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdpJyk7XG4gIHZhciB0ZXh0ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcbiAgdGV4dC5pbm5lckhUTUwgPSAnVW5tYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmFyJywgJ3VubWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbmNvbnN0IHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgdmFyIGljb24gPSBidXR0b24ucXVlcnlTZWxlY3RvcignaScpO1xuICB2YXIgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ01hcmsgcmVzdGF1cmFudCBhcyBmYXZvdXJpdGUnO1xuICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcycsICdtYXJrZWQnKTtcbiAgaWNvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnUmVzdGF1cmFudCBpcyBub3QgY3VycmVudGx5IG1hcmtlZCBhcyBmYXZvdXJpdGUnKTtcbn07XG5cbi8qKlxuICogU2V0IHN0YXRlIGFuZCB0ZXh0IGZvciBtYXJrIGFzIGZhdm91cml0ZSBidXR0b24uXG4gKi9cbmNvbnN0IGZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MID0gKGlzRmF2b3VyaXRlID0gc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKSA9PiB7XG4gIGNvbnN0IGZhdm91cml0ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBpZiAoc3RyaW5nVG9Cb29sZWFuKGlzRmF2b3VyaXRlKSkge1xuICAgIG1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfSBlbHNlIHtcbiAgICB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUoZmF2b3VyaXRlQnV0dG9uKTtcbiAgfVxuXG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZmV0Y2hSZXZpZXdzID0gKCkgPT4ge1xuICBjb25zdCBpZCA9IGdldFVybFBhcmFtKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGNvbnNvbGUubG9nKCdObyByZXN0YXVyYW50IGlkIGluIFVSTCcpO1xuICB9IGVsc2Uge1xuICAgIERCSGVscGVyLmZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkKGlkLCAoZXJyb3IsIHJldmlld3MpID0+IHtcbiAgICAgIHNlbGYucmV2aWV3cyA9IHJldmlld3M7XG4gICAgICBpZiAoIXJldmlld3MpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZpbGxSZXZpZXdzSFRNTCgpO1xuICAgICAgREJIZWxwZXIuZ2V0T3V0Ym94UmV2aWV3cyhpZCwgKGVycm9yLCBvdXRib3hSZXZpZXdzKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5vdXRib3hSZXZpZXdzID0gb3V0Ym94UmV2aWV3cztcbiAgICAgICAgICBmaWxsU2VuZGluZ1Jldmlld3NIVE1MKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIGFsbCByZXZpZXdzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmV2aWV3c0hUTUwgPSAocmV2aWV3cyA9IHNlbGYucmV2aWV3cykgPT4ge1xuICBpZiAoIXJldmlld3MgfHwgcmV2aWV3cy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgbm9SZXZpZXdzLmlubmVySFRNTCA9ICdObyByZXZpZXdzIHlldCEnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgcmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpLCB1bC5maXJzdENoaWxkKTtcbiAgfSk7XG59O1xuXG5jb25zdCBmaWxsU2VuZGluZ1Jldmlld3NIVE1MID0gKG91dGJveFJldmlld3MgPSBzZWxmLm91dGJveFJldmlld3MpID0+IHtcbiAgaWYgKCFvdXRib3hSZXZpZXdzIHx8IG91dGJveFJldmlld3MubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIG91dGJveFJldmlld3MuZm9yRWFjaCgob3V0Ym94UmV2aWV3KSA9PiB7XG4gICAgY29uc3QgeyByZXF1ZXN0X2lkLCAuLi5yZXZpZXcgfSA9IG91dGJveFJldmlldztcbiAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcsIHRydWUsIHJlcXVlc3RfaWQpLCB1bC5maXJzdENoaWxkKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBjcmVhdGVSZXZpZXdIVE1MID0gKHJldmlldywgc2VuZGluZywgcmVxdWVzdElkKSA9PiB7XG4gIGNvbnN0IGFydGljbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhcnRpY2xlJyk7XG4gIGFydGljbGUuY2xhc3NOYW1lID0gJ3Jldmlldyc7XG5cbiAgY29uc3QgaGVhZGVyU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgaGVhZGVyU3Bhbi5jbGFzc05hbWUgPSAncmV2aWV3LWhlYWRlcic7XG5cbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSByZXZpZXcubmFtZTtcbiAgbmFtZS5jbGFzc05hbWUgPSAncmV2aWV3LW5hbWUnO1xuICBoZWFkZXJTcGFuLmFwcGVuZENoaWxkKG5hbWUpO1xuXG4gIGNvbnN0IGRhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cbiAgaWYgKHNlbmRpbmcpIHtcbiAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFyJywgJ2ZhLWNsb2NrJyk7XG4gICAgY29uc3QgbG9hZGluZ1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbG9hZGluZ1RleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcnO1xuICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChsb2FkaW5nVGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICBkYXRlLmlubmVySFRNTCA9IGRhdGVUZXh0O1xuICB9XG5cbiAgZGF0ZS5jbGFzc05hbWUgPSAncmV2aWV3LWRhdGUnO1xuICBoZWFkZXJTcGFuLmFwcGVuZENoaWxkKGRhdGUpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGhlYWRlclNwYW4pO1xuXG4gIGNvbnN0IGNvbnRlbnRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBjb250ZW50U3Bhbi5jbGFzc05hbWUgPSAncmV2aWV3LWNvbnRlbnQnO1xuXG4gIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcmF0aW5nLmlubmVySFRNTCA9IGBSYXRpbmc6ICR7cmV2aWV3LnJhdGluZ31gO1xuICByYXRpbmcuY2xhc3NOYW1lID0gJ3Jldmlldy1yYXRpbmcnO1xuICBjb250ZW50U3Bhbi5hcHBlbmRDaGlsZChyYXRpbmcpO1xuXG4gIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKGNvbW1lbnRzKTtcbiAgYXJ0aWNsZS5hcHBlbmRDaGlsZChjb250ZW50U3Bhbik7XG5cbiAgaWYgKHNlbmRpbmcpIHtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnZGF0YS1pZCcsIHJlcXVlc3RJZCk7XG4gICAgYXJ0aWNsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICd0cnVlJyk7XG4gICAgYXJ0aWNsZS5jbGFzc0xpc3QuYWRkKCdzZW5kaW5nJyk7XG4gIH1cblxuICByZXR1cm4gYXJ0aWNsZTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJldmlld0hUTUwgPSAoZXJyb3IsIHJlcXVlc3RJZCwgcmV2aWV3KSA9PiB7XG4gIGNvbnN0IHJldmlld0VsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7cmVxdWVzdElkfVwiXWApO1xuICBpZiAoZXJyb3IpIHtcbiAgICBpZiAocmV2aWV3RWxlbWVudCkgeyAvLyBmb3IgZXJyb3IsIG5vIG5lZWQgdG8gYWRkIHRvIFVJIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgIHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VuZGluZycpO1xuICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICBkYXRlLmlubmVySFRNTCA9ICcnO1xuICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmFzJywgJ2ZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyk7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBlcnJvclRleHQuaW5uZXJIVE1MID0gJ1NlbmRpbmcgZmFpbGVkJztcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICBkYXRlLmFwcGVuZENoaWxkKGVycm9yVGV4dCk7XG4gICAgICBkYXRlLmNsYXNzTGlzdC5hZGQoJ2Vycm9yJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xuICAgIGlmICh1bCAmJiBzZWxmLnJlc3RhdXJhbnQpIHsgLy8gb25seSB1cGRhdGUgaWYgdGhlIHJlc3RhdXJhbnQgaXMgbG9hZGVkXG4gICAgICBpZiAocmV2aWV3RWxlbWVudCkge1xuICAgICAgICByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbmRpbmcnKTtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlldy1kYXRlJyk7XG4gICAgICAgIGNvbnN0IGRhdGVUZXh0ID0gZm9ybWF0RGF0ZShuZXcgRGF0ZShyZXZpZXcudXBkYXRlZEF0KSk7XG4gICAgICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcmVhdGVSZXZpZXdIVE1MKHJldmlldywgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cbmNvbnN0IGZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn07XG5cbi8qKlxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZ2V0VXJsUGFyYW0gPSAobmFtZSwgdXJsKSA9PiB7XG4gIHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKTtcblxuXG4gIGNvbnN0IHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XG4gIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csICcgJykpO1xufTtcblxuY29uc3Qgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59XG5cbmNvbnN0IHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICdmYWxzZScpO1xuICBzcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn1cblxuY29uc3QgdG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKCkgPT4ge1xuICBjb25zdCBpc0Zhdm91cml0ZSA9IHN0cmluZ1RvQm9vbGVhbihzZWxmLnJlc3RhdXJhbnQuaXNfZmF2b3JpdGUpO1xuICBjb25zdCBuZXdJc0Zhdm91cml0ZSA9ICghaXNGYXZvdXJpdGUpICYmIGlzRmF2b3VyaXRlICE9PSAnZmFsc2UnO1xuICBjb25zdCByZXN0YXVyYW50SWQgPSBzZWxmLnJlc3RhdXJhbnQuaWQ7XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zhdm91cml0ZS1zcGlubmVyJyk7XG4gIGxldCBmYWlsZWRVcGRhdGVDYWxsYmFjaztcbiAgaWYgKG5ld0lzRmF2b3VyaXRlKSB7XG4gICAgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICB9IGVsc2Uge1xuICAgIHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgfVxuICBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gIERCSGVscGVyLnNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMocmVzdGF1cmFudElkLCBuZXdJc0Zhdm91cml0ZSwgKGVycm9yLCB1cGRhdGVkUmVzdGF1cmFudCkgPT4ge1xuICAgIHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgICBpZiAoIXVwZGF0ZWRSZXN0YXVyYW50KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrKGJ1dHRvbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYucmVzdGF1cmFudCA9IHVwZGF0ZWRSZXN0YXVyYW50O1xuICB9KTtcbn1cbiJdLCJmaWxlIjoicmVzdGF1cmFudF9pbmZvLmpzIn0=

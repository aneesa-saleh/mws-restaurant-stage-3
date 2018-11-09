"use strict";

var restaurant;
var reviews;
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

  var id = getParameterByName('id');

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
  var id = getParameterByName('id');

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
    });
  }
};
/**
 * Create all reviews HTML and add them to the webpage.
 */


var fillReviewsHTML = function fillReviewsHTML() {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.reviews;
  var container = document.getElementById('reviews-container');

  if (!reviews) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  var ul = document.getElementById('reviews-list');
  reviews.forEach(function (review) {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
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


var getParameterByName = function getParameterByName(name, url) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwicmV2aWV3cyIsIm5ld01hcCIsIm1hdGNoZXNNZWRpYVF1ZXJ5IiwibWVkaWFRdWVyeSIsInByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiaW5pdE1hcCIsImZldGNoUmV2aWV3cyIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwidXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJzZXRJbnRlcnZhbCIsImNsZWFuTWFwYm94VGlsZXNDYWNoZSIsIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJkYXRhIiwidHlwZSIsInJlcXVlc3RJZCIsInJldmlldyIsImVycm9yIiwidXBkYXRlUmV2aWV3SFRNTCIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJNQVBCT1hfQVBJX0tFWSIsImNvbnNvbGUiLCJzZWxmIiwiTCIsIm1hcCIsImNlbnRlciIsImxhdGxuZyIsImxhdCIsImxuZyIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXBib3hUb2tlbiIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImlkIiwiYWRkVG8iLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm5leHRNYXRjaGVzTWVkaWFRdWVyeSIsInJlc3RhdXJhbnRDb250YWluZXIiLCJnZXRFbGVtZW50QnlJZCIsImFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyIiwic2V0QXR0cmlidXRlIiwiY2FsbGJhY2siLCJnZXRQYXJhbWV0ZXJCeU5hbWUiLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwibmFtZSIsImlubmVySFRNTCIsImFkZHJlc3MiLCJwaWN0dXJlIiwic291cmNlTGFyZ2UiLCJjcmVhdGVFbGVtZW50IiwibWVkaWEiLCJzcmNzZXQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJzaXplIiwid2lkZSIsImFwcGVuZENoaWxkIiwic291cmNlTWVkaXVtIiwic291cmNlU21hbGwiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsImFsdCIsImFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2UiLCJjdWlzaW5lIiwiY3Vpc2luZV90eXBlIiwiYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lIiwiYWRkUmV2aWV3QnV0dG9uIiwicmVtb3ZlQXR0cmlidXRlIiwiYWRkUmV2aWV3T3ZlcmxheUhlYWRpbmciLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsIk9iamVjdCIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImZpbGxNYXJrQXNGYXZvdXJpdGVIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInByb3RvdHlwZSIsInJvdyIsImRheSIsInRpbWUiLCJtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiYnV0dG9uIiwiaWNvbiIsInF1ZXJ5U2VsZWN0b3IiLCJ0ZXh0IiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwidW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwiaXNGYXZvdXJpdGUiLCJpc19mYXZvcml0ZSIsImZhdm91cml0ZUJ1dHRvbiIsInN0cmluZ1RvQm9vbGVhbiIsImxvZyIsImZldGNoUmV2aWV3c0J5UmVzdGF1cmFudElkIiwiZmlsbFJldmlld3NIVE1MIiwiY29udGFpbmVyIiwibm9SZXZpZXdzIiwidWwiLCJmb3JFYWNoIiwiY3JlYXRlUmV2aWV3SFRNTCIsInNlbmRpbmciLCJhcnRpY2xlIiwiaGVhZGVyU3BhbiIsImRhdGUiLCJsb2FkaW5nVGV4dCIsImRhdGVUZXh0IiwiZm9ybWF0RGF0ZSIsIkRhdGUiLCJ1cGRhdGVkQXQiLCJjb250ZW50U3BhbiIsInJhdGluZyIsImNvbW1lbnRzIiwicmV2aWV3RWxlbWVudCIsImVycm9yVGV4dCIsImJyZWFkY3J1bWIiLCJsaSIsInVybCIsImxvY2F0aW9uIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSIsInNwaW5uZXIiLCJyZW1vdmVNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlIiwidG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlIiwibmV3SXNGYXZvdXJpdGUiLCJyZXN0YXVyYW50SWQiLCJmYWlsZWRVcGRhdGVDYWxsYmFjayIsInNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMiLCJ1cGRhdGVkUmVzdGF1cmFudCJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJQSxVQUFKO0FBQ0EsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE1BQUo7QUFDQSxJQUFJQyxpQkFBSjtBQUNBLElBQU1DLFVBQVUsR0FBRyxvQkFBbkI7QUFDQSxJQUFJQyx3QkFBSjtBQUVBOzs7O0FBR0FDLFFBQVEsQ0FBQ0MsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQUNDLEtBQUQsRUFBVztBQUN2REMsRUFBQUEsT0FBTztBQUNQQyxFQUFBQSxZQUFZOztBQUNaLE1BQUlDLE1BQU0sQ0FBQ0MsVUFBWCxFQUF1QjtBQUNyQlQsSUFBQUEsaUJBQWlCLEdBQUdRLE1BQU0sQ0FBQ0MsVUFBUCxDQUFrQlIsVUFBbEIsRUFBOEJTLE9BQWxEO0FBQ0Q7O0FBQ0RDLEVBQUFBLDZCQUE2QixHQU4wQixDQU10Qjs7QUFDakNDLEVBQUFBLHFCQUFxQjtBQUNyQkMsRUFBQUEsV0FBVyxDQUFDQyxxQkFBRCxFQUF3QixJQUF4QixDQUFYOztBQUVBLE1BQUlDLFNBQVMsQ0FBQ0MsYUFBZCxFQUE2QjtBQUMzQkQsSUFBQUEsU0FBUyxDQUFDQyxhQUFWLENBQXdCWixnQkFBeEIsQ0FBeUMsU0FBekMsRUFBb0QsVUFBQ0MsS0FBRCxFQUFXO0FBQUEsd0JBQ2xCQSxL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QUdPO0FBQ0xBLElBQUFBLDJCQUEyQixDQUFDUCxNQUFELENBQTNCO0FBQ0FtRCxJQUFBQSxvQkFBb0IsR0FBR3BELHlCQUF2QjtBQUNEOztBQUNEOEMsRUFBQUEsK0JBQStCLENBQUM3QyxNQUFELEVBQVM4QyxPQUFULENBQS9CO0FBQ0FoRyxFQUFBQSxRQUFRLENBQUNzRyw0QkFBVCxDQUFzQ0YsWUFBdEMsRUFBb0RELGNBQXBELEVBQW9FLFVBQUN4SCxLQUFELEVBQVE0SCxpQkFBUixFQUE4QjtBQUNoR04sSUFBQUEsa0NBQWtDLENBQUMvQyxNQUFELEVBQVM4QyxPQUFULENBQWxDOztBQUNBLFFBQUksQ0FBQ08saUJBQUwsRUFBd0I7QUFDdEJ4SCxNQUFBQSxPQUFPLENBQUNKLEtBQVIsQ0FBY0EsS0FBZDtBQUNBMEgsTUFBQUEsb0JBQW9CLENBQUNuRCxNQUFELENBQXBCO0FBQ0E7QUFDRDs7QUFDRGxFLElBQUFBLElBQUksQ0FBQzdCLFVBQUwsR0FBa0JvSixpQkFBbEI7QUFDRCxHQVJEO0FBU0QsQ0F4QkQiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgcmVzdGF1cmFudDtcbmxldCByZXZpZXdzO1xubGV0IG5ld01hcDtcbmxldCBtYXRjaGVzTWVkaWFRdWVyeTtcbmNvbnN0IG1lZGlhUXVlcnkgPSAnKG1pbi13aWR0aDogODAwcHgpJztcbmxldCBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBtYXAgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXG4gKi9cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcbiAgaW5pdE1hcCgpO1xuICBmZXRjaFJldmlld3MoKTtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgbWF0Y2hlc01lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShtZWRpYVF1ZXJ5KS5tYXRjaGVzO1xuICB9XG4gIHVwZGF0ZVJlc3RhdXJhbnRDb250YWluZXJBcmlhKCk7IC8vIHNldCBpbml0aWFsIGFyaWEgdmFsdWVzXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICBzZXRJbnRlcnZhbChjbGVhbk1hcGJveFRpbGVzQ2FjaGUsIDUwMDApO1xuXG4gIGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHsgdHlwZSwgcmVxdWVzdElkLCByZXZpZXcsIGVycm9yIH0gPSBldmVudC5kYXRhO1xuICAgICAgaWYgKHR5cGUgPT09ICd1cGRhdGUtcmV2aWV3Jykge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICB1cGRhdGVSZXZpZXdIVE1MKHRydWUsIHJlcXVlc3RJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlUmV2aWV3SFRNTChmYWxzZSwgcmVxdWVzdElkLCByZXZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxufSk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBsZWFmbGV0IG1hcFxuICovXG5jb25zdCBpbml0TWFwID0gKCkgPT4ge1xuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgIGNvbnN0IE1BUEJPWF9BUElfS0VZID0gJ3BrLmV5SjFJam9pWVc1bFpYTmhMWE5oYkdWb0lpd2lZU0k2SW1OcWEyeG1aSFZ3TURGb1lXNHpkbkF3WVdwbE1tNTNiSEVpZlEuVjExZERPdEVuV1N3VHhZLUM4bUpMdyc7XG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgICAgIGNlbnRlcjogW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgICAgem9vbTogMTYsXG4gICAgICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2UsXG4gICAgICB9KTtcbiAgICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XG4gICAgICAgIG1hcGJveFRva2VuOiBNQVBCT1hfQVBJX0tFWSxcbiAgICAgICAgbWF4Wm9vbTogMTgsXG4gICAgICAgIGF0dHJpYnV0aW9uOiAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMsICdcbiAgICAgICAgICArICc8YSBocmVmPVwiaHR0cHM6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzIuMC9cIj5DQy1CWS1TQTwvYT4sICdcbiAgICAgICAgICArICdJbWFnZXJ5IMKpIDxhIGhyZWY9XCJodHRwczovL3d3dy5tYXBib3guY29tL1wiPk1hcGJveDwvYT4nLFxuICAgICAgICBpZDogJ21hcGJveC5zdHJlZXRzJyxcbiAgICAgIH0pLmFkZFRvKG5ld01hcCk7XG4gICAgICBmaWxsQnJlYWRjcnVtYigpO1xuICAgICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubmV3TWFwKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4qIFVwZGF0ZSBhcmlhLWhpZGRlbiB2YWx1ZXMgb2YgdGhlIHZpc2libGUgYW5kIGFjY2Vzc2libGUgcmVzdGF1cmFudCBjb250YWluZXJzXG4qL1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgY29uc3QgbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWEobWVkaWFRdWVyeSkubWF0Y2hlcztcbiAgICBpZiAobmV4dE1hdGNoZXNNZWRpYVF1ZXJ5ICE9PSBtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBvbmx5IHVwZGF0ZSBhcmlhIHdoZW4gbGF5b3V0IGNoYW5nZXNcbiAgICAgIG1hdGNoZXNNZWRpYVF1ZXJ5ID0gbmV4dE1hdGNoZXNNZWRpYVF1ZXJ5O1xuICAgICAgdXBkYXRlUmVzdGF1cmFudENvbnRhaW5lckFyaWEoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKipcbiogU2V0IGFyaWEtaGlkZGVuIHZhbHVlcyBmb3IgdmlzaWJsZSBhbmQgcmVndWxhciByZXN0YXVyYW50IGNvbnRhaW5lcnNcbiogQWNjZXNzaWJsZSByZXN0YXVyYW50IGNvbnRhaW5lciBpcyBvZmYgc2NyZWVuXG4qIEl0IGlzIHJlcXVpcmVkIHRvIG1haW50YWluIHNjcmVlbiByZWFkaW5nIG9yZGVyIHdoZW4gdGhlIGxheW91dCBzaGlmdHNcbiovXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50Q29udGFpbmVyQXJpYSA9ICgpID0+IHtcbiAgY29uc3QgcmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWNvbnRhaW5lcicpO1xuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtY29udGFpbmVyJyk7XG4gIGlmIChtYXRjaGVzTWVkaWFRdWVyeSkgeyAvLyBsYXJnZXIgbGF5b3V0LCBzY3JlZW4gcmVhZGluZyBvcmRlciBvZmZcbiAgICByZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgfSBlbHNlIHsgLy8gdXNlIHJlZ3VsYXIgcmVhZGluZyBvcmRlclxuICAgIHJlc3RhdXJhbnRDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgIGFjY2Vzc2libGVSZXN0YXVyYW50Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cbiAqL1xuY29uc3QgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xuICBpZiAoc2VsZi5yZXN0YXVyYW50KSB7IC8vIHJlc3RhdXJhbnQgYWxyZWFkeSBmZXRjaGVkIVxuICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlkID0gZ2V0UGFyYW1ldGVyQnlOYW1lKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJztcbiAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgICBzZWxmLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xuICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcblxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xuICBhZGRyZXNzLmlubmVySFRNTCArPSByZXN0YXVyYW50LmFkZHJlc3M7XG5cbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LXBpY3R1cmUnKTtcblxuICBjb25zdCBzb3VyY2VMYXJnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VMYXJnZS5tZWRpYSA9ICcobWluLXdpZHRoOiA4MDBweCknO1xuICBzb3VyY2VMYXJnZS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbGFyZ2UnLCB3aWRlOiB0cnVlIH0pO1xuICBzb3VyY2VMYXJnZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZUxhcmdlKTtcblxuICBjb25zdCBzb3VyY2VNZWRpdW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgc291cmNlTWVkaXVtLm1lZGlhID0gJyhtaW4td2lkdGg6IDYwMHB4KSc7XG4gIHNvdXJjZU1lZGl1bS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnbWVkaXVtJyB9KTtcbiAgc291cmNlTWVkaXVtLnR5cGUgPSAnaW1hZ2UvanBlZyc7XG4gIHBpY3R1cmUuYXBwZW5kQ2hpbGQoc291cmNlTWVkaXVtKTtcblxuICBjb25zdCBzb3VyY2VTbWFsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICBzb3VyY2VTbWFsbC5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgeyBzaXplOiAnc21hbGwnIH0pO1xuICBzb3VyY2VTbWFsbC50eXBlID0gJ2ltYWdlL2pwZWcnO1xuICBwaWN0dXJlLmFwcGVuZENoaWxkKHNvdXJjZVNtYWxsKTtcblxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xuICAvLyBzZXQgZGVmYXVsdCBzaXplIGluIGNhc2UgcGljdHVyZSBlbGVtZW50IGlzIG5vdCBzdXBwb3J0ZWRcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xuICBpbWFnZS5hbHQgPSByZXN0YXVyYW50LmFsdDtcbiAgcGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cbiAgY29uc3QgYWNjZXNzaWJsZVJlc3RhdXJhbnRJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Nlc3NpYmxlLXJlc3RhdXJhbnQtaW1nJyk7XG4gIGFjY2Vzc2libGVSZXN0YXVyYW50SW1hZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgcmVzdGF1cmFudC5hbHQpO1xuXG4gIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XG4gIGN1aXNpbmUuaW5uZXJIVE1MID0gYEN1aXNpbmU6ICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YDtcblxuICBjb25zdCBhY2Nlc3NpYmxlUmVzdGF1cmFudEN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjZXNzaWJsZS1yZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgYWNjZXNzaWJsZVJlc3RhdXJhbnRDdWlzaW5lLmlubmVySFRNTCA9IGBDdWlzaW5lOiAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWA7XG5cbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC1yZXZpZXctYnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgQWRkIGEgcmV2aWV3IGZvciAke3Jlc3RhdXJhbnQubmFtZX1gKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcblxuICBjb25zdCBhZGRSZXZpZXdPdmVybGF5SGVhZGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtcmV2aWV3LW92ZXJsYXktaGVhZGluZycpO1xuICBhZGRSZXZpZXdPdmVybGF5SGVhZGluZy5pbm5lckhUTUwgPSBgQWRkIHJldmlldyBmb3IgJHtyZXN0YXVyYW50Lm5hbWV9YDtcblxuICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xuICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcbiAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3RhdXJhbnQsICdpc19mYXZvcml0ZScpKSB7XG4gICAgZmlsbE1hcmtBc0Zhdm91cml0ZUhUTUwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcbiAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3BlcmF0aW5nSG91cnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XG5cbiAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xuXG4gICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZSA9IChidXR0b24pID0+IHtcbiAgdmFyIGljb24gPSBidXR0b24ucXVlcnlTZWxlY3RvcignaScpO1xuICB2YXIgdGV4dCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gIHRleHQuaW5uZXJIVE1MID0gJ1VubWFyayByZXN0YXVyYW50IGFzIGZhdm91cml0ZSc7XG4gIGljb24uY2xhc3NMaXN0LmFkZCgnZmFzJywgJ21hcmtlZCcpO1xuICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhcicsICd1bm1hcmtlZCcpO1xuICBpY29uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdSZXN0YXVyYW50IGlzIGN1cnJlbnRseSBtYXJrZWQgYXMgZmF2b3VyaXRlJyk7XG59O1xuXG5jb25zdCB1bm1hcmtSZXN0YXVyYW50QXNGYXZvdXJpdGUgPSAoYnV0dG9uKSA9PiB7XG4gIHZhciBpY29uID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgdmFyIHRleHQgPSBidXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0ZXh0LmlubmVySFRNTCA9ICdNYXJrIHJlc3RhdXJhbnQgYXMgZmF2b3VyaXRlJztcbiAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAndW5tYXJrZWQnKTtcbiAgaWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYXMnLCAnbWFya2VkJyk7XG4gIGljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1Jlc3RhdXJhbnQgaXMgbm90IGN1cnJlbnRseSBtYXJrZWQgYXMgZmF2b3VyaXRlJyk7XG59O1xuXG4vKipcbiAqIFNldCBzdGF0ZSBhbmQgdGV4dCBmb3IgbWFyayBhcyBmYXZvdXJpdGUgYnV0dG9uLlxuICovXG5jb25zdCBmaWxsTWFya0FzRmF2b3VyaXRlSFRNTCA9IChpc0Zhdm91cml0ZSA9IHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSkgPT4ge1xuICBjb25zdCBmYXZvdXJpdGVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFyay1hcy1mYXZvdXJpdGUnKTtcbiAgaWYgKHN0cmluZ1RvQm9vbGVhbihpc0Zhdm91cml0ZSkpIHtcbiAgICBtYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH0gZWxzZSB7XG4gICAgdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlKGZhdm91cml0ZUJ1dHRvbik7XG4gIH1cblxufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cbmNvbnN0IGZldGNoUmV2aWV3cyA9ICgpID0+IHtcbiAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgY29uc29sZS5sb2coJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJyk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXZpZXdzQnlSZXN0YXVyYW50SWQoaWQsIChlcnJvciwgcmV2aWV3cykgPT4ge1xuICAgICAgc2VsZi5yZXZpZXdzID0gcmV2aWV3cztcbiAgICAgIGlmICghcmV2aWV3cykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJldmlld3NIVE1MKCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIGFsbCByZXZpZXdzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jb25zdCBmaWxsUmV2aWV3c0hUTUwgPSAocmV2aWV3cyA9IHNlbGYucmV2aWV3cykgPT4ge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1jb250YWluZXInKTtcblxuICBpZiAoIXJldmlld3MpIHtcbiAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgbm9SZXZpZXdzLmlubmVySFRNTCA9ICdObyByZXZpZXdzIHlldCEnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgcmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKHJldmlldykpO1xuICB9KTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHVsKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmNvbnN0IGNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3LCBzZW5kaW5nLCByZXF1ZXN0SWQpID0+IHtcbiAgY29uc3QgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgYXJ0aWNsZS5jbGFzc05hbWUgPSAncmV2aWV3JztcblxuICBjb25zdCBoZWFkZXJTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBoZWFkZXJTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctaGVhZGVyJztcblxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xuICBuYW1lLmNsYXNzTmFtZSA9ICdyZXZpZXctbmFtZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQobmFtZSk7XG5cbiAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG4gICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXInLCAnZmEtY2xvY2snKTtcbiAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsb2FkaW5nVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyc7XG4gICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICBkYXRlLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkYXRlVGV4dCA9IGZvcm1hdERhdGUobmV3IERhdGUocmV2aWV3LnVwZGF0ZWRBdCkpO1xuICAgIGRhdGUuaW5uZXJIVE1MID0gZGF0ZVRleHQ7XG4gIH1cblxuICBkYXRlLmNsYXNzTmFtZSA9ICdyZXZpZXctZGF0ZSc7XG4gIGhlYWRlclNwYW4uYXBwZW5kQ2hpbGQoZGF0ZSk7XG4gIGFydGljbGUuYXBwZW5kQ2hpbGQoaGVhZGVyU3Bhbik7XG5cbiAgY29uc3QgY29udGVudFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGNvbnRlbnRTcGFuLmNsYXNzTmFtZSA9ICdyZXZpZXctY29udGVudCc7XG5cbiAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XG4gIHJhdGluZy5jbGFzc05hbWUgPSAncmV2aWV3LXJhdGluZyc7XG4gIGNvbnRlbnRTcGFuLmFwcGVuZENoaWxkKHJhdGluZyk7XG5cbiAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcbiAgY29udGVudFNwYW4uYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xuICBhcnRpY2xlLmFwcGVuZENoaWxkKGNvbnRlbnRTcGFuKTtcblxuICBpZiAoc2VuZGluZykge1xuICAgIGFydGljbGUuc2V0QXR0cmlidXRlKCdkYXRhLWlkJywgcmVxdWVzdElkKTtcbiAgICBhcnRpY2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NlbmRpbmcnKTtcbiAgfVxuXG4gIHJldHVybiBhcnRpY2xlO1xufTtcblxuY29uc3QgdXBkYXRlUmV2aWV3SFRNTCA9IChlcnJvciwgcmVxdWVzdElkLCByZXZpZXcpID0+IHtcbiAgY29uc3QgcmV2aWV3RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtyZXF1ZXN0SWR9XCJdYCk7XG4gIGlmIChlcnJvcikge1xuICAgIGlmIChyZXZpZXdFbGVtZW50KSB7IC8vIGZvciBlcnJvciwgbm8gbmVlZCB0byBhZGQgdG8gVUkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgcmV2aWV3RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdzZW5kaW5nJyk7XG4gICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgIGRhdGUuaW5uZXJIVE1MID0gJyc7XG4gICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYXMnLCAnZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnKTtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGVycm9yVGV4dC5pbm5lckhUTUwgPSAnU2VuZGluZyBmYWlsZWQnO1xuICAgICAgZGF0ZS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgIGRhdGUuYXBwZW5kQ2hpbGQoZXJyb3JUZXh0KTtcbiAgICAgIGRhdGUuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgaWYgKHVsICYmIHNlbGYucmVzdGF1cmFudCkgeyAvLyBvbmx5IHVwZGF0ZSBpZiB0aGUgcmVzdGF1cmFudCBpcyBsb2FkZWRcbiAgICAgIGlmIChyZXZpZXdFbGVtZW50KSB7XG4gICAgICAgIHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VuZGluZycpO1xuICAgICAgICBjb25zdCBkYXRlID0gcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWRhdGUnKTtcbiAgICAgICAgY29uc3QgZGF0ZVRleHQgPSBmb3JtYXREYXRlKG5ldyBEYXRlKHJldmlldy51cGRhdGVkQXQpKTtcbiAgICAgICAgZGF0ZS5pbm5lckhUTUwgPSBkYXRlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVJldmlld0hUTUwocmV2aWV3LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWRkIHJlc3RhdXJhbnQgbmFtZSB0byB0aGUgYnJlYWRjcnVtYiBuYXZpZ2F0aW9uIG1lbnVcbiAqL1xuY29uc3QgZmlsbEJyZWFkY3J1bWIgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xuICBjb25zdCBicmVhZGNydW1iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWInKTtcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICBsaS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XG4gIGJyZWFkY3J1bWIuYXBwZW5kQ2hpbGQobGkpO1xufTtcblxuLyoqXG4gKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxuICovXG5jb25zdCBnZXRQYXJhbWV0ZXJCeU5hbWUgPSAobmFtZSwgdXJsKSA9PiB7XG4gIHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKTtcblxuXG4gIGNvbnN0IHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XG4gIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csICcgJykpO1xufTtcblxuY29uc3Qgc2V0TWFya0FzRmF2b3VyaXRlRmV0Y2hpbmdTdGF0ZSA9IChidXR0b24sIHNwaW5uZXIpID0+IHtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ3RydWUnKTtcbiAgc3Bpbm5lci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59XG5cbmNvbnN0IHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUgPSAoYnV0dG9uLCBzcGlubmVyKSA9PiB7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtYnVzeScsICdmYWxzZScpO1xuICBzcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn1cblxuY29uc3QgdG9nZ2xlUmVzdGF1cmFudEFzRmF2b3VyaXRlID0gKCkgPT4ge1xuICBjb25zdCBpc0Zhdm91cml0ZSA9IHN0cmluZ1RvQm9vbGVhbihzZWxmLnJlc3RhdXJhbnQuaXNfZmF2b3JpdGUpO1xuICBjb25zdCBuZXdJc0Zhdm91cml0ZSA9ICghaXNGYXZvdXJpdGUpICYmIGlzRmF2b3VyaXRlICE9PSAnZmFsc2UnO1xuICBjb25zdCByZXN0YXVyYW50SWQgPSBzZWxmLnJlc3RhdXJhbnQuaWQ7XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXJrLWFzLWZhdm91cml0ZScpO1xuICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zhdm91cml0ZS1zcGlubmVyJyk7XG4gIGxldCBmYWlsZWRVcGRhdGVDYWxsYmFjaztcbiAgaWYgKG5ld0lzRmF2b3VyaXRlKSB7XG4gICAgbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gdW5tYXJrUmVzdGF1cmFudEFzRmF2b3VyaXRlO1xuICB9IGVsc2Uge1xuICAgIHVubWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZShidXR0b24pO1xuICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrID0gbWFya1Jlc3RhdXJhbnRBc0Zhdm91cml0ZTtcbiAgfVxuICBzZXRNYXJrQXNGYXZvdXJpdGVGZXRjaGluZ1N0YXRlKGJ1dHRvbiwgc3Bpbm5lcik7XG4gIERCSGVscGVyLnNldFJlc3RhdXJhbnRGYXZvdXJpdGVTdGF0dXMocmVzdGF1cmFudElkLCBuZXdJc0Zhdm91cml0ZSwgKGVycm9yLCB1cGRhdGVkUmVzdGF1cmFudCkgPT4ge1xuICAgIHJlbW92ZU1hcmtBc0Zhdm91cml0ZUZldGNoaW5nU3RhdGUoYnV0dG9uLCBzcGlubmVyKTtcbiAgICBpZiAoIXVwZGF0ZWRSZXN0YXVyYW50KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIGZhaWxlZFVwZGF0ZUNhbGxiYWNrKGJ1dHRvbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYucmVzdGF1cmFudCA9IHVwZGF0ZWRSZXN0YXVyYW50O1xuICB9KTtcbn1cbiJdLCJmaWxlIjoicmVzdGF1cmFudF9pbmZvLmpzIn0=

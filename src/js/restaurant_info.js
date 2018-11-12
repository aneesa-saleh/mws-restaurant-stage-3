let restaurant;
let reviews;
let outboxReviews;
let newMap;
let matchesMediaQuery;
const mediaQuery = '(min-width: 800px)';
let previouslyConnected;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
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
    navigator.serviceWorker.addEventListener('message', (event) => {
      const {
        type, requestId, review, error,
      } = event.data;
      if (type === 'update-review') {
        if (error) {
          enqueueToast('An error occurred while submitting your review', 'error');
          updateReviewHTML(true, requestId);
        } else {
          enqueueToast(`${review.name}'s review has been saved`, 'success');
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

  const toast = document.getElementById('toast');
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    const MAPBOX_API_KEY = 'pk.eyJ1IjoiYW5lZXNhLXNhbGVoIiwiYSI6ImNqa2xmZHVwMDFoYW4zdnAwYWplMm53bHEifQ.V11dDOtEnWSwTxY-C8mJLw';
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false,
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: MAPBOX_API_KEY,
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, '
          + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '
          + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets',
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
* Update aria-hidden values of the visible and accessible restaurant containers
*/
window.addEventListener('resize', () => {
  if (window.matchMedia) {
    const nextMatchesMediaQuery = window.matchMedia(mediaQuery).matches;
    if (nextMatchesMediaQuery !== matchesMediaQuery) { // only update aria when layout changes
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
const updateRestaurantContainerAria = () => {
  const restaurantContainer = document.getElementById('restaurant-container');
  const accessibleRestaurantContainer = document.getElementById('accessible-restaurant-container');
  if (matchesMediaQuery) { // larger layout, screen reading order off
    restaurantContainer.setAttribute('aria-hidden', 'true');
    accessibleRestaurantContainer.setAttribute('aria-hidden', 'false');
  } else { // use regular reading order
    restaurantContainer.setAttribute('aria-hidden', 'false');
    accessibleRestaurantContainer.setAttribute('aria-hidden', 'true');
  }
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getUrlParam('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
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
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML += restaurant.address;

  const picture = document.getElementById('restaurant-picture');

  const sourceLarge = document.createElement('source');
  sourceLarge.media = '(min-width: 800px)';
  sourceLarge.srcset = DBHelper.imageUrlForRestaurant(restaurant, { size: 'large', wide: true });
  sourceLarge.type = 'image/jpeg';
  picture.appendChild(sourceLarge);

  const sourceMedium = document.createElement('source');
  sourceMedium.media = '(min-width: 600px)';
  sourceMedium.srcset = DBHelper.imageUrlForRestaurant(restaurant, { size: 'medium' });
  sourceMedium.type = 'image/jpeg';
  picture.appendChild(sourceMedium);

  const sourceSmall = document.createElement('source');
  sourceSmall.srcset = DBHelper.imageUrlForRestaurant(restaurant, { size: 'small' });
  sourceSmall.type = 'image/jpeg';
  picture.appendChild(sourceSmall);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  // set default size in case picture element is not supported
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.alt;
  picture.appendChild(image);

  const accessibleRestaurantImage = document.getElementById('accessible-restaurant-img');
  accessibleRestaurantImage.setAttribute('aria-label', restaurant.alt);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = `Cuisine: ${restaurant.cuisine_type}`;

  const accessibleRestaurantCuisine = document.getElementById('accessible-restaurant-cuisine');
  accessibleRestaurantCuisine.innerHTML = `Cuisine: ${restaurant.cuisine_type}`;

  const addReviewButton = document.getElementById('add-review-button');
  addReviewButton.setAttribute('aria-label', `Add a review for ${restaurant.name}`);
  addReviewButton.removeAttribute('disabled');

  const addReviewOverlayHeading = document.getElementById('add-review-overlay-heading');
  addReviewOverlayHeading.innerHTML = `Add review for ${restaurant.name}`;

  // fill operating hours
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
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (const key in operatingHours) {
    if (Object.prototype.hasOwnProperty.call(operatingHours, key)) {
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  }
};

const markRestaurantAsFavourite = (button) => {
  const icon = button.querySelector('i');
  const text = button.querySelector('span');
  text.innerHTML = 'Unmark restaurant as favourite';
  icon.classList.add('fas', 'marked');
  icon.classList.remove('far', 'unmarked');
  icon.setAttribute('aria-label', 'Restaurant is currently marked as favourite');
};

const unmarkRestaurantAsFavourite = (button) => {
  const icon = button.querySelector('i');
  const text = button.querySelector('span');
  text.innerHTML = 'Mark restaurant as favourite';
  icon.classList.add('far', 'unmarked');
  icon.classList.remove('fas', 'marked');
  icon.setAttribute('aria-label', 'Restaurant is not currently marked as favourite');
};

/**
 * Set state and text for mark as favourite button.
 */
const fillMarkAsFavouriteHTML = (isFavourite = self.restaurant.is_favorite) => {
  const favouriteButton = document.getElementById('mark-as-favourite');
  if (stringToBoolean(isFavourite)) {
    markRestaurantAsFavourite(favouriteButton);
  } else {
    unmarkRestaurantAsFavourite(favouriteButton);
  }
};

/**
 * Get current restaurant from page URL.
 */
const fetchReviews = () => {
  const id = getUrlParam('id');
  if (!id) { // no id found in URL
    console.log('No restaurant id in URL');
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      DBHelper.getOutboxReviews(id, (error, outboxReviews) => {
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
const fillReviewsHTML = (reviews = self.reviews) => {
  if (!reviews || reviews.length === 0) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach((review) => {
    ul.insertBefore(createReviewHTML(review), ul.firstChild);
  });
};

const fillSendingReviewsHTML = (outboxReviews = self.outboxReviews) => {
  if (!outboxReviews || outboxReviews.length === 0) return;

  const ul = document.getElementById('reviews-list');
  outboxReviews.forEach((outboxReview) => {
    const { request_id, ...review } = outboxReview;
    ul.insertBefore(createReviewHTML(review, true, request_id), ul.firstChild);
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review, sending, requestId) => {
  const article = document.createElement('article');
  article.className = 'review';

  const headerSpan = document.createElement('span');
  headerSpan.className = 'review-header';

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'review-name';
  headerSpan.appendChild(name);

  const date = document.createElement('p');

  if (sending) {
    const icon = document.createElement('i');
    icon.classList.add('far', 'fa-clock');
    const loadingText = document.createElement('span');
    loadingText.innerHTML = 'Sending';
    date.appendChild(icon);
    date.appendChild(loadingText);
  } else {
    const dateText = formatDate(new Date(review.updatedAt));
    date.innerHTML = dateText;
  }

  date.className = 'review-date';
  headerSpan.appendChild(date);
  article.appendChild(headerSpan);

  const contentSpan = document.createElement('span');
  contentSpan.className = 'review-content';

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  contentSpan.appendChild(rating);

  const comments = document.createElement('p');
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

const updateReviewHTML = (error, requestId, review) => {
  const reviewElement = document.querySelector(`[data-id="${requestId}"]`);
  if (error) {
    if (reviewElement) { // for error, no need to add to UI if it doesn't exist
      const date = reviewElement.querySelector('.review-date');
      date.innerHTML = '';
      const icon = document.createElement('i');
      icon.classList.add('fas', 'fa-exclamation-triangle');
      const errorText = document.createElement('span');
      errorText.innerHTML = 'Sending failed';
      date.appendChild(icon);
      date.appendChild(errorText);
      date.classList.add('error');
    }
  } else {
    const ul = document.getElementById('reviews-list');
    if (ul && self.restaurant) { // only update if the restaurant is loaded
      if (reviewElement) {
        reviewElement.classList.remove('sending');
        const date = reviewElement.querySelector('.review-date');
        const dateText = formatDate(new Date(review.updatedAt));
        date.innerHTML = dateText;
      } else {
        createReviewHTML(review, false);
      }
    }
  }
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getUrlParam = (name, url) => {
  url = url || window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);


  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const setMarkAsFavouriteFetchingState = (button, spinner) => {
  button.setAttribute('disabled', true);
  button.setAttribute('aria-busy', 'true');
  spinner.classList.add('show');
};

const removeMarkAsFavouriteFetchingState = (button, spinner) => {
  button.removeAttribute('disabled');
  button.setAttribute('aria-busy', 'false');
  spinner.classList.remove('show');
};

const toggleRestaurantAsFavourite = () => {
  const isFavourite = stringToBoolean(self.restaurant.is_favorite);
  const newIsFavourite = (!isFavourite) && isFavourite !== 'false';
  const restaurantId = self.restaurant.id;
  const button = document.getElementById('mark-as-favourite');
  const spinner = document.getElementById('favourite-spinner');
  let failedUpdateCallback;
  let successMessage;
  let errorMessage;
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
  DBHelper.setRestaurantFavouriteStatus(restaurantId, newIsFavourite, (error, updatedRestaurant) => {
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
  const connectionStatus = document.getElementById('connectionStatus');

  if (navigator.onLine && !previouslyConnected) { // user came back online
    enqueueToast('You are back online', 'success');
  } else if (!navigator.onLine && previouslyConnected) { // user went offline
    enqueueToast('You are offline', 'error');
  }

  previouslyConnected = navigator.onLine;
}

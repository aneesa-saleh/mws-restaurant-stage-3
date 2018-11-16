let restaurants;
let neighborhoods;
let cuisines;
let newMap;
const markers = [];
let mapInitialized = false;
let previouslyConnected;
const ø = Object.create(null);

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  previouslyConnected = navigator.onLine;
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false,
  });
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();

  if (window.caches) {
    setInterval(cleanMapboxTilesCache, 5000);
  }

  if ('onLine' in navigator) {
    window.addEventListener('online', showConnectionStatus);
    window.addEventListener('offline', showConnectionStatus);
    requestAnimationFrame(showConnectionStatus);
  }
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  const MAPBOX_API_KEY = 'pk.eyJ1IjoiYW5lZXNhLXNhbGVoIiwiYSI6ImNqa2xmZHVwMDFoYW4zdnAwYWplMm53bHEifQ.V11dDOtEnWSwTxY-C8mJLw';
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: MAPBOX_API_KEY,
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, '
      + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '
      + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets',
  }).addTo(newMap);
  mapInitialized = true;
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      // requestAnimationFrame(fillRestaurantsHTML.bind(ø, restaurants));
      fillRestaurantsHTML(restaurants);
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  resetRestaurants(restaurants);
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
  });
  // register observer after the picture elements have been loaded
  registerObserver(document.querySelectorAll('#restaurants-list picture'), loadPicture);

  if (!mapInitialized) {
    requestAnimationFrame(initMap);
  }
  requestAnimationFrame(addMarkersToMap.bind(ø, restaurants));
};

function loadPicture(picture) {
  const {
    src, srcset, srcset_small: srcsetSmall, srcset_medium: srcsetMedium,
  } = picture.dataset;

  const sourceMedium = picture.querySelector('source[data-size="medium"]');
  const sourceSmall = picture.querySelector('source[data-size="small"]');
  const img = picture.querySelector('img');

  const { alt } = img.dataset;

  sourceMedium.srcset = srcsetMedium;
  sourceSmall.srcset = srcsetSmall;

  img.srcset = srcset;
  img.src = src;

  img.setAttribute('aria-busy', 'false');
  img.alt = alt;
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const article = document.createElement('article');

  // for picture element, we leave src and srcset attributes of the source and image elements empty
  // IntersectionObserver will be used to lazy load the images by setting their src and srcset
  // as they enter the viewport
  const picture = document.createElement('picture');

  // a two-column layout is used for larger viewports
  // medium images are displayed for wide single-column (451px - 749px) and wide 2-column viewports (>= 950px)
  const sourceMedium = document.createElement('source');
  sourceMedium.media = '(min-width: 451px) and (max-width: 749px), (min-width: 950px)';
  sourceMedium.type = 'image/jpeg';
  sourceMedium.setAttribute('data-size', 'medium');
  picture.setAttribute('data-srcset_medium', DBHelper.imageUrlForRestaurant(restaurant, { size: 'medium' }));
  picture.appendChild(sourceMedium);

  // small images are displayed for small single-column (<= 450px) and small 2-column viewports (750px - 949px)
  const sourceSmall = document.createElement('source');
  sourceSmall.media = '(max-width: 450px), (min-width: 750px) and (max-width: 949px)';
  sourceSmall.type = 'image/jpeg';
  sourceSmall.setAttribute('data-size', 'small');
  picture.setAttribute('data-srcset_small', DBHelper.imageUrlForRestaurant(restaurant, { size: 'small' }));
  picture.appendChild(sourceSmall);

  const image = document.createElement('img');
  image.classList.add('restaurant-img');
  // set default size in case picture element is not supported
  picture.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, { size: 'medium' }));
  picture.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant, { size: 'medium', singleValue: true }));
  image.setAttribute('data-alt', restaurant.alt);
  image.setAttribute('aria-busy', 'true');
  image.alt = '';

  picture.appendChild(image);

  article.append(picture);

  const span = document.createElement('span');

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  span.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  span.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  span.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View Details of ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  span.append(more);

  article.append(span);

  return article;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};

function showConnectionStatus() {
  if (navigator.onLine && !previouslyConnected) { // user came back online
    enqueueToast('You are back online', 'success');
  } else if (!navigator.onLine && previouslyConnected) { // user went offline
    enqueueToast('You are offline', 'error');
  }

  previouslyConnected = navigator.onLine;
}

"use strict";function _objectSpread(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{},r=Object.keys(n);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),r.forEach(function(e){_defineProperty(t,e,n[e])})}return t}function _defineProperty(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}importScripts("/js/helpers.js","https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js");var staticCacheName="restaurant-reviews-static-v5",restaurantImagesCache="restaurant-reviews-restaurant-images",mapboxTilesCache="restaurant-reviews-map-tiles",fontsCache="restaurant-reviews-fonts",fontAwesomeCache="font-awesome",allCaches=[staticCacheName,restaurantImagesCache,mapboxTilesCache,fontsCache,fontAwesomeCache];self.addEventListener("install",function(e){e.waitUntil(caches.open(staticCacheName).then(function(e){return e.addAll(["/","/restaurant.html","/css/restaurant-details.css","/css/restaurants-list.css","/js/helpers.js","/js/main.js","/js/restaurant_info.js","/img/offline.svg","/img/offline_wide.svg","/img/spinner.gif","/img/restaurant_map_tiny.png","/img/restaurants_map_tiny.png","https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js","https://use.fontawesome.com/releases/v5.5.0/css/all.css","https://unpkg.com/leaflet@1.3.1/dist/leaflet.css","https://unpkg.com/leaflet@1.3.1/dist/leaflet.js","https://fonts.googleapis.com/css?family=Source+Sans+Pro:200,300,400,700","https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png","https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png","https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png"])}).catch(function(e){return console.log(e)}))}),self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(e){return Promise.all(e.filter(function(e){return e.startsWith("restaurant-reviews-")&&!allCaches.includes(e)}).map(function(e){return caches.delete(e)}))}).catch(function(e){return console.log(e)})),self.clients.claim()});var dbPromise=openDatabase(!0);self.addEventListener("message",function(e){if("post-review"===e.data.type){var t=e.data,n=t.review,r=t.requestId;dbPromise.then(function(e){e.transaction("outbox","readwrite").objectStore("outbox").put(_objectSpread({},n,{request_id:r})),self.registration.sync.register(r)})}}),self.addEventListener("sync",function(e){e.waitUntil(dbPromise.then(function(a){var i=e.tag,o=a.transaction("outbox").objectStore("outbox");o.get(i).then(function(e){var t=e.restaurant_id,n=e.name,r=e.rating,s=e.comments;return DBHelper.addReview(t,n,r,s,function(e,t){e?(self.clients.matchAll().then(function(e){e.forEach(function(e){e.postMessage({type:"update-review",error:!0,requestId:i})})}),(o=a.transaction("outbox","readwrite").objectStore("outbox")).delete(i)):(self.clients.matchAll().then(function(e){e.forEach(function(e){e.postMessage({type:"update-review",review:t,requestId:i})})}),a.transaction("reviews","readwrite").objectStore("reviews").put(t),(o=a.transaction("outbox","readwrite").objectStore("outbox")).delete(i))})})}))}),self.addEventListener("fetch",function(t){var e=new URL(t.request.url);if(e.origin===location.origin){if(/img\/[0-9_\-a-zA-Z]+\.jpg/.test(e.pathname))return void t.respondWith(serveRestaurantImage(t.request));if(e.pathname.startsWith("/index.html"))return void t.respondWith(caches.match("/").then(function(e){return e||fetch(t.request)}))}else{if("https://api.tiles.mapbox.com"===e.origin)return void t.respondWith(serveMapboxTiles(t.request));if("https://fonts.gstatic.com"===e.origin)return void t.respondWith(serveFonts(t.request));if("https://use.fontawesome.com"===e.origin&&!e.pathname.endsWith(".css"))return void t.respondWith(serveFontAwesome(t.request))}t.respondWith(caches.match(t.request,{ignoreSearch:!0}).then(function(e){return e||fetch(t.request)}))});var serveRestaurantImage=function(n){var r=n.url.split("-")[0];return caches.open(restaurantImagesCache).then(function(t){return t.match(r).then(function(e){return e||fetch(n).then(function(e){return t.put(r,e.clone()),e}).catch(function(e){return console.log(e),n.url.includes("wide")?caches.match("/img/offline_wide.svg"):caches.match("/img/offline.svg")})})})},serveMapboxTiles=function(n){return caches.open(mapboxTilesCache).then(function(t){return t.match(n.url).then(function(e){return e||fetch(n).then(function(e){return t.put(n.url,e.clone()),e})})})},serveFonts=function(n){return caches.open(fontsCache).then(function(t){return t.match(n.url).then(function(e){return e||fetch(n).then(function(e){return t.put(n.url,e.clone()),e})})})},serveFontAwesome=function(n){return caches.open(fontAwesomeCache).then(function(t){return t.match(n.url).then(function(e){return e||fetch(n).then(function(e){return t.put(n.url,e.clone()),e})})})};
//# sourceMappingURL=sourcemaps/service-worker.js.map

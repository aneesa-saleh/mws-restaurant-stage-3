"use strict";function _objectSpread(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{},r=Object.keys(n);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),r.forEach(function(e){_defineProperty(t,e,n[e])})}return t}function _defineProperty(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}importScripts("/js/helpers.js","https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js");var staticCacheName="restaurant-reviews-static-v5",restaurantImagesCache="restaurant-reviews-restaurant-images",mapboxTilesCache="restaurant-reviews-map-tiles",allCaches=[staticCacheName,restaurantImagesCache,mapboxTilesCache];self.addEventListener("install",function(e){e.waitUntil(caches.open(staticCacheName).then(function(e){return e.addAll(["/","/restaurant.html","/css/restaurant-details.css","/css/restaurants-list.css","/js/helpers.js","/js/main.js","/js/restaurant_info.js","/img/offline.svg","/img/offline_wide.svg","/img/spinner.gif","https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js","https://use.fontawesome.com/releases/v5.5.0/css/all.css","https://unpkg.com/leaflet@1.3.1/dist/leaflet.css","https://unpkg.com/leaflet@1.3.1/dist/leaflet.js","https://fonts.googleapis.com/css?family=Source+Sans+Pro:200,300,400,600,700","https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png","https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png","https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png"])}).catch(function(e){return console.log(e)}))}),self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(e){return Promise.all(e.filter(function(e){return e.startsWith("restaurant-reviews-")&&!allCaches.includes(e)}).map(function(e){return caches.delete(e)}))}).catch(function(e){return console.log(e)})),self.clients.claim()});var dbPromise=openDatabase(!0);self.addEventListener("message",function(e){if("post-review"===e.data.type){var t=e.data,n=t.review,r=t.requestId;dbPromise.then(function(e){e.transaction("outbox","readwrite").objectStore("outbox").put(_objectSpread({},n,{request_id:r})),self.registration.sync.register(r)})}}),self.addEventListener("sync",function(e){e.waitUntil(dbPromise.then(function(a){var i=e.tag,c=a.transaction("outbox").objectStore("outbox");c.get(i).then(function(e){var t=e.restaurant_id,n=e.name,r=e.rating,s=e.comments;return DBHelper.addReview(t,n,r,s,function(e,t){e?(self.clients.matchAll().then(function(e){e.forEach(function(e){e.postMessage({type:"update-review",error:!0,requestId:i})})}),(c=a.transaction("outbox","readwrite").objectStore("outbox")).delete(i)):(self.clients.matchAll().then(function(e){e.forEach(function(e){e.postMessage({type:"update-review",review:t,requestId:i})})}),a.transaction("reviews","readwrite").objectStore("reviews").put(t),(c=a.transaction("outbox","readwrite").objectStore("outbox")).delete(i))})})}))}),self.addEventListener("fetch",function(t){var e=new URL(t.request.url);if(e.origin===location.origin){if(/img\/[0-9_\-a-zA-Z]+\.jpg/.test(e.pathname))return void t.respondWith(serveRestaurantImage(t.request));if(e.pathname.startsWith("/index.html"))return void t.respondWith(caches.match("/").then(function(e){return e||fetch(t.request)}))}else if("https://api.tiles.mapbox.com"===e.origin)return void t.respondWith(serveMapboxTiles(t.request));t.respondWith(caches.match(t.request,{ignoreSearch:!0}).then(function(e){return e||fetch(t.request)}))});var serveRestaurantImage=function(n){var r=n.url.split("-")[0];return caches.open(restaurantImagesCache).then(function(t){return t.match(r).then(function(e){return e||fetch(n).then(function(e){return t.put(r,e.clone()),e}).catch(function(e){return console.log(e),n.url.includes("wide")?caches.match("/img/offline_wide.svg"):caches.match("/img/offline.svg")})})})},serveMapboxTiles=function(n){return caches.open(mapboxTilesCache).then(function(t){return t.match(n.url).then(function(e){return e||fetch(n).then(function(e){return t.put(n.url,e.clone()),e})})})};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2Utd29ya2VyLmpzIl0sIm5hbWVzIjpbImltcG9ydFNjcmlwdHMiLCJzdGF0aWNDYWNoZU5hbWUiLCJyZXN0YXVyYW50SW1hZ2VzQ2FjaGUiLCJtYXBib3hUaWxlc0NhY2hlIiwiYWxsQ2FjaGVzIiwic2VsZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsIndhaXRVbnRpbCIsImNhY2hlcyIsImNhY2hlIiwidGhlbiIsImFkZEFsbCIsImNhdGNoIiwiZGJQcm9taXNlIiwiY29uc29sZSIsImxvZyIsImVycm9yIiwicmVxdWVzdElkIiwib3V0Ym94U3RvcmUiLCJwdXQiLCJjYWNoZU5hbWVzIiwiUHJvbWlzZSIsInJldmlldyIsInJlcXVlc3RfaWQiLCJjYWNoZU5hbWUiLCJzdGFydHNXaXRoIiwiaW5jbHVkZXMiLCJyZWdpc3RyYXRpb24iLCJzeW5jIiwicmVnaXN0ZXIiLCJ0cmFuc2FjdGlvbiIsInJlc3RhdXJhbnRfaWQiLCJuYW1lIiwicmVxdWVzdCIsIl9ldmVudCRkYXRhIiwiZGF0YSIsInJhdGluZyIsImNvbW1lbnRzIiwiZGIiLCJhZGRSZXZpZXciLCJfb2JqZWN0U3ByZWFkIiwidGFnIiwib2JqZWN0U3RvcmUiLCJnZXQiLCJkZWxldGUiLCJuZXdSZXZpZXciLCJjbGllbnRzIiwibWF0Y2hBbGwiLCJmb3JFYWNoIiwiY2xpZW50IiwicG9zdE1lc3NhZ2UiLCJ0eXBlIiwicmVzcG9uZFdpdGgiLCJzZXJ2ZVJlc3RhdXJhbnRJbWFnZSIsInJlcXVlc3RVcmwiLCJVUkwiLCJ1cmwiLCJzZXJ2ZU1hcGJveFRpbGVzIiwidGVzdCIsInBhdGhuYW1lIiwibWF0Y2giLCJyZXNwb25zZSIsImZldGNoIiwib3JpZ2luIiwiaWdub3JlU2VhcmNoIiwibmV0d29ya1Jlc3BvbnNlIiwic3RvcmFnZVVybCIsImNsb25lIiwic3BsaXQiLCJvcGVuIl0sIm1hcHBpbmdzIjoiaWZBQUFBLGNBQWMsaUJBQWtCLHlEQUVoQyxJQUFNQyxnQkFBa0IsK0JB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aWNlLXdvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydFNjcmlwdHMoJy9qcy9oZWxwZXJzLmpzJywgJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vaWRiQDIuMS4zL2xpYi9pZGIubWluLmpzJyk7XG5cbmNvbnN0IHN0YXRpY0NhY2hlTmFtZSA9ICdyZXN0YXVyYW50LXJldmlld3Mtc3RhdGljLXY1JztcbmNvbnN0IHJlc3RhdXJhbnRJbWFnZXNDYWNoZSA9ICdyZXN0YXVyYW50LXJldmlld3MtcmVzdGF1cmFudC1pbWFnZXMnO1xuY29uc3QgbWFwYm94VGlsZXNDYWNoZSA9ICdyZXN0YXVyYW50LXJldmlld3MtbWFwLXRpbGVzJztcbmNvbnN0IGFsbENhY2hlcyA9IFtcbiAgc3RhdGljQ2FjaGVOYW1lLFxuICByZXN0YXVyYW50SW1hZ2VzQ2FjaGUsXG4gIG1hcGJveFRpbGVzQ2FjaGUsXG5dO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2luc3RhbGwnLCAoZXZlbnQpID0+IHtcbiAgZXZlbnQud2FpdFVudGlsKFxuICAgIGNhY2hlcy5vcGVuKHN0YXRpY0NhY2hlTmFtZSkudGhlbihjYWNoZSA9PiBjYWNoZS5hZGRBbGwoW1xuICAgICAgJy8nLFxuICAgICAgJy9yZXN0YXVyYW50Lmh0bWwnLFxuICAgICAgJy9jc3MvcmVzdGF1cmFudC1kZXRhaWxzLmNzcycsXG4gICAgICAnL2Nzcy9yZXN0YXVyYW50cy1saXN0LmNzcycsXG4gICAgICAnL2pzL2hlbHBlcnMuanMnLFxuICAgICAgJy9qcy9tYWluLmpzJyxcbiAgICAgICcvanMvcmVzdGF1cmFudF9pbmZvLmpzJyxcbiAgICAgICcvaW1nL29mZmxpbmUuc3ZnJyxcbiAgICAgICcvaW1nL29mZmxpbmVfd2lkZS5zdmcnLFxuICAgICAgJy9pbWcvc3Bpbm5lci5naWYnLFxuICAgICAgJ2h0dHBzOi8vY2RuLnJhd2dpdC5jb20vamFrZWFyY2hpYmFsZC9pZGIvbWFzdGVyL2xpYi9pZGIuanMnLFxuICAgICAgJ2h0dHBzOi8vdXNlLmZvbnRhd2Vzb21lLmNvbS9yZWxlYXNlcy92NS41LjAvY3NzL2FsbC5jc3MnLFxuICAgICAgJ2h0dHBzOi8vdW5wa2cuY29tL2xlYWZsZXRAMS4zLjEvZGlzdC9sZWFmbGV0LmNzcycsXG4gICAgICAnaHR0cHM6Ly91bnBrZy5jb20vbGVhZmxldEAxLjMuMS9kaXN0L2xlYWZsZXQuanMnLFxuICAgICAgJ2h0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzP2ZhbWlseT1Tb3VyY2UrU2FucytQcm86MjAwLDMwMCw0MDAsNjAwLDcwMCcsXG4gICAgICAnaHR0cHM6Ly91bnBrZy5jb20vbGVhZmxldEAxLjMuMS9kaXN0L2ltYWdlcy9tYXJrZXItaWNvbi5wbmcnLFxuICAgICAgJ2h0dHBzOi8vdW5wa2cuY29tL2xlYWZsZXRAMS4zLjEvZGlzdC9pbWFnZXMvbWFya2VyLWljb24tMngucG5nJyxcbiAgICAgICdodHRwczovL3VucGtnLmNvbS9sZWFmbGV0QDEuMy4xL2Rpc3QvaW1hZ2VzL21hcmtlci1zaGFkb3cucG5nJyxcbiAgICBdKSkuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5sb2coZXJyb3IpKSxcbiAgKTtcbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgKGV2ZW50KSA9PiB7XG4gIC8vIGRlbGV0ZSB0aGUgb2xkIHZlcnNpb25zIG9mIHRoZSBjYWNoZVxuICBldmVudC53YWl0VW50aWwoXG4gICAgY2FjaGVzLmtleXMoKS50aGVuKGNhY2hlTmFtZXMgPT4gUHJvbWlzZS5hbGwoXG4gICAgICBjYWNoZU5hbWVzLmZpbHRlcihjYWNoZU5hbWUgPT4gKFxuICAgICAgICBjYWNoZU5hbWUuc3RhcnRzV2l0aCgncmVzdGF1cmFudC1yZXZpZXdzLScpICYmICFhbGxDYWNoZXMuaW5jbHVkZXMoY2FjaGVOYW1lKVxuICAgICAgKSkubWFwKGNhY2hlTmFtZSA9PiBjYWNoZXMuZGVsZXRlKGNhY2hlTmFtZSkpLFxuICAgICkpLmNhdGNoKGVycm9yID0+IGNvbnNvbGUubG9nKGVycm9yKSksXG4gICk7XG5cbiAgc2VsZi5jbGllbnRzLmNsYWltKCk7XG59KTtcblxuY29uc3QgZGJQcm9taXNlID0gb3BlbkRhdGFiYXNlKHRydWUpO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgaWYgKGV2ZW50LmRhdGEudHlwZSA9PT0gJ3Bvc3QtcmV2aWV3Jykge1xuICAgIGNvbnN0IHsgcmV2aWV3LCByZXF1ZXN0SWQgfSA9IGV2ZW50LmRhdGE7XG4gICAgZGJQcm9taXNlLnRoZW4oKGRiKSA9PiB7XG4gICAgICBjb25zdCBvdXRib3hTdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdvdXRib3gnLCAncmVhZHdyaXRlJykub2JqZWN0U3RvcmUoJ291dGJveCcpO1xuICAgICAgb3V0Ym94U3RvcmUucHV0KHsgLi4ucmV2aWV3LCByZXF1ZXN0X2lkOiByZXF1ZXN0SWQgfSk7XG4gICAgICBzZWxmLnJlZ2lzdHJhdGlvbi5zeW5jLnJlZ2lzdGVyKHJlcXVlc3RJZCk7XG4gICAgfSk7XG4gIH1cbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ3N5bmMnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgZXZlbnQud2FpdFVudGlsKFxuICAgIGRiUHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQudGFnO1xuICAgICAgbGV0IG91dGJveFN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ291dGJveCcpLm9iamVjdFN0b3JlKCdvdXRib3gnKTtcbiAgICAgIG91dGJveFN0b3JlLmdldChyZXF1ZXN0SWQpLnRoZW4oKHJlcXVlc3QpID0+IHtcbiAgICAgICAgY29uc3QgeyByZXN0YXVyYW50X2lkLCBuYW1lLCByYXRpbmcsIGNvbW1lbnRzIH0gPSByZXF1ZXN0O1xuICAgICAgICByZXR1cm4gREJIZWxwZXIuYWRkUmV2aWV3KHJlc3RhdXJhbnRfaWQsIG5hbWUsIHJhdGluZywgY29tbWVudHMsIChlcnJvciwgbmV3UmV2aWV3KSA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBicm9hZGNhc3QgdXBkYXRlIHRvIGFsbCBjbGllbnRzXG4gICAgICAgICAgICBzZWxmLmNsaWVudHMubWF0Y2hBbGwoKS50aGVuKChjbGllbnRzKSA9PiB7XG4gICAgICAgICAgICAgIGNsaWVudHMuZm9yRWFjaCgoY2xpZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICBjbGllbnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAndXBkYXRlLXJldmlldycsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGRlbGV0ZSByZXZpZXcgZnJvbSBvdXRib3ggc3RvcmVcbiAgICAgICAgICAgIG91dGJveFN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ291dGJveCcsICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZSgnb3V0Ym94Jyk7XG4gICAgICAgICAgICBvdXRib3hTdG9yZS5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYnJvYWRjYXN0IHVwZGF0ZSB0byBhbGwgY2xpZW50c1xuICAgICAgICAgICAgc2VsZi5jbGllbnRzLm1hdGNoQWxsKCkudGhlbigoY2xpZW50cykgPT4ge1xuICAgICAgICAgICAgICBjbGllbnRzLmZvckVhY2goKGNsaWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY2xpZW50LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3VwZGF0ZS1yZXZpZXcnLFxuICAgICAgICAgICAgICAgICAgICByZXZpZXc6IG5ld1JldmlldyxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBhZGQgcmV2aWV3IHRvIHJldmlld3Mgc3RvcmVcbiAgICAgICAgICAgIGNvbnN0IHJldmlld3NTdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXZpZXdzJywgJ3JlYWR3cml0ZScpLm9iamVjdFN0b3JlKCdyZXZpZXdzJyk7XG4gICAgICAgICAgICByZXZpZXdzU3RvcmUucHV0KG5ld1Jldmlldyk7XG4gICAgICAgICAgICAvLyBkZWxldGUgcmV2aWV3IGZyb20gb3V0Ym94IHN0b3JlXG4gICAgICAgICAgICBvdXRib3hTdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdvdXRib3gnLCAncmVhZHdyaXRlJykub2JqZWN0U3RvcmUoJ291dGJveCcpO1xuICAgICAgICAgICAgb3V0Ym94U3RvcmUuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICApO1xufSk7XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCAoZXZlbnQpID0+IHtcbiAgY29uc3QgcmVxdWVzdFVybCA9IG5ldyBVUkwoZXZlbnQucmVxdWVzdC51cmwpO1xuXG4gIGlmIChyZXF1ZXN0VXJsLm9yaWdpbiA9PT0gbG9jYXRpb24ub3JpZ2luKSB7XG4gICAgY29uc3QgcmVzdGF1cmFudEltYWdlUGF0aFJlZ2V4ID0gL2ltZ1xcL1swLTlfXFwtYS16QS1aXStcXC5qcGcvO1xuICAgIGlmIChyZXN0YXVyYW50SW1hZ2VQYXRoUmVnZXgudGVzdChyZXF1ZXN0VXJsLnBhdGhuYW1lKSkge1xuICAgICAgZXZlbnQucmVzcG9uZFdpdGgoc2VydmVSZXN0YXVyYW50SW1hZ2UoZXZlbnQucmVxdWVzdCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNhY2hlIHNob3VsZCBtYXRjaCBpbmRleC5odG1sIHRvIC9cbiAgICBpZiAocmVxdWVzdFVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvaW5kZXguaHRtbCcpKSB7XG4gICAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZXMubWF0Y2goJy8nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZSB8fCBmZXRjaChldmVudC5yZXF1ZXN0KSkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIGlmIChyZXF1ZXN0VXJsLm9yaWdpbiA9PT0gJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20nKSB7XG4gICAgZXZlbnQucmVzcG9uZFdpdGgoc2VydmVNYXBib3hUaWxlcyhldmVudC5yZXF1ZXN0KSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZXZlbnQucmVzcG9uZFdpdGgoXG4gICAgY2FjaGVzLm1hdGNoKGV2ZW50LnJlcXVlc3QsIHsgaWdub3JlU2VhcmNoOiB0cnVlIH0pIC8vIGlnbm9yZSBzZWFyY2ggZm9yIC9yZXN0YXVyYW50Lmh0bWw/aWQ9WFxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UgfHwgZmV0Y2goZXZlbnQucmVxdWVzdCkpLFxuICApO1xufSk7XG5cbmNvbnN0IHNlcnZlUmVzdGF1cmFudEltYWdlID0gKHJlcXVlc3QpID0+IHtcbiAgLy8gaW1hZ2UgdXJscyBoYXZlIG11bHRpcGxlIC0gYW5kIF8gZm9yIG9yaWVudGF0aW9uLCBjcm9wLCBwaXhlbCBkZW5zaXR5IGFuZCBzY3JlZW4gc2l6ZVxuICAvLyB0aGUgcmVsZXZhbnQgcGFydCBvZiB0aGUgdXJsIGlzIGJlZm9yZSB0aGUgZmlyc3QgLVxuICBjb25zdCBzdG9yYWdlVXJsID0gcmVxdWVzdC51cmwuc3BsaXQoJy0nKVswXTtcblxuICByZXR1cm4gY2FjaGVzLm9wZW4ocmVzdGF1cmFudEltYWdlc0NhY2hlKS50aGVuKFxuICAgIGNhY2hlID0+IGNhY2hlLm1hdGNoKHN0b3JhZ2VVcmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICBpZiAocmVzcG9uc2UpIHJldHVybiByZXNwb25zZTtcblxuICAgICAgcmV0dXJuIGZldGNoKHJlcXVlc3QpLnRoZW4oKG5ldHdvcmtSZXNwb25zZSkgPT4ge1xuICAgICAgICBjYWNoZS5wdXQoc3RvcmFnZVVybCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xuICAgICAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xuICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgLy8gdXNlIG9mIG9mZmxpbmUgaW1hZ2VzIGluc3BpcmVkIGJ5IFNhbGFoIEhhbXphJ3Mgc3RhZ2UgMSBwcm9qZWN0XG4gICAgICAgIC8vIEF2YWlsYWJsZSBhdCBodHRwczovL2dpdGh1Yi5jb20vU2FsYWhIYW16YS9td3MtcmVzdGF1cmFudC1zdGFnZS0xL2Jsb2IvbWFzdGVyL3N3LmpzXG4gICAgICAgIGlmIChyZXF1ZXN0LnVybC5pbmNsdWRlcygnd2lkZScpKSByZXR1cm4gY2FjaGVzLm1hdGNoKCcvaW1nL29mZmxpbmVfd2lkZS5zdmcnKTtcbiAgICAgICAgcmV0dXJuIGNhY2hlcy5tYXRjaCgnL2ltZy9vZmZsaW5lLnN2ZycpO1xuICAgICAgfSk7XG4gICAgfSksXG4gICk7XG59O1xuXG5jb25zdCBzZXJ2ZU1hcGJveFRpbGVzID0gcmVxdWVzdCA9PiBjYWNoZXMub3BlbihtYXBib3hUaWxlc0NhY2hlKS50aGVuKFxuICBjYWNoZSA9PiBjYWNoZS5tYXRjaChyZXF1ZXN0LnVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICBpZiAocmVzcG9uc2UpIHJldHVybiByZXNwb25zZTtcblxuICAgIC8vIGlmIHJlcXVlc3QgaXNuJ3QgY2FjaGVkLCBjYWNoZSBpdCB3aGVuIGZldGNoIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgcmV0dXJuIGZldGNoKHJlcXVlc3QpLnRoZW4oKG5ldHdvcmtSZXNwb25zZSkgPT4ge1xuICAgICAgY2FjaGUucHV0KHJlcXVlc3QudXJsLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XG4gICAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xuICAgIH0pO1xuICB9KSxcbik7XG4iXX0=

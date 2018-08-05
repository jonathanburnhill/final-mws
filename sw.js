let mainCache = 'restaurant-file-cache-v9';
let cachedFiles = [
    '/',
    'index.html',
    'restaurant.html',
    'css/style.css',
    'js/min/idb.js',
    'js/min/dbhelper.js',
    'js/min/main.js',
    'js/min/restaurant_info.js',
    'data/manifest.json',
    'images/1-thumbnail.webp',
    'images/2-thumbnail.webp',
    'images/3-thumbnail.webp',
    'images/4-thumbnail.webp',
    'images/5-thumbnail.webp',
    'images/6-thumbnail.webp',
    'images/7-thumbnail.webp',
    'images/8-thumbnail.webp',
    'images/9-thumbnail.webp',
    'images/10-thumbnail.webp'
];


//Build cache
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(mainCache).then(function(cache) {
            return cache.addAll(cachedFiles);
        }).then(self.skipWaiting())
    );
});

// Check for requests and return apporprate response
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open('mainCache').then(function(cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request)
                    .then(function(response) {
                        cache.put(event.request, response.clone());
                        return response;
                    });
            });
        })
    );
});

self.addEventListener('fetch', (event)=> {
    const request = event.request;

    event.respondWith(
        caches.match(request).then((response) => {
            if(response) {
                return response;
            }
            
            fetch(request).then((response) => {
                let dbToCache = response.clone();
                caches.open(mainCache).then((cache) => {
                    cache.put(request, dbToCache);
                });
                
                return response;
            });
        })
    );
});
  
self.addEventListener('fetch', event => {
    if (event.request.method =='POST') {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('activate', event => { 
    event.waitUntil(self.clients.claim());
});

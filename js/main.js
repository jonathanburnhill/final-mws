let restaurants;
let neighborhoods;
let cuisines;
let map;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */


document.addEventListener('DOMContentLoaded', (event) => {
    // initMap();
    fetchNeighborhoods();
    fetchCuisines();
    if('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('sw.js').then(function(registration){
                console.log(`Registration was a success with scope: ${registration.scope}`);
            }, function(err) {
                console.log(`ServiceWorker registration failed: ${err}`);
            });
        });
    }

});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods()
        .then(neighborhoods => {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
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
    DBHelper.fetchCuisines()
        .then(cuisines => {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */

// const initMap = () => {
//     self.newMap = L.map('map', {
//         center: [40.722216, -73.987501],
//         zoom: 12,
//         scrollWheelZoom: false
//     });
//     L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
//         mapboxToken: 'pk.eyJ1Ijoiam9ub2Zyb21icmFkZm9yZCIsImEiOiJjamtkejY0cDAxa2VmM3BudmlvNHVxdm1nIn0.KEoRcWWfwDRIWcTjhqQtsw',
//         maxZoom: 18,
//         attribution: '',
//         id: 'mapbox.streets'
//     }).addTo(newMap);
  
//     updateRestaurants();
// };

window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
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

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
        .then(restaurants => {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }).catch(error => console.error(error));
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
    // self.markers = [];
    if(self.markers) {
        self.markers.forEach(m => m.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    ul.setAttribute('aria-label', 'restaurants name');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 *             
 */
const createRestaurantHTML = (restaurant) => {
    
    const li = document.createElement('li');
    li.setAttribute('class', 'restaurant__result__list');

    const image = document.createElement('img');
    image.setAttribute('alt', `${restaurant.name}`);

    const options = {
        // If the image gets within 50px in the Y axis, start the download.
        root: null, // Page as root
        rootMargin: '0px',
        threshold: 0.1
    };
    const loadImage = image => {
        image.setAttribute('class', 'restaurant-img');
        image.src = `images/${restaurant.photograph}-thumbnail.webp`;
        
    };
    
    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            if(entry.intersectionRatio > 0) {
                console.log(entry.intersectionRatio);
                loadImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    };
    
    // The observer for the images on the page
    const observer = new IntersectionObserver(handleIntersection, options);
    
    observer.observe(image);

    li.append(image);

    const name = document.createElement('h2');
    name.setAttribute('class', 'restaurants__name');
    name.innerHTML = `<strong>${restaurant.name}</strong>`;
    li.append(name);

     
    const likeButton = document.createElement('button');
    likeButton.innerHTML = '❤';
    likeButton.setAttribute('class', 'like__btn');
    likeButton.setAttribute('aria-label', 'click to make favourite');

    likeButton.onclick = () => {
        const isFave = !restaurant.is_favorite;
        DBHelper.updateFavouriteRestaurant(restaurant.id, isFave);
        restaurant.is_favorite = !restaurant.is_favorite;
        toggleFavourites(likeButton, restaurant.is_favorite);
    };
    toggleFavourites(likeButton, restaurant.is_favorite);
    li.appendChild(likeButton);
        

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = `<strong>${restaurant.neighborhood}</strong>`;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = `<strong>${restaurant.address}</strong>`;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = '<i> - View Details - </i> <br /> <br />';
    more.className = 'restaurant__link';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    return li;
};



/**
 * Toggle favourite elementclass
 */

const toggleFavourites = (element, faveRestaurant) => {
    if(!faveRestaurant) {
        element.classList.remove('liked');
        element.setAttribute('class', 'not__liked');
        element.setAttribute('aria-label', 'Click to mark as a favourite restaurant');
    } else {
        element.classList.remove('not__liked');
        element.setAttribute('class', 'liked');
        element.setAttribute('aria-label', 'Remove as a favourite restaurant');
    }
    
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
    // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        const markerClick = () => {
            window.location.href = marker.options.url;
        };
        marker.on('click', markerClick);

        self.markers.push(marker);
    });
};


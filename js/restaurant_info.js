let restaurant;
let map;
let newMap;

// document.addEventListener('DOMContentLoaded', event => {
//     initMap();
// });

// const initMap = () => {
//     let newMap = new L.map('map', {
//         center: [40.722216, -73.987501],
//         zoom: 12,
//         scrollWheelZoom: false
//     });
//     L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70??access_token={mapboxToken}', {
//         mapboxToken: 'pk.eyJ1Ijoiam9ub2Zyb21icmFkZm9yZCIsImEiOiJjamtkejY0cDAxa2VmM3BudmlvNHVxdm1nIn0.KEoRcWWfwDRIWcTjhqQtsw',
//         maxZoom: 18,
//         attribution: '',
//         id: 'mapbox.streets'
//     }).addTo(newMap);
  
//     updateRestaurants();
// };


window.initMap = () => {
    fetchRestaurantFromURL((restaurant) => {
        // if (error) { // Got an error!
        //     console.error(error);
        // } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        // }
    });
};



/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
    if (self.restaurant) { // restaurant already fetched!
        return Promise.resolve(self.restaurant);
    }
    const id = parseInt(getParameterByName('id'));
    if (!id || id === isNaN) { // no id found in URL
        return Promise.reject('No Restaurant found');
    } else {
        return DBHelper.fetchRestaurantById(id).then(restaurant => {
            self.restaurant = restaurant;
            if (!restaurant) {
                return Promise.reject('restaurant not found');
            }
            self.restaurant = restaurant;
            fillRestaurantHTML();
            return restaurant;
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
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = `images/${restaurant.photograph}-thumbnail.webp`;
    image.setAttribute('alt', `${restaurant.name}`);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    DBHelper.fetchReviewsById(restaurant.id).then(reviews => {

        fillReviewsHTML(reviews);
    });
       
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 **/
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-show');
    const title = document.createElement('h3');
    title.innerHTML = 'Stand on the shoulders of giants! Read the reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
   
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};
/**
 * Create review HTML and add it to the webpage.
 */

const createReviewHTML = (review) => {
    const li = document.createElement('li');
    if(!navigator.onLine) {
        const connectionStatus = document.createElement('p');
        connectionStatus.setAttribute('class', 'offline_label');
        connectionStatus.innerHTML ='Your currently offline we will update when you reconnect';
        li.setAttribute('class', 'offline');
        li.appendChild(connectionStatus);
    }
    li.setAttribute('class', 'review__results');
    const name = document.createElement('p');
    name.setAttribute('class', 'review__details');
    name.innerHTML = `name: ${review.name}`;
    li.appendChild(name);
    
    const date = document.createElement('p');
    date.setAttribute('class', 'review__details');
    date.innerHTML = `Date: ${new Date(review.createdAt).toLocaleString()}`;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}/5`;
    rating.setAttribute('class', 'review__details');
    li.appendChild(rating);
        
    const comments = document.createElement('p');
    comments.setAttribute('class', 'comments__details');
    comments.setAttribute('class', 'review__details');
    comments.innerHTML = review.comments;
    li.appendChild(comments);
        
    return li;
};
 
/**
 * Button to send reviews
 */

const addReview = () => {
    event.preventDefault();

    const restaurantId = getParameterByName('id');
    const name = document.querySelector('#name').value;
    let rating;
    const comments = document.querySelector('#comments').value;
    rating = document.querySelector('#rating option:checked').value;
    const review = [name, rating, comments, restaurantId];

    const finalReview = {
        restaurantId: parseInt(review[3]),
        rating: parseInt(review[1]),
        name: review[0],
        comments: review[2],
        createdAt: new Date()
    };

    DBHelper.addReview(finalReview);
    addReviewHTML(finalReview);
    document.querySelector('.reviews__post__container');
};

const addReviewHTML = review => {
    if(document.querySelector('#no-review')) {
        document.querySelector('#no-review').remove();
    }
    const container = document.querySelector('#reviews-show');
    const ul = document.querySelector('#reviews-list');

    ul.insertBefore(createReviewHTML(review), ul.firstChild);
    container.appendChild(ul);
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = `<a href="/" class="link__home" aria-label="home" aria-current="page"><i class="fas fa-home font__basic"></i><span class="link__home--text font__basic">Home/${restaurant.name}</span></a>`;
  
};

    /**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};



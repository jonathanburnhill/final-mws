/**
 * Common database helper functions.
 */
class DBHelper {
 
    /* Database URL.
    * Change this to restaurants.json file location on your server.
    */
    static get DATABASE_URL() {
        const port = 1337;
        return `http://localhost:${port}/`;
    }


    /**
     * Open DB for resturant and review data
     */
    static dbPromise() {
        return idb.open('db', 3, upgradeDB => {          
            switch(upgradeDB.oldVersion) {
            case 0:
                upgradeDB.createObjectStore('restaurants', {
                    keyPath: 'id'
                });
            case 1:
                const reviewsDB = upgradeDB.createObjectStore('reviews', {
                    keyPath: 'id'
                });
                reviewsDB.createIndex('restaurant', 'restaurant_id');
            }
        });
    }
    
    /**
   * fetch restaurants
   */ 
    static fetchRestaurants() {
        return this.dbPromise()
            .then(db => {
                const tx = db.transaction('restaurants');
                const restaurantStore = tx.objectStore('restaurants');
                return restaurantStore.getAll();
            })
            .then(restaurants => {
                if (restaurants.length !== 0) {
                    return Promise.resolve(restaurants);
                }
                return this.fetchAndCacheRestaurantData();
            });
    }
    // *Fetch and cahce restaurant results
    //
    //


    static fetchAndCacheRestaurantData() {
        return fetch(DBHelper.DATABASE_URL + 'restaurants')
            .then(response => response.json())
            .then(restaurants => {
                return this.dbPromise()
                    .then(db => {
                        const tx = db.transaction('restaurants', 'readwrite');
                        const restaurantStore = tx.objectStore('restaurants');
                        restaurants.forEach(restaurant => restaurantStore.put(restaurant));

                        return tx.complete.then(() => Promise.resolve(restaurants));
                    });
            });
    }
    /**
   * Fetch a restaurant by its ID.
   */
    static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
        return DBHelper.fetchRestaurants()
            .then(restaurants => restaurants.find(r => r.id === id));

    }

    /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
        return DBHelper.fetchRestaurants()
            .then(restaurants => restaurants.filter(r => r.cuisine_type === cuisine));
    }

    /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
    static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
        return DBHelper.fetchRestaurants()
            .then(restaurants => restaurants.filter(r => r.neighborhood === neighborhood));
        
    }

    /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
        return DBHelper.fetchRestaurants()
            .then(restaurants => {
                let results = restaurants;
                if (cuisine !== 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood !== 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                return results;
            
            });
    }

    
    /**
   * Fetch all neighborhoods with proper error handling.
   */
    static fetchNeighborhoods() {
    // Fetch all restaurants
        return DBHelper.fetchRestaurants().then(restaurants => {
            const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
            // Remove duplicates from neighborhoods
            const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
            return uniqueNeighborhoods;
        });
    }

    /**
   * Fetch all cuisines with proper error handling.
   */
    static fetchCuisines(callback) {
    // Fetch all restaurants
        return DBHelper.fetchRestaurants().then(restaurants => {
            const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
            // Remove duplicates from cuisines
            const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
            return uniqueCuisines;
            
        });
    }

    /**
   * Restaurant page URL.
   */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
   * Restaurant image URL.
   */
    static imageUrlForRestaurant(restaurant) {
        fetch(`/images/${restaurant.photograph}-thumbnail.webp`);
    }

    static retinaUrlForRestaurant(restaurant) {
        return (`/${restaurant.retina}`);
    }

    /** Alt tags for images **/
    static altTagsForImages(restaurant) {
        return(restaurant.name);
    }


    /**
   * Map marker for a restaurant.
   */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new L.Marker([restaurant.latlng.lat, restaurant.latlng.lng], {
            title: restaurant.name,
            alt: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
        });
        marker.addTo(newMap);
        return marker;
    }

    /*
* Add Reviews 
*/
    static addReview(review) {
        let offline = {
            name: 'addUserReview',
            data: review,
            object_type: 'review'
        };

        //Check if user is online
        if(!navigator.onLine && (offline.name === 'addUserReview')) {
            DBHelper.sendReviewsWhenOnline(offline);
            return;
        }

        const sendReview = {
            'name': review.name,
            'rating': parseInt(review.rating),
            'comments': review.comments,
            'restaurant_id': parseInt(review.restaurant_id)
        };

        const fetchHeaders = {
            method: 'POST',
            body: JSON.stringify(sendReview),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        };

        fetch(DBHelper.DATABASE_URL + 'reviews', fetchHeaders)
            .then(response => {
                const contentType = response.headers.get('content-type');
                if(contentType && contentType.indexOf('application/json') !== -1) {
                    return response.json();
                } else {
                    return 'API callback was a success';
                }
            }).then(data =>{
                console.log(data);
            }).catch(error => {
                console.log(error);
            });
    }

    /**
 * Send data when offline
 */
    static sendReviewsWhenOnline(offline) {
        localStorage.setItem('data', JSON.stringify(offline.data));
    
        window.addEventListener('online', event => {
            const data = JSON.parse(localStorage.getItem('data'));
            [...document.querySelectorAll('.offline')]
                .forEach(el => {
                    el.classList.remove('offline');
                    el.querySelector('.offline_label').remove();
                });

            if(data !== null) {
                if(offline.name === 'addUserReview') {
                    DBHelper.addReview(offline.data);
                }

                localStorage.removeItem('data');
            }
        });
    }

    /**
     * Update the status of favourite restaurants
     */
    static updateFavouriteRestaurant(restaurantId, isFavourite) {
        fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavourite}`, {
            method: 'PUT'
        }).then(() => {
            this.dbPromise().then(db => {
                const tx = db.transaction('restaurants', 'readwrite');
                const restaurantStore = tx.objectStore('restaurants');
                restaurantStore.get(restaurantId).then(restaurant => {
                    restaurant.is_favorite = isFavourite;
                    restaurantStore.put(restaurant);
                });
            });
        });
    }
    
  

    /**
 * fetch all reviews
 */

    static storeIndexedDB(table, objects) {
        this.dbPromise.then(function(db) {
            if (!db) return;

            let tx = db.transaction(table, 'readwrite');
            const store = tx.objectStore(table);
            if (Array.isArray(objects)) {
                objects.forEach(function(object) {
                    store.put(object);
                });
            } else {
                store.put(objects);
            }
        });
    }

    /**
     * Get the stored object reviews by id
     */
    static getStoredById(table, indx, id) {
        return this.dbPromise().then(db => {
            if(!db) {
                return;
            }
            const store = db.transaction(table).objectStore(table);
            const indexId = store.index(indx);
            return indexId.getAll(id);
        });
    }

    /**
 Fetch reviews by id
* */   

    static fetchReviewsById(id) {
        return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
            .then(response => response.json())
            .then(reviews => {
                this.dbPromise().then(db => {
                    if(!db) {
                        return;
                    }
                    const tx = db.transaction('reviews', 'readwrite');
                    const reviewStore = tx.objectStore('reviews');
                    if(Array.isArray(reviews)) {
                        reviews.forEach(review => {
                            reviewStore.put(review);
                        });
                    } else {
                        reviewStore.put(reviews);
                    }
                });
                return Promise.resolve(reviews);
            }).catch(() => {
                return DBHelper.getStoredById('reviews', 'restaurant', id)
                    .then(storedReviews => {
                        return Promise.resolve(storedReviews);
                    });
            
            });
    }

  

}


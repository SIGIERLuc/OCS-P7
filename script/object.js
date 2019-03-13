//Création du restaurant
function restaurantGeneration(restaurantList, restaurant, i) {
    var element = {
        id: restaurant[i].restaurantName.replace(/\s+/g, '') + Math.round(restaurant[i].lat * 10000000),
        info: restaurant[i]
    }

    if (!restaurantList[element.id]) {
        /* Calcul de la moyenne du restaurant */
        if (element.info.ratings) {
            var restaurantRating = element.info.ratings;
            var raitingsMoyenne = 0;

            for (var party of Object.keys(restaurantRating)) {
                var raitingsMoyenne = raitingsMoyenne + restaurantRating[party].rating;
            }
            element.average = Math.round(raitingsMoyenne / restaurantRating.length);
        }
        /* Création de l'objet LATLONG utiliser par google map */
        element.info.coords = new google.maps.LatLng(element.info.lat, element.info.lng);

        /* Insertion de l'objet dans la list des restaurant */
        restaurantList[element.id] = element;
    }

}


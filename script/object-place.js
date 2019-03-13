//Création du restaurant
function restaurantGeneration(restaurant) {
    /* console.log(restaurant); */
    if (restaurant.result) {
        var element = {
            id: restaurant.result.id,
            result: restaurant.result
        }
        if (!restaurantList[element.id]) {
            /* Calcul de la moyenne du restaurant */
            element.result.rating = Math.round(element.result.rating);

            /* Création de l'objet LATLONG utiliser par google map */
            element.coords = element.result.geometry.location;

            /* Insertion de l'objet dans la list des restaurant */
            restaurantList[element.id] = element;
        }
    }
    /* console.log(restaurantList) */
}
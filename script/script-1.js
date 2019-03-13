console.log(document.location.href);
var focusRestaurant = {
    valid: false,
    coords: "",
    marker: ""
};
var markers = [];
var divList = document.getElementById("list");
var map;
var activeInfoWindow;
var highlight;
var restaurantList = {};
var reviewStarsInfo = _.debounce(attrStarsInfo, 100);
var debounceActualize = _.debounce(request, 100);


/* Initialisation de la map */
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: new google.maps.LatLng(45.9027226, 6.1169521),
        mapTypeId: "terrain",
        styles: [
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }
        ]
    });
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var image = "../img/red-pushpin.png";
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var marker = new google.maps.Marker({
                position: pos,
                map: map,
                title: "Vous êtes ici !",
                icon: image
            });

            map.setCenter(pos);
        });
    }
    /* Actualise les restaurant afficher si les limites de la carte change */
    google.maps.event.addListener(map, "bounds_changed", function () {
        debounceActualize();
    });
    /* Ferme l"infoWindow et enlève le focus si on clique a coter du restaurant Highlighter */
    google.maps.event.addListener(map, "click", function (e) {
        cleanFocus(focusRestaurant, highlight, activeInfoWindow);
    });

    if (document.location.href === "https://snifferwolf.com/p7/html/googleAPI-2.html") {
        google.maps.event.addListener(map, "dblclick", function (e) {
            restaurantForm(e);
        });
    }
}
/* event listener */
document.getElementsByName("ratingFilterMin")[0].addEventListener('change', request);
document.getElementsByName("ratingFilterMax")[0].addEventListener('change', request);

function request() {
    if (map.zoom >= 15) {

        var requestURL = '../json/restaurant.json';
        var request = new XMLHttpRequest();
        request.open('GET', requestURL);

        request.responseType = 'json';

        request.onload = function () {
            var restaurant = request.response;
            for (var i = 0; i < restaurant.length; i++) {
                restaurantGeneration(restaurantList, restaurant, i);
            }
            displayRestaurant();

        };
        request.send();
    }
    else {
        $(divList).empty();
        setMapOnAll(null);
    }

}

// Loop through the json and place a marker for each
// set of coordinates

function displayRestaurant() {
    var bounds = map.getBounds();
    for (var i of Object.keys(restaurantList)) {
        var divDisplay;
        var ratingNumber = 0;
        var coords = [restaurantList[i].info.lat, restaurantList[i].info.lng];
        var restaurantName = restaurantList[i].info.restaurantName;
        var restaurantID = restaurantList[i].id;
        var restaurantAddress = restaurantList[i].info.address;
        var reviewArray = restaurantList[i].info.ratings;
        var review = "<h4>" + restaurantName + "</h4>" + "<p>" + restaurantAddress + "</p>";

        if (bounds.contains(restaurantList[i].info.coords) === true) {

            var markerCache = (restaurantList[i].marker) ? restaurantList[i].marker : false;

            if (!restaurantList[i].average) {
                average = 0;
            }
            else {
                average = restaurantList[i].average;
            }

            var filter = ratingFilter(average, i);
            if (filter === false && focusRestaurant.marker === restaurantList[i].marker) {
                cleanFocus(focusRestaurant, highlight, activeInfoWindow);
            }
            var checkingExist = document.getElementById(restaurantID);
            if (filter === true && checkingExist === null) {
                if (restaurantList[i].marker) {
                    restaurantList[i].marker.setMap(map);
                }
                $("<div></div>").appendTo("#list").attr({ "id": restaurantID, class: "push" }).click(
                    function () {
                        cleanFocus(focusRestaurant, highlight, activeInfoWindow);

                        /* Ne pas oublier de fermer l'infowindow */

                        /*Changement de l"icone du restaurant sélectionner
                        + Focus du restaurant dans la liste
                        + centrage de la carte sur le restaurant*/

                        highlight = this;
                        divList.scrollTop = 0;
                        focusRestaurant.valid = true;
                        focusRestaurant.coords = restaurantList[this.id].info.coords;
                        focusRestaurant.marker = restaurantList[this.id].marker;
                        focusRestaurant.marker.setIcon("../img/restaurant-selected.png");


                        $(highlight).addClass("highlight");
                        $(highlight).parent().prepend($(highlight));
                    }
                );
                $("<h4></h4>").appendTo("#" + restaurantID).html(restaurantName);
                $("<p></p>").appendTo("#" + restaurantID).html(restaurantAddress);

                divDisplay = $("<div></div>").appendTo("#" + restaurantID).attr("id", restaurantID + "img");
                $("<img>").appendTo(divDisplay).attr({ src: "https://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + coords[0] + "," + coords[1] + "&heading=151.78&pitch=-0.76&key=AIzaSyDvAcN31KO1DCVk-F4aKMOuwEyy1dT-jpY", class: "img-fluid previewImg" });
                $("<div></div>").appendTo(divDisplay).attr({ class: "starrr", id: "starrr" + restaurantID });
                $("#starrr" + restaurantID).starrr({
                    rating: average,
                    max: 5,
                    readOnly: true
                });

                $("<button></button>").appendTo("#" + restaurantID).attr({ "type": "button", "class": "btn btn-info custom-btn", "data-toggle": "collapse", "data-target": "#review" + i, "title": "Lire les commentaires" }).html("Commentaires");
                if (document.location.href === "https://snifferwolf.com/p7/html/googleAPI-2.html") {
                    $("<button></button>").appendTo("#" + restaurantID).attr({ "type": "button", "class": "btn btn-info custom-btn", "id": restaurantID, "title": "Ajouter un commentaire" }).click(
                        function () {
                            commentForm(this.id);
                        }
                    ).html("+");
                }
                $("<div></div>").appendTo("#" + restaurantID).attr({ class: "collapse reviewList", id: "review" + i });

                if (!reviewArray) {
                    $("<div></div>").appendTo("#review" + i).attr({ id: "comment" + restaurantID, class: "row" });
                    $("<p></p>").appendTo("#comment" + restaurantID).html("Il n'y a pas de commentaire pour ce restaurant.").attr({ class: "col-sm-11 noComment" });
                }

                if (reviewArray) {

                    for (ratingNumber of Object.keys(reviewArray)) {
                        if ($("#comment" + restaurantID)) {
                            $("#comment" + restaurantID).remove();
                        }
                        $("<div></div>").appendTo("#review" + i).attr({ id: "comment" + restaurantID + ratingNumber, class: "row" });
                        $("<p></p>").appendTo("#comment" + restaurantID + ratingNumber).html(reviewArray[ratingNumber].text).attr({ class: "col-sm-8 push" });
                        $("<div></div>").appendTo("#comment" + restaurantID + ratingNumber).attr({ class: "starrr col-sm-3", id: restaurantID + ratingNumber });
                        $("<hr>").insertAfter("#comment" + restaurantID + ratingNumber);
                        review = review + "<p>" + reviewArray[ratingNumber].text + "</p>"
                            + "<div class='starrr' id='info" + restaurantID + reviewArray[ratingNumber].time + "'></div>"
                            + "<hr></hr>";
                        $("#" + restaurantID + ratingNumber).starrr({
                            rating: reviewArray[ratingNumber].rating,
                            max: 5,
                            readOnly: true
                        });
                    }
                }

                restaurantList[i].infoWindowContent = review;
                restaurantList[i].infoWindow = new google.maps.InfoWindow({
                    content: review
                });

                restaurantList[i].infoWindow.addListener("closeclick", function () {
                    cleanFocus(focusRestaurant, highlight, activeInfoWindow)
                });

                $("<hr>").appendTo("#" + restaurantID);

                //Add DOM element END
                if (markerCache === false) {
                    restaurantList[i].marker = addMarker(restaurantList[i].info.coords, restaurantName, restaurantID);
                }
            }
            if (filter === false) {
                cleaningRestaurant(restaurantID);
                if (restaurantList[i].marker) {
                    restaurantList[i].marker.setMap(null);
                }
            }


        }
        if (bounds.contains(restaurantList[i].info.coords) === false) {
            if (document.getElementById(restaurantID)) {
                cleaningRestaurant(restaurantID);
            }
            if (restaurantList[i].infoWindow) {
                restaurantList[i].infoWindow.close();
            }

        }
    }
    if (focusRestaurant.valid !== false) {
        if (bounds.contains(focusRestaurant.coords) === false) {
            cleanFocus(focusRestaurant, highlight, activeInfoWindow);
        }
    }
}

function ratingFilter(average) {
    var starMin = $("#ratingFilterMin").val();
    var starMax = $("#ratingFilterMax").val();
    if (average >= starMin && average <= starMax) {
        return true;
    }
    return false;
}

function cleanFocus(focusRestaurant, highlight, activeInfoWindow) {
    if (focusRestaurant.marker) {
        focusRestaurant.marker.setIcon("../img/restaurant.png");
        $(highlight).removeClass("highlight");
    }
    if (activeInfoWindow) {
        activeInfoWindow.close();
    }
}

function cleaningRestaurant(restaurantName) {
    $("#" + restaurantName).remove();
}

function addMarker(location, name, value) {
    /* Création du marker pour le restaurant */
    var image = "../img/restaurant.png";
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: name,
        icon: image
    });
    /* Ajout d"un evenement clique sur le marker */
    marker.addListener("click", function () {
        /* Fermeture de l"ancien infoWindow et suppression du focus*/
        cleanFocus(focusRestaurant, highlight, activeInfoWindow);

        /* Paramétrage et ouverture du nouvel infoWindow
        + Focus sur le restaurant*/
        restaurantList[value].infoWindow.open(map, marker);

        if (restaurantList[value].info.ratings) {
            reviewStarsInfo(restaurantList[value].id, restaurantList[value].info.ratings);
        }
        focusRestaurant.valid = true;
        focusRestaurant.coords = restaurantList[value].info.coords;
        activeInfoWindow = restaurantList[value].infoWindow;
        focusRestaurant.marker = restaurantList[value].marker;
        marker.setIcon("../img/restaurant-selected.png");


        highlight = $("#" + restaurantList[value].id);
        $(highlight).addClass("highlight");

        divList.scrollTop = 0;
        $(highlight).parent().prepend($(highlight));

    });
    markers.push(marker);
    return marker;
}

function attrStarsInfo(restaurantID, reviewArray) {
    /* Attribution des étoiles dans l"infoWindow */
    for (var party of Object.keys(reviewArray)) {
        $("#info" + restaurantID + reviewArray[party].time).starrr({
            rating: reviewArray[party].rating,
            max: 5,
            readOnly: true
        });
    }
}

function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}



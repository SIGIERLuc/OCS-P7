
/* Ajout du gif de chargement pendant les requests ajax */
$body = $("body");

$(document).on({
    ajaxStart: function () { $body.addClass("loading"); },
    ajaxStop: function () { $body.removeClass("loading"); displayRestaurant(); }
});
var focusRestaurant = {
    valid: false,
    coords: "",
    marker: ""
};
var markers = [];
var divList = document.getElementById("list");
var map;
var requestDone;
var activeInfoWindow;
var highlight;
var restaurantList = {};
var reviewStarsInfo = _.debounce(attrStarsInfo, 100);
var debounceActualize = _.debounce(placeCall, 100);


/* Initialisation de la map */
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
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
    /* Ajoute un restaurant si un double clique est effectuer sur la carte */
    google.maps.event.addListener(map, "dblclick", function (e) {
        restaurantForm(e);
    });
    /* Ferme l"infoWindow et enlève le focus si on clique a coter du restaurant Highlighter */
    google.maps.event.addListener(map, "click", function (e) {
        cleanFocus(focusRestaurant, highlight, activeInfoWindow);
    });
}


/* Ajout des event listener sur les filtre d"étoiles */
document.getElementsByName("ratingFilterMin")[0].addEventListener("change", placeCall);
document.getElementsByName("ratingFilterMax")[0].addEventListener("change", placeCall);



function placeCall() {
    /* Place Api request en fonction du zoom */
    if (map.zoom >= 15) {
        var mapCenter = map.getCenter();
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch({
            location: mapCenter,
            radius: 450,
            type: ["restaurant"]
        }, ajaxRequest);
    }
    else {
        $(divList).empty();
        setMapOnAll(null);
    }
}

function ajaxRequest(results, status) {
    var a = 0;
    var bounds = map.getBounds();
    if (map.zoom <= 17) {
        results = starFilter(results);
    }
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            /* Crée les restaurant et les afficher */
            if (!restaurantList[results[i].id] && bounds.contains(results[i].geometry.location)) {
                var proxyurl = "https://cors-anywhere.herokuapp.com/";
                var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + results[i].place_id + "&fields=geometry,vicinity,name,formatted_phone_number,id,rating,reviews&key=AIzaSyDvAcN31KO1DCVk-F4aKMOuwEyy1dT-jpY"; // site that doesn’t send Access-Control-*

                var request = $.get(proxyurl + url, function () {

                }).success(function (data) {
                    restaurantGeneration(data);
                    a++
                }).fail(function () { });
            }
        }
    }
    if (a === 0) {
        displayRestaurant();
    }
}



function displayRestaurant() {
    var bounds = map.getBounds();
    for (var i of Object.keys(restaurantList)) {
        var divDisplay;
        var ratingNumber = 0;
        var coords = [restaurantList[i].result.geometry.location.lat, restaurantList[i].result.geometry.location.lng];
        var restaurantName = restaurantList[i].result.name;
        var restaurantID = restaurantList[i].id;
        var restaurantAddress = restaurantList[i].result.vicinity;
        var reviewArray = restaurantList[i].result.reviews;
        var review = "<h4>" + restaurantName + "</h4>" + "<p>" + restaurantAddress + "</p>";

        if (bounds.contains(restaurantList[i].coords) === true) {
            if (restaurantList[i].marker) {
                restaurantList[i].marker.setMap(map);
            }

            var markerCache = (restaurantList[i].marker) ? restaurantList[i].marker : false;

            if (!restaurantList[i].result.rating) {
                average = 0;
            }
            else {
                average = restaurantList[i].result.rating;
            }

            var filter = ratingFilter(average, i);
            if (filter === false && focusRestaurant.marker === restaurantList[i].marker) {
                cleanFocus(focusRestaurant, highlight, activeInfoWindow);
            }
            var checkingExist = document.getElementById(restaurantID);
            if (filter === true && checkingExist === null) {

                /* Crée une var pour ensuite appenTo(VAR) */$("<div></div>").appendTo("#list").attr({ "id": restaurantID, class: "push" }).click(
                function () {
                    cleanFocus(focusRestaurant, highlight, activeInfoWindow);

                    /* Ne pas oublier de fermer l'infowindow */

                    /*Changement de l"icone du restaurant sélectionner
                    + Focus du restaurant dans la liste
                    + centrage de la carte sur le restaurant*/

                    highlight = this;
                    divList.scrollTop = 0;
                    focusRestaurant.valid = true;
                    focusRestaurant.coords = restaurantList[this.id].coords;
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
                $("<button></button>").appendTo("#" + restaurantID).attr({ "type": "button", "class": "btn btn-info custom-btn", "id": restaurantID, "title": "Ajouter un commentaire" }).click(
                    function () {
                        commentForm(this.id);

                    }
                ).html("+");

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
                        $("<hr>").appendTo("#comment" + restaurantID + ratingNumber);
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

                restaurantList[i].result.infoWindowContent = review;
                restaurantList[i].infoWindow = new google.maps.InfoWindow({
                    content: review
                });

                restaurantList[i].infoWindow.addListener("closeclick", function () {
                    cleanFocus(focusRestaurant, highlight, activeInfoWindow)
                });

                $("<hr>").appendTo("#" + restaurantID);

                //Add DOM element END
                if (markerCache === false) {
                    restaurantList[i].marker = addMarker(restaurantList[i].coords, restaurantName, restaurantID);
                }
            }
            if (filter === false) {
                cleaningRestaurant(restaurantID);
                if (restaurantList[i].marker) {
                    restaurantList[i].marker.setMap(null);
                }
            }


        }
        if (bounds.contains(restaurantList[i].coords) === false) {
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

function commentForm(id) {

    var dialog, form,
        comment = $("#comment"),
        ratings = $("#ratings"),
        allFields = $([]).add(comment).add(ratings),
        tips = $(".validateTips");


    function updateTips(t) {
        tips
            .text(t)
            .addClass("ui-state-highlight");
        setTimeout(function () {
            tips.removeClass("ui-state-highlight", 1500);
        }, 500);
    }

    function checkLength(o, n, min, max) {
        if (o.val().length > max || o.val().length < min) {
            o.addClass("ui-state-error");
            updateTips("Le commentaire doit faire entre " +
                min + " et " + max + " caractères.");
            return false;
        } else {
            return true;
        }
    }
    function checkValue(o, n, min, max) {
        if (o.val() > max || o.val() < min) {
            o.addClass("ui-state-error");
            updateTips("La note du commentaire doit se trouver entre " +
                min + " et " + max + " étoiles.");
            return false;
        } else {
            return true;
        }
    }

    function addComment() {
        var valid = true;
        allFields.removeClass("ui-state-error");

        valid = valid && checkLength(comment, "comment", 3, 140);
        valid = valid && checkValue(ratings, "ratings", 0, 5);


        if (valid) {
            var newReview = {
                rating: parseInt(ratings.val()),
                text: comment.val(),
                time: Date.now()
            };
            if (!restaurantList[id].result.reviews) {
                var reviews = [];
                restaurantList[id].result.reviews = reviews;
            }
            restaurantList[id].result.reviews.push(newReview);
            updateTips("*Tout les champs sont requis");
            refresh(restaurantList[id]);
            dialog.dialog("close");
        }
        return valid;
    }

    dialog = $("#review-form").dialog({
        dialogClass: "no-close",
        autoOpen: false,
        height: 400,
        width: 350,
        modal: true,
        buttons: {
            "Ajouter le commentaire": addComment,
            "Annuler": function () {
                dialog.dialog("close");
            }
        },
        close: function () {
            form[0].reset();
            allFields.removeClass("ui-state-error");
        },
    });

    form = dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        addComment();
    });
    dialog.dialog("open");


}

function refresh(element) {
    /* Mise à jour de la moyenne du restaurant */

    var reviewArray = element.result.reviews;
    var average = 0;
    if (reviewArray[0].rating) {
        for (var party of Object.keys(reviewArray)) {
            average = average + reviewArray[party].rating;
        }
        element.result.rating = Math.round(average / reviewArray.length);
    }
    $("#starrr" + element.id).remove();
    $("<div></div>").appendTo("#" + element.id + "img").attr({ class: "starrr", id: "starrr" + element.id });
    $("#starrr" + element.id).starrr({
        rating: element.result.rating,
        max: 5,
        readOnly: true
    });

    /* Ajout du dernier commentaire au restaurant */
    if ($("#comment" + element.id)) {
        $("#comment" + element.id).remove();
    }
    var ratingNumber = reviewArray[reviewArray.length - 1].time;
    var comment = element.result.infoWindowContent;
    var divComment = $("<div></div>").appendTo("#review" + element.id).attr({ id: "comment" + element.id + ratingNumber, class: "row" });
    $("<p></p>").appendTo(divComment).html(reviewArray[reviewArray.length - 1].text).attr({ class: "col-sm-8 push" });
    $("<div></div>").appendTo(divComment).attr({ class: "starrr col-sm-3", id: element.id + ratingNumber });
    comment = comment + "<p>" + reviewArray[reviewArray.length - 1].text + "</p>"
        + "<div class='starrr' id='info" + element.id + ratingNumber + "'></div>"
        + "<hr></hr>";
    $("#" + element.id + ratingNumber).starrr({
        rating: reviewArray[reviewArray.length - 1].rating,
        max: 5,
        readOnly: true
    });
    /* Mise à jour de l"infoWindow */

    element.result.infoWindowContent = comment;
    element.infoWindow.close();

    element.infoWindow = new google.maps.InfoWindow({
        content: comment
    });
    element.infoWindow.addListener("closeclick", function () {
        cleanFocus(focusRestaurant, highlight, activeInfoWindow)
    });

    element.infoWindow.open(map, element.marker);
    if (element.result.reviews) {
        reviewStarsInfo(element.id, element.result.reviews);
    }

    /* Mise en valeur du restaurant dans la liste */

    highlight = $("#" + element.id);
    $(highlight).addClass("highlight");
    activeInfoWindow = element.infoWindow;
    $(highlight).parent().prepend($(highlight));


}

function restaurantForm(e) {

    var dialog, form,

        name = $("#name"),
        address = $("#address"),
        comment = $("#commentRestaurant"),
        ratings = $("#ratingsRestaurant"),
        allFields = $([]).add(name).add(address).add(comment).add(ratings),
        tips = $(".validateTips");


    function updateTips(t) {
        tips
            .text(t)
            .addClass("ui-state-highlight");
        setTimeout(function () {
            tips.removeClass("ui-state-highlight", 1500);
        }, 500);
    }

    function checkLength(o, n, min, max) {
        if (o.val().length > max || o.val().length < min) {
            o.addClass("ui-state-error");
            updateTips("Les informations doivent faire entre " +
                min + " et " + max + " caractères.");
            return false;
        } else {
            return true;
        }
    }
    function checkValue(o, n, min, max) {
        if (o.val() > max || o.val() < min) {
            o.addClass("ui-state-error");
            updateTips("La note du commentaire doit se trouver entre " +
                min + " et " + max + " étoiles.");
            return false;
        } else {
            return true;
        }
    }


    function addRestaurant() {
        var valid = true;
        allFields.removeClass("ui-state-error");
        valid = valid && checkLength(name, "name", 1, 140);
        valid = valid && checkLength(address, "address", 1, 140);
        valid = valid && checkLength(comment, "comment", 1, 140);
        valid = valid && checkValue(ratings, "ratings", 0, 5);

        if (valid) {
            var newRestaurant = {
                name: name.val(),
                address: address.val(),
                rating: parseInt(ratings.val()),
                text: comment.val()
            };
            updateTips("*Tout les champs sont requis");
            createRestaurant(newRestaurant.name, newRestaurant.address, newRestaurant.text, newRestaurant.rating, e);
            dialog.dialog("close");
        }
        return valid;
    }

    dialog = $("#restaurant-form").dialog({
        dialogClass: "no-close",
        autoOpen: false,
        height: 400,
        width: 350,
        modal: true,
        buttons: {
            "Ajouter le restaurant": addRestaurant,
            "Annuler": function () {
                dialog.dialog("close");
            }
        },
        close: function () {
            form[0].reset();
            allFields.removeClass("ui-state-error");
        },
    });

    form = dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        addRestaurant();
    });
    dialog.dialog("open");


}

function createRestaurant(name, address, comment, ratings, e) {
    /* Création de l"objet restaurant */
    var cursorPosition = e["latLng"];
    var newRestaurant = {
        result: {
            name: name,
            vicinity: address,
            geometry: {
                location: {
                    lat: cursorPosition.lat(),
                    lng: cursorPosition.lng(),
                },
            },

            reviews: [{
                rating: ratings,
                text: comment
            }]
        },
        id: "",
    };
    /* Attribution des paramètre manquant défini par les paramètre existant */
    newRestaurant.coords = new google.maps.LatLng(newRestaurant.result.geometry.location.lat, newRestaurant.result.geometry.location.lng);

    var reviewArray = newRestaurant.result.reviews;
    var average = 0;
    if (reviewArray[0].rating) {
        for (var party of Object.keys(reviewArray)) {
            average = average + reviewArray[party].rating;
        }
        newRestaurant.result.rating = Math.round(average / reviewArray.length);
    }
    newRestaurant.id = newRestaurant.result.name.replace(/\s+/g, "") + Math.round(newRestaurant.result.geometry.location.lat * 10000000);
    if (!restaurantList[newRestaurant.id]) {
        restaurantList[newRestaurant.id] = newRestaurant;

        /* Affichage du restaurant si présent dans les limites de la carte */
        var bounds = map.getBounds();
        if (bounds.contains(newRestaurant.coords) === true) {
            displayRestaurant();
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

function cleaningRestaurant(restaurantName) {
    $("#" + restaurantName).remove();
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
        + Focus sur le restaurant et centrage de la carte*/
        restaurantList[value].infoWindow.open(map, marker);

        if (restaurantList[value].result.reviews) {
            reviewStarsInfo(restaurantList[value].id, restaurantList[value].result.reviews);
        }
        focusRestaurant.valid = true;
        focusRestaurant.coords = restaurantList[value].coords;
        focusRestaurant.marker = restaurantList[value].marker;
        activeInfoWindow = restaurantList[value].infoWindow;
        marker.setIcon("../img/restaurant-selected.png");

        highlight = $("#" + restaurantList[value].id);
        $(highlight).addClass("highlight");

        divList.scrollTop = 0;
        $(highlight).parent().prepend($(highlight));

    });
    markers.push(marker);
    return marker;
}

function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function starFilter(results) {
    switch (map.zoom) {
        case 17:
            results = results.filter(function (obj) {
                return obj.rating > '3.5';
            });
            break;

        case 16:
            results = results.filter(function (obj) {
                return obj.rating > '4';
            });
            break;

        case 15:
            results = results.filter(function (obj) {
                return obj.rating > '4.5';
            });
            break;
    }
    return results;
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
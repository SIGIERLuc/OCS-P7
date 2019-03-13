
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
                text: comment.val(),
                rating: parseInt(ratings.val()),
                time: Date.now()
            };
            if (!restaurantList[id].info.ratings) {
                var reviews = [];
                restaurantList[id].info.ratings = reviews;
            }
            restaurantList[id].info.ratings.push(newReview);
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

function refresh(element) {
    /* Mise à jour de la moyenne du restaurant */

    var reviewArray = element.info.ratings;
    var average = 0;
    if (reviewArray[0].rating) {
        for (var party of Object.keys(reviewArray)) {
            average = average + reviewArray[party].rating;
        }
        element.average = Math.round(average / reviewArray.length);
    }
    $("#starrr" + element.id).remove();
    $("<div></div>").appendTo("#" + element.id + "img").attr({ class: "starrr", id: "starrr" + element.id });
    $("#starrr" + element.id).starrr({
        rating: element.average,
        max: 5,
        readOnly: true
    });

    /* Ajout du dernier commentaire au restaurant */
    if ($("#comment" + element.id)) {
        $("#comment" + element.id).remove();
    }
    var ratingNumber = reviewArray[reviewArray.length - 1].time;
    var commentInfoWindow = element.infoWindowContent;
    var divComment = $("<div></div>").appendTo("#review" + element.id).attr({ id: "comment" + element.id + ratingNumber, class: "row" });
    $("<p></p>").appendTo(divComment).html(reviewArray[reviewArray.length - 1].text).attr({ class: "col-sm-8 push" });
    $("<div></div>").appendTo(divComment).attr({ class: "starrr col-sm-3", id: element.id + ratingNumber });
    commentInfoWindow = commentInfoWindow + "<p>" + reviewArray[reviewArray.length - 1].text + "</p>"
        + "<div class='starrr' id='info" + element.id + ratingNumber + "'></div>"
        + "<hr></hr>";
    $("#" + element.id + ratingNumber).starrr({
        rating: reviewArray[reviewArray.length - 1].rating,
        max: 5,
        readOnly: true
    });
    /* Mise à jour de l"infoWindow */

    element.infoWindowContent = commentInfoWindow;
    element.infoWindow.close();

    element.infoWindow = new google.maps.InfoWindow({
        content: commentInfoWindow
    });
    element.infoWindow.addListener("closeclick", function () {
        cleanFocus(focusRestaurant, highlight, activeInfoWindow)
    });

    element.infoWindow.open(map, element.marker);
    if (element.info.ratings) {
        reviewStarsInfo(element.id, element.info.ratings);
    }

    /* Mise en valeur du restaurant dans la liste */

    highlight = $("#" + element.id);
    $(highlight).addClass("highlight");
    activeInfoWindow = element.infoWindow;
    $(highlight).parent().prepend($(highlight));


}

function createRestaurant(name, address, comment, ratings, e) {
    /* Création de l"objet restaurant */
    var cursorPosition = e["latLng"];
    var newRestaurant = {
        info: {
            restaurantName: name,
            address: address,
            lat: cursorPosition.lat(),
            lng: cursorPosition.lng(),
            ratings: [{
                rating: ratings,
                text: comment
            }]
        },
        id: "",
    };
    /* Attribution des paramètre manquant défini par les paramètre existant */
    newRestaurant.info.coords = new google.maps.LatLng(newRestaurant.info.lat, newRestaurant.info.lng);

    var reviewArray = newRestaurant.info.ratings;
    var average = 0;
    if (reviewArray[0].rating) {
        for (var party of Object.keys(reviewArray)) {
            average = average + reviewArray[party].rating;
        }
        newRestaurant.average = Math.round(average / reviewArray.length);
    }
    newRestaurant.id = newRestaurant.info.restaurantName.replace(/\s+/g, "") + Math.round(newRestaurant.info.lat * 10000000);
    if (!restaurantList[newRestaurant.id]) {
        restaurantList[newRestaurant.id] = newRestaurant;

        /* Affichage du restaurant si présent dans les limites de la carte */
        var bounds = map.getBounds();
        if (bounds.contains(newRestaurant.info.coords) === true) {
            displayRestaurant();
        }
    }




}
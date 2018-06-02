var pageCount = 0;

//  FUNCTIONS
//  Event API call function using ajax
function displayEvents(location, page, searchTerm, zipcode, within) {
  $("#dynamic-content").css("display", "block");
  $.ajax({
    async: true,
    crossDomain: true,
    url: "https://obscure-gorge-69381.herokuapp.com/https://api.eventful.com/json/events/search?...&app_key=4xmNBd2Pb7vPw3Rz&l=" + location + zipcode + within + searchTerm + "&page_size=20&page_number=" + page + "&date=Future&sort_order=popularity",
    method: 'GET'
  }).then(function (response) {
    console.log(JSON.parse(response));

    if (JSON.parse(response).total_items === "0") {
      $("#search-error").html("Your search did not produce any results. Please try again.");
    }
    else {

      var eventResults = JSON.parse(response).events.event;
      var pageTotal = JSON.parse(response).page_count;

      //  loop through the results and combine html elements with search results
      for (let i = 0; i < eventResults.length; i++) {
        const element = eventResults[i];
        var eventDiv = $("<div class='event-container event-anime" + page + "'>");
        var eventInfo = $("<div class='event-info-container'>");
        var addBtn = $("<button class='button add-event-btn'>");
        var eventImg = $("<img class='event-poster'>");
        var eventDate = $("<h5 class='event-date'>").text(moment(element.start_time).format("YYYY-MM-DD") + " @ " + moment(element.start_time).format("h:mm a"));
        var eventTitle = $("<p class='event-title'>").text(element.title);
        var eventCity = $("<h6 class='event-city'>" + element.venue_name + " - " + element.city_name + ", " + element.region_abbr + "<br><a href='" + element.url + "' class='event-link' target='_blank'>More info</a></h6>");

        //  Some event ids include date info preceded by an '@' symbol, which creates an error when using that as a firebase object key, so the following checks for '@' and uses everything before it as the id.
        var altId;
        if (element.id.includes("@")) {
          altId = element.id.split("@").shift();
          addBtn.attr("event-id", altId);
        }
        else {
          addBtn.attr("event-id", element.id);
        }

        //  Some API responses from eventful don't include an image, and a few have an image but add 'http:' to the image url. The following checks to make sure there is an image, and whether the image url in the API response includes http (which will return true whether it's http or https). If there is no image, a generic default is used; if there is no http, this adds https:
        if (element.image === null) {
          eventImg.attr("src", "assets/images/narf.png");
        } else if (element.image.medium.url.includes("http")) {
          eventImg.attr("src", element.image.medium.url);
        } else {
          eventImg.attr("src", "https:" + element.image.medium.url);
        }

        //  Append each individual result to the 'dynamic-content' div
        addBtn.attr("start-time", element.start_time);
        addBtn.text("Add");
        eventDiv.append(addBtn);
        eventDiv.append(eventImg);
        eventInfo.append(eventTitle);
        eventInfo.append(eventDate);
        eventInfo.append(eventCity);
        eventDiv.append(eventInfo);
        $("#dynamic-content").append(eventDiv);
        $("#dynamic-content").append("<hr>");
      }

      //  Greensock animation - getting the class with the current page number prevents it from reanimating existing items when you are only loading more results ("Load More Results" button).
      var eventObject = $(".event-anime" + page);
      TweenMax.staggerFrom(eventObject, 1.5, {
        opacity: 0,
        rotationX: "720eg",
        left: "800px",
        ease: Power2.easeOut
      }, 0.2);

      //  increment flag variables
      pageNumber++;
      pageCount++;

      //  Conditional to control whether a "Load More Results" button is needed
      if (pageTotal > pageCount) {

        //  Creates a "Load More Results" button with all necessary search parameters embedded as attributes
        var moreResultsBtn = $("<button class='button'>");
        moreResultsBtn.attr("id", "more-event-results");
        moreResultsBtn.attr("location", location);
        moreResultsBtn.attr("zipcode", zipcode);
        moreResultsBtn.attr("within", within);
        moreResultsBtn.attr("increment", page);
        moreResultsBtn.attr("search-term", searchTerm);
        moreResultsBtn.text("Load More Results");
        $("#dynamic-content").append(moreResultsBtn);
      }
    }
  });
} // end displayEvents() function

//  Adds an event to database events (which is where 'My Events' entries are stored)
function newDbEventObject(p1, p2, p3, p4, p5, p6) {
  var dbKey = p3;
  var newEvent = {
    title: p1,
    date: p2,
    poster: p4,
    city: p5,
    link: p6,
    objKey: dbKey
  }
  return varkDb.ref("events").child(dbKey).set(newEvent);
}

// Adds an event to the "eventQuickList" database object (which is where the "at a glance" events list pulls from)
function eventQuickListItem(p1, p2, p3, p4) {
  var dbKey = p3;
  var eventListItem = {
    title: p1,
    date: p2,
    link: p4,
    objKey: dbKey
  }
  return varkDb.ref("eventQuickList").child(dbKey).set(eventListItem);
}
// END FUNCTIONS

//  BUTTON CLICKS (event handlers)
//  EVENTS button - static button, displays default events search
$("#display-events").on("click", function () {
  $("#dynamic-content").empty();
  pageNumber = 1;
  $("#dynamic-content").append("<h2>Coming Events</h2>");
  displayEvents("Salt+Lake+City", pageNumber);
});

//  EVENTS SEARCH button
$("#event-search-btn").on("click", function (event) {
  event.preventDefault();
  pageNumber = 1;
  pageCount = 0;
  var searchCity = $("#event-city-input").val().trim();

  //  Eventful's search does not seem to like an empty 'q=title:' in the search string, so the following prevents adding it unless the 'Event or Artist' search is used
  // var searchKeywords = "";
  if (!($("#event-keyword-input").val().trim() === "")) {
    var searchKeywords = "&q=title:" + $("#event-keyword-input").val().trim();
  }

  var searchZipcode = $("#event-zipcode-input").val();
  var searchWithin = "&within=" + $("#event-within-input").val().trim();
  var zipTest = /^\d{5}(-\d{4})?$/.test(searchZipcode);

  //  User input validation
  if ((!(searchZipcode === "")) || (!($("#event-within-input").val().trim())) === "") {
    if (!zipTest) {
      $("#search-error").empty();
      $("#search-error").text("Please enter a valid zip code.");
      document.getElementById("event-zipcode-input").disabled = false;
      document.getElementById("event-within-input").disabled = false;
      document.getElementById("event-city-input").disabled = false;
    }
    else if (zipTest && ($("#event-within-input").val().trim() === "")) {
      $("#search-error").empty();
      $("#search-error").text("You must also enter a search radius if you enter a zip code.");
      document.getElementById("event-zipcode-input").disabled = false;
      document.getElementById("event-within-input").disabled = false;
      document.getElementById("event-city-input").disabled = false;
    }
    else if (zipTest && (isNaN($("#event-within-input").val().trim()) || ($("#event-within-input").val().trim() < 0))) {
      $("#search-error").empty();
      $("#search-error").text("Please enter a valid search radius.");
      document.getElementById("event-zipcode-input").disabled = false;
      document.getElementById("event-within-input").disabled = false;
      document.getElementById("event-city-input").disabled = false;
    }
    else {
      $("#search-error").empty();
      $("#dynamic-content").empty();
      $("#dynamic-content").append("<h2>Search Results</h2>");
      displayEvents(searchCity, pageNumber, searchKeywords, searchZipcode, searchWithin);
      document.getElementById("event-zipcode-input").disabled = false;
      document.getElementById("event-within-input").disabled = false;
      document.getElementById("event-city-input").disabled = false;
    }
  } else {
    $("#search-error").empty();
    $("#dynamic-content").empty();
    $("#dynamic-content").append("<h2>Search Results</h2>");
    displayEvents(searchCity, pageNumber, searchKeywords, searchZipcode, searchWithin);
  }
  // $(".event-search-input").val("");
});

//  LOAD MORE EVENT RESULTS Button - dynamic button, adds another page of search results
$("#dynamic-content").on("click", "#more-event-results", function () {
  //  Create parameters to pass into the function
  var param1 = $(this).attr("location");
  var param2 = $(this).attr("search-term");
  var param3 = $(this).attr("zipcode");
  var param4 = $(this).attr("within");
  //  Call the function
  displayEvents(param1, pageNumber, param2, param3, param4);
  //  Remove the button after click - it will be recreated at the bottom if necessary by the displayEvents() function
  $(this).remove();
});

//  ADD TO MY EVENTS button - dynamic button, adds event to db events and db eventQuickList
$("#dynamic-content").on("click", ".add-event-btn", function () {
  var title = $(this).siblings("div").children("p").html();
  var poster = $(this).siblings("img").attr("src");
  var eventId = $(this).attr("event-id");
  var eventDate = $(this).attr("start-time");
  var eventCity = $(this).siblings("div").children("h6").html();
  var eventInfo = $(this).siblings("div").children("h6").children("a").attr("href");
  newDbEventObject(title, eventDate, eventId, poster, eventCity, eventInfo);
  eventQuickListItem(title, eventDate, eventId, eventInfo);
});

//  REMOVE EVENT button - dynamic button, removes from My Events html, from db events, and from db eventQuickList
$("#my-event-content").on("click", ".remove-event-btn", function () {
  var remove = $(this).attr("data");
  $(this).closest("div").remove();
  $("#" + remove).remove();
  varkDb.ref("events").child(remove).remove();
  varkDb.ref("eventQuickList").child(remove).remove();
});

//  Firebase listener to populate the "My Events" page on page load
varkDb.ref("events").orderByChild("date").on("child_added", function (childSnapshot) {
  var data = childSnapshot.val();
  $("#my-event-content").append("<div class='event-container' id='" + data.objKey + "'><button class='button remove-event-btn' data='" + data.objKey + "'>Remove</button><img src='" + data.poster + "' class='event-poster'><div class='event-info-container'><p class='event-title'>" + data.title + "</p><h5 class='event-date'>" + moment(data.date).format("YYYY-MM-DD") + " @ " + moment(data.date).format("h:mm a") + "</h5><h6 class='event-city'>" + data.city + "</h6></div></div>");
  var eventStuff = $("#" + data.objKey);
  TweenLite.from(eventStuff, 1.5, {
    opacity: 0,
    left: "800px",
    rotationX: "720deg",
    ease: Back.easeOut
  });
}, function (errorObject) {
  console.log(errorObject);
  $("#my-movie-content").append("<p>" + errorObject.code + "</p>");
});

//  Firebase listener to populate the "at a glance" events list
varkDb.ref("eventQuickList").orderByChild("date").on("child_added", function (childSnapshot) {
  var data = childSnapshot.val();
  $("#event-quick-list").append("<tr id='" + data.objKey + "'><td>" + moment(data.date).format("YYYY-MM-DD") + "</td><td><a href='" + data.link + "' class='event-link' target='_blank'>" + data.title + "</a></td></tr>");
}, function (errorObject) {
  console.log(errorObject);
  $("#my-movie-content").append("<p>" + errorObject.code + "</p>");
});
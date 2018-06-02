//  Initialize firebase
var config = {
    apiKey: "AIzaSyCNL6Q2BIadv465lKGHJG9_wOZlUvFUztY",
    authDomain: "event-vaark.firebaseapp.com",
    databaseURL: "https://event-vaark.firebaseio.com",
    projectId: "event-vaark",
    storageBucket: "event-vaark.appspot.com",
    messagingSenderId: "857971417467"
  };
  
  firebase.initializeApp(config);
  
  var varkDb = firebase.database();
  
  //  Flag variables to control the functions and buttons below
  var pageNumber = 1;
  var totalResults = 0;
  
  //  FUNCTIONS
  //  Movie API call function
  function displayMovies(param1, param2, page, searchTerm) {
    $("#dynamic-content").css("display", "flex");
    axios({
      method: 'get',
      url: "https://api.themoviedb.org/3/" + param1 + "/" + param2 + "?api_key=ab8e08e3d76136182fa701fcadfde64a&language=en-US&region=US&query=" + searchTerm + "&page=" + page + "&include_adult=false"
    }).then(function (response) {
  
      var movieResults = response.data.results;
      console.log(movieResults);
  
      if (movieResults.length === 0) {
        $("#search-error").html("Your search did not produce any results. Please try again.");
      }
      else {
  
        //  loop through the results and combine html elements with search results
        for (let i = 0; i < movieResults.length; i++) {
          const element = movieResults[i];
          var movieDiv = $("<div class='movie-container movie-anime" + page + "'>");
          var addBtn = $("<button class='button add-movie-btn'>");
          var movieImg = $("<img class='movie-poster'>");
          var releaseDate = $("<h5 class='movie-date'>").text(element.release_date);
          var movieTitle = $("<p class='movie-title'>").text(element.original_title);
          var movieDetails = $("<h6 class='movie-details'><a href='https://www.themoviedb.org/movie/" + element.id + "' class='movie-link' target='_blank'>More Info</a></h6>");
  
          //  Some API responses from TMDB don't include posters, so the following checks for a poster, and if it finds 'null', it uses a generic default.
          if (element.poster_path === null) {
            movieImg.attr("src", "assets/images/film.jpg");
          } else {
            movieImg.attr("src", "https://image.tmdb.org/t/p/original" + element.poster_path);
          }
  
          //  Append each individual result to the 'dynamic-content' div
          addBtn.attr("movie-id", element.id);
          addBtn.attr("release-date", element.release_date);
          addBtn.text("Add to My Movies");
          movieDiv.attr("id", element.id + page);
          movieDiv.append(addBtn);
          movieDiv.append(movieImg);
          movieDiv.append(movieDetails);
          movieDiv.append(releaseDate);
          movieDiv.append(movieTitle);
          $("#dynamic-content").append(movieDiv);
        }
  
        // Greensock animation - getting the class with the current page number prevents it from reanimating existing items when you are only loading more results ("Load More Results" button).
        var movieObject = $(".movie-anime" + page);
        TweenMax.staggerFrom(movieObject, 1.5, {
          opacity: 0,
          rotationY: "720eg",
          left: "800px",
          ease: Power2.easeOut
        }, 0.2);
  
        //  increment flag variables
        pageNumber++;
        totalResults += movieResults.length;
  
        //  Conditional to control whether a "Load More Results" button is needed
        if (response.data.total_results > totalResults) {
  
          //  Creates a "Load More Results" button with all necessary search parameters embedded as attributes
          var moreResultsBtn = $("<button class='button'>");
          moreResultsBtn.attr("id", "more-movie-results");
          moreResultsBtn.attr("result-type", param1);
          moreResultsBtn.attr("result-characteristic", param2);
          moreResultsBtn.attr("increment", page);
          moreResultsBtn.attr("search-term", searchTerm);
          moreResultsBtn.text("Load More Results");
          $("#dynamic-content").append(moreResultsBtn);
        }
      }
    });
  } // end displayMovies() function
  
  //  Adds a movie to database movies (which is where 'My Movies' entries are stored)
  function newDbMovieObject(p1, p2, p3, p4) {
    var dbKey = p3;
    var newMovie = {
      title: p1,
      date: p2,
      poster: p4,
      objKey: dbKey
    }
    return varkDb.ref("movies").child(dbKey).set(newMovie);
  }
  
  //  Adds data to the "movieQuickList" database object (which is where the "at a glance" movies list pulls from)
  function movieQuickListItem(p1, p2, p3) {
    var dbKey = p3;
    var movieListItem = {
      title: p1,
      date: p2,
      objKey: dbKey
    }
    return varkDb.ref("movieQuickList").child(dbKey).set(movieListItem);
  }
  
  //  Disables 'Zip Code' and 'Within' search fields if anything is entered into the 'Event City' search field.
  function disableZipField() {
    if ($("#event-city-input").val().trim() === "") {
      document.getElementById("event-zipcode-input").disabled = false;
      document.getElementById("event-within-input").disabled = false;
    } else {
      document.getElementById("event-zipcode-input").disabled = true;
      document.getElementById("event-within-input").disabled = true;
    }
  }
  
  //  Disables the 'Event City' search field if anything is entered into either the 'Zip Code' or 'Within' search fields.
  function disableCityField() {
    if ($("#event-zipcode-input").val().trim() === "" && $("#event-within-input").val().trim() === "") {
      document.getElementById("event-city-input").disabled = false;
    } else {
      document.getElementById("event-city-input").disabled = true;
    }
  }
  //  END FUNCTIONS
  
  //  BUTTON CLICKS (event handlers)
  //  CURRENT MOVIES button - static button, displays Current field, which defaults to movies currently in theaters
  $("#display-current").on("click", function () {
    $("#dynamic-content").empty();
    $("#dynamic-content").append("<h2>Movies Currently in Theaters</h2>");
    totalResults = 0;
    pageNumber = 1;
    displayMovies("movie", "now_playing", pageNumber);
  });
  
  //  UPCOMING button - displays Upcoming field, which defaults to movies being released in the next two weeks or so
  $("#display-upcoming").on("click", function () {
    $("#dynamic-content").empty();
    $("#dynamic-content").append("<h2>Movies Coming Soon</h2>");
    totalResults = 0;
    pageNumber = 1;
    displayMovies("movie", "upcoming", pageNumber);
  });
  
  //  MOVIE SEARCH button - static button, pushes search term value into movie ajax call
  $("#movie-search-btn").on("click", function (event) {
    event.preventDefault();
    $("#dynamic-content").empty();
    $("#dynamic-content").append("<h2>Search Results</h2>");
    totalResults = 0;
    pageNumber = 1;
    displayMovies("search", "movie", pageNumber, $("#movie-input").val().trim());
    $("#movie-input").val("");
  });
  
  //  LOAD MORE MOVIE RESULTS Button - dynamic button, adds another page of search results
  $("#dynamic-content").on("click", "#more-movie-results", function () {
  
    //  Create parameters to pass into the function
    var param1 = $(this).attr("result-type");
    var param2 = $(this).attr("result-characteristic");
    var param4 = $(this).attr("search-term");
  
    //  Call the function
    displayMovies(param1, param2, pageNumber, param4);
  
    //  Remove the button after click - it will be recreated at the bottom if necessary by the displayMovies() function
    $(this).remove();
  });
  
  //  ADD TO MY MOVIES button - dynamic button, adds movie to db movies and db movieQuickList
  $("#dynamic-content").on("click", ".add-movie-btn", function () {
    var title = $(this).siblings("p").html();
    var poster = $(this).siblings("img").attr("src");
    var movieId = $(this).attr("movie-id");
    var rlsDate = $(this).attr("release-date");
    newDbMovieObject(title, rlsDate, movieId, poster);
    movieQuickListItem(title, rlsDate, movieId);
  });
  
  //  REMOVE MOVIE button - dynamic button, removes from My Movies html, from db movies, and from db movieQuickList
  $("#my-movie-content").on("click", ".remove-movie-btn", function () {
    var remove = $(this).attr("data");
    $(this).closest("div").remove();
    $("#" + remove).remove();
    varkDb.ref("movies").child(remove).remove();
    varkDb.ref("movieQuickList").child(remove).remove();
  });
  
  //  Loads default movie search results on page load
  displayMovies("movie", "now_playing", pageNumber);
  
  //  Firebase listener to populate the "My Movies" page on page load
  varkDb.ref("movies").orderByChild("date").on("child_added", function (childSnapshot) {
    var data = childSnapshot.val();
    $("#my-movie-content").append("<div class='movie-container my-movie-div' id='" + data.objKey + "'><button class='button remove-movie-btn' data='" + data.objKey + "'>Remove</button><img src='" + data.poster + "' class='movie-poster'><h6 class='movie-details'><a href='https://www.themoviedb.org/movie/" + data.objKey + "' class='movie-link' target='_blank'>More Info</a></h6><h5 class='movie-date'>" + data.date + "</h5><p class='movie-title'>" + data.title + "</p></div>");
    var stuff = $("#" + data.objKey);
    TweenMax.staggerFrom(stuff, 1.5, {
      opacity: 0,
      rotationY: "720eg",
      left: "800px",
      ease: Back.easeOut
    }, 0.25);
  }, function (errorObject) {
    console.log(errorObject);
    $("#my-movie-content").append("<p>" + errorObject.code + "</p>");
  });
  
  //  Firebase listener to populate the "at a glance" movies list
  varkDb.ref("movieQuickList").orderByChild("date").on("child_added", function (childSnapshot) {
    var data = childSnapshot.val();
    $("#movie-quick-list").append("<tr id='" + data.objKey + "'><td>" + data.date + "</td><td><a href='https://www.themoviedb.org/movie/" + data.objKey + "' class='movie-link' target='_blank'>" + data.title + "</a></td></tr>");
  }, function (errorObject) {
    console.log(errorObject);
    $("#my-movie-content").append("<p>" + errorObject.code + "</p>");
  });
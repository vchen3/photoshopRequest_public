/* Angular App 
 * Holds all scope variables and functions for Angular/client-side

 * Engaging between Angular and the Node app often happens by sending http
 * requests to the node app, then having node send back relevant data. 

 * Scope Variables *
 $scope.allPosts                  All source documents ordered by fewest number of responses
 $scope.currentPost               Source document currently being studied

 */


var angularApp = angular.module("myApp", ['ngRoute']);

//Angular controller with scope variables defined
angularApp.controller("study2Controller", 
  function($scope, $http, $route, $routeParams, $location, $window, $q, $interval, $timeout)
{ 
  $scope.userID = "vc349";

//Setting scope variables, general set-up
  var vm = this;
  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;

  // posts that the user has actually seen and interacted with! Necessary to end survey
  $scope.seenPosts = [];
  
  // Store index in $scope.allPosts
  $scope.allPostsIndex = 0;

  $scope.showInstructions=false;
  $scope.showSurvey = true;
  $scope.showThankYou = false;
  $scope.totalPosts = 10;
  $scope.currentRating = 'none';

  $scope.getRandomArray = function(sourceArray, neededElements){
    // Hold posts
    var result = [];
    // Hold random nums
    var randomArray = []
    while (randomArray.length != neededElements) {
      var randomNum = Math.floor(Math.random()*sourceArray.length)
      if (!randomArray.includes(randomNum)){
        randomArray.push(randomNum);
        result.push(sourceArray[randomNum]);
      }
    }
    return result;
  }

  $scope.getMultipleArray = function(sourceArray){
    var result=[];
    var multipleSource = ["6cewji", "6htdp3"]
    for(obj in sourceArray){
      if (multipleSource.includes(sourceArray[obj].id)){
        result.push(sourceArray[obj]);
      }
    }
    return result;
  }

  $scope.getAllPostsError = function(response){
    if (response.status != -1){
      console.log("get all posts error");
      console.log(response.status);
    }
  }

  $scope.getAllUsersError = function(response){
    if (response.status != -1){
      console.log("get all users error");
      console.log(response.status);
      }
  }

  $scope.getAllPostSuccess = function(response){
    var incomingArray = response.data;
    $scope.allPosts = $scope.getRandomArray(incomingArray, $scope.totalPosts)
    //$scope.allPosts = $scope.getMultipleArray(incomingArray)
    $scope.currentPost = $scope.allPosts[0];
    $scope.initNewPost($scope.currentPost);
};
  
  $scope.getAllUsersSuccess = function(response){
    $scope.allUsers = response.data;
    //Set userID
    while ($scope.allUsers.indexOf($scope.userID) != -1){
      newUserID = Math.random().toString(36).substring(7);
      $scope.userID = newUserID;
      $scope.addUser(newUserID);
    }
  }

  //Get all posts
  $http.get('/allPosts').then($scope.getAllPostSuccess, $scope.getAllPostsError);

   //Get all users
  $http.get('/listUsers').then($scope.getAllUsersSuccess, $scope.getAllUsersError);

  $scope.shuffleArray = function(array){
    var m = array.length, t, i;
    while (m){
      // Pick a remaining element
      i = Math.floor(Math.random() * m--);
  
      // Swap it with current element
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  // Load new post
  $scope.initNewPost = function(currentPost){
    $scope.compareViewSource = false;
    $scope.imageRankings = {};

    // Reset source and response images
    $scope.sourceImages = [];
    $scope.responseImages = [];

    currentTable = currentPost.table;
    Object.keys(currentTable).forEach( function(key){
      // push source images
      if (key.indexOf("SOURCE")!=-1){
        slide = {};
        slide["name"] = key;
        slide["image"] = currentTable[key];
        $scope.sourceImages.push(slide);
      }
      // push non-source images to "responseImages"
      else {
        slide = {};
        slide["name"] = key;
        slide["image"] = currentTable[key];
        $scope.responseImages.push(slide);
      }
    })
    // Randomize order that users see response images
    $scope.shuffleArray($scope.responseImages)

    $scope.currentSourceIndex = 0;
    $scope.currentResponseIndex = 0;
    $scope.currentResponseImg = $scope.responseImages[$scope.currentResponseIndex];
    $scope.seenPosts.push(currentPost.id);

    // Get study1 response info
    var completePost = {};
    completePost["postID"] = $scope.currentPost["id"]

    $http.post('/getStudy1Responses', completePost).then(function(response){
      if (("editedReq" in response.data[0]) && ("selectedReq" in response.data[0])){
        var newEditedRequest = (response.data[0]["editedReq"]);
        var newSelectedRequest = (response.data[0]["selectedReq"])

        var newEditedRequestArray = newEditedRequest.split(" ");
        var newSelectedRequestArray = newSelectedRequest.split(" ");    

        // If there are multiple words in the edited request, display
        if ((newEditedRequestArray.length) > 1) {
          $scope.currentPost.title = newEditedRequest;
          $scope.currentPost.content = "";
        }
        // Otherwise, only display the selected request
        else if ((newSelectedRequestArray.length)>1){
          $scope.currentPost.title = newSelectedRequest;
          $scope.currentPost.content = "";
        }
      }
    }).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data)
      }
    });

    //$scope.updatePhotos()
  }

  //Record new user   
  $scope.addUser = function(userID){
    var newUser = {};
    newUser["userID"] = userID;

    $http.post('/addUser', newUser).catch(function(data){
      if (data["status"] != -1){
        console.log(data)
      }
    });
  };

  //Record rating
  $scope.saveRating = function(num) {
    if ((num == 'none') || (num == undefined)){
      alert("Please give a valid rating.")
      return;
    }
    if (num == 0){
      $scope.currentRating = "0";
    }
    var savedRatingKey = $scope.currentResponseImg["name"];
    var savedRatingVal = $scope.currentRating;
    $scope.imageRankings[savedRatingKey] = savedRatingVal;

    // If valid rating, prep study3 input 
    if (savedRatingVal >= 3){
      var completePost = {};
      completePost["id"] = $scope.currentPost.id;
      completePost["responseImg"] = JSON.parse(angular.toJson($scope.currentResponseImg));

      var savedSourceImages = JSON.parse(angular.toJson($scope.sourceImages));

      // Check if this post already saved to study3_source.  If not, add it
      $http.post('/study3SourceExists', completePost).then(function(response){
        var id = response.data["id"];
        var currentlyExploring = response.data["responseImg"];
        var existingArray = response.data["array"];
        
        // study3_source does not have any posts with this id
        if (existingArray.length == 0){
          var study3Input = {};
          study3Input["postID"] = id;
          study3Input["source_images"] = savedSourceImages;
          study3Input["response_image"] = currentlyExploring;
          study3Input["study3Responses"] = 0;
          
          $http.post('/saveStudy3Source', study3Input).catch(function(data){
            if (data["status"] != -1){
              console.log("save response error");
            }
          });
        }
        // Wait to set new response after study3Input has been set
        // Otherwise, $scope.sourceImages updates to the next post's,
        // and the wrong sourceImage array is saved.
        $scope.setNewResponse();
      });
    }
    else{
      $scope.setNewResponse();
    }

  };

  // update response image and index
  // if gone through all responses, go to next post
  $scope.setNewResponse = function() {
    // If viewed all responses, save response and move on to next post
    if ($scope.currentResponseIndex==$scope.responseImages.length-1){
      $scope.saveStudy2Response();
    }
    else{
      $scope.currentRating = 'none';
      $scope.currentResponseIndex += 1;
      $scope.currentResponseImg = $scope.responseImages[$scope.currentResponseIndex];
      $scope.compareViewSource = false;
    }
  }

  //Record response
  $scope.saveStudy2Response = function() {
    var savedResponse = {}
    savedResponse["postID"] = $scope.currentPost.id
    savedResponse["userID"] = $scope.userID
    savedResponse["imageRankings"] = $scope.imageRankings
    $http.post('/saveStudy2Response', savedResponse).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data)
      }
    });
    $scope.recordPostResponse($scope.currentPost.id);
    $scope.setNewPost();
  };

  //Record that source post of postID has received a response
  $scope.recordPostResponse = function(postID){
    var completePost = {};
    completePost["post"] = postID;
    $http.post('/recordPostResponse', completePost).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data)
      }
    });
  };

  //Set new post
  $scope.setNewPost = function(){
    if ($scope.seenPosts.length == $scope.totalPosts){
      $scope.showSurvey = false;
      $scope.showInstructions = false;
      $scope.showThankYou = true;
    }
    else{
      // Get new post and update to show edited/selected request
      $scope.allPostsIndex++;
      $scope.currentPost = $scope.allPosts[$scope.allPostsIndex];
      $scope.initNewPost($scope.currentPost)
    }
  };

  $scope.switchViews = function(keyCode){
    // Only switch views if arrowkeys or on click
    if (keyCode >= 37 && keyCode <= 40 || keyCode == "a") {
      $scope.compareViewSource = !$scope.compareViewSource;
    }
  }

  // For 5 seconds: update source images every 2 seconds
  $scope.updatePhotos = function(){
    $interval(function(){
      $scope.changeSource();
    },1700,5)
  }
  

  $scope.changeSource = function() {
    var currentValue = $scope.currentSourceIndex;
    currentValue++;
    $scope.showSource(currentValue);
  }

  $scope.showSource = function(slideNum) {
    $scope.currentSourceIndex = slideNum
    if (slideNum >= $scope.sourceImages.length){
      $scope.currentSourceIndex = 0;
    }
    if ($scope.currentSourceIndex == -1){
      $scope.currentSourceIndex = $scope.sourceImages.length-1;
    }
  }

  $scope.invalidPost = function() {
    var savedResponse = {};
    savedResponse["postID"] = $scope.currentPost.id;
    savedResponse["userID"] = $scope.userID;
    savedResponse["valid"] = 0;
    savedResponse["timestamp"] = new Date().getTime();
    
    // Note invalid study1 response
    $http.post('/saveStudy1Response', savedResponse).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data);
      }
    })

    // Set new post
    $scope.setNewPost();
  }

  $scope.hideInstructions = function() {
    $scope.showInstructions = !$scope.showInstructions
  }

  //Reset error
  $scope.resetError = function(err){
    console.log(err)
  };

  $scope.clearSurvey = function(){
    // Remove all responses
    $http.get('/1removeResponses').then(console.log("1removedResponses"), $scope.resetError);
    $http.get('/2resetSourceDocs').then(console.log('2resetSourceDocs'), $scope.resetError);
    $http.get('/3removeUsers').then(console.log('3removeUsers'), $scope.resetError);
    $http.get('/4addExampleUser').then(console.log('4addExampleUser'), $scope.resetError);

  };
});
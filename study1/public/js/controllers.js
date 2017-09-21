/* Angular App 
 * Holds all scope variables and functions for Angular/client-side

 * Engaging between Angular and the Node app often happens by sending http
 * requests to the node app, then having node send back relevant data. 

 * Scope Variables *
 $scope.allPosts                  All source documents ordered by fewest number of responses
 $scope.currentPost               Source document currently being studied
 $scope.isValidReq                Boolean if current request is valid
 $scope.currentSelection,         
        savedSelectReq, 
        saveSelectedReq           Booleans & strings related to saving selected req
 $scope.savedEditReq, 
        editedReq                 Boolean & string related to saving edited req

//Meta Survey
 $scope.seenPosts                 Array of all posts that one user has seen
 $scope.allUsers
 $scope.userID


 */


var angularApp = angular.module("myApp", ["ngRoute"]);
//Angular controller with scope variables defined
angularApp.controller('study1Controller', function ($scope, $http, $route, $routeParams, $location) { 

  //Setting scope variables, general set-up
  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;
  $scope.validReq = false;
  $scope.showValidRequest = true;
  $scope.savedSelectReq = false;
  $scope.showSelectRequest = false;
  $scope.savedEditReq = false;
  $scope.showEditRequest = false;
  $scope.currentSelection = "";
  $scope.selectedReq = "";
  $scope.editedReq = "";

  $scope.totalPosts = 15;

  $scope.seenPosts = [];
  $scope.userID = "vc349";
  $scope.surveyFinished = false;

  $scope.getAllPostsError = function(response) {
    if (response.status !== -1){
      console.log("get all posts error");
      console.log(response);
    }
  }

  $scope.getRandomArray = function(sourceArray, neededElements){
    var result = [];
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

  $scope.getAllUsersError = function(response) {
    if (response.status !== -1){
      console.log("get all users error");
      console.log(response);
      }
  }

  $scope.getAllPostSuccess = function(response) {
    var incomingArray = response.data
    $scope.allPosts = $scope.getRandomArray(incomingArray, $scope.totalPosts)
    /*$scope.allPosts.push({
    "_id": {
        "$oid": "59923e40734d1d2227f7cb95"
    },
    "id": "6fs2pe",
    "title": "[Specific] Please Please Help Improve My Child's Yearbook Photo. He would not sit without me.",
    "url": "https://i.redd.it/mizgnwa1l62z.jpg",
    "content": "",
    "table": {
        "SOURCE": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6fs2pe/SOURCE.jpg",
        "dikn1w5": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6fs2pe/dikn1w5.jpg",
        "dilbo4i": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6fs2pe/dilbo4i.jpg"
    },
    "study1Responses": 0,
    "study2Responses": 0,
    "study3Responses": 0
});*/
    $scope.currentPost = $scope.allPosts[0];
    $scope.seenPosts.push($scope.currentPost.id);
    $scope.sourceImages = [];

    // Get all source images
    currentTable = $scope.currentPost.table;
    Object.keys(currentTable).forEach( function(key) {
      // if "SOURCE" in image title
      if (key.indexOf("SOURCE")!==-1){
        slide = {};
        slide["name"] = key;
        slide["image"] = currentTable[key];
        $scope.sourceImages.push(slide);
        }
      }
    )
    $scope.currentSlide = {value: 0};
  }

  $scope.getAllUsersSuccess = function(response) {
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

  $scope.plusDivs = function(n) {
    var currentValue = $scope.currentSlide.value;
    $scope.showDiv(currentValue += n);
  }

  $scope.showDiv = function(slideNum) {
    $scope.currentSlide.value=slideNum
    if (slideNum >= $scope.sourceImages.length) {
      $scope.currentSlide.value = 0;
    }    
    else if (slideNum == -1) {
      $scope.currentSlide.value = $scope.sourceImages.length-1;
    }
  }

  //Record new user   
  $scope.addUser = function(userID) {
    var newUser = {};
    newUser["userID"] = userID;

    $http.post('/addUser', newUser).catch(function(data){
      if (data["status"] != -1){
        console.log(data)
      }
    })
  }

  //Functions related to recording selected/edited request
  $scope.clearSelectedText = function() {
    $scope.currentSelection="";
  }

  $scope.addSelectedText = function(post) {
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    $scope.currentSelection+=text;
  }

  //Record if request is valid
  $scope.isValidReq = function(num) {
    $scope.validReq=num;
    $scope.showValidRequest = false;
    $scope.showSelectRequest = true;
    $scope.showEditRequest = true;

    //If invalid: send invalid response, get new currentPost
    if (!num){
      $scope.saveResponse(num);
    }
  }

  $scope.backShowValidReq = function(){
    $scope.validReq = true;
    $scope.showValidRequest = true;
    $scope.showSelectRequest = false;
    $scope.showEditRequest = false;
  }

  $scope.backShowSelectReq = function(){
    $scope.savedSelectReq = false;
    $scope.showValidRequest = false;
    $scope.showSelectRequest = true;
    $scope.showEditRequest = false;
    $scope.savedEditReq = false;
  }

  //Record response
  $scope.saveResponse = function(valid) {
    $scope.recordPostResponse($scope.currentPost.id);

    var savedResponse = {};
    savedResponse["postID"] = $scope.currentPost.id;
    savedResponse["userID"] = $scope.userID;
    savedResponse["valid"] = valid;
    savedResponse["timestamp"] = new Date().getTime();
    // If valid, save selected and edited req
    // and save to "valid" collection
    if (valid){
      if ($scope.selectedReq == ""){
        alert("Please select the request.");
        return false; 
      }
      savedResponse["selectedReq"] = $scope.selectedReq;
      savedResponse["editedReq"] = $scope.editedReq;

      var source_valid = $scope.currentPost;
      delete source_valid["_id"];

      $http.post('/saveSourceValid', source_valid).catch(function(data){
        if (data["status"] != -1){
          console.log("save response error");
          console.log(data);
        }
      })
    }
    $http.post('/saveResponse', savedResponse).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data);
      }
    })
    
    $scope.setNewPost();
  }

  //Record that source post of postID has received a response
  $scope.recordPostResponse = function(postID){
    var completePost = {};
    completePost["post"] = postID;
    $http.post('/recordPostResponse', completePost).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data);
      }
    })
  };

  //Set new post
  $scope.setNewPost = function(){
    var seenPosts = $scope.seenPosts;
    if (seenPosts.length == $scope.totalPosts){
      $scope.surveyFinished = true;
      $scope.showValidRequest = false;
      $scope.showSelectRequest = false;
      $scope.showEditRequest = false;
    }
    else{
      var count = 0;
      var viewingOldPost = true;

      do{
        var thisPost = $scope.allPosts[count];
        var alreadySeen = $scope.seenPosts.indexOf(thisPost.id);
        if (alreadySeen == -1){
          viewingOldPost = false;
        }
        else{
          count++;
        }
      }while (viewingOldPost)

      $scope.currentPost = $scope.allPosts[count];
      $scope.seenPosts.push($scope.currentPost.id);

      $scope.validReq = false;
      $scope.showValidRequest = true;
      $scope.savedSelectReq = false;
      $scope.savedEditReq = false;
      $scope.currentSelection = "";
      $scope.selectedReq = "";
      $scope.editedReq = "";
      $scope.showSelectRequest = false;
      $scope.showEditRequest = false;
      $scope.surveyFinished = false;
      $scope.sourceImages = []

      // Get all source images
      currentTable = $scope.currentPost.table;
      Object.keys(currentTable).forEach( function(key){
        // if "SOURCE" in image title
        if (key.indexOf("SOURCE")!=-1){
          slide = {};
          slide["name"] = key;
          slide["image"] = currentTable[key];
          $scope.sourceImages.push(slide);
        }
      })
    $scope.currentSlide = {value: 0};
    }
  }

  //Reset error
  $scope.resetError = function(err){
    console.log(err);
  }

  $scope.resetSurvey = function(){
    // Remove all responses
    $http.get('/1removeResponses').then(console.log("1removedResponses"), $scope.resetError);
    $http.get('/2resetSourceDocs').then(console.log('2resetSourceDocs'), $scope.resetError);
    $http.get('/3removeUsers').then(console.log('3removeUsers'), $scope.resetError);
    $http.get('/4addExampleUser').then(console.log('4addExampleUser'), $scope.resetError);

  };

})
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

  $scope.showInstructions=true;
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

  $scope.setPending = function(resImg, pending){
    var setPending = {};
    setPending["resImg"] = resImg;
    setPending["pending"] = pending;

    // Set pending, and unset pending status 35 minutes later
    $http.post('/setPending', setPending).then(function(response){
      var resImage = response.data;
      setTimeout(function(){
        var setPending = {};
        setPending["resImg"] = resImage;
        setPending["pending"] = 0;

        $http.post('/setPending', setPending).catch(function(data){
          if (data["status"] != -1){
            console.log(data)
          }
        });
      }, 2100000)
    }).catch(function(data){
      if (data["status"] != -1){
        console.log(data)
      }
    });
  }      

  $scope.getAllPostSuccess = function(response){
    var incomingArray = response.data;
    $scope.allPosts = $scope.getRandomArray(incomingArray, $scope.totalPosts);
    for (i in $scope.allPosts){
      var currentPost = $scope.allPosts[i];
      $scope.setPending(currentPost["response_image"], 1);
    }
    $scope.currentPost = $scope.allPosts[0];
    $scope.initNewPost($scope.currentPost);
    /*$scope.allPosts = [];
    $scope.allPosts.push({
      // little girl
    "postID": "6hfgpt",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hfgpt/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "diy0349_2",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hfgpt/diy0349_2.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
      // combine to make mountain and horizon
    "postID": "6cucva",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6cucva/SOURCE.jpg"
        },
        {
            "name": "SOURCE2_0",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6cucva/SOURCE2_0.jpg"
        },
        {
            "name": "SOURCE_3",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6cucva/SOURCE_3.jpg"
        }
    ],
    "response_image": {
        "name": "dhxo6q1",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6cucva/dhxo6q1.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
      // man in pool
    "postID": "6j2x6p",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6j2x6p/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "djb69qa",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6j2x6p/djb69qa.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
      // man in ocean
    "postID": "6ixhik",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6ixhik/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "dj9vrbf",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6ixhik/dj9vrbf.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
      // cat
    "postID": "6inrvt",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6inrvt/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "dj7ogyg",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6inrvt/dj7ogyg.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
      // flower girl
    "postID": "6hxrml",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hxrml/SOURCE.png"
        },
        {
            "name": "SOURCE_1_1",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hxrml/SOURCE_1_1.png"
        }
    ],
    "response_image": {
        "name": "dj22bb1",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hxrml/dj22bb1.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
      // man swinging on beach
    "postID": "6iopsg",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6iopsg/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "dj85de6",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6iopsg/dj85de6.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push(
      // girl profile
      {
    "postID": "6itbou",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6itbou/SOURCE.jpg"
        },
        {
            "name": "SOURCE_1_1",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6itbou/SOURCE_1_1.jpg"
        }
    ],
    "response_image": {
        "name": "dj8wo66",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6itbou/dj8wo66.jpg"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
    // baby with football
    "postID": "6iw0il",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6iw0il/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "dj9sz72",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6iw0il/dj9sz72.png"
    },
    "study3Responses": 0
});
    $scope.allPosts.push({
    // older pic of couple
    "postID": "6hr4ih",
    "source_images": [
        {
            "name": "SOURCE",
            "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hr4ih/SOURCE.jpg"
        }
    ],
    "response_image": {
        "name": "dj0xin3",
        "image": "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/6hr4ih/dj0xin3.png"
    },
    "study3Responses": 0
});*/
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

  // Load new post
  $scope.initNewPost = function(currentPost){
    // Saw the post
    $scope.seenPosts.push(currentPost.postID);

    // In comparison: view the response first
    $scope.compareViewSource = false;

    // Set source and response images
    $scope.sourceImages = currentPost.source_images;
    $scope.currentSourceIndex = 0;
    $scope.responseImage = currentPost.response_image;
    $scope.description = "";

    // If needed, scroll thru multiple source images
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

$scope.isLink = function(str){
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
}
    

  // Record response.  If num == 0, this is an irrelevant image.  Save description as ""
  $scope.saveStudy3Response = function(num) {
    // Issue if you click "Submit" without giving a description.
    if ((($scope.description == undefined) || ($scope.description == "") || ($scope.isLink($scope.description))) && (num)) {
      alert("Please submit valid instructions.")
      return;
    }
    var savedResponse = {}
    savedResponse["postID"] = $scope.currentPost.postID;
    savedResponse["userID"] = $scope.userID
    savedResponse["response_image"] = $scope.responseImage;
    // If valid response, record and save description
    if (num == 1){
      savedResponse["description"] = $scope.description;
      savedResponse["valid_response"] = 1;
    }
    // Record invalid response
    else{
      savedResponse["valid_response"] = 0;
    }
    $http.post('/saveStudy3Response', savedResponse).then(
        $scope.recordPostResponse(savedResponse["response_image"])
      ).catch(function(data){
      if (data["status"] != -1){
        console.log("save response error");
        console.log(data)
      }
    });
  };


  //Record that source post of postID has received a response
  $scope.recordPostResponse = function(resImg){
    var completePost = {};
    completePost["resImg"] = resImg;
    // Record post response
    $http.post('/recordPostResponse', completePost).then(function(response){
      var setPending = {};
      setPending["resImg"] = resImg;
      setPending["pending"] = 0; 

      // Unset pending
      $http.post('/setPending', setPending).then(function(response){
        // Set next post
        $scope.setNewPost();
      }).catch(function(data){
        if (data["status"] != -1){
          console.log(data)
        }
      });
    }).catch(function(data){
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
      $scope.showThankYou = true;
    }
    else{
      // Update location in allPosts array
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

  //Reset error
  /*$scope.resetError = function(err){
    console.log(err)
  };

  $scope.clearSurvey = function(){
    // Remove all responses
    $http.get('/1removeResponses').then(console.log("1removedResponses"), $scope.resetError);
    $http.get('/2resetSourceDocs').then(console.log('2resetSourceDocs'), $scope.resetError);
    $http.get('/3removeUsers').then(console.log('3removeUsers'), $scope.resetError);
    $http.get('/4addExampleUser').then(console.log('4addExampleUser'), $scope.resetError);

  };*/
  // Function for finding all damaged source_3 documents
  $scope.getDamaged = function (){
    $http.get('/study3_source').then(function(response){
      $scope.study3SourceArray = response.data;
      $scope.damagedArray = [];
      for (i in $scope.study3SourceArray){

        var study = $scope.study3SourceArray[i];
        var postID = study["postID"];
        var source_img = study["source_images"][0].image;
        
        if (source_img.indexOf(postID) == -1){
          if ($scope.damagedArray.indexOf(postID) == -1){
            $scope.damagedArray.push(postID);
          }
        }
      }
      console.log($scope.damagedArray.length);
    }).catch(function(data){
      if (data["status"] != -1){
        console.log("error getting study2 ratings");
        console.log(data)      
      }
    });
  };




$scope.fixNumResponses = function(){
  /*Record correct study3 responses
  loop through study3_source by 
  search out # responses in study3 by {"response_image"}
    GET # documents
  set study3 response as that*/
  $http.get('/study3_source').then(function(response){
    console.log(response)
      var allStudy3Source = response.data;
      for (i in allStudy3Source){
        var study = allStudy3Source[i];
        console.log(study)
        var res_image = study["response_image"];
        
        var sent = {}
        sent["resImg"] = res_image;

        $http.post('/study3',sent).then(function(response){
          var resImg = response.data["resImg"];
          var study3Responses = response.data["result"];
          var numResponses = response.data["result"].length;

          var setData = {};
          setData["resImg"] = resImg
          setData["numResponses"] = numResponses;
          //console.log(resImg)
          //console.log("set to " + numResponses)
          console.log("*")
          $http.post('/fixStudy3Source',setData).catch(function(data){
            if (data["status"] != -1){
              console.log("error posting real study3 data");
              console.log(setData)
              console.log(data)      
            }
          })
        }).catch(function(data){
          if (data["status"] != -1){
            console.log("error getting study3 responses");
            console.log(data)      
          }
        }) 
      }
    }).catch(function(data){
      if (data["status"] != -1){
        console.log("error getting study3 source");
        console.log(data)      
      }
    });
};



});





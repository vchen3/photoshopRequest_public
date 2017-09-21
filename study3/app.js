/* Node App
 */

var express = require('express');
var expressApp = express();
var http = require('http').Server(expressApp);
var path = require('path');
var bodyParser = require('body-parser');
var util = require('util');

expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({
  extended: true
}));

expressApp.use(express.static(path.join(__dirname, '/public'))); //Add CSS
expressApp.use('/public', express.static(path.join(__dirname,'/public'))); //Add controller, data
expressApp.use('/js', express.static(path.join(__dirname,'/js'))); //Add controller, data
expressApp.use('/lib', express.static(path.join(__dirname,'/lib'))); //Add Angular and socket


//Connect with mongoDB, set currentCollection and URL to local database
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
//var url = 'mongodb://localhost:27017/MTurkStudies';
var url = "mongodb://vchen601:photoshopRequest_MLAB_410@ds034807.mlab.com:34807/mturkstudies";

//Load default HTML 
expressApp.get('/', function(req, res){
  res.sendFile(__dirname + '/views/background.html');
});

expressApp.get('/survey', function(req, res){
  res.sendFile(__dirname + '/views/survey.html');
});

/*expressApp.get('/damaged', function(req, res){
  res.sendFile(__dirname + '/views/damaged.html');
});*/

//List all post data lowest to highest
expressApp.get('/allPosts', function(req, res){
  MongoClient.connect(url, function(err, db) {
    db.collection('study3_source').find({"pending":0}).sort({"study3Responses":1}).limit(100).toArray(function(err, result) {
      if (err){
        throw err;
      }
      res.json(result);
    });
  });
});


//Get all users and info
expressApp.get('/allUsers', function(req, res){
  MongoClient.connect(url, function(err, db) {
    db.collection('users').find().toArray(function(err, result) {
      if (err){
        print()
        throw err;
      }
      res.send(result)
    });
  });
});

//Get just usernames
expressApp.get('/listUsers', function(req, res){
  MongoClient.connect(url, function(err, db) {
    db.collection('users').find().toArray(function(err, result) {
      if (err){
        print()
        throw err;
      }
      userList = []
      for (var i = 0; i < result.length; i++){
        userList.push(result[i]["userID"])
      }
      res.send(userList)
    });
  });
});

//Add user
expressApp.post('/addUser', function(req, res){
  MongoClient.connect(url, function(err, db) {
    console.log("connect to " + url)
    try{
      db.collection('users').insertOne(req.body);
    } catch(e){
      console.log("error adding user");
      console.log(e)
    }
    res.end();
  })
});


//Record that source post of study3_source has received a response
expressApp.post('/recordPostResponse', function(req, res){
  var resImg = req.body["resImg"]
  MongoClient.connect(url, function(err, db) {
    try{
      db.collection('study3_source').updateMany({"response_image":resImg}, {$inc: {"study3Responses":1}});
    }
    catch(e){
      console.log(e)
    }
    res.end();
  })
});

expressApp.post('/saveStudy3Response', function(req, res){
  var newDocument = req.body
  MongoClient.connect(url, function(err, db) {
    try{
      db.collection('study3').insertOne(newDocument);
    }
    catch(e){
      console.log("error saving study3 response");
      console.log(e)
    }
    res.end();
  })
});

// Get study2 responses
expressApp.post('/study2', function(req, res){
  try{
    var postID = req.body["post"];
    MongoClient.connect(url, function(err, db) {
      db.collection('study2').find({"postID":postID}).toArray(function(err, result){
        res.send(result);
      })
    })
  } catch(e){
    console.log(e)
  }
});


// Get all study3_source
expressApp.get('/study3_source', function(req, res){
  try{
    MongoClient.connect(url, function(err, db) {
      console.log("r")
      db.collection('study3_source').find().skip(2000).limit(100).toArray(function(err, result) {
        if (err){
          throw err;
        }
        res.send(result);
      });
    });
  } catch(e){
    console.log(e)
  }
});

//Get study3 responses
expressApp.post('/study3', function(req, res){
  var resImg = req.body["resImg"]
  try{
    MongoClient.connect(url, function(err, db) {
      db.collection('study3').find({"response_image":resImg}).toArray(function(err, result){
        var final = {};
        final["resImg"] = resImg;
        final["result"] = result
        res.send(final);
      })
    })
  } catch(e){
    console.log(e)
  }
});

// Fix study 3 responses
expressApp.post('/fixStudy3Source', function(req, res){
  var resImg = req.body["resImg"];
  var numResponses = req.body["numResponses"];
  console.log("!")
  try{
    MongoClient.connect(url, function(err, db) {
      db.collection('study3_source').updateMany({"response_image":resImg},{$set:{"study3Responses":numResponses}})
    })
  } catch(e){
    console.log(e)
  }
  res.end();
});

expressApp.get('/resetPending', function(req, res){
  try{
    MongoClient.connect(url, function(err, db) {
      db.collection('study3_source').updateMany({},{$set:{"pending":0}})
    })
  } catch(e){
    console.log(e)
  }
  res.end();
});


expressApp.post('/setPending', function(req, res){
  var resImg = req.body["resImg"]
  var pending = req.body["pending"]
  try{
    MongoClient.connect(url, function(err, db) {
      //console.log("set " + resImg["name"] + " pending:" + pending)
      db.collection('study3_source').updateMany({"response_image":resImg},{$set:{"pending":pending}})
    })
  } catch(e){
    console.log(e)
  }
  res.send(resImg);
});


// TO RUN LOCALLY
/*
// Connect to the database before starting the application server.
MongoClient.connect(url, function (err, database) {
  if (err) {
    console.log("!! ERROR !!");
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  expressApp.listen(8000, function(){
    console.log("Express server listening on port %d", this.address().port);
  });
});
*/

// TO PUSH TO SITE
var db;
MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log("!! ERROR !!");
    console.log(err);
    process.exit(1);
  }
  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  expressApp.listen(process.env.PORT || 8000, function(){
    console.log("Express server listening on port %d", this.address().port);
  });
 });





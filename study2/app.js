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
var assert = require('assert');
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

//List all post data lowest to highest
expressApp.get('/allPosts', function(req, res){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('source_valid').find().sort({"study2Responses":1}).limit(100).toArray(function(err, result) {
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
    assert.equal(null, err);
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
    assert.equal(null, err);
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
    try{
      db.collection('users').insertOne(req.body);
    }
    catch(e){
      console.log("error adding user");
      console.log(e);
    }
    res.end();
  })
});

//Get post with lowest number of responses
expressApp.post('/saveStudy2Response', function(req, res){
  var newDocument = req.body
  MongoClient.connect(url, function(err, db) {
    try {
      db.collection('study2').insertOne(newDocument);
    }
    catch (e){
      console.log("error saving study2 response");
      console.log(e);
    }
    res.end();
  })
});

//G Save as source for study3
expressApp.post('/saveStudy3Source', function(req, res){
  var newDocument = req.body
  MongoClient.connect(url, function(err, db) {
    try {
      db.collection('study3_source').insertOne(newDocument)
    } catch(e){
      console.log("error saving study3 response");
      console.log(e);
    };
    res.end();
  })
});

//Record that source post of postID has received a response
expressApp.post('/recordPostResponse', function(req, res){
  var postID = req.body["post"]
  MongoClient.connect(url, function(err, db) {
    try{
      db.collection('source_valid').update({"id":postID}, {$inc: {"study2Responses":1}});
    }
    catch(e){
      console.log("error recording post response");
      console.log(e);
    }
    res.end();
  })
});


expressApp.post('/getStudy1Responses/', function(req, res){
  var incomingID = req.body["postID"]
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('study1').find({"postID":incomingID,"valid":1}).toArray(function(err, result) {
      if (err){
        throw err;
      } 
      res.send(result);
    });
  });
});

// Save response to study1 collection
expressApp.post('/saveStudy1Response', function(req, res){
  var newDocument = req.body
  MongoClient.connect(url, function(err, db) {
    try{
      db.collection('study1').insertOne(newDocument);
    }
    catch(e){
      console.log("error saving study1 response");
      console.log(e)
    }
    res.end();
  })
});

// Check if study3 response already exists
expressApp.post('/study3SourceExists', function(req, res){
  var incomingID = req.body["id"]
  var responseImg = req.body["responseImg"]
  MongoClient.connect(url, function(err, db) {
    db.collection('study3_source').find({"response_image":responseImg}).limit(1).toArray(function(err, result) {
      if (err){
        throw err;
      }
      var sendData = {};
      sendData["id"] = incomingID;
      sendData["responseImg"] = responseImg;
      sendData["array"] = result;
      res.send(sendData)
    });
  })
});

// Functions related to resetting survey
/*
// Remove all responses
expressApp.get('/1removeResponses', function(req, res){
  console.log("trying to remove responses");
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    try{
      db.collection("study2").remove({})
    }catch(e){
      if (e["status"] != -1){
        console.log("save response error");
        console.log(e)
      }
    }
  });
  res.end();
});

// Reset source documents to 0 responses
expressApp.get('/2resetSourceDocs', function(req, res){
  console.log("trying to reset source docs");
  MongoClient.connect(url, function(err, db) {
    db.collection("source_valid").updateMany({}, {$set: {"study2Responses":0}}, function(err, result){
      assert.equal(err,null);
    })
    res.end();
  });
});

// Remove all users
expressApp.get('/3removeUsers', function(req, res){
  console.log("trying to remove users");
  MongoClient.connect(url, function(err, db) {
    try{
      db.collection("users").remove({})
    }catch(e){
      if (e["status"] != -1){
        console.log("save response error");
        console.log(e)
      }
    }
  });
  res.end();
});
    
// Add user vc349 {"userID" : "vc349"}
expressApp.get('/4addExampleUser', function(req, res){
  console.log("trying to add example user");
  MongoClient.connect(url, function(err, db) {
    db.collection("users").insertOne({"userID":"vc349"}, function(err, result){
      assert.equal(err,null);
    })
    res.end();
  });
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});*/





/*
// TO RUN LOCALLY

// Connect to the database before starting the application server.
MongoClient.connect(url, function (err, database) {
  console.log(url)
  if (err) {
    console.log("!! ERROR !!");
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  expressApp.listen(5000, function(){
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
  expressApp.listen(process.env.PORT || 5000, function(){
    console.log("Express server listening on port %d", this.address().port);
  });
 });




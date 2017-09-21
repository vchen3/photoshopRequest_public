/* Node App 
 * Functions below are organized by what "level" they deal with:
  General functions, and then functions that deal with sessions, prompts, and then ideas

  Connect with socket and mongoDB
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

expressApp.get('/instructions', function(req, res){
  res.sendFile(__dirname + '/views/instructions.html');
});

expressApp.get('/survey', function(req, res){
  res.sendFile(__dirname + '/views/survey.html');
});

//List all post data lowest to highest
expressApp.get('/allPosts', function(req, res){
  MongoClient.connect(url, function(err, db) {
    db.collection('source').find().sort({"study1Responses":1}).limit(100).toArray(function(err, result) {
      if (err){
        console.log(err);
      }
      res.send(result);
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
    try {
      db.collection('users').insertOne(req.body);
    } catch (e){
      console.log("error adding user")
      console.log(e);
    }
    res.end();
  })
});

// Save response to study1 collection
expressApp.post('/saveResponse', function(req, res){
  var newDocument = req.body
  MongoClient.connect(url, function(err, db) {
    try {
      db.collection('study1').insertOne(newDocument);
    }
    catch (e){
      console.log("error saving response");
      console.log(e);
    }
    res.end();
  })
});

// Save response to valid collection
expressApp.post('/saveSourceValid', function(req, res){
  var newDocument = req.body
  MongoClient.connect(url, function(err, db) {
    try {
      db.collection('source_valid').insertOne(newDocument);
    } 
    catch (e){
      console.log("error saving valid");
      console.log(e);
    }
    res.end();
  })
});

//Record that source post of postID has received a response
expressApp.post('/recordPostResponse', function(req, res){
  var postID = req.body["post"]
  MongoClient.connect(url, function(err, db) {
    try{
      db.collection('source').update({"id":postID}, {$inc: {"study1Responses":1}});
    }
    catch(e){
      console.log("error recording post response");
      console.log(e);
    }
    res.end();
  })
});


/*
// Functions related to resetting survey

// Remove all responses
expressApp.get('/1removeResponses', function(req, res){
  console.log("trying to remove responses");
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    try{
      db.collection("study1").remove({})
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
    db.collection("source").updateMany({}, {$set: {"study1Responses":0}}, function(err, result){
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


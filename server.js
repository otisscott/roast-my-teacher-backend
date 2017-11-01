var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var TEACHERS_COLLECTION = 'teachers';

var app = express();
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/api/teachers"
 *    GET: finds all teachers
 *    POST: creates a new teacher
 */

app.get("/api/teachers", function(req, res) {
  db.collection(TEACHERS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get teachers.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/teachers", function(req, res) {
  var newTeacher = req.body;
  newTeacher.createDate = new Date();

  if (!req.body.name) {
    handleError(res, "Invalid user input", "Must provide a name.", 400);
  }

  db.collection(TEACHERS_COLLECTION).insertOne(newTeacher, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new teacher.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/api/teachers/:id"
 *    GET: find teacher by id
 *    PUT: update teacher by id
 *    DELETE: deletes teacher by id
 */

app.get("/api/teachers/:id", function(req, res) {
  db.collection(TEACHERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get teacher");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/teachers/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(TEACHERS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update teacher");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
});

app.delete("/api/teachers/:id", function(req, res) {
  db.collection(TEACHERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete teacher");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});

/* "/api/teachers/:id/ratings"
 *  GET: Get all reviews for a teacher
 *  PUT: Post a review to a teacher
 *  DELETE: Deletes teacher review by access code
 */

app.get("/api/teachers/:id", function(req, res) {
  db.collection(TEACHERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id)}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get teacher's reviews");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/teachers/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(TEACHERS_COLLECTION).updateOne({ _id: new ObjectID(req.params.id) }, { roasts: new ObjectID(req.params.roasts)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update teacher");
    } else {
      updateDoc._id.roasts = req.params.roasts;
      res.status(200).json(updateDoc);
    }
  });
});

app.delete("/api/teachers/:id", function(req, res) {
  db.collection(TEACHERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete teacher");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});

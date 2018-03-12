const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const csv = require("fast-csv");
const ObjectID = mongodb.ObjectID;

const TEACHERS_COLLECTION = 'teachers';
const STUDENTS_COLLECTION = 'students';
const ROAST_COLLECTION = 'roasts';
const app = express();
var swearjar = require('swearjar');
app.use(bodyParser.json());

let db;

const connectString = "mongodb://otisscott:ezpz@ds235785.mlab.com:35785/heroku_cgrr4zk9";

mongodb.MongoClient.connect(connectString, (err, database) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  db = database;
  console.log("Database connection ready");
  // Initialize the app.
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log("App now running on port", port);
  });
});

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/api/teachers", (req, res, next) => {
  db.collection(TEACHERS_COLLECTION).find({}).toArray((err, docs) => {
    if (err) {
      handleError(res, err.message, "Failed to get teachers.");
    } else {
      res.status(200).json(docs);
    }
  });
});



app.post("/api/teachers", (req, res, next) => {
  const newTeacher = req.body;
  newTeacher.createDate = new Date();

  db.collection(TEACHERS_COLLECTION).insertOne(newTeacher, (err, doc) => {
    if (err) {
      handleError(res, err.message, "Failed to create new teacher.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

app.get("/api/teachers/:id", (req, res, next) => {
  db.collection(TEACHERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id)}, (err, doc) => {
    if (err) {
      handleError(res, err.message, "Failed to get teacher");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/teachers/:id", (req, res, next) => {
  const updateDoc = req.body;
  delete updateDoc._id;

  db.collection(TEACHERS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, (err, doc) => {
    if (err) {
      handleError(res, err.message, "Failed to update teacher");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
});

app.delete("/api/teachers/:id", (req, res, next) => {
  db.collection(TEACHERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, (err, result) => {
    if (err) {
      handleError(res, err.message, "Failed to delete teacher");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});

app.get("/api/roasts", (req, res, next) => {
  db.collection(ROAST_COLLECTION).find({}).toArray((err, docs) => {
    if (err) {
      handleError(res, err.message, "Failed to get roasts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/roasts", (req, res, next) => {
  let newRoast = req.body;
  newRoast.createDate = new Date();
  newRoast = swearjar.censor(newRoast);

  db.collection(ROAST_COLLECTION).insertOne(newRoast, (err, doc) => {
    if (err) {
      handleError(res, err.message, "Failed to create new roast.");
    } else {
      res.status(201).json(doc);
    }
  });
});

app.get("/api/roasts/:teacherid", (req, res, next) => {
  if(req.params.teacherid.length < 7) {
    db.collection(ROAST_COLLECTION).find({from: req.params.teacherid }).toArray((err, doc) => {
      if (err) {
        handleError(res, err.message, "Failed to get roasts for teacher");
      } else {
        res.status(200).json(doc);
      }
    });
  } else {
    db.collection(ROAST_COLLECTION).find({refer: req.params.teacherid }).toArray((err, doc) => {
      if (err) {
        handleError(res, err.message, "Failed to get roasts for teacher");
      } else {
        res.status(200).json(doc);
      }
    });
  }
});

app.delete("/api/roasts/:id", (req, res, next) => {
  db.collection(ROAST_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, (err, result) => {
    if (err)
      handleError(res, err.message, "Failed to delete roast");
    else
      res.status(200).json(req.params.id);
  });
});

app.get("/api/students/:studentID", (req, res, next) => {
  db.collection(STUDENTS_COLLECTION).findOne({studentID: req.params.studentID}, (err, doc) => {
    if (err) {
      handleError(res, err.message, "That is not a Student ID");
    } else {
      res.status(200).json(doc);
    }
  })
});

app.post("/api/students", (req, res, next) => {
  csv
    .fromPath("my.csv")
    .on("data", function(data){
      sub = data[3].split(", ")
      for(let i = 0; i < sub.length; i++) {
        db.collection(TEACHERS_COLLECTION).insertOne({first: data[2], last: data[1], subject: sub[i]}, (err, doc) => {
          if (err) {
            handleError(res, err.message, "Something went wrong");
          } else {
            res.status(201);
          }
        })
      }
    })
    .on("end", function(){
      console.log("done");
    });
});

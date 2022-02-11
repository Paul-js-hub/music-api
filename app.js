import dbConnection from "./mongodb";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import cloudinary from "cloudinary";
import fs from "fs";

dotenv.config();
const app = express();

dbConnection();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Welcome to music api");
});

app.get("/audio", (req, res) => {
  let music = "./songs/amazing.mp3"; // filepath
  let stat = fs.statSync(music);
  let range = req.headers.range;
  let readStream;
  // if there is no request about range
  if (range !== undefined) {
    // remove 'bytes=' and split the string by '-'
    var parts = range.replace(/bytes=/, "").split("-");

    var partial_start = parts[0];
    var partial_end = parts[1];

    if (
      (isNaN(partial_start) && partial_start.length > 1) ||
      (isNaN(partial_end) && partial_end.length > 1)
    ) {
      return res.sendStatus(500);
    }
    // convert string to integer (start)
    var start = parseInt(partial_start, 10);
    // convert string to integer (end)
    // if partial_end doesn't exist, end equals whole file size - 1
    var end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
    // content length
    var content_length = end - start + 1;

    res.status(206).header({
      "Content-Type": "audio/mpeg",
      "Content-Length": content_length,
      "Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
    });

    // Read the stream of starting & ending part
    readStream = fs.createReadStream(music, { start: start, end: end });
  } else {
    res.header({
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
    });
    readStream = fs.createReadStream(music);
  }
  readStream.pipe(res);
});

app.post("/audio/upload", (req, res) => {
  // Get the file name and extension with multer
  const storage = multer.diskStorage({
    filename: (req, file, cb) => {
      const fileExt = file.originalname.split(".").pop();
      const filename = `${new Date().getTime()}.${fileExt}`;
      cb(null, filename);
    },
  });

  // Filter the file to validate if it meets the required audio extension
  // Function to control which files are accepted
  const fileFilter = (req, file, cb) => {
    if (file.mimetype === "audio/mp3" || file.mimetype === "audio/mpeg") {
      cb(null, true);
    } else {
      cb(
        {
          message: "Unsupported File Format",
        },
        false
      );
    }
  };

  // Set the storage, file filter and file size with multer
  const upload = multer({
    storage,
    limits: {
      fieldNameSize: 200,
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter,
  }).single("audio");

  // upload to cloudinary
  upload(req, res, (err) => {
    if (err) {
      return res.send(err);
    }

    // SEND FILE TO CLOUDINARY
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const { path } = req.file; //file becomes available in req at this point

    const fName = req.file.originalname.split(".")[0];
    cloudinary.v2.uploader.upload(
      path,
      {
        resource_type: "raw",
        public_id: `uploads/${fName}`,
      },

      // Send cloudinary response or catch error
      (err, audio) => {
        if (err) return res.send(err);

        fs.unlinkSync(path);
        res.send(audio);
      }
    );
  });
});

export default app;

import dbConnection from "./mongodb";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import cloudinary from "cloudinary";
import { isEmpty } from 'lodash';
import Music from "./model/musicModel";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

dbConnection();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Welcome to music api");
});

app.get("/audio", async (req, res) => {
  try {
    const music = await Music.find();
    return res.send(music);
  } catch (error) {
    res.send(error);
  }
});

app.get("/music/:id", async (req, res) => {
  const music = await Music.findById(req.params.id); // Looking up for the music
  if (!music)
    res
      .status(404)
      .send({ message: "The music with that particular ID not found." }); ////If it does not exist return Not Found
  res.send({ message: "Success", music });
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

    if (isEmpty(req.file)) return res.status(400).send('EROOR! No file submitted.');

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
        if (audio) {
          const data = {
            musicUrl: audio.url,
            title: fName,
          };

          const music = new Music(data);
          music
            .save()
            .then((doc) => {
              res.status(201).send({
                message: "Your music has been successfully uploaded",
                doc,
              });
            })
            .catch((err) => {
              res.status(500).send({
                message: "Something went wrong while processing your request",
                err,
              });
            });
        } else {
          res.send({
            message: "Something went wrong while processing your request",
          });
        }
      }
    );
  });
});

app.listen(PORT, () => console.log(`App is listening to port ${PORT}`))
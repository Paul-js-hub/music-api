import mongoose from 'mongoose';

const dbConnection = () => {
    const mongoDB = process.env.MONGODB_URI;
    mongoose.connect(mongoDB , { useNewUrlParser: true, useUnifiedTopology: true });

    //Get the default connection
    const db = mongoose.connection;

    //Bind connection to error event (to get notification of connection errors)
    //db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.on("connected", () =>{
        console.log("Mongoose connected")
    })
}

//username: hesbononchera
//password: onchera
export default dbConnection;
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const musicSchema = new Schema({
    title:String,
    musicUrl:String
});

const musicModel = mongoose.model('Music', musicSchema);

module.exports = musicModel

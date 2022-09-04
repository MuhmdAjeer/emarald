const db = require('../config/connection')
const COLLECTIONS = require('../config/collections');
const { ObjectId } = require('mongodb');
const collections = require('../config/collections');

module.exports = {
    getAllRooms : ()=>{
        db.get().collection(COLLECTIONS.ROOM_COLLECTION)
        .aggregate(
            [
                {
                    $project : {'images' : 0}
                }
            ]
        ).toArray()
        .then((result)=>{
            console.log(result);
        })
    },
    getAllHotels : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(COLLECTIONS.HOTEL_COLLECTION)
            .aggregate([
                {
                    $match : {
                        disabled : false,
                        approved : true,
                        blocked : false
                    }
                }
            ])
            .toArray()
            .then((result)=> resolve(result))
            
        })
    },
    getRoomsByHotel : async(hotelId)=>{
        if(!ObjectId.isValid(hotelId)) throw 'Invalid objectId'
        return await db.get().collection(collections.ROOM_COLLECTION)
        .find({hotelId : ObjectId(hotelId)})
        .toArray()
    }
}
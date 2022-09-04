const db = require('../config/connection')
const COLLECTIONS = require('../config/collections')
const { ObjectID } = require('bson')
const collections = require('../config/collections')
const objectId = require('mongodb').ObjectId

module.exports = {
    getHotelsBookings : (vendorId) => {
        return new Promise((resolve,reject)=>{
            db.get().collection(COLLECTIONS.HOTEL_COLLECTION)
            .aggregate([
                {
                    $match : {
                        vendorId : objectId(vendorId)
                    }
                },
                {
                    $lookup : {
                        from : COLLECTIONS.BOOKING_COLLECTION,
                        localField : '_id',
                        foreignField : 'hotelID',
                        pipeline : [
                            {
                                $match : {
                                'status' : 'success'
                            }
                            },
                            {
                                $group : {
                                    _id : '$hotelID',
                                    totalRooms : {$sum : '$rooms'}
                                }
                            }
                        ],
                        as : 'bookings'
                    }
                },
            ]).toArray()
            .then((result)=>resolve(result))
        })
    },
    getRoomCategoriesData : (hotelId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(COLLECTIONS.BOOKING_COLLECTION)
            .aggregate(
                [
                    {
                        $match : {
                            hotelID : objectId(hotelId),
                            status : 'success'
                        }
                    },
                    {
                        $lookup : {
                            from : COLLECTIONS.ROOM_COLLECTION,
                            localField : 'roomID',
                            foreignField : '_id',
                            as : 'roomDetails'
                        }
                    },
                    {
                        $group : {
                            _id : "$roomDetails.category",
                            totalRooms : {$sum : '$rooms'}
                        }
                    }
                ]
            ).toArray()
            .then((result)=> resolve(result)) 
        })
    }
}
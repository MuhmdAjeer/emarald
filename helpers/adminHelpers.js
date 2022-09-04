const db = require('../config/connection')
const ObjectId = require('mongodb').ObjectId
const collection = require('../config/collections');
const collections = require('../config/collections');
const { validateRequest } = require('twilio/lib/webhooks/webhooks');
const { response } = require('express');
const { ObjectID } = require('bson');
const vendor = require('../middlewares/vendor');

module.exports = {
    doLogin : (data)=>{
        let loginStatus = false;
        return new Promise(async(resolve,reject)=>{
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({'admin_id' : data.id})
            
            if(admin){
                if(admin.password == data.password){
                    loginStatus = true;
                    resolve(loginStatus)
                }else{
                    loginStatus = false;
                    resolve(loginStatus)
                }
            }else{
                loginStatus = false;
                resolve(loginStatus)
            }
        })
    },

 

    getRoomCategories : ()=>{            
     return new Promise(async(resolve,reject)=>{
        let rooms = await db.get().collection(collections.ADMIN_COLLECTION).find({}).toArray()
        console.log(rooms);
        if(rooms){
            return resolve(rooms[0].roomCategories)
            console.log(rooms[0].roomCategories)
        }else{
            resolve('no rooms found')
        }
        })
    },
    getAmenityList : ()=>{
        return new Promise(async(resolve,reject)=>{
            let amenities = await db.get().collection(collections.ADMIN_COLLECTION)
            .find( { } )
            .toArray()

            resolve(amenities[0].amenity)
        })
    
    },

    addCategory : (data)=>{
        return new Promise(async(resolve,reject)=>{
            let room = await db.get().collection(collections.ADMIN_COLLECTION).findOne({"roomCategories" : data.category})
            console.log(room);
            if(room){
                reject('Category Already exists')
            }else{
                db.get().collection(collections.ADMIN_COLLECTION).updateOne({},{
                    $push : {'roomCategories' : data.category}
                }).then(()=>{
                    resolve()
                })
            }
        })
    },
    addAmenity : (data)=>{
        return new Promise(async(resolve,reject)=>{
            let amenity = await db.get().collection(collections.ADMIN_COLLECTION)
            .findOne( { 'amenity' : data.amenity } )
        
            if(amenity){
                return reject('Already Exists')
            }else{
                db.get().collection(collections.ADMIN_COLLECTION)
                    .updateOne(
                        {},
                        {
                            $push : {'amenity' : data.amenity}
                        }
                    ).then((msg)=>{
                        console.log(msg,'dddd');
                        resolve()  
                    })
            }     
        })
        
    },
    deleteCategory : (category)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ADMIN_COLLECTION).updateOne({},{
                $pull : {"roomCategories" : category}
            }).then(()=>{
                resolve()
            })
        })
    },
    deleteAmenity : (amenity)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ADMIN_COLLECTION)
            .updateOne(
                {},
                {
                    $pull : {'amenity' : amenity }
                }
            )
            .then(()=>{
                resolve()
            })
            .catch((err)=> {
                reject(err)
            })
        })
    },
    addCoupon : (couponData)=>{
        return new Promise(async(resolve,reject)=>{
            
                let response = {
                    success : false,
                    message : 'Already Exists'
                }

            let coupon = await db.get().collection(collection.COUPON_COLLECTION)
            .findOne({'code' : couponData.code})
                console.log(coupon);
            if(coupon){
                return resolve(response)
            }else{
                db.get().collection(collection.COUPON_COLLECTION)
                .insertOne(couponData)
                .then((result)=>{
                    response.success = true
                    resolve(response)
                })
                .catch((err)=> reject(err))
            }

        })
    },
    getAllCoupons : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .find({})
            .toArray()
            .then((coupons) => resolve(coupons) )
            .catch((err)=> reject(err))
        })
    },
    deleteCoupon : (id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .deleteOne({'_id' : ObjectID(id)})
            .then((response)=>resolve(true))
            .catch((err)=>reject(err))
        })
    },
    getAllUsers : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .find({})
            .toArray()
            .then((users)=> resolve(users))
            .catch((err)=> reject(err))
        })
    },
    getAllVendors : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.VENDOR_COLLECTION)
            .find({})
            .toArray()
            .then((vendors)=> resolve(vendors))
            .catch((err)=> reject(err))
        })
    },
    blockUser : async(userId,value)=>{
        value = value == 'false' ? false : true
        console.log(value);
        await db.get().collection(collection.USER_COLLECTION)
        .updateOne({_id : ObjectID(userId)},{
            $set : {
                'isBlocked' : value
            }
        })
    },
    getAllhotelCategoryChart : async()=>{
        let data = await db.get().collection(collection.ROOM_BOOKINGS)
        .aggregate([
            {
                $group : {
                    _id : '$date',
                    roomsBooked : {$sum : '$count'}
                }
            },
            {
                $sort : {_id : 1}
            },
            {
                $limit : 10
            }
        ]).toArray()
        return data
    },
    getChartByCategory : async()=>{
        let data = await db.get().collection(collection.BOOKING_COLLECTION)
        .aggregate(
            [
                {
                    $match : {status : 'success'}
                },
                {
                    $lookup : {
                        from : collection.ROOM_COLLECTION,
                        localField : 'roomID',
                        foreignField : '_id',
                        as : 'roomData'
                    }
                },
                {
                    $group : {
                        _id : '$roomData.category',
                        totalRooms : {$sum : '$rooms'}
                    }
                }
            ]
        ).toArray()
        return data
    },
    getAllBookings : async()=>{
        let bookings = await db.get().collection(collection.BOOKING_COLLECTION)
        .aggregate(
            [
                {
                    $match : { status : 'success' }
                },
                {
                    $lookup : {
                        from : collection.HOTEL_COLLECTION,
                        localField : 'hotelID',
                        foreignField : '_id',
                        as : 'hotel'
                    }
                },
                {$unwind : "$hotel"},
                {
                    $lookup : {
                        from : collection.ROOM_COLLECTION,
                        localField : 'roomID',
                        foreignField : '_id',
                        as : 'room'
                    }
                },
                {$unwind : "$room"},
                {
                    $lookup : {
                        from : collection.USER_COLLECTION,
                        localField : 'userId',
                        foreignField : '_id',
                        as : 'user'
                    }
                },
                {$unwind : "$user"}
            ]
        ).toArray()
        return bookings
    },
    cancelBooking : async(bookingId)=>{
        if(!ObjectID.isValid(bookingId)) throw 'Invalid objectId'
        await db.get().collection(collection.BOOKING_COLLECTION)
        .updateOne(
            {_id : ObjectID(bookingId)},
            {
                $set : {
                    status : 'cancelled'
                }
            }
        )
    },
    getVendorRequests : async()=>{
        return await db.get().collection(collection.VENDOR_COLLECTION)
        .find({'approved' : false})
        .toArray(); 
    },
    approveVendor : async(vendorId)=>{
        await db.get().collection(collection.VENDOR_COLLECTION)
        .updateOne({_id : ObjectID(vendorId)},
        {
            $set : {
                'approved' : true
            }
        })
    },
    cancelVendorRequest : async(vendorId)=>{
        await db.get().collection(collection.VENDOR_COLLECTION)
        .updateOne({_id:ObjectID(vendorId)},
        {
            $set : {
                'approved' : 'cancelled'
            }
        }) 
    },
    getHotelRequests : async()=>{
        return await db.get().collection(collection.HOTEL_COLLECTION)
        .aggregate([
            {
                $match : { 'approved' : false }
            },
            {
                $lookup : {
                    from : collection.VENDOR_COLLECTION,
                    localField : 'vendorId',
                    foreignField : '_id',
                    as : 'vendor'
                }
            },
            {
                $unwind : '$vendor'
            },
            {
                $sort : {'requestedAt' : -1}
            }
        ])
        .toArray();
    },
    approveHotel : async(hotelId)=>{
        await db.get().collection(collection.HOTEL_COLLECTION)
        .updateOne({_id : ObjectID(hotelId)},
        {
            $set : {
                approved : true         
            }
        })
    },
    denyHotel : async(hotelId)=>{
        await db.get().collection(collection.HOTEL_COLLECTION)
        .updateOne({_id : ObjectID(hotelId)},{
            $set : {
                approved : 'cancelled'
            }
        })
    },
    getApprovedHotels : async()=>{
        return await db.get().collection(collection.HOTEL_COLLECTION)
            .aggregate([
                {
                    $match : {
                        approved : true
                    }
                },
                {
                    $lookup : {
                        from : collection.VENDOR_COLLECTION,
                        localField : 'vendorId',
                        foreignField : '_id',
                        as : 'vendor'
                    }
                },
                {
                    $unwind : '$vendor'
                }
            ])
            .toArray()
    },
    changeBlockStatus : async(hotelId,value)=>{
        await db.get().collection(collection.HOTEL_COLLECTION)
        .updateOne({_id : ObjectID(hotelId)},{
            $set : {
                blocked : value
            }
        })
    }
}
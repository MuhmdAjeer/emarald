const db = require('../config/connection')
const COLLECTIONS = require('../config/collections')
const bcrypt = require('bcrypt')
const collections = require('../config/collections')
const { ObjectID } = require('bson')
const objectId = require('mongodb').ObjectId


module.exports = {

    checkVendorExist : async (data)=>{
        let vendor =  await db.get().collection(COLLECTIONS.VENDOR_COLLECTION).findOne({
            $or : [
                {"username" : data.username},
                {"email" : data.email}
            ]
        })
        return vendor;
    },
    doSignup : (data)=>{
        return new Promise(async(resolve,reject)=>{
            data.password = await bcrypt.hash(data.password,10)
            const {ConfirmPassword , code , ...newData} = data;
            newData.approved = false;
            db.get().collection(COLLECTIONS.VENDOR_COLLECTION).insertOne(newData)
            .then((result)=>{
                resolve(result.insertedId)
            }).catch((err)=>{
                console.log(err);
            })
        })
    },

    doLogin : (data)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
            let vendor = await db.get().collection(COLLECTIONS.VENDOR_COLLECTION).findOne({
                "username" : data.username
            })
            if(vendor){
            let ifExist = await bcrypt.compare(data.password,vendor.password)
                if(ifExist){
                    switch (vendor.approved) {
                        case true:
                            resolve(vendor._id)   
                            break;
                        case false:
                            response.message = "Your request is pending"
                            reject(response)
                        case 'cancelled':
                            response.message = "Your request is Cancelled"
                            reject(response)
                        default:
                            break;
                    }
                }else{
                    response.message = "Wrong Password"
                    reject(response)
                }
            }else{
                response.message = "Vendor Doesnt Exist"
                reject(response)
            }
        })
    },
    addHotel : (hotelData)=>{
        return new Promise((resolve,reject)=>{
            hotelData.vendorId = ObjectID(hotelData.vendorId)
            db.get().collection(collections.HOTEL_COLLECTION)
            .insertOne(hotelData)
            .then(()=>{
                console.log('done');
                resolve()
            })
            .catch((err)=>{
                console.log(err);
            })
        })
    },
    getVendorHotels : (vendorId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.HOTEL_COLLECTION)
            .aggregate(
                [
                    {
                        $match : {'vendorId' : ObjectID(vendorId)}
                    }
                ]).toArray()
                .then((result)=>{
                console.log(result);
                resolve(result)
            })
        })
    },
    addRoom : (roomData)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(roomData.hotelId , roomData.category , 'hi this is the details');
            let exist = await db.get().collection(collections.ROOM_COLLECTION)
            .findOne({'hotelId' : ObjectID(roomData.hotelId), 'category' : roomData.category})
            console.log(exist , 'im exist');
            if(exist == null){
                roomData.hotelId = objectId(roomData.hotelId)
                db.get().collection(COLLECTIONS.ROOM_COLLECTION)
                .insertOne(roomData)
                .then(()=>{
                    resolve()
                })
                .catch((err)=> console.log(err))
            }else{
                return reject({message : 'Category already exists'})    
            }
        })
    },
    getOneHotel : (hotelId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.HOTEL_COLLECTION)
            .findOne({'_id' : objectId(hotelId)})
            .then((hotel)=>{
                resolve(hotel)
            })
        })
    },
    editHotel : (hotelData)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.HOTEL_COLLECTION)
            .updateOne(
                {'_id' : objectId(hotelData.hotelId)},
                {
                    $set : {
                        'name' : hotelData.name,
                        'city' : hotelData.city,
                        'adress': hotelData.adress ,
                        'phone' :  hotelData.phone,
                        'description' : hotelData.description,
                        'image': hotelData.image,
                        'checkIn': hotelData.checkIn,
                        'checkOut' : hotelData.checkOut
                    }
                    
                }
            )
            .then((result)=>{
                console.log(result)
                resolve()
            })
            .catch((err)=> reject(err))
        })
    },
    getHotelBookings : (hotelId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.BOOKING_COLLECTION)
            .aggregate([
                {
                    $match : {'hotelID' : objectId(hotelId) , 'status' : 'success'}
                },
                {
                    $lookup : {
                        from : COLLECTIONS.ROOM_COLLECTION,
                        localField : 'roomID',
                        foreignField : '_id',
                        as : 'room-details' 
                    }
                },
                {
                    $lookup : {
                        from : COLLECTIONS.HOTEL_COLLECTION,
                        localField : 'hotelID',
                        foreignField : '_id',
                        as : 'hotel-details' 
                    }
                }
                
            ]).toArray()
            .then((bookings)=>{
                resolve(bookings)
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    checkHotelIdExist : (vendorId,hotelId)=>{
        return new Promise((resolve,reject)=>{
            console.log(vendorId , hotelId , 'fdsfasdfsd');
            db.get().collection(collections.HOTEL_COLLECTION)
            .findOne(
                {
                    '_id' : ObjectID(hotelId),
                    'vendorId':objectId(vendorId)
                }
            ).then((result)=>{
                console.log(result);
                if(result){
                    resolve()
                }else{
                    reject('Hotel doesnt exist')
                }
            })
        })
    },
    disableHotel : async(hotelId,value)=>{
        await db.get().collection(collections.HOTEL_COLLECTION)
        .updateOne({_id : objectId(hotelId)} , {
            $set : {
                'disabled' : value
            }
        })
    },
    updateRoom : async(data)=>{
        await db.get().collection(collections.ROOM_COLLECTION)
        .updateOne({_id : objectId(data.roomId)},{
            $set : {
                'roomSize' : data.roomSize,
                'roomPrice': data.roomPrice,
                'maxCount' : data.maxCount
            }
        })
    }
}
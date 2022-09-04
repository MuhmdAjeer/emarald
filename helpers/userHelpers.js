const db = require('../config/connection')
const objectID = require('mongodb').ObjectId
const collections = require('../config/collections')
const bcrypt =require('bcrypt')
const { WHISHLIST_COLLECTION } = require('../config/collections')
const {getDayDiff , getDatesArray, tConvert} = require('../func/destructor')
const Razorpay = require('razorpay');
const { ObjectId, ObjectID } = require('mongodb')
const { resolve } = require('path')
const { query } = require('express')

const razorpay = new Razorpay({
  key_id: 'rzp_test_N2RRXE67XccXt4',
  key_secret: 'PPjV1hdF2UGJgi1rve9stTNC',
});



module.exports = {

     checkUserExist : async(data)=>{
        let user = await db.get().collection(collections.USER_COLLECTION).findOne({
            $or : [
                {"username" : data.username},
                {"email" : data.email}
            ]
        })
        return user;
     },
    
    doSignup : async(data)=>{
        data.password = await bcrypt.hash(data.password,10);
        const {ConfirmPassword , ...newData} = data;
        let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
        newData.country = regionNames.of(newData.country)
        newData.isBlocked = false
       
        let user =  await db.get().collection(collections.USER_COLLECTION).insertOne(newData)
        return user.insertedId
         
    },

    doLogin : (data)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
            //CHECK IF USER EXITS
            let user = await db.get().collection(collections.USER_COLLECTION)
            .findOne({"username" : data.username})

            //IF EXISTS COMPARE PASSWORD
            if(user){
                if(user.isBlocked){
                    return reject({message : 'You are blocked from the site'})
                }
                let exist = await bcrypt.compare(data.password,user.password)
                console.log(exist , 'fdsafsadfsd');
                if(exist){
                    return resolve(user._id)
                }else{
                    response.message = 'Wrong Password'
                    reject(response)
                }
    
            }else{
                response.message = 'User Doesnt Exist'
                reject(response)
            }
        })
    },
    getOneHotel : (hotelId)=>{
        console.log('hello', hotelId , 'hoteld');
         return new Promise(async(resolve,reject)=>{
            if(objectID.isValid(hotelId) == false){
               return reject({status : 302})
            }
            db.get().collection(collections.HOTEL_COLLECTION)
            .aggregate(
                [
                    {
                        $match : {'_id' : objectID(hotelId),
                        approved : true ,
                        disabled : false,
                        blocked:false
                    }
                    },
                    {
                        $lookup : {
                            from : collections.ROOM_COLLECTION,
                            localField : '_id',
                            foreignField : 'hotelId',
                            as : 'rooms'
                        }
                    },
                    {
                        $lookup : {
                            from : 'ratings',
                            localField : '_id',
                            foreignField : 'hotelId',
                            pipeline : [
                                {
                                    $group : {
                                        '_id' : '$hotelId',
                                        'avgRating': {$avg : "$rating"}
                                    },
                                    
                                },
                                {
                                    $project : {
                                        "avgRating" : {$round : ["$avgRating",1]}
                                    }
                                }
                            ],
                            as : 'rating'
                        }
                    }
                ]
            ).toArray()
            .then((result)=>{
                // let roomImages = []
                // rooms =  result[0].rooms
                // // result[0].rooms.images = roomImages.shift()
                // rooms.map((value)=>{
                //     value.images = value.images.shift()
                // })
                console.log(result , 'imresult');
                if(result[0] == null){
                   return reject({status : 404})
                }
                console.log(result[0]?.rooms);
                // console.log(rooms);
                resolve(result)
            })
            .catch((err)=> reject(err))
         })

    },
    getOneRoom : (roomId)=>{

        return new Promise((resolve,reject)=>{
            if(objectID.isValid(roomId == false)) return reject({status : 404})
            db.get().collection(collections.ROOM_COLLECTION)
            .aggregate(
                [
                    {$match : {'_id' : objectID(roomId)}},
                    {
                        $lookup : {
                            from : collections.HOTEL_COLLECTION,
                            localField : 'hotelId',
                            foreignField : '_id',
                            as : 'hotel'
                        }
                    }
                ]
            ).toArray()
            .then((room)=>{
                if(room[0] == null){
                    return reject({status : 404})
                }
                resolve(room[0])
            })
            .catch((err)=>{
                reject(err)
                console.log(err);
            })
        })
    },
    getTotalPrice : (data)=>{

        const days = getDayDiff(data.checkIn , data.checkOut)
        price = parseInt(data.roomPrice)
        rooms = parseInt(data.roomCount)
        
        console.log(days , 'days');
        if(days == 0){
            totalPrice = price * rooms; 
            return totalPrice;
        }else{
            totalPrice = price * rooms * days; 
            return totalPrice
        }
    },
    addToWishlist : (hotelId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {
                status : false
            }
            // Check weather user already has whislist array in db
            let exist = await db.get().collection(collections.WHISHLIST_COLLECTION)
            .findOne( { 'user' : objectID(userId) } )
            //if exist push hotel to that array , else create a new array in db
            if(exist){
                let hotelExist = await db.get().collection(WHISHLIST_COLLECTION).findOne(
                    {
                        'user': objectID(userId),
                        'hotels' : objectID(hotelId)
                    }
                )
                if(hotelExist){
                    resolve(response)
                }else{

                    db.get().collection(collections.WHISHLIST_COLLECTION)
                    .updateOne({'user' :objectID(userId)},
                    {$push : {'hotels' : objectID(hotelId)}})
                    .then((result)=>{
                        if(result.modifiedCount != 0){
                            response.status = true
                            resolve(response)
                        }else{
                            resolve(response)
                        }
                    })
                }
            }else{
                let whishlist = {
                    user : objectID(userId),
                    hotels : [objectID(hotelId)]
                }
                db.get().collection(collections.WHISHLIST_COLLECTION)
                .insertOne(whishlist)
                
            }       
        })
    },
    getWishlists : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.WHISHLIST_COLLECTION)
            .aggregate([
                {
                    $match : {'user' : objectID(userId)}
                },
                {
                    $lookup : {
                        from : collections.HOTEL_COLLECTION,
                        localField : 'hotels',
                        foreignField : '_id',
                        as : 'hotels'
                    }
                }
            ]).toArray()
            .then((result)=>{
                resolve(result[0]?.hotels)
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    removeWishListHotel : (hotelId,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.WHISHLIST_COLLECTION)
            .updateOne(
                {'user':objectID(userId)},
                {
                    $pull : {
                        'hotels' : objectID(hotelId)
                    }
                }
            ).then((result)=>{
                console.log(result);
                resolve()
            })
        })
    },
    getOneUser : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.USER_COLLECTION)
            .findOne({'_id' : objectID(userId)})
            .then((userDetails)=>resolve(userDetails))
            .catch((err)=>reject(err))
        })
    },
    createBooking : (bookingdata)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.BOOKING_COLLECTION)
            .insertOne(bookingdata)
            .then((result)=>{
                resolve(result.insertedId)
            }) .catch((err)=>{
                reject(err)
            })
           
        })
    },
    updateRoomCount : (data)=>{

            const dates = getDatesArray(data.checkin,data.checkout)
            //! const rooms = parseInt(data.rooms)
            dates.forEach((date)=>{
            db.get().collection(collections.ROOM_BOOKINGS)
            .updateMany(
                {
                    roomID : objectID(data.roomId) ,
                    date : date
                },
                {
                    $set : {
                        userId : objectID(data.userId)
                    },
                    $inc : {
                        count : data.rooms
                    },
                    
                },
                {
                    'upsert' : true
                }
            )
        })
    },
    generateRazorpay : (bookingId,price)=>{
        return new Promise((resolve,reject)=>{
            razorpay.orders.create({
                amount: price * 100,
                currency: "INR",
                receipt: ""+bookingId
              })
              .then((order)=>{
                resolve(order)
              })
              .catch((err)=>{
                console.log(err);
                reject(err)
              })
        })
    },
    getOneCoupon : (code)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.COUPON_COLLECTION)
            .findOne({'code' : code})
            .then((result)=>{
                console.table(result);
                resolve(result)
            })
            .catch((err)=>{
                console.log(err);
                reject(err)
            })
        })
    },
    checkIfDateIsinBetween : (firstDate,lastDate,dateBetween)=>{
        const dates = [firstDate,lastDate,dateBetween].map(date => {
            return new Date(date)
         });
     
         console.log(dates[1]);
         if(dates[0] <= dates[2]  && dates[1] >=dates[2] ){
             return true;
         }else{
             return false;
         }
    },
    getDiscountedAmount : (coupon,amount)=>{
        if(coupon.type == 'percentage'){
            discountAmount = Math.trunc((coupon.amount / 100) * amount) 
            totalAfter = amount - discountAmount
            coupon = {
                ...coupon,
                discountedPrice : discountAmount,
                totalAfter : totalAfter
            } 
            return coupon;
        }else{
            totalAfter = amount - coupon.amount
            coupon = {
                ...coupon,
                totalAfter : totalAfter,
                discountedPrice : coupon.amount
            }
            return coupon
        }
    },
    verifyPayment : (details)=>{
        return new Promise((resolve,reject)=>{
            console.log(details , 'haai');
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256','PPjV1hdF2UGJgi1rve9stTNC')
            hmac.update(details['rzp[razorpay_order_id]'] + '|' + details['rzp[razorpay_payment_id]'])
            hmac = hmac.digest('hex')   
            console.log(hmac , 'codddee');
            let x = hmac == details['rzp[razorpay_signature]']
            console.log(x);
            if(hmac == details['rzp[razorpay_signature]']){
                console.log('payment success');
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus : (id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.BOOKING_COLLECTION)
            .updateOne(
                {
                    '_id' : ObjectId(id)
                },
                {
                    $set : {
                        'status' : 'success'
                    }
                }
            )
            .then(()=> resolve())
            .catch((err)=> reject(err))
        })
    },
    getBookingBill : (bookingId,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.BOOKING_COLLECTION)
            .aggregate(
                [
                    {$match : {'_id' : ObjectId(bookingId) , 'userId' : ObjectId(userId)}},
                    {$lookup : {
                        from : collections.ROOM_COLLECTION,
                        localField : 'roomID',
                        foreignField : '_id',
                        as : 'roomDetails'
                    }},
                    {$lookup : {
                        from : collections.HOTEL_COLLECTION,
                        localField : 'roomDetails.hotelId',
                        foreignField : '_id',
                        as : 'hotel'
                    }},
                    // {
                    //     $out : {db : collections.DATABASE , coll : collections.BOOKING_BILLS}
                    // }
                ]
            ).toArray()
            .then((result)=>{
                console.log(result)
                if(result[0] == null){
                    return reject({status : 404})
                }
                resolve(result[0])
            })
            .catch((err)=> reject(err)) 
        })
    },
    getUserBookings : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.BOOKING_COLLECTION)
            .aggregate([
                {
                    $match : {'userId' : ObjectId(userId) , 
                    'status' : 'success',}
                },
                {
                    $lookup : {
                        from : collections.ROOM_COLLECTION,
                        localField : 'roomID',
                        foreignField : '_id',
                        as : 'roomdetails' 
                    }
                },
                {
                    $lookup : {
                        from : collections.HOTEL_COLLECTION,
                        localField : 'hotelID',
                        foreignField : '_id',
                        as : 'hoteldetails' 
                    }
                },
                {
                    $sort : {'bookedTime' : -1}
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
    checkRoomAvailability : (booking,room)=>{
        return new Promise((resolve,reject)=>{
            const dates = getDatesArray(booking.checkin,booking.checkout)
            const rooms = parseInt(booking.rooms)
            const maxRooms = parseInt(room.maxCount)

            db.get().collection(collections.ROOM_BOOKINGS)
            .aggregate([
                {
                    $match : {
                        date : {$in : dates}
                    }
                },
                {
                    $project : {
                        date : 1 ,
                        count : {$add : ['$count',rooms]}
                    }
                },
                {
                    $match : {count : {$gte : maxRooms}}
                }
            ]).toArray()
            .then((result)=>{
                console.log(result);
                if(result[0]?.date){
                    resolve({availability : false , result})
                }else{
                    resolve({availability : true})
                }
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    updateUser : async (data,userId)=>{
       try {
        console.log(data);
        let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
        data.country = regionNames.of(data.country)
       let result =  await db.get().collection(collections.USER_COLLECTION)
       .updateOne({_id : objectID(userId)},{$set : data})
       return
       } catch (error) {
        console.log(error);
        return error
       }
    },
    updatePassword : async(userId,data)=>{
        let user = await db.get().collection(collections.USER_COLLECTION)
        .findOne({_id : objectID(userId)})
        //check passwords are same
            let samePassword = await bcrypt.compare(data.currentpw,user.password)
            if(samePassword){
                let password = await bcrypt.hash(data.password , 10)
                console.log(password , 'this is password' , data , 'this is data' , user , 'this is user');
                await db.get().collection(collections.USER_COLLECTION)
                .updateOne({_id : objectID(userId)},{
                    $set : {
                        'password' : password 
                    }
                })
            }else{
                throw 'Passwords not same'
            }
        
    },
    hotelQuery : async(query)=>{  
        let result = await db.get().collection(collections.HOTEL_COLLECTION)
        .findOne(
            {
                approved : true,disabled:false,
                $or : [{city : query.city},{checkIn : query.checkIn}, {checkOut : query.checkOut}]
            }
        )
        return result
    },
    ifAllreadyBooked : async(data,userId)=>{
        let bookings = await db.get().collection(collections.ROOM_BOOKINGS)
        .find({userId : objectID(userId)})
        .toArray()
        let dates = bookings.map((booking)=> booking.date)
        let bookedDates = getDatesArray(data.checkin,data.checkout)
        let ifBooked = false
        dates.forEach((date)=>bookedDates.forEach((date1)=>{
            date = new Date(date)
            date1 = new Date(date1)
            if(date1.valueOf() == date.valueOf()){
                ifBooked = true
                console.log('helloo');
                return
            }
        }))
        return ifBooked
    }

}

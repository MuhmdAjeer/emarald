const userHelpers = require('../helpers/userHelpers');
const otpAuth = require('../auth/twillio');
const {getDayDiff, getDatesArray} = require('../func/destructor');
const { ObjectId, ObjectID, Db } = require('mongodb')


module.exports = { 
    userSignup : async(req,res)=>{
        let user = await userHelpers.checkUserExist(req.body)
        console.log(user);
        if(user){
            return res.render('users/signup',{message : "Username or Email Already Exist"})
        }
        req.session.userSignupDetails = req.body
        otpAuth.sendOTP(req.body.phone)
        .then((resolve)=>{
            console.log(req.body , 'this is reqbody');
            res.render('users/otpVerify' , {data : req.body})
        }).catch((err)=>{
            console.log(err);
            res.render('users/signup',{message : "An error occured! Please Try Again"})
        })          
    },
    
    verificationOtp : (req,res)=>{
        otpAuth.checkOTP(req.body.phone,req.body.code)
        .then(async()=>{
            req.session.userLogin = true
            req.session.user = req.body
            req.session.userSignupDetails =null
            res.redirect('/home')
            let userId = await userHelpers.doSignup(req.body)
            req.session.userId = userId
        }).catch(()=>{
            res.render('users/otpVerify' , {data : req.session.userSignupDetails , message : 'Wrong OTP'})
        })
    },
    userLogin : (req,res)=>{

        userHelpers.doLogin(req.body)
        .then((userId)=>{
            req.session.userId = userId
            req.session.userLogin =true
            console.log(req.session);
            req.session.user = req.body
            res.redirect('/home')
        })
        .catch((response)=>{
            res.render('users/login' , {response})
        })
    },
    getHotelPage : (req,res,next)=>{
        userHelpers.getOneHotel(req.params.hotelId)
        .then((hotel)=>{
            res.render('users/hotel-page',{ hotel , layout : 'user-layout', user : req.session.user })
        })
        .catch((err)=> next(err))
    },
    getRoomPage : (req,res,next)=>{
        userHelpers.getOneRoom(req.params.roomId)
        .then((room)=>{
            console.log(room , 'ccc')
            res.render('users/room-details-page' , { layout : 'user-layout' , room , unavailable :req.session.roomUnavailabilty, user : req.session.user})
            req.session.roomUnavailabilty = false
        })
        .catch((err)=> next(err))
    },
    addToWishlist : (req,res)=>{
        if(!req.session.userLogin) res.json({message : 'Please Login first'})
        console.log(req.session.userId);
        userHelpers.addToWishlist(req.body.hotelId , req.session.userId)
        .then((result)=>{
            res.json(result)
        })
    },
    getWishlistPage : (req,res,next)=>{
        userHelpers.getWishlists(req.session.userId)
        .then((hotels)=> { 
            console.log(hotels);
            res.render('users/wishlist' , {layout : 'user-layout' , hotels, user : req.session.user})
        })
        .catch((err)=>{
            next(err) 
        })

    },
    bookingDetails : (req,res,next)=>{
        try {
            console.log(req.query);
            bookingData = req.query
            bookingData.days = getDayDiff(bookingData.checkin,bookingData.checkout)
            bookingData.days = bookingData.days == 0 ? 1 : bookingData.days
            userHelpers.getOneRoom(req.query.roomId)
            .then((room)=>{
            userHelpers.checkRoomAvailability(bookingData,room)
            .then((response)=>{
            if(response.availability){
                userHelpers.getOneUser(req.session.userId)
                .then((user)=>{ 
                    bookingData.totalPrice = room.roomPrice * bookingData.days * bookingData.rooms
                    res.render('users/room-payment' , {layout : 'user-layout' , room , user , bookingData})
                    })
                .catch((err)=> next(err))
            }else{
                req.session.roomUnavailabilty = true
                res.redirect(`/hotel/room/${req.query.roomId}`)
            }
                })
            })
            .catch((err)=> next(err))
        } catch (error) {
            next({status : 400})
        }

    },
    createOrder : (req,res,next)=>{
        try {
        let bookingData = JSON.parse(req.body.bookingData)
        let room = JSON.parse(req.body.room)
        let user = JSON.parse(req.body.user)
        console.log(getDatesArray(bookingData.checkin,bookingData.checkout));
        let couponDiscount = req.session?.couponDiscount
        let discountedPrice = couponDiscount == null ? bookingData.totalPrice : bookingData.totalPrice-couponDiscount
        let couponCode = req.session?.couponCode
        room._id = ""+room._id
        bookingData.rooms = parseInt(bookingData.rooms) 
        bookingData = {
            userId : ObjectId(req.session.userId),
            roomID : ObjectId(room._id),
            hotelID : ObjectId(room.hotelId),
            status : 'pending',
            bookedTime : new Date(),
            discount : parseInt(couponDiscount) ,
            grandTotal : discountedPrice,
            coupon : couponCode,  
            ...bookingData,
            ...user
        }
        // userHelpers.updateRoomCount(bookingData)
        userHelpers.createBooking(bookingData)
        .then((bookingId)=>{
        userHelpers.generateRazorpay(bookingId,bookingData.grandTotal)
        .then((order)=>{
            order.dPrice =  req.session.couponDiscount
            order.couponCode = req.session?.couponCode
            console.log(order);
            res.json(order)    
        })
        })
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    couponDiscount : (req,res)=>{
        let amount = req.query.total
        let code = req.query.code;
        code = code.toUpperCase();
        userHelpers.getOneCoupon(code)
        .then((result)=>{
            if(result){ //checking if result is null or not
                today = new Date()
                valid = userHelpers.checkIfDateIsinBetween(result.validFrom,result.validUpto,today) //chechking if coupon is valid for the date
                if(valid){
                    let coupon = userHelpers.getDiscountedAmount(result,amount) 
                    console.table(coupon)
                    req.session.couponDiscount = coupon.discountedPrice
                    req.session.couponCode = coupon.code
                    res.json(coupon)           
                }else{
                    res.json({status : 'invalid'})
                }
            }else{
                res.json({status : 'not found'})
            }
        })
    },
    verifyPayment : (req,res)=>{
        console.log(req.body , 'im payment body');
        userHelpers.verifyPayment(req.body)
        .then(()=>{
        userHelpers.changePaymentStatus(req.body['order[receipt]'])
        .then(()=> res.json({success : true , bookingId : req.body['order[receipt]']}))
        .catch((err)=> console.log(err))
        })
        .catch(()=> res.json({success : false , message : 'payment failed'}))
    },
    bookingConfirmation : (req,res,next)=>{
            bookingId = req.params.id;
            userId = req.session.userId;
            userHelpers.getBookingBill(bookingId,userId)
            .then((bill)=>{
                userHelpers.updateRoomCount(bill)
                res.render('users/booking-success',{layout : 'user-layout' , bill, user : req.session.user})
            })
            .catch((err)=> next(err))            
       
    },
    getBookings : (req,res)=>{
            let userId = req.session.userId
            userHelpers.getUserBookings(userId)
            .then((bookings)=>{
                console.log(bookings);
                console.log(bookings[0]?.hoteldetails , bookings[0]?.roomdetails);
                res.render('users/my-bookings',{bookings , layout : 'user-layout', user : req.session.user})
            })
            .catch((err)=>{
                console.log(err);
            })

    },
    updateUser : async(req,res)=>{
        try {
            
            await userHelpers.updateUser(req.body , req.session.userId)
            res.json({success : true})
        } catch (error) {
            console.log(error);
        }
        
    },
    updatePassword : async(req,res)=>{
        try {
            await userHelpers.updatePassword(req.session.userId,req.body)
            res.json({success : true})
        } catch (error) {
            console.log(error);
            res.json({success : false})
        }
        
    },
    hotelSearch : async(req,res,next)=>{
        try {
            let query = req.query
            if(query.checkIn) query.checkIn = tConvert(query.checkIn)
            if(query.checkOut) query.checkOut = tConvert(query.checkOut)

            let result = await userHelpers.hotelQuery(query)
            let hotels = []
            hotels.push(result)
            if(hotels[0] == null) hotels = false
            res.render('users/search',{hotels , layout : 'user-layout', user : req.session.user})
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    checkifBooked : async(req,res)=>{
        try {
            const ifBooked = await userHelpers.ifAllreadyBooked(req.body,req.session.userId)
            if(ifBooked) res.json({booked : true})
            else res.json({booked : false})
        } catch (error) {
            res.json({success : false})
        }
    }
}
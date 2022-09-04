const {destructor , tConvert} = require('../func/destructor')
const otpAuth = require('../auth/twillio');
const adminHelpers = require('../helpers/adminHelpers');
const vendorHelpers = require("../helpers/vendorHelpers");
const vendorCharts = require('../helpers/vendorCharts')
const { ObjectID } = require('bson');
const roomHelpers = require('../helpers/roomHelpers');
const { Db } = require('mongodb');

module.exports = {
    VendorSignup : async(req,res)=>{
      console.log(req.body);
      let vendor = await vendorHelpers.checkVendorExist(req.body)
      if(vendor){
        if(vendor?.approved == false){
          return res.render('vendor/signup' , {ifRequestSend : true})
        }else if(vendor?.approved == true){
          return res.render('vendor/signup' , {message : 'Already Exists'})
        }else if(vendor?.approved == 'cancelled'){
          return res.render('vendor/signup' , {message : 'Vendor request denied'})
        }
      }else{
        req.session.vendor = req.body;
        otpAuth.sendOTP(req.body.phone)
        .then((response)=> res.render('vendor/otpVerify' ,{data : req.body}))
        .catch((rej)=> res.redirect('/vendor/signup'))        
      }
    },

    otpVerification : (req,res)=>{
        otpAuth.checkOTP(req.body.phone,req.body.code)
        .then((status)=>{ 
          vendorHelpers.doSignup(req.body)
          .then((vendorId)=>{
            req.session.sendVendorRequest = true;
            res.redirect('/vendor/signup')
          })
        }).catch(()=>{
          res.render('vendor/otpVerify' , {data : req.session.vendor , message : 'Wrong OTP'})
        })
    },

    vendorLogin : (req,res)=>{
      console.log(req.body);
      vendorHelpers.doLogin(req.body)
      .then((vendorId)=>{
        req.session.vendor = req.body.username ; req.session.vendorLogin = true
        req.session.vendorId = vendorId
         res.redirect('/vendor/dashboard')
      })
      .catch((response)=>{
        res.render('vendor/login' , {response})
      })
    },
    getAddRoomPage : (req,res,next)=>{
      const vendorId = req.session.vendorId
      vendorHelpers.checkHotelIdExist(vendorId,req.query.hotelId)
      .then(()=>{
      Promise.all([adminHelpers.getRoomCategories(),adminHelpers.getAmenityList()])
      .then(([categories,amenities])=>{
        success = req.session.addroomSuccess 
        req.session.addroomSuccess = false
        err = req.session.roomAddErr
        req.session.roomAddErr = false
        res.render('vendor/add-rooms' , { layout : 'vendor-layout', categories , amenities,hotelId : req.query.hotelId,err,success  } )})
      })
      .catch((err)=>{
        next(err)
      })  
    },

    //hotelListing
    addHotelDetails : (req,res,next)=>{
      let files = req.files
      let hotelData = req.body
      hotelData.images = files.map((value) => value.filename)
      req.body.image = hotelData.images
      req.body.checkIn = tConvert(req.body.checkIn)
      req.body.checkOut = tConvert(req.body.checkOut)
      req.body = {
        ...req.body,
        requestedAt : new Date(),
        disabled : false,
        approved : false,
        blocked : false
      }
      vendorHelpers.addHotel(req.body)
      .then(()=>{
        res.redirect('/vendor/dashboard')
      })
      .catch((err)=> next(err))
    },

    addRoomDetails : (req,res,next)=>{
      let files = req.files
      const roomData =  destructor(req.body)
      req.body.images = []
      roomData.images = files.map((value) => value.filename)
      vendorHelpers.addRoom(roomData)
      .then(()=>{
        req.session.addroomSuccess = true
        res.redirect(`/vendor/add-rooms?hotelId=${roomData.hotelId}`)
      })
      .catch((err)=> {
        if(err.message == 'Category already exists'){
          req.session.roomAddErr = true
        res.redirect(`/vendor/add-rooms?hotelId=${roomData.hotelId}`)
        }else{
          next(err)
        }
      })

    },
    myhotels : (req,res)=>{
      let vendorId = req.session.vendorId
      vendorHelpers.getVendorHotels(vendorId)
      .then((hotels)=>{
        res.render('vendor/view-hotels',{hotels , layout : 'vendor-layout'})
      })
    },

    hotelEditingPage : (req,res,next)=>{
      try {
        hotelId = req.params.hotelId
        if (!ObjectID.isValid(hotelId)) return next({status : 404})
        vendorHelpers.getOneHotel(hotelId)
        .then((hotel)=>{
          if(hotel == null) throw {status : 404}
          res.render('vendor/edit-hotel' , { layout : 'vendor-layout' , hotel })
        })
      } catch (error) {
        next(error)
      }
    },
    editHotel : (req,res)=>{
      files = req.files
      hotelData = req.body
      hotelData.images = files.map((value) => value.filename)
      req.body.image = hotelData.images
      console.log(hotelData.images , 'imagesss');
      hotelData.checkIn = tConvert(req.body.checkIn)
      hotelData.checkOut = tConvert(req.body.checkOut)
      console.log(hotelData);
      vendorHelpers.editHotel(hotelData)
      .then(()=> res.json({success : true}))
      .catch((err)=> res.json({success : false}))
    },
    hotelBookings : (req,res,next)=>{
      if (!ObjectID.isValid(req.params.id)) return next({status : 404})
      vendorHelpers.getHotelBookings(req.params.id)
      .then((bookings)=>{
        console.log(bookings);
        res.render('vendor/bookings' , {bookings , layout : 'vendor-layout'})
      })
      .then((err)=>{
        next(err)
      })
    },
    getVendorsHotelData : (req,res)=>{
      vendorCharts.getHotelsBookings('62e2ef598f43ee77b3027f44')
      .then((result)=> res.json(result))
    },
    getRoomCategoryChart : (req,res)=>{
      const hotelId = req.query.hotelId
      vendorCharts.getRoomCategoriesData(hotelId)
      .then((data)=> res.json(data))
    },
    disableHotel : async(req,res)=>{
      try {
        let {hotelId , value} =  req.query
        if(value == 'false'){
          value = false
        }else{
          value = true
        }
        await vendorHelpers.disableHotel(hotelId , value)
        res.json({success : true})
      } catch (error) {
        console.log(error);
        res.json({success :false})
      }
    },
    getHotelRooms : async(req,res,next)=>{
      try {
        Promise.all([roomHelpers.getRoomsByHotel(req.query.hotelId),adminHelpers.getAmenityList()])
        .then(([rooms,amenities])=>{
          console.log(rooms,'fsdafsd',amenities);
          res.render('vendor/view-hotel-rooms',{layout : 'vendor-layout',rooms,amenities})
        })
        .catch((err)=> next(err))
      } catch (error) {
        next(error)
      }
    },
    updateRoom : async(req,res)=>{
      try {
        console.log(req.body);
        await vendorHelpers.updateRoom(req.body)
        res.json({success : true})
      } catch (error) {
        res.json({success : false})      
      }
    }
}

const express = require('express')
const vendorController = require('../controller/vendor-controller')
const controller = require('../controller/vendor-controller')
const vendorHelpers = require('../helpers/vendorHelpers')
const upload = require('../middlewares/utilis')
const {verifyLogin} = require('../middlewares/vendor')
const router = express.Router()

//render signup page for vendor
router.get('/signup',(req,res)=>{
    res.render('vendor/signup',{ifRequestSend : req.session.sendVendorRequest});
    req.session.sendVendorRequest = false;
})

// render login page for vendor
router.get('/login',(req,res)=>{
    res.render('vendor/login')
})
//render vendor's dashboard page
router.get('/dashboard',verifyLogin,(req,res)=>{
    vendorHelpers.getVendorHotels(req.session.vendorId)
    .then((hotels)=>{
        res.render('vendor/dashboard',{layout : "vendor-layout" , hotels})
    })
})
//logut vendor from the session
router.get('/logout',(req,res)=>{
    req.session.vendorLogin = false
    res.redirect('/vendor/login')
})

//receives the signup data and redirect to otp verify if valid
router.post('/signup' , controller.VendorSignup)
//receives the code and verify & redirect to homepage
router.post('/otpAuth', controller.otpVerification)
//receives login data and verify
router.post('/login', controller.vendorLogin)

// router.post('/add-hotel',upload.array('image',1),addHotel)

//render page add rooms for the specified hotel in the query params
router.get('/add-rooms/',verifyLogin,controller.getAddRoomPage)
router.get('/view-rooms/', controller.getHotelRooms)

router.get('/bookings/:id',verifyLogin,controller.hotelBookings)

// render the list of hotels of the vendor
router.get('/my-hotels',verifyLogin,controller.myhotels)
// render hotel listing page
router.get('/list-hotel',verifyLogin,(req,res)=>{
    res.render('vendor/list-hotel',
    {
        id : req.session.vendorId ,
        layout : 'vendor-layout'
    })
})

// GET hotel details editing page
router.get('/edit-hotel/:hotelId', verifyLogin,controller.hotelEditingPage)
// receives hotel data and store inthe db
router.post('/list-hotel',verifyLogin,upload.array('image',3),vendorController.addHotelDetails)
// receives room data and store it in the db
router.post('/add-room',verifyLogin,upload.array('image',3), vendorController.addRoomDetails)
// Edit hotel details in database
router.post('/edit-hotel',upload.array('image',3),verifyLogin,vendorController.editHotel)

router.post('/update-room', vendorController.updateRoom)
router.get('/disableHotel' , verifyLogin,vendorController.disableHotel)

//! chart data fetching
router.get('/hotels-bookings-data', verifyLogin,vendorController.getVendorsHotelData )
router.get('/hotelRoomCategoy' ,verifyLogin, vendorController.getRoomCategoryChart)

module.exports = router
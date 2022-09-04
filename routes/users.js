const express = require('express');
const { userSignup, userLogin, verificationOtp , getHotelPage , getRoomPage , addToWishlist ,getWishlistPage,checkifBooked} = require('../controller/user-controller');
const controller = require('../controller/user-controller')
const roomHelpers = require('../helpers/roomHelpers');
const userHelpers = require('../helpers/userHelpers');
const router = express.Router();
const {ifLogin} = require('../middlewares/user')
const {getDayDiff} = require('../func/destructor')



/* GET home page. */
router.get('/',ifLogin, (req, res, next) =>{
  res.redirect('/home')
});

/* GET login Page */
router.get('/login',(req,res)=>{
  res.render('users/login')
})
// GET user Signup Page
router.get('/signup', (req,res)=>{
  res.render('users/signup')
})
// GET Home page
router.get('/home',(req,res)=>{
  roomHelpers.getAllHotels()
  .then((hotels)=>{
    console.log(hotels);
    res.render('users/home' , {layout : 'user-layout' , user : req.session.user , hotels})
  })
})
router.get('/search',controller.hotelSearch)
// LOGOUT user from sesion
router.get('/logout',(req,res)=>{
  req.session.userLogin = false
  res.redirect('/login')
})
// GET one hotel details page
router.get('/hotel/:hotelId',ifLogin,getHotelPage)
//GET room booking page 
router.get('/hotel/room/:roomId' ,ifLogin, getRoomPage)
// GET whishlist page
router.get('/wishlists' ,ifLogin, getWishlistPage)
router.post('/booked-on-same-dates', checkifBooked)
router.get('/add-coupon-discount' , ifLogin,controller.couponDiscount)
router.get('/booking-confirmation' , ifLogin,(req,res)=>{
  res.render('users/booking-success',{layout : 'user-layout', user : req.session.user})
})
router.get('/booking-confirmation/:id',ifLogin,controller.bookingConfirmation)
router.get('/bookings',ifLogin,controller.getBookings)



// verify signup 
router.post('/signup', userSignup)
// Veify login
router.post('/login',userLogin)
// Verify OTP
router.post('/otpauth',verificationOtp)

router.post('/add-total-price',(req,res)=>{
  let price = userHelpers.getTotalPrice(req.body)
  res.json(price)
})
//remove hotel from whishlist
router.post('/remove-from-wishlist',ifLogin,(req,res)=>{
  console.log(req.body);
  userHelpers.removeWishListHotel(req.body.hotelId,req.session.userId)
  .then(()=> res.json('success'))
})

router.get('/profile',ifLogin,(req,res)=>{
  userHelpers.getOneUser(req.session.userId)
  .then((user)=>  res.render('users/user-profile' , {layout : 'user-layout' , user}))
 
})
router.post('/update-user' ,ifLogin, controller.updateUser)
router.post('/change-password' ,ifLogin, controller.updatePassword)

router.post('/remove-coupon',ifLogin,(req,res)=>{
  try {
    req.session.couponDiscount = false
    req.session.couponCode = false
  res.json('success')
  } catch (error) {
    console.log(error);
  }
})


router.post('/add-to-whishlist' , addToWishlist)
router.get('/booking-details' ,ifLogin,controller.bookingDetails) 
router.post('/create-order' , ifLogin,controller.createOrder)

router.post('/verify-payment' , ifLogin,controller.verifyPayment)

module.exports = router



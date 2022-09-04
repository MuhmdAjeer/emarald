const express = require("express");
const router = express.Router();
const adminHelpers = require("../helpers/adminHelpers");
const adminHelper = require("../helpers/adminHelpers");
const {ifLogin} = require('../middlewares/admin')
const {addCoupon , deleteCoupon } = require('../controller/admin-controller')
const moment  = require('moment');
const { Db } = require("mongodb");
const admin = require("../middlewares/admin");
// get admin login page
router.get("/", ifLogin , (req, res) => {
  res.redirect('/admin/dashboard')
});

//render admin login page
router.get('/login',(req,res)=>{
  res.render('admin/admin-login')
})

//verify adminLogin
router.post("/login", (req, res) => {
  adminHelper.doLogin(req.body)
  .then((loggedIn) => {
    if (loggedIn) {
      req.session.adminLogin = true;
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin/admin-login' ,{err : 'Incorrect username or password'});
    }
  });
});

//render admin dashboard
router.get("/dashboard", ifLogin , (req, res) => {
  res.render("admin/admin-dashboard", { layout: "admin-layout" });
});

//add room categories to database
router.post("/add-category", ifLogin , (req, res) => {
  adminHelper.addCategory(req.body)
    .then(() => {
      res.redirect("/admin/rooms");
    })
    .catch((err) => {
      res.redirect('/admin/rooms?err=' + err)
    });
});

//add amenities to database
router.post('/add-amenity',ifLogin , (req,res)=>{
  adminHelper.addAmenity(req.body)
  .then(()=>{
    res.redirect('/admin/rooms')
  })
  .catch((err)=>{
    console.log(err);
  })
})

//render page to add and view room/categories
router.get("/rooms", ifLogin , (req, res) => {
  let err = req.query.err
  Promise.all([adminHelpers.getRoomCategories(),adminHelpers.getAmenityList()])
  .then(([category,amenities])=>{
    res.render('admin/view-rooms',{ layout : 'admin-layout' , amenities , category , err })
  })
});

router.get('/view-users' , ifLogin,(req,res)=>{
  adminHelpers.getAllUsers().then((users)=>{
    res.render('admin/view-all-users' , {users ,layout : 'admin-layout'})
  })
})

router.get('/view-vendors' ,ifLogin, (req,res)=>{
  adminHelpers.getAllVendors().then((vendors)=>{
    res.render('admin/view-vendors', {layout : 'admin-layout' , vendors})
  })
})

router.get('/coupons' , ifLogin,(req,res)=>{
  adminHelper.getAllCoupons().then((coupons)=>{
    res.render('admin/coupon' , {layout : 'admin-layout' , coupons})
  })
})

router.get('/all-bookings',async(req,res,next)=>{
  try {
    let bookings = await adminHelpers.getAllBookings()
    bookings.forEach(element => {
      element.checkout = moment(element.checkout).format('MMMM Do YYYY')
      element.checkin  = moment(element.checkin).format('MMMM Do YYYY')
      element.bookedTime = moment(element.bookedTime).format('MMMM Do YYYY')
    });
    res.render('admin/view-bookings' , {layout : 'admin-layout',bookings})
  } catch (error) {
    next(error)
  }
})
router.get('/cancel-booking' , async(req,res)=>{
  try {
    await adminHelper.cancelBooking(req.query.bookingId)
    res.json('success')
  } catch (error) {
    res.json('failed')
  }
})
router.get('/vendor-requests', async(req,res,next)=>{
  try {
    let requests = await adminHelper.getVendorRequests()
    console.log(requests);
    res.render('admin/vendor-requests',{requests , layout : 'admin-layout'})
  } catch (error) {
    next(error)
  }
})

router.get('/hotel-requests',async(req,res,next)=>{
  try {
    let hotels = await adminHelpers.getHotelRequests()
    console.log(hotels);
    res.render('admin/hotel-requests',{layout: 'admin-layout',hotels})
  } catch (error) {
    console.log(error);
    next(error)
  }
})

router.get('/approve-vendor', async(req,res)=>{
  try {
    await adminHelper.approveVendor(req.query.vendorId)
    res.json({success:true})
  } catch (error) {
    res.json({success:false})
  }
})

router.get('/approve-hotel', async(req,res)=>{
  try {
    await adminHelper.approveHotel(req.query.hotelId)
    res.json({success : true})
  } catch (error) {
    console.log(error);
    res.json({succes : false})
  }
})

router.get('/deny-hotel', async(req,res)=>{
  try {
    await adminHelper.denyHotel(req.query.hotelId)
    res.json({success : true})
  } catch (error) {
    console.log(error);
    res.json({succes : false})
  }
})

router.get('/cancel-vendor-request' , async(req,res)=>{
  try {
    await adminHelper.cancelVendorRequest(req.query.vendorId)
    res.json({success : true})
  } catch (error) {
    res.json({success : false})
  }
})

//delete the room category
router.get("/delete-category/:id", ifLogin , (req, res) => {
  adminHelpers.deleteCategory(req.params.id).then(() => {
    res.redirect("/admin/rooms");
  });
});
router.get('/block-user',ifLogin,async(req,res)=>{
  try {
    console.log(req.query);
  await adminHelpers.blockUser(req.query.userId,req.query.value)
  res.json({success : true})
  } catch (error) {
    res.json({success : false})
  }
})
//delete a amenity from database
router.get('/delete-amenity/',ifLogin , (req,res)=>{
  console.log(req.query.name);
  adminHelpers.deleteAmenity(req.query.name)
  .then(()=>{
    res.redirect('/admin/rooms')
  })
})
router.get('/update-block-status',async(req,res)=>{
  try {
    console.log(req.query.value);
    let status = req.query.value == 'true' ? true : false
    await adminHelper.changeBlockStatus(req.query.hotelId,status)
    console.log(status);
    res.json({success : true})
  } catch (error) {
    console.log(error);
    res.json({success : false})
  }
})

router.get('/view-all-hotels',async(req,res)=>{
  let hotels = await adminHelper.getApprovedHotels()
  console.log(hotels);
  res.render('admin/all-hotels-list',{layout:'admin-layout',hotels})
})

router.post('/delete-coupon',ifLogin,deleteCoupon)

router.post('/add-coupon' , ifLogin,addCoupon)
router.get('/category-chart',async(req,res)=>{
  let data = await adminHelper.getAllhotelCategoryChart()
  console.log(data);
  res.json(data)
})
router.get('/room-category-chart' ,ifLogin,async(req,res)=>{
  try {
  let data = await adminHelper.getChartByCategory()
  res.json(data)
  } catch (error) {
    console.log(error);
  }
})

//logout admin from the session
router.get('/logout',(req,res)=>{
  req.session.adminLogin = false;
  res.redirect('/admin/login')
})
module.exports = router;

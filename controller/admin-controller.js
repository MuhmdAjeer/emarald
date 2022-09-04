const { response } = require("express")
const adminHelpers = require("../helpers/adminHelpers")

module.exports = {
    denyRequest : (req,res,next)=>{
        const {id ,hotel} = req.params
        adminHelpers.denyHotel(id,hotel)
        .then(()=> res.redirect('/admin/hotel-requests'))
        .catch((err)=> next(err))
    },
    addCoupon : (req,res,next)=>{
        console.log(req.body);
        code = req.body.code
        req.body.code = code.toUpperCase() 
        adminHelpers.addCoupon(req.body)
        .then((response)=>{
            console.log(response);
            res.json(response)
        })
        .catch((err)=> next(err))
    },
    deleteCoupon : (req,res,next)=>{
        adminHelpers.deleteCoupon(req.body.id)
        .then((response)=> res.json(response))
        .catch((err)=> next(err))
    }
}
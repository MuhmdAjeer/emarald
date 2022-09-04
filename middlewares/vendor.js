module.exports = {
    verifyLogin : (req,res,next)=>{
        if(req.session.vendorLogin){
            next()
        }else{
            res.redirect('/vendor/login')
        }
    }
}
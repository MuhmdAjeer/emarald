module.exports = {
    ifLogin : (req,res,next)=>{

        if(req.session.adminLogin){
            next()
        }else{
            res.redirect('/admin/login')
        }
    },
    

}
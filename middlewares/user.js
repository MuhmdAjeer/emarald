module.exports = { 
    ifLogin : (req,res,next)=>{
        if(req.session.userLogin){
            next()
        }else{
            res.redirect('/login')
        }
    }
    
}
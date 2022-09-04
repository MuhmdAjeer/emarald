module.exports = {
    destructor : (room)=>{
      const amenities = Object.keys(room).slice(5)
      console.log(room , 'imtoom');
      console.log(room.hotelId , 'imhotelid');
      const roomDetails = {
        hotelId :  room.hotelId,
        category : room.category,
        roomSize : room.roomSize,
        roomPrice : room.roomPrice,
        maxCount : room.maxCount,
        amenities : amenities
      }

      return roomDetails
    },
    tConvert :  (time)=>{
      // Check correct time format and split into components
      time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    
      if (time.length > 1) { // If time format correct
        time = time.slice (1);  // Remove full string match value
        time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
        time[0] = +time[0] % 12 || 12; // Adjust hours
      }
      return time.join (''); // return adjusted time or original string
    },
    getDayDiff : (date1,date2)=>{
      date1 = new Date(date1); 
      date2 = new Date(date2); 
      const timeDiff = date2.getTime() - date1.getTime();  
      const daydiff = timeDiff / (1000 * 60 * 60 * 24); 
      return daydiff;
    },
    toLongDate : (d) => {   
      function join(t, a, s) {
          function format(m) {
             let f = new Intl.DateTimeFormat('en', m);
             return f.format(t);
          }
          return a.map(format).join(s);
       }
       
       let a = [{day: 'numeric'}, {month: 'short'}, {year: 'numeric'}];
       d = new Date(d)
       let s = join(d, a, '-');
       console.log(s);
  },
  getDatesArray : (start, end) => {
    for(var arr=[],dt=new Date(start); dt<new Date(end); dt.setDate(dt.getDate()+1)){
        arr.push(new Date(dt));
    }
    return arr;
  }
}
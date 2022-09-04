

$(document).ready(function () {
  $('form[id="add-hotel"]').validate({
    rules: {
      name: {
        required: true,
        maxlength: 14,
      },

      city: {
        required: true,
      },
      image: {
        required: true,
      },
      adress: {
        required: true,
        minlength: 16,
        maxlength: 60,
      },
      phone: {
        required: true,
        minlength: 10,
        maxlength: 10,
      },
      description: {
        required: true,
        minlength: 20,
      },
      checkIn: {
        required: true,
      },
      checkOut: {
        required: true,
      },
    },
    messages: {
      name: {
        required: "this field is required",
        maxlength: "maximum length should be 14",
      },

      city: {
        required: "this field is required",
      },
      adress: {
        required: "this field is required",
        minlength: "Minimum length should be 16",
        maxlength: "maximum lenght should be 60",
      },
      description: {
        required: "This field is required",
        minlength: "minimum length should be 16",
      },
      phone: {
        required: "This field is required",
        minlength: "Enter a valid phone number",
        maxlength: "Enter a valid phone number",
      },
    },
  });
});

$(document).ready(function () {
  $('#add-room').validate({
    rules: {
      roomSize: {
        required: true,
        maxlength: 3,
      },
      roomPrice: {
        required: true,
      },
      maxCount : {
        required : true
      }
    },
    messages: {
      roomSize: {
        required: "This field is required",
        maxlength: "length should be less than 3 characters",
      },
      roomPrice: {
        required: "This field is required",
      },
      maxCount : {
        required : 'This field is required'
      }
    },
  });
});

$(document).ready(function () {
  console.log("dsafdccccccccccccccccc");
  $("#booking").validate({
    rules: {
      checkout: {
        required: true,
      },
      checkin: {
        required: true,
      },
      a: {
        required: true,
      },
    },
    messages: {
      checkout: {
        required: "This Field is Mandatory",
      },
      checkin: {
        required: "This Field is Mandatory",
      },
      a: {
        required: "daf",
      },
    },
  });
});

function createOrder(booking, user, room) {
  let fullName = document.getElementById("fullname").value;
  let userDetails = {
    fullName: document.getElementById("fullname").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
  };
  userDetails = JSON.stringify(userDetails);
  let err = document.getElementById("err").innerHTML;

  if (fullName == "") {
    err.hidden = false;
  } else {
    $.ajax({
      url: "/create-order",
      method: "post",
      data: {
        bookingData: booking,
        user: userDetails,
        room: room,
      },
      success: (order) => {
        showRazorpay(order);
      },
    });
  }
}

function showRazorpay(order) {
  console.log(order);
  var options = {
    key: "rzp_test_N2RRXE67XccXt4", // Enter the Key ID generated from the Dashboard
    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    name: "Emarald",
    description: "Test Transaction",
    image: "",
    order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    handler: function (response) {
      // alert(response.razorpay_payment_id);
      // alert(response.razorpay_order_id);
      // alert(response.razorpay_signature);
      verifyPayment(response,order)
    },
    prefill: {
      name: "Gaurav Kumar",
      email: "gaurav.kumar@example.com",
      contact: "8137977758",
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#3397cc",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}

function addcoupon(total) {
  console.log(total , total);
  let code = document.getElementById("code").value;

  $.ajax({
    url: "/add-coupon-discount",
    method: "get",
    data: {
      code: code,
      total: total,
    },
    success: (response) => {
      if (response.status == 'not found') {
        document.getElementById('couponerror').hidden = false
      }else if(response.status == 'invalid'){
        document.getElementById('couponerror').innerHTML = 'Coupon is invalid'
        document.getElementById('couponerror').hidden = false
      }else{
        swal("", "Coupon Added!", "success");
        document.getElementById("couponcode").innerHTML = response.code;
        document.getElementById("couponPrice").innerHTML =response.discountedPrice;
        document.getElementById("grandtotal").innerHTML = response.totalAfter;
        document.getElementById("couponcode").hidden = false;
        document.getElementById("pricediv").hidden = false;
        document.getElementById("removecoupon").hidden = false;
        document.getElementById("couponPrice").hidden = false;
      }
    },
  });
}

function addCoupon() {
  $("#addcoupon").validate({
    rules: {
      code: {
        required: true,
      },
      validFrom: {
        required: true,
      },
      validUpto: {
        required: true,
      },
      type: {
        required: true,
      },
      description: {
        required: true,
      },
    },
    messages: {
      code: {
        required: "This Field is Mandatory",
      },
      validFrom: {
        required: "This Field is Mandatory",
      },
      validUpto: {
        required: "This Field is Mandatory",
      },
      type: {
        required: "This Field is Mandatory",
      },
      description: {
        required: "This Field is Mandatory",
      },
    },
  });
}
function btnDisable() {
  document.getElementById('couponerror').hidden = true
  console.log("helloddgdd");
  if (document.getElementById("code").value == "") {
    console.log("in iif");
    document.getElementById("codebtn").disabled = true;
  } else {
    document.getElementById("codebtn").disabled = false;
  }
}

function removecoupon(){
  $.ajax({
    url : '/remove-coupon',
    method : 'post',
    success : (response)=>{
      if(response == 'success'){
        document.getElementById("removecoupon").hidden = true;
        $("#container11").load(location.href + " #container11");
        // $("#couponcode").load(location.href + " #couponcode");
        // $("#pricediv").load(location.href + " #pricediv");

        $("#grandtotal").load(location.href + " #grandtotal");
      }
    }
  })
}

function verifyPayment(rzp,order){
  $.ajax({
    url : '/verify-payment',
    method : 'post',
    data : {
      rzp,
      order
    },
    success : (response)=>{
      if(response.success){
        location.href = `/booking-confirmation/${response.bookingId}`
      }else{
        swal({
          title: "Payment Failed",
          text: 'Please try again!',
          icon: "error",
          button: "OK",
          });
      }
    }
  })
}

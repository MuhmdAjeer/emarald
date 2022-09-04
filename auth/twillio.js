const accountSid = "AC6330326bf483f82d39090687dbbf6bc4";
const authToken = "c1de8ba97db2110d8c28221decf0705f";
const serviceId = "VA1784f6fae3fb612d6bb092e6ebddf4d7";
const client = require("twilio")(accountSid, authToken);

module.exports = {
  sendOTP: (number) => {
    // client.verify.v2.services
    //         .create({friendlyName: 'Emarald'})
    //         .then(service => console.log(service.sid));
    number = "+91" + number;
    return new Promise((resolve, reject) => {
      client.verify.v2
        .services(serviceId)
        .verifications.create({ to: number, channel: "sms" })
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  },

  checkOTP: (number, otp) => {
    number = `+91${number}`;
    console.log(otp);
    return new Promise((resolve, reject) => {
      client.verify.v2
        .services(serviceId)
        .verificationChecks.create({ to: number, code: otp })
        .then((response) => {
          if(response.status == 'approved'){
            resolve()
          }else{
            reject()
          }
        });
    });
  },
};

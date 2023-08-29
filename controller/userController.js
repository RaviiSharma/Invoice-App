
const helpers = require("../helpers");
const knex = require('../db.js')
const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require('path');
const url = require('url');
const fs = require('fs');



let moment = require('moment');
let date = moment();
let formattedDate = date.format('YYYY-MM-DD HH:mm:ss');


require("dotenv").config()

let user = {};


user.userRegister = async (req, res) => {
  try {
    console.log("req.body", req.body)
    console.log("register api");
    const data = req.body;
    console.log("data", data);


    if (
      !data.user_name ||
      !helpers.validInputValue(data.user_name) ||
      !helpers.validOnlyCharacters(data.user_name)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "user_name is required and should contain only alphabets",
      });
    };
    if (
      !data.mobile_no ||
      !helpers.validInputValue(data.mobile_no) ||
      !helpers.validPhone(data.mobile_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "mobile_no is required and should contain only number",
      });
    };
    let result0 = await knex("company_details")
      .select("*")
      .where("user_mobileno", data.mobile_no);

    if (result0.length !== 0) {
      // console.log("k2", result0[0].user_mobileno);
      return res.json({
        code: "400",
        status: false,
        message: `Account already registered with this ${data.mobile_no}, please login`,
      });
    };
    if (
      !data.email_id ||
      !helpers.validInputValue(data.email_id) ||
      !helpers.validEmail(data.email_id)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "email_id address is required and should be a valid email address",
      });
    }
    // if (
    //   !data.aadhar_no ||
    //   !helpers.validInputValue(data.aadhar_no) ||
    //   !helpers.validAadhaar(data.aadhar_no)
    // ) {
    //   return res.status(400).json({
    //     code: "400",
    //     status: false,
    //     message:
    //       "aadhar_no address is required and should be a valid aadhar_no ",
    //   });
    // };
    // if (
    //   !data.user_pin ||
    //   !helpers.validInputValue(data.user_pin) 
    //   // ||
    //   // !helpers.validPincode(data.user_pin)
    // ) {
    //   return res.status(400).json({
    //     code: "400",
    //     status: false,
    //     message:
    //       "user_pin is required and should be a valid pin",
    //   });
    // };
    // const options1 = {
    //   method: "GET",
    //   url: `https://api.postalpincode.in/pincode/${data.user_pin}`,
    // };

    // const pincodeDetail1 = await axios(options1);

    // if (pincodeDetail1.data[0].PostOffice === null) {
    //   return res.json({
    //     code: "400",
    //     status: "failed",
    //     message: `pin code should be valid ${data.user_pin} `,
    //   });
    // }

    // const userCity = pincodeDetail1.data[0].PostOffice[0].Division;
    // const userDistrict = pincodeDetail1.data[0].PostOffice[0].District;
    // const userState = pincodeDetail1.data[0].PostOffice[0].State;

    // if (!data.user_plot_no) {
    //   return res.status(400).json({
    //     code: "400",
    //     status: false,
    //     message:
    //       "user_plot_no is required",
    //   });
    // };
    // if (
    //   !data.user_city	 ||
    //   !helpers.validInputValue(data.user_city	) ||
    //   !helpers.validOnlyCharacters(data.user_city	)
    // ) {
    //   return res.status(400).json({
    //     code: "400",
    //     status: false,
    //     message: "user city	is required and should contain only alphabets",
    //   });
    // };
    // if (
    //   !data.user_state	 ||
    //   !helpers.validInputValue(data.user_state	) ||
    //   !helpers.validOnlyCharacters(data.user_state	)
    // ) {
    //   return res.status(400).json({
    //     code: "400",
    //     status: false,
    //     message: "user_state is required and should contain only alphabets",
    //   });
    // };
    // if (
    //   !data.user_pan_no ||
    //   !helpers.validInputValue(data.user_pan_no) ||
    //   !helpers.validPAN_no(data.user_pan_no)
    // ) {
    //   return res.status(400).json({
    //     code: "400",
    //     status: false,
    //     message:
    //       "user_pan_no is required and should be a valid pan",
    //   });
    // };


    // Validate company_name
    if (
      !data.company_name ||
      !helpers.validInputValue(data.company_name) ||
      !helpers.validOnlyCharacters(data.company_name)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_name is required and should contain only alphabets",
      });
    };

    //   if (
    //     !data.company_mobileno ||
    //     !helpers.validInputValue(data.company_mobileno) ||
    //     !helpers.validPhone(data.company_mobileno)
    //   ) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message: "company_mobileno is required and should contain only number",
    //     });
    //   };
    //   let result = await knex("company_details")
    //   .select("*")
    //   .where("company_mobileno", data.company_mobileno);

    // if (result.length !== 0) {
    //   return res.json({
    //     code: "400",
    //     status: false,
    //     message: "this comapny number is already register",
    //   });
    // };

    //   if (
    //     !data.company_email ||
    //     !helpers.validInputValue(data.company_email) ||
    //     !helpers.validEmail(data.company_email)
    //   ) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message:
    //         "company_email address is required and should be a valid email address",
    //     });
    //   };

    //   if (
    //     !data.company_pin ||
    //     !helpers.validInputValue(data.company_pin) ||
    //     !helpers.validPincode(data.company_pin)
    //   ) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message:
    //         "company_pin is required and should be a valid pin",
    //     });
    //   };
    //   if (!data.company_address) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message:
    //         "company_address is required",
    //     });
    //   };
    //   if (
    //     !data.company_city ||
    //     !helpers.validInputValue(data.company_city) ||
    //     !helpers.validOnlyCharacters(data.company_city)
    //   ) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message: "company_city is required and should contain only alphabets",
    //     });
    //   };
    //   if (
    //     !data.company_pan_no ||
    //     !helpers.validInputValue(data.company_pan_no) ||
    //     !helpers.validPAN_no(data.company_pan_no)
    //   ) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message:
    //         "company_pan_no is required and should be a valid pan",
    //     });
    //   };
    //   if (
    //     !data.company_gst_no ||
    //     !helpers.validInputValue(data.company_gst_no) ||
    //     !helpers.validGST_no(data.company_gst_no)
    //   ) {
    //     return res.status(400).json({
    //       code: "400",
    //       status: false,
    //       message:
    //         "company_gst_no is required and should be a valid gst",
    //     });
    //   };

    // //axios call
    // const options = {
    //   method: "GET",
    //   url: `https://api.postalpincode.in/pincode/${data.company_pin}`,
    // };

    // const pincodeDetail = await axios(options);

    // if (pincodeDetail.data[0].PostOffice === null) {
    //   return res.json({
    //     code: "400",
    //     status: "failed",
    //     message: `pin code should be valid ${data.company_pin} `,
    //   });
    // }

    // const City = pincodeDetail.data[0].PostOffice[0].Division;
    // const District = pincodeDetail.data[0].PostOffice[0].District;
    // const State = pincodeDetail.data[0].PostOffice[0].State;

    // //________________________________________________________________________________________________________

    //     if(!req.files) return res.status(400).json({status:false,message:"logo required"})

    //     const profile = req.files.company_logo;
    //     console.log("profile",profile)
    // const fileSize = profile.size / 1000;//convert into kb
    // const arr = profile.name.split(".");

    // const fileExt=arr[arr.length-1]

    // if (fileSize > 1000) {
    //   return res
    //     .status(400)
    //     .json({ message: "file size must be lower than 1000kb" });
    // };
    // console.log("fileExt",fileExt);

    // if (!["jpeg","pdf","jpg","png"].includes(fileExt)) {
    //   return res
    //     .status(400)
    //     .json({ message: "file extension must be jpg,png and jpeg" });
    // };
    //  const fileName = `${req.body.company_name}${path.extname(profile.name)}`; 
    //  console.log(fileName)

    //  profile.mv(`uploads/${fileName}`, async (err) => { //mv:its function helps to upload file
    //    if (err) {
    //      console.log(err);
    //      return res.status(500).send(err);
    //    }
    //   });

    //genrate otp
    let otp = helpers.generateOTP(4);
    console.log("Generated otp:", otp);

    // Perform database insertion
    await knex("company_details")
      .insert({
        user_name: data.user_name,
        user_mobileno: data.mobile_no,
        user_email: data.email_id,
        // user_aadhar_no: data.aadhar_no,
        // user_pin:data.user_pin,
        // user_pan_no:data.user_pan_no,

        // user_plot_no:data.user_plot_no,
        // user_city:userCity,
        // user_state:userState,
        otp: otp,
        company_name: data.company_name,
        // company_mobileno:data.company_mobileno,
        // company_email:data.company_email,
        // company_address:data.company_address,
        // company_pin:data.company_pin,
        // company_pan_no:data.company_pan_no,
        // company_logo:fileName,
        // company_city:City,
        // company_gst_no:data.company_gst_no,

        // company_state:State,
        company_status: 1
      })
      .then((resp) => {
        return res.status(201).json({
          code: "200",
          status: true,
          message: "Inserted successfully",
          OTP: otp,
        });
      })
      .catch((error) => {
        return res.status(500).json({ code: "500", error: error.message });
      });
  } catch (error) {
    return res.status(500).json({ code: "500", error: error.message });
  }
};

//VERIFY OTP
user.verifyOTP = async (req, res) => {
  try {

    const OTP = req.body.OTP;


    const result0 = await knex("company_details").select("*").where("otp", OTP);

    if (result0.length == 0) {
      return res.json({
        code: "400",
        status: false,
        message: "OTP does not match",
      });
    };

    let email = result0[0].user_email;
    let name = result0[0].user_name;
    let id = result0[0].id;
    let company_name = result0[0].company_name;
    let mobileno = result0[0].user_mobileno;


    let token = jwt.sign(
      {
        email: email,
        name: name,
        id: id,
        company_name,
        user_mobileno: mobileno
      },
      "invoice_APP"
    );

    return res.status(200).json({

      code: "200",
      status: true,
      message: "OTP verified successfully",
      userID: id,
      token: token,
      name: name,
      email: email,
      company_name: company_name,
      mobileno: mobileno

    });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error,

    });
  }
};

//LOGIN
user.Login = async (req, res) => {
  try {
    let data = req.body;

    if (
      !data.mobile_no ||
      !helpers.validInputValue(data.mobile_no) ||
      !helpers.validPhone(data.mobile_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "mobile_no is required and should be a correct mobile_no",
      });
    }

    let result0 = await knex("company_details")
      .select("*")
      .where("user_mobileno", data.mobile_no);

    if (result0.length === 0) {
      return res.json({
        code: "400",
        status: false,
        message: "account not found , please register first",
      });
    };

    let otp = helpers.generateOTP(4);

    //update query

    await knex("company_details")
      .where("user_mobileno", data.mobile_no)
      .update("otp", otp);

    res.json({ code: "200", message: "OTP successfully sent", otp: otp });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};


user.editRegister = async (req, res) => {
  try {
    console.log("editRegister")
    const data = req.body;
    const ID=req.user.id;
    console.log("ID",ID)

    const store = {};
 
    if(data.user_name) {
      if(!helpers.validInputValue(data.user_name) || !helpers.validOnlyCharacters(data.user_name)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_name is required and should contain only alphabets",
        });
    }
    store["user_name"] = data.user_name;
  };
    if(data.user_mobileno) {
      if(!helpers.validInputValue(data.user_mobileno) || !helpers.validPhone(data.user_mobileno)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_mobileno is required and should contain only  10 number",
        });
    }
      store["user_mobileno"] = data.user_mobileno;
    };
    if(data.user_email) {
      if(!helpers.validInputValue(data.user_email) || !helpers.validEmail(data.user_email)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_email is required and should contain only valid email",
        });
    }
      store["user_email"] = data.user_email;
    };

    if(data.user_aadhar_no) {
      if(!helpers.validInputValue(data.user_aadhar_no) || !helpers.validAadhaar(data.user_aadhar_no)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_aadhar_no is required and should contain only valid aadhar",
        });
    }
      store["user_aadhar_no"] = data.user_aadhar_no;
    };

    if(data.user_pin) {
      if(!helpers.validInputValue(data.user_pin) || !helpers.validPincode(data.user_pin)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_pin is required and should contain only valid",
        });
    };
  
    const options2 = {
      method: "GET",
      url: `https://api.postalpincode.in/pincode/${data.user_pin}`,
    };
    
    const pincodeDetail2 = await axios(options2);
    if (pincodeDetail2.data[0].PostOffice === null) {
      return res.json({
        code: "400",
        status: "failed",
        message: "pin code should be valid ",
      });
    }
    
    var userCity = pincodeDetail2.data[0].PostOffice[0].Division;
    var userState = pincodeDetail2.data[0].PostOffice[0].State;
  
    //console.log("x",pincodeDetail.data[0].PostOffice[0])
      store["user_pin"] = data.user_pin;
    };

    if(data.user_pan_no) {
      if(!helpers.validInputValue(data.user_pan_no) || !helpers.validPAN_no(data.user_pan_no)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_pan_no is required and should contain only valid",
        });
    }
      store["user_pan_no"] = data.user_pan_no;
    };
    if(data.user_plot_no) {
      
      store["user_plot_no"] = data.user_plot_no;
    };

    if(data.user_city) {
      if(!helpers.validInputValue(data.user_city) || !helpers.validOnlyCharacters(data.user_city)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_city is required and should contain only valid",
        });
    }
      store["user_city"] = userCity;
    };
  
    if(data.user_state) {
      if(!helpers.validInputValue(data.user_state) || !helpers.validOnlyCharacters(data.user_state)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_state is required and should contain only valid",
        });
    }
      store["user_state"] = userState;
    };

    // user_pin:data.user_pin,
    // user_pan_no:data.user_pan_no,

    // user_plot_no:data.user_plot_no,
    // user_city:userCity,
    // user_state:userState,


    //---------------------------------company
    if(data.company_name) {
      if(!helpers.validInputValue(data.company_name) || !helpers.validOnlyCharacters(data.company_name)){
        return res.status(400).json({
          code: "400",
          status: false,
          message: "company_name is required and should contain only alphabets",
        });
    }
      store["company_name"] = data.company_name;
    };

  if(data.company_mobileno) {
    if(!helpers.validInputValue(data.company_mobileno) || !helpers.validPhone(data.company_mobileno)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_mobileno is required and should contain only  10 number",
      });
  }
    store["company_mobileno"] = data.company_mobileno;
  };

  if(data.company_email) {
    if(!helpers.validInputValue(data.company_email) || !helpers.validEmail(data.company_email)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_email is required and should contain only valid email",
      });
  }
    store["company_email"] = data.company_email;
  };

  if(data.company_address) {
    if(!helpers.validInputValue(data.company_address)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_address is required and should contain only valid",
      });
  }
    store["company_address"] = data.company_address;
  };

  if(data.company_pin) {
    if(!helpers.validInputValue(data.company_pin) || !helpers.validPincode(data.company_pin)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_pin is required and should contain only valid",
      });
  };

  const options = {
    method: "GET",
    url: `https://api.postalpincode.in/pincode/${data.company_pin}`,
  };
  
  const pincodeDetail = await axios(options);
  if (pincodeDetail.data[0].PostOffice === null) {
    return res.json({
      code: "400",
      status: "failed",
      message: "pin code should be valid ",
    });
  }
  
  var City = pincodeDetail.data[0].PostOffice[0].Division;
  var State = pincodeDetail.data[0].PostOffice[0].State;

  //console.log("x",pincodeDetail.data[0].PostOffice[0])
    store["company_pin"] = data.company_pin;
  };

  if(data.company_pan_no) {
    if(!helpers.validInputValue(data.company_pan_no) || !helpers.validPAN_no(data.company_pan_no)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_pan_no is required and should contain only valid",
      });
  }
    store["company_pan_no"] = data.company_pan_no;
  };
  if(data.company_city) {
    if(!helpers.validInputValue(data.company_city) || !helpers.validOnlyCharacters(data.company_city)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_city is required and should contain only valid",
      });
  }
    store["company_city"] = City;
  };

  if(data.company_state) {
    if(!helpers.validInputValue(data.company_state) || !helpers.validOnlyCharacters(data.company_state)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_state is required and should contain only valid",
      });
  }
    store["company_state"] = State;
  };
  if(data.company_gst_no) {
    if(!helpers.validInputValue(data.company_gst_no) || !helpers.validGST_no(data.company_gst_no)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_gst_no is required and should contain only valid",
      });
  }
    store["company_gst_no"] = data.company_gst_no;
  };
  if(data.gst) {
    if(!helpers.validInputValue(data.gst) || !helpers.isValidNumberValue(data.gst)){
      return res.status(400).json({
        code: "400",
        status: false,
        message: "gst is required and should contain only valid",
      });
  }
    store["gst"] = data.gst;
  };

if(req.files){
  const profile = req.files.company_logo;
  console.log("profile",profile)
  const fileSize = profile.size / 1000;//convert into kb
  const arr = profile.name.split(".");

  const fileExt=arr[arr.length-1]

  if (fileSize > 1000) {
    return res
      .status(400)
      .json({ message: "file size must be lower than 1000kb" });
  };
  console.log("fileExt",fileExt);

  if (!["jpeg","pdf","jpg","png"].includes(fileExt)) {
    return res
      .status(400)
      .json({ message: "file extension must be jpg,png and jpeg" });
  };
  let q = await knex.select("company_mobileno").from("company_details").where("id", ID);
  if (q.length == 0) {
    return res.send({ code: "400", message: " company name not exists " });
  };
  let compName = ID
   var fileName = `${compName}${path.extname(profile.name)}`; 
   console.log("compName",fileName)
   profile.mv(`uploads/${fileName}`, async (err) => { //mv:its function helps to upload file
     if (err) {
       console.log(err);
       return res.status(500).send(err);
     }
    });
    store["company_logo"] = fileName;
    store["image_isenable"] = 1;
}
 

    console.log("store",store);
    // let q = await knex.select("company_logo").from("company_details").where("id", ID);
    // if (q.length == 0) {
    //   return res.send({ code: "400", message: " company name not exists " });
    // };

   // Check if the employee exists and update
    const results = await knex.select("*").from("company_details").where("id", ID);
    if (results.length !== 1) {
      return res.status(404).json({ code: "400", status: "error", message: "userId not matched" });
    } else {
      await knex("company_details").where("id", ID).update(store);
      return res.status(200).json({ code: "200", status: "success", message: "Successfully Update", data: store });
    }
  } catch (error) {
    return res.status(500).json({ code: "500", status: "error", message: "Something went wrong: " + error });
  }
};






user.userDetailsById = async (req, res) => {
  try {
    console.log("userDetails API");

    let tokenId = req.user.id
    console.log("tokenId", tokenId)

    let q = await knex.select("*").from("company_details").where("id", tokenId);
    if (q.length == 0) {
      return res.send({ code: "400", message: " no data found " });
    };
    let all = q[0]

    let userData = {
      id: all.id,
      user_name: all.user_name,
      user_mobileno: all.user_mobileno,
      user_email: all.user_email,
      user_pin: all.user_pin,
      user_city: all.user_city,
      user_state: all.user_state,
      user_plot_no: all.user_plot_no,
      user_aadhar_no: all.user_aadhar_no,
      user_pan_no: all.user_pan_no

    };
    let companyData = {
      id: all.id,
      company_name: all.company_name,
      company_mobileno: all.company_mobileno,
      company_email: all.company_email,
      company_pin: all.company_pin,
      company_gst_no: all.company_gst_no,
      company_pan_no: all.company_pan_no,
      company_address: all.company_address,
      company_city: all.company_city,
      company_state: all.company_state,
      company_logo: all.company_logo,
      gst:all.gst
    };

    return res.json({ code: "200", message: " successfully ", userData: userData, companyData: companyData });

  } catch (error) {
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};


module.exports = user;


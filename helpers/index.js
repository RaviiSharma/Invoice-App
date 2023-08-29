// const { jwt } = require("jsonwebtoken");
const db = require("../db.js")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
require("dotenv").config()

let helpers = {};

//Send Response
helpers.response = (code, status, msg, data = "") => {
    let response = {};
    if (code) {
        response.code = code;
    }
    if (status) {
        response.status = status;
    }
    if (msg) {
        response.msg = msg;
    }
    if (data) {
        response.data = data;
    }
    return response;
};


helpers.isValidProductName = (name) => {
    return /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(name);
}

helpers.isValidNumberValue = (value) => {
    return /^([1-9][0-9]*|0)(\.[0-9]+)?$/.test(value);
}



helpers.validInputValue = (value) => {
    if (typeof value !== 'undefined' && value !== null && typeof value === 'string' && value.length > 0) {
        return true;
    } else {
        throw new Error('Invalid value');
    }
};





helpers.validOnlyCharacters = (value) => {
    const regexForChar = /^[A-Za-z\s]+$/;
    return regexForChar.test(value)

}


helpers.validEmail = (email) => {
    const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regexForEmail.test(email)


};


helpers.validPhone = (phone) => {
    // Assuming a valid phone number is a 10-digit number
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};


helpers.validNumber = (value) => {
    if (typeof (value) === "undefined" || value === null) return false;
    if (typeof (value) === "string" && value.trim().length > 0 && Number(value) !== NaN && Number(value) >= 0) return true
    if (typeof (value) === "number" && value >= 0) return true;
    return false;
};

helpers.validPincode = (pincode) => {
    const regexForPass = /^[1-9][0-9]{5}$/
    return regexForPass.test(pincode);
};

helpers.validPrice = (price) => {
    let regexForPrice = /^[1-9]{1}\d*((\.)\d+)?$/
    return regexForPrice.test(price)
};

helpers.validObjectId = (objectId) => {
    return mongoose.Types.ObjectId.valid(objectId);
};

helpers.validImageType = (value) => {
    const regexForMimeTypes = /image\/png|image\/jpeg|image\/jpg/;
    return regexForMimeTypes.test(value)
}


//---------------------------------------NEW VALIDATIONS ------------------------------------------------------

helpers.ValidPassword = (input) => {

    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{4,}$/;
    if (pattern.test(input)) {
        return true;
    }
}


helpers.ValidPasswordAlfaNumeric = (input) => {

    const pattern = /^[a-zA-Z0-9@#$*]{6,12}$/;

    if (pattern.test(input)) {
        return true;
    } else {
        throw new Error('password contain [a-zA-Z0-9@#$*] matches any alphanumeric character, @, #, $, or * min 6 and  max 12 length only'); // Throw an error if input is invalid
    }
}

helpers.validDigit = (input) => {

    const pattern = /^\d+$/;
    if (pattern.test(input)) {
        return true;
    }
}

helpers.validDate = (input) => {

    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (pattern.test(input)) {
        return true;
    }
}

helpers.validDateTime = (input) => {

    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (pattern.test(input)) {
        return true;
    }
}

helpers.validIFSC = (input) => {

    const pattern = /^[A-Za-z]{4}[0][A-Za-z0-9]{6}$/;


    if (pattern.test(input)) {
        return true;
    }
}


helpers.validCharNum = (input) => {

    const pattern = /^[a-zA-Z0-9]+$/;


    if (pattern.test(input)) {
        return true;
    }
};

helpers.validPAN_no = (input) => {

    const pattern = /^([A-Z]{5})(\d{4})([A-Z]{1})$/;

    if (pattern.test(input)) {
        return true;
    }
};

helpers.validTAN_no = (input) => {

    const pattern = /^([A-Z]{4})(\d{5})([A-Z]{1})$/;

    if (pattern.test(input)) {
        return true;
    }
};

helpers.validGST_no = (input) => {

    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

    if (pattern.test(input)) {
        return true;//29ABCDE1234F1Z5
    }
};



helpers.validAadhaar = (aadharNumber) => {

    const pattern = /^\d{12}$/;
    return pattern.test(aadharNumber)
};

helpers.isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

// Generate a 6-digit OTP with only digits
helpers.generateOTP = (length) => {
    let otp = "";

    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }

    return otp;
};









module.exports = helpers;
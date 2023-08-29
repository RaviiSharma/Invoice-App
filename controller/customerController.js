
const helpers = require("../helpers");
const knex = require('../db.js')
const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require('path');
const url = require('url');
const fs = require('fs');



require("dotenv").config()

let customer = {};


customer.insertCustomerDetails = async (req, res) => {
  try {
    console.log("req.body",req.body)
    const data = req.body;
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
    let result0 = await knex("customer_details")
      .select("*")
      .where("user_mobileno", data.mobile_no);
    if (result0.length !== 0) {
      return res.json({
        code: "400",
        status: false,
        message: `Account already registered with this ${data.mobile_no}, please login`,
      });
    };
    if(data.email_id){if (
        !helpers.validInputValue(data.user_email) ||
        !helpers.validEmail(data.user_email)
      ) {
        return res.status(400).json({
          code: "400",
          status: false,
          message:
            "email_id address is required and should be a valid email address",
        });
      }}
    if(data.company_name){
        if (
            !helpers.validInputValue(data.company_name) ||
            !helpers.validOnlyCharacters(data.company_name)
          ) {
            return res.status(400).json({
              code: "400",
              status: false,
              message: "company_name is required and should contain only alphabets",
            });
          };
    }
    
    await knex("customer_details")
      .insert({
        user_name: data.user_name,
        user_mobileno: data.mobile_no,
        user_email: data.email_id,
        company_name: data.company_name,
        billing_address:data.billing_address,
        user_status:1
      })
      .then((resp) => {
        return res.status(201).json({
          code: "200",
          status: true,
          message: "Inserted successfully"
        });
      })
      .catch((error) => {
        return res.status(500).json({ code: "500", error: error.message });
      });
  } catch (error) {
    return res.status(500).json({ code: "500", error: error.message });
  }
};



customer.getCustomerDetails=async(req,res)=>{
    try{
        if(req.query.id){
            var customer=await knex.select("*").from("customer_details").where("user_status",1)
            .where("id",req.query.id)
            checkStatus(customer)
        }
        if(req.query.user_name){
            var customer=await knex.select("*").from("customer_details").where("user_status",1)
            .where("user_name",req.query.user_name)
            checkStatus(customer)
        }
        if(req.query.user_mobileno){
            var customer=await knex.select("*").from("customer_details").where("user_status",1)
            .where("user_mobileno",req.query.user_mobileno)
            checkStatus(customer)
        }
    }catch(e){
        return res.status(500).json(helpers.response("500","error","something went wrong ",e))
    }
   function checkStatus(customer){
        if(customer.length==0){
            return res.status(400).json(helpers.response("400","error","invalid customer",customer))
        }else{
            return res.status(200).json(helpers.response("200","success","successfully get the details",customer))
        }
    }

}






module.exports = customer;


const helpers = require("../helpers");
const knex = require('../db.js')
const fs = require('fs');

const easyinvoice = require('easyinvoice');



require("dotenv").config()

let invoice = {};





invoice.generateInvoice100 = async (req, res) => {
  try {
    console.log("generateInvoice100 api");

    const user = req.user;//token
    console.log("tokenid",user.id);

    const result = await knex.select('*').from('cart_details').leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id").where({ "cart_user_id": user.id, "cart_status": 1 });
    if (result.length === 0) {
      return res.send({ code: "400", message: "no data found" });
    }
    const sum = result.reduce((acc, item) => acc + item.net_price, 0);
    const dateD = Date.now();
    const obj = {
      name: req.query.name,
      mobileno: req.query.mobileno,
      invoice_number: `I${dateD}${result[0].cart_id}`,
      net_price: sum,
      created_at: new Date(),
      created_by: result[0].cart_user_id,
      invoice_status: 1,
    };
    const [data] = await knex('invoice_details').insert(obj);
    await knex('cart_details').update({ 'cart_status': '3', 'cart_order': obj.created_at }).where({ 'cart_user_id': user.id, "cart_status": 1 });
    const invoiceUrl = `http://192.168.100.112:3010/pdfFile?id=${data}&user_id=${user.id}`;
    await knex("invoice_details").update({ invoice_link: invoiceUrl }).where("id", data);
    await generateAndSendInvoicePdf(data, user, res);
  } catch (e) {
    console.log(e);
    return res.send({ code: "500", message: " something went worng ", status: e.message });
  }
  async function generateAndSendInvoicePdf(id, user, res) {
    try {
      const order = await knex.select("*").from("invoice_details").where({ "id": id });
      if (order.length === 0) {
        return res.send({ code: "400", message: " invalid invoice" });
      } else {
        const cartproduct = await knex.select("*").from("cart_details")
          .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
          .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": user.id, "cart_details.cart_order": order[0].created_at });
        if (cartproduct.length === 0) {
          return res.send({ code: "400", message: " invalid " });
        } else {
          var details = await knex.select("*").from("company_details").where("id", user.id)
          if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 1) {
            let cm_logo = details[0].company_logo
            console.log("q", details[0].company_logo);
            var notice = details[0].note;
            var gst = details[0].gst;
            console.log("gst", gst)
            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_sale_price,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(order, user, extractedData, notice, logo)
          }
          else if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 0) {
            var notice = details[0].note;
            var gst = details[0].gst;
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_sale_price,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(order, user, extractedData, notice)
          }
          else {
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_sale_price,
              quantity: row.cart_quantity,
              "tax-rate": 0,
            }));
            createinvoice(order, user, extractedData)
          }
        }
      }
    } catch (err) {
      console.log(err)
      return res.send({ code: "500", message: " something went worng here", status: err.message });
    }
  }
  function createinvoice(order, user, extractedData, notice, logo) {
    const dateTimeString = order[0].created_at.toISOString().split('T')[0];
    const invoiceData = {
      "client": {
        "company": `customer name: ${order[0].name}`,
        "zip": `contact number: ${order[0].mobileno}`
      },
      "sender": {
        "company": `sender name:${user.name}`,
        "address": `mobile number:${user.user_mobileno}`,
        // "zip": "1234 AB",
        // "city": "bokaro",
        // "country": "India"
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order[0].invoice_number,
        "date": dateTimeString,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",
      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData, function (result) {
      res.attachment('invoice.pdf');
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      res.send(pdfBuffer);
    });
  }
}


invoice.pdfFile100 = async (req, res) => {
  try {
    console.log("pdfFile100 api")

    const order = await knex.select("*").from("invoice_details").where({ "id": req.query.id })
    if (order.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "invalid invoice"));
    }
    else {
      const cartproduct = await knex.select("*").from("cart_details")
        .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
        .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": req.query.user_id, "cart_details.cart_order": order[0].created_at })
      // .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": 5, "cart_details.cart_order": order[0].created_at })
      if (cartproduct.length === 0) {
        return res.status(400).json(helpers.response("400", "error", "invalid "));
      }
      else {
        const convertToProductsFormat = (cartproduct) => {
          return cartproduct.map((row) => ({
            description: row.product_name,
            price: row.product_sale_price,
            quantity: row.cart_quantity,
            tax_rate: 0
          }));
        };
        const products1 = convertToProductsFormat(cartproduct);
        const extractedData = products1.map(object => {
          return {
            description: object.description,
            quantity: object.quantity,
            price: object.price,
            "tax-rate": object.tax_rate
          };

        });
        const dateTimeString = (order[0].created_at).toString();
        const parts = ((dateTimeString.split('T')[0]).split(" ")).slice(0, 4).join(" ");
        // const parts1 = parts.split(" ");
        // const datePart = parts.slice(0, 4).join(" ");
        console.log(parts);
        var data = {
          "client": {
            "company": "customer name: " + order[0].name,
            // "address": req.query.contact_number,
            "zip": "contact number: " + order[0].mobileno,
            // "city": "Clientcity",
            // "country": "Clientcountry"
          },
          // "sender": {
          //   "company": "Ravi ",
          //   "address": "dhanbad 123",
          //   "zip": "1234 AB",
          //   "city": "bokaro",
          //   "country": "India"
          // },
          // "images": {
          //   // The logo on top of your invoice
          //   "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
          //   // The invoice background
          //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
          // },
          "information": {
            // Invoice number
            "number": order[0].invoice_number,
            // Invoice data
            "date": parts,
            // Invoice due date
            // "due-date": "31-12-2021"
          },
          "products": extractedData,
          "bottomNotice": "Kindly pay your invoice ",
          "settings": {
            "currency": "INR",
          },
        };
        easyinvoice.createInvoice(data, function (result) {

          res.attachment('invoice.pdf');
          let q = Buffer.from(result.pdf, 'base64')
          res.send(q);
        });
      }
    }
  } catch (err) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong " + err + ""));
  }
}




invoice.generateInvoicefinal = async (req, res) => {
  try {
    console.log("generateInvoicefinal api")
    var user = req.user
    let result = await knex.select('*').from('cart_details')
      .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
      .where({ "cart_user_id": user.id })
      .where("cart_status", 1)
    var sum = 0
    for (let i = 0; i < result.length; i++) {
      sum += result[i].net_price
    }
    const date = new Date()
    const dateD = Date.now()
    if (result.length === 0) {
      return res.status(500).json(helpers.response("500", "error", "invalid"));
    }
    else {
      let obj = {
        name: req.query.name,
        mobileno: req.query.mobileno,
        invoice_number: "I" + dateD + result[0].cart_id,
        net_price: sum,
        created_at: date,
        created_by: result[0].cart_user_id,
        invoice_status: 1,
      }
      knex('invoice_details').insert(obj).then((data) => {
        knex('cart_details').update({ 'cart_status': '3', 'cart_order': obj.created_at })
          .where({ 'cart_user_id': user.id })
          .where("cart_status", 1).then((resp1) => {
            var arr = [];
            arr.push({
              url: 'http://192.168.101.8:3010/pdfFile?id=' + data + '&user_id=' + user.id
            })
            knex("invoice_details").update({ invoice_link: arr[0].url }).where("id", data[0]).then((up) => {
              return res.status(200).send({ code: "200", status: "success", msg: "successfully get the url", data: arr });
            }).catch((e) => {
              return res.status(500).json(helpers.response("500", "error", 'can not generate invoice ', e));
            })

          }).catch((e) => {
            return res.status(500).json(helpers.response("500", "error", 'can not be proceeded furthur', e));
          })
      }).catch((e) => {
        return res.status(500).json(helpers.response("500", "error", 'error in processing ', e));
      })
    }
  } catch (e) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
}








invoice.pdfFileFinal = async (req, res) => {
  try {
    console.log("pdfFileFinal api");

    const order = await knex.select("*").from("invoice_details").where({ "id": req.query.id });
    if (order.length === 0) {
      return res.send({ code: "400", message: " invalid invoice" });
    } else {
      const cartproduct = await knex.select("*").from("cart_details")
        .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
        .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": req.query.user_id, "cart_details.cart_order": order[0].created_at });
      if (cartproduct.length === 0) {
        return res.send({ code: "400", message: " invalid " });
      } else {
        var details = await knex.select("*").from("company_details").where("id", req.query.user_id)
        if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 1) {
          let cm_logo = details[0].company_logo
          console.log("q", details[0].company_logo);
          var notice = details[0].note;
          var gst = details[0].gst;
          console.log("gst", gst)
          var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_sale_price,
            quantity: row.cart_quantity,
            "tax-rate": gst,
          }));
          createinvoice(order, details, extractedData, notice, logo)
        }
        else if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 0) {
          var notice = details[0].note;
          var gst = details[0].gst;
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_sale_price,
            quantity: row.cart_quantity,
            "tax-rate": gst,
          }));
          createinvoice(order, details, extractedData, notice)
        }
        else {
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_sale_price,
            quantity: row.cart_quantity,
            "tax-rate": 0,
          }));
          createinvoice(order, details, extractedData)
        }
      }
    }
  } catch (err) {
    console.log(err)
    return res.send({ code: "500", message: " something went worng here", status: err.message });
  }
  function createinvoice(order, user, extractedData, notice, logo) {
    const dateTimeString = order[0].created_at.toISOString().split('T')[0];
    const invoiceData = {
      "client": {
        "company": `customer name: ${order[0].name}`,
        "zip": `contact number: ${order[0].mobileno}`
      },
      "sender": {
        "company": `sender name:${user[0].user_name}`,
        "address": `mobile number:${user[0].user_mobileno}`,
        // "zip": "1234 AB",
        // "city": "bokaro",
        // "country": "India"
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order[0].invoice_number,
        "date": dateTimeString,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",
      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData, function (result) {
      res.attachment('invoice.pdf');
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      res.send(pdfBuffer);
    });
  }
}



invoice.pdfFile10000 = async (req, res) => {
  try {
    console.log("pdfFile10000 api");
    const order = await knex.select("*").from("invoice_items").where({ "created_by": req.query.user_id });
    if (order.length === 0) {
      return res.send({ code: "400", message: " invalid invoice" });
    } else {
      var cartproduct = ((JSON.parse(order[0].item_details))[0]).product
      var userOrder = ((JSON.parse(order[0].item_details))[0]).user
      var details = await knex.select("*").from("company_details").where("id", req.query.user_id)
      if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 1) {
        let cm_logo = details[0].company_logo
        console.log("q", details[0].company_logo);
        var notice = details[0].note;
        var gst = details[0].gst;
        console.log("gst", gst)
        var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_sale_price,
          quantity: row.cart_quantity,
          "tax-rate": gst,
        }));
        createinvoice(userOrder, details, extractedData, notice, logo)
      }
      else if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 0) {
        var notice = details[0].note;
        var gst = details[0].gst;
        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_sale_price,
          quantity: row.cart_quantity,
          "tax-rate": gst,
        }));
        createinvoice(userOrder, details, extractedData, notice)
      }
      else {
        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_sale_price,
          quantity: row.cart_quantity,
          "tax-rate": 0,
        }));
        createinvoice(userOrder, details, extractedData)
      }

    }
  } catch (err) {
    console.log(err)
    return res.send({ code: "500", message: " something went worng here", status: err.message });
  }
  function createinvoice(order, user, extractedData, notice, logo) {
    // const dateTimeString = (order.created_at).toISOString().split('T')[0];
    const dateTimeString = order.created_at
    const date = new Date(dateTimeString);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const invoiceData = {
      "client": {
        "company": `customer name: ${order.name}`,
        "zip": `contact number: ${order.mobileno}`
      },
      "sender": {
        "company": `sender name:${user[0].user_name}`,
        "address": `mobile number:${user[0].user_mobileno}`,
        // "zip": "1234 AB",
        // "city": "bokaro",
        // "country": "India"
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order.invoice_number,
        "date": formattedDate,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",
      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData, function (result) {
      res.attachment('invoice.pdf');
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      res.send(pdfBuffer);
    });
  }
}




invoice.pdfFilelast = async (req, res) => {
  try {
    console.log("pdfFilelast api")
    const order = await knex.select("*").from("invoice_items").where({ "created_by": req.query.user_id });
    if (order.length === 0) {
      return res.send({ code: "400", message: " invalid invoice" });
    } else {
      var cartproduct = ((JSON.parse(order[0].item_details))[0]).product
      var userOrder = ((JSON.parse(order[0].item_details))[0]).user
      var details = await knex.select("*").from("company_details").where("id", req.query.user_id)

      if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 1) {
        let cm_logo = details[0].company_logo
        console.log("q", details[0].company_logo);
        var notice = details[0].note + "<br><br><br><br><br><br><br><br><br><br><br>" + details[0].footer + `<br><br><a href='https://www.google.com'>Google</a>` + details[0].company_mobileno;

        var gst = details[0].gst;
        console.log("gst", gst);
        var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' })//7277151703.jpeg
        if (!logo) {
          return res.status(400).send({ code: "400", message: "No logo found in local" });
        };
        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_sale_price,
          quantity: row.cart_quantity,
          "tax-rate": gst,
        }));
        createinvoice(userOrder, details, extractedData, notice, logo)
      }
      else if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 0) {
        var notice = details[0].note;
        var gst = details[0].gst;
        console.log("gst", gst)

        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_sale_price,
          quantity: row.cart_quantity,
          "tax-rate": gst,
        }));
        createinvoice(userOrder, details, extractedData, notice)
      }
      else {
        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_sale_price,
          quantity: row.cart_quantity,
          "tax-rate": 0,
        }));
        createinvoice(userOrder, details, extractedData)
      }

    }
  } catch (err) {
    console.log(err)
    return res.send({ code: "500", message: "something went worng here", status: err.message });
  }
  function createinvoice(order, user, extractedData, notice, logo) {
    // const dateTimeString = (order.created_at).toISOString().split('T')[0];
    const dateTimeString = order.created_at
    const date = new Date(dateTimeString);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const invoiceData = {
      "client": {
        "company": `customer name: ${order.name}`,
        "zip": `contact number: ${order.mobileno}`
      },
      "sender": {
        "company": `sender name:${user[0].user_name}`,
        "address": `mobile number:${user[0].user_mobileno}`,
        // "zip": "1234 AB",
        // "city": "bokaro",
        // "country": "India"
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order.invoice_number,
        "date": formattedDate,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",

      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData, function (result) {
      res.attachment('invoice.pdf');
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      res.send(pdfBuffer);
    });
  }
};







invoice.invoiceList = async (req, res) => {
  try {
    var user = req.user
    const inv = await knex.select("invoice_link").from("invoice_details").where("created_by", user.id)
    if (inv.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "invalid invoice", e));
    } else {
      return res.status(200).json(helpers.response("200", "success", "get the link history successfully", inv));
    }
  } catch (err) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
  }
}




invoice.invoiceHistory = async (req, res) => {
  try {
    var user = req.user
    const clientlist = await knex.select("id", "name", "mobileno", "invoice_number", "net_price", "invoice_link", "invoice_status", "created_at").from("invoice_details").where("created_by", user.id)
    if (clientlist.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "no client is present"));
    }
    else {
      return res.status(200).json(helpers.response("200", "success", "successfully get the details", clientlist));
    }
  } catch (e) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
}







invoice.pdfFilesecondlast = async (req, res) => {
  try {
    console.log("pdfFilesecondlast api");
    const order = await knex.select("*").from("invoice_details").where({ "id": req.query.id });

    if (order.length === 0) {
      return res.send({ code: "400", message: "invalid invoice" });
    } else {
      // Fetch cartproduct based on conditions
      const cartproduct = await knex.select("*").from("cart_details")
        .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
        .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": req.query.user_id, "cart_details.cart_order": order[0].created_at });

      if (cartproduct.length === 0) {
        return res.send({ code: "400", message: "invalid cart product" });
      } else {
        const details = await knex.select("*").from("company_details").where("id", req.query.user_id);

        if (details.length === 0) {
          return res.send({ code: "400", message: `no user found with this id ${req.query.user_id} in company_details` });
        }

        const imageIsEnabled = details[0].image_isenable;

        if (imageIsEnabled === 1) {
          if (details[0].note !== null && details[0].gst !== null && details[0].company_logo !== null) {
            console.log("1")

            //var notice = details[0].note;
            var notice = details[0].note + "<br><br><br><br><br><br><br><br><br><br><br>" + details[0].footer + `<br><br><a href='https://www.google.com'>Google</a>` + details[0].company_mobileno;

            var gst = details[0].gst;
            console.log("gst1", gst);

            let cm_logo = details[0].company_logo;
            console.log("q", details[0].company_logo);

            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_mrp,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(order, details, extractedData, notice, logo);
          } else if (details[0].gst !== null && details[0].company_logo !== null) {
            console.log("2")
            var gst = details[0].gst;
            console.log("gst2", gst);

            let cm_logo = details[0].company_logo;
            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            // console.log("q", details[0].company_logo);

            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_mrp,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(order, details, extractedData, notice, logo);
          }
        } else {
          console.log("3")
          // console.log("gst3", gst);

          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_mrp,
            quantity: row.cart_quantity,
            "tax-rate": 0,
          }));
          createinvoice(order, details, extractedData);
        }
      }
    }
  } catch (err) {
    console.log(err);
    return res.send({ code: "500", message: "something went wrong here", status: err.message });
  }

  function createinvoice(order, user, extractedData, notice, logo) {
    const dateTimeString = order[0].created_at.toISOString().split('T')[0];
    const invoiceData = {
      "client": {
        "company": `customer name: ${order[0].name}`,
        "zip": `contact number: ${order[0].mobileno}`
      },
      "sender": {
        "company": `sender name:${user[0].user_name}`,
        "address": `mobile number:${user[0].user_mobileno}`,
        // "zip": "1234 AB",
        // "city": "bokaro",
        // "country": "India"
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order[0].invoice_number,
        "date": dateTimeString,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",
      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData)
      .then(result => {
        res.attachment('invoice.pdf');
        const pdfBuffer = Buffer.from(result.pdf, 'base64');
        res.send(pdfBuffer);
      })
      .catch(error => {
        console.error("Error generating invoice:", error);
        return res.status(500).json(helpers.response("500", "error", 'error generating invoice', error.message));
      });
  }
};




invoice.generateInvoice = async (req, res) => {
  try {
    var user = req.user;
    console.log("generateInvoice api","tokenid",user.id);
    let result = await knex.select('*').from('cart_details')
      .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
      .where({ "cart_user_id": user.id })
      .where("cart_status", 1)
    var sum = 0
    for (let i = 0; i < result.length; i++) {
      sum += result[i].net_price
    }
    const date = new Date()
    const dateD = Date.now()
    if (result.length === 0) {
      return res.status(500).json(helpers.response("500", "error", "invalid"));
    }
    else {
      let obj = {
        name: req.query.name,
        mobileno: req.query.mobileno,
        invoice_number: "I" + dateD + result[0].cart_id,
        net_price: sum,
        created_at: date,
        created_by: result[0].cart_user_id,
        invoice_status: 1,
      }
      knex('invoice_details').insert(obj).then((data) => {
        knex("invoice_items").insert({ item_details: JSON.stringify([{ user: obj, product: result }]), item_status: 1, item_order: obj.created_at, created_by: user.id }).then((respp11) => {
          if (req.query.insert_type == 1) {
            return res.status(200).send({ code: "200", status: "success", msg: 'success ', data: { user: obj, product: result } });
          }
          if (req.query.insert_type == 2) {
            knex('cart_details').del().where({ 'cart_user_id': user.id }).where("cart_status", 1).then((resp1) => {
              var arr = [];
              arr.push({
                 url: 'https://invoice.apptimates.com/pdfFile?id=' + respp11[0] + '&user_id=' + user.id
                //url: 'http://192.168.101.6:3010/pdfFile?id=' + respp11[0] + '&user_id=' + user.id
              })
              knex("invoice_details").update({ invoice_link: arr[0].url }).where("id", data[0]).then((up) => {
                return res.status(200).send({ code: "200", status: "success", msg: "successfully get the url", data: arr });
              }).catch((e) => {
                return res.status(500).json(helpers.response("500", "error", 'can not generate invoice ', e));
              })

            }).catch((e) => {
              return res.status(500).json(helpers.response("500", "error", 'can not be proceeded furthur', e));
            })
          }
        })

      }).catch((e) => {
        return res.status(500).json(helpers.response("500", "error", 'error in processing ', e));
      })

    }
  } catch (e) {
    console.log(e)
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
}



invoice.pdfFile = async (req, res) => {
  try {
    console.log("pdfFile api");
    const order = await knex.select("*").from("invoice_items").where("items_id",req.query.id);
    if (order.length === 0) {
      return res.send({ code: "400", message: "invalid invoice" });
    } else {
      var cartproduct = ((JSON.parse(order[0].item_details))[0]).product
      var userOrder = ((JSON.parse(order[0].item_details))[0]).user
      var details = await knex.select("*").from("company_details").where("id", req.query.user_id);
      const imageIsEnabled = details[0].image_isenable;
      if (imageIsEnabled === 1) {
        if (details[0].note !== null && details[0].gst !== null && details[0].company_logo !== null) {
          console.log("1")

          //var notice = details[0].note;
          var notice = details[0].note + "<br><br><br><br><br><br><br><br><br><br><br>" + details[0].footer + `<br><br><a href='https://www.google.com'>Google</a>` + details[0].company_mobileno;

          var gst = details[0].gst;
          console.log("gst1", gst);

          let cm_logo = details[0].company_logo;
          console.log("q", details[0].company_logo);

          var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_mrp,
            quantity: row.cart_quantity,
            "tax-rate": gst,
          }));
          createinvoice(userOrder, details, extractedData, notice, logo);
        } 
        else if (details[0].gst !== null && details[0].company_logo !== null) {
          var gst = details[0].gst;
          let cm_logo = details[0].company_logo;
          var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_mrp,
            quantity: row.cart_quantity,
            "tax-rate": gst,
          }));
          createinvoice(userOrder, details, extractedData, notice, logo);
        }
        else{
          let cm_logo = details[0].company_logo;
          var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_mrp,
            quantity: row.cart_quantity,
            "tax-rate": 0,
          }));
          createinvoice(userOrder, details, extractedData,notice, logo);
        }
      } else {
        const extractedData = cartproduct.map(row => ({
          description: row.product_name,
          price: row.product_mrp,
          quantity: row.cart_quantity,
          "tax-rate": 0,
        }));
        console.log("data",extractedData)
        createinvoice(userOrder, details, extractedData);
      }
    }
  } catch (err) {
    console.log(err);
    return res.send({ code: "500", message: "something went wrong here", status: err.message });
  }
  function createinvoice(order, user, extractedData, notice, logo) {
    //const dateTimeString = order[0].created_at.toISOString().split('T')[0];
    const dateTimeString = order.created_at;
    const date = new Date(dateTimeString);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const invoiceData = {
      "client": {
        "company": `customer name: ${order.name}`,
        "zip": `contact number: ${order.mobileno}`
      },
      "sender": {
        "company": `sender name:${user[0].user_name}`,
        "address": `mobile number:${user[0].user_mobileno}`,
        
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order.invoice_number,
        "date": formattedDate,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",
      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData)
      .then(result => {
        res.attachment('invoice.pdf');
        const pdfBuffer = Buffer.from(result.pdf, 'base64');
        res.send(pdfBuffer);
      })
      .catch(error => {
        console.error("Error generating invoice:", error);
        return res.status(500).json(helpers.response("500", "error", 'error generating invoice', error.message));
      });
  }
};





invoice.generateInvoiceLast = async (req, res) => {
  try {
    var user = req.user
    let result = await knex.select('*').from('cart_details')
      .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
      .where({ "cart_user_id": user.id })
      .where("cart_status", 1)
    var sum = 0
    for (let i = 0; i < result.length; i++) {
      sum += result[i].net_price
    }
    const date = new Date()
    const dateD = Date.now()
    if (result.length === 0) {
      return res.status(500).json(helpers.response("500", "error", "invalid"));
    }
    else {
      let obj = {
        name: req.query.name,
        mobileno: req.query.mobileno,
        invoice_number: "I" + dateD + result[0].cart_id,
        net_price: sum,
        created_at: date,
        created_by: result[0].cart_user_id,
        invoice_status: 1,
      }
      knex('invoice_details').insert(obj).then((data) => {
        knex("invoice_items").insert({ item_details: JSON.stringify([{ user: obj, product: result }]), item_status: 1, item_order: obj.created_at, created_by: user.id }).then((respp11) => {
          if (req.query.insert_type == 1) {
            return res.status(200).send({ code: "200", status: "success", msg: 'success ', data: { user: obj, product: result } });
          }
          if (req.query.insert_type == 2) {
            knex('cart_details').del().where({ 'cart_user_id': user.id }).where("cart_status", 1).then((resp1) => {
              var arr = [];
              arr.push({
                url: 'https://192.168.101.12/pdfFile?id=' + data + '&user_id=' + user.id
              })
              knex("invoice_details").update({ invoice_link: arr[0].url }).where("id", data[0]).then((up) => {
                pdfFile(user.id,respp11[0])
              }).catch((e) => {
                return res.status(500).json(helpers.response("500", "error", 'can not generate invoice ', e));
              })

            }).catch((e) => {
              return res.status(500).json(helpers.response("500", "error", 'can not be proceeded furthur', e));
            })
          }
        })
      }).catch((e) => {
        return res.status(500).json(helpers.response("500", "error", 'error in processing ', e));
      })
    }
  } catch (e) {
    console.log(e)
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
  async function pdfFile(user_id,respp) {
    try {
      const order = await knex.select("*").from("invoice_items").where("items_id",respp);
      if (order.length === 0) {
        return res.send({ code: "400", message: "invalid invoice" });
      } else {
        var cartproduct = ((JSON.parse(order[0].item_details))[0]).product
        var userOrder = ((JSON.parse(order[0].item_details))[0]).user
        var details = await knex.select("*").from("company_details").where("id", user_id);
        const imageIsEnabled = details[0].image_isenable;
        if (imageIsEnabled === 1) {
          if (details[0].note !== null && details[0].gst !== null && details[0].company_logo !== null) {
            console.log("1")

            //var notice = details[0].note;
            var notice = details[0].note + "<br><br><br><br><br><br><br><br><br><br><br>" + details[0].footer + `<br><br><a href='https://www.google.com'>Google</a>` + details[0].company_mobileno;

            var gst = details[0].gst;
            console.log("gst1", gst);

            let cm_logo = details[0].company_logo;
            console.log("q", details[0].company_logo);

            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_mrp,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(userOrder, details, extractedData, notice, logo);
          } 
          else if (details[0].gst !== null && details[0].company_logo !== null) {
            var gst = details[0].gst;
            let cm_logo = details[0].company_logo;
            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_mrp,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(userOrder, details, extractedData, notice, logo);
          }
          else{
            let cm_logo = details[0].company_logo;
            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_mrp,
              quantity: row.cart_quantity,
              "tax-rate": 0,
            }));
            createinvoice(userOrder, details, extractedData,notice, logo);
          }
        } else {
          const extractedData = cartproduct.map(row => ({
            description: row.product_name,
            price: row.product_mrp,
            quantity: row.cart_quantity,
            "tax-rate": 0,
          }));
          createinvoice(userOrder, details, extractedData);
        }
      }
    } catch (err) {
      console.log(err);
      return res.send({ code: "500", message: "something went wrong here", status: err.message });
    }
    function createinvoice(order, user, extractedData, notice, logo) {
      //const dateTimeString = order[0].created_at.toISOString().split('T')[0];
      const dateTimeString = order.created_at;
      const date = new Date(dateTimeString);
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = date.getUTCDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      // const invoiceData = {
      //   "client": {
      //     "company": `customer name: ${order.name}`,
      //     "zip": `contact number: ${order.mobileno}`
      //   },
      //   "sender": {
      //     "company": `sender name:${user[0].user_name}`,
      //     "address": `mobile number:${user[0].user_mobileno}`,
          
      //   },
      //   "images": {
      //     "logo": logo,
      //     //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      //   },
      //   "information": {
      //     "number": order.invoice_number,
      //     "date": formattedDate,
      //   },
      //   "products": extractedData,
      //   "bottom-notice": notice,
      //   "settings": {
      //     "currency": "INR",
      //   },
      //   "translate": {
      //     "vat": "GST",
      //     "due-date": " "
      //   },
      // };
      // easyinvoice.createInvoice(invoiceData)
        // .then(result => {
          // res.attachment('invoice.pdf');
          // const pdfBuffer = Buffer.from(result.pdf, 'base64');
          // res.send(pdfBuffer);
          return res.status(200).json(helpers.response("200", "success", 'success',[{order:order,user:user}]));

        // })
        // .catch(error => {
        //   console.error("Error generating invoice:", error);
        //   return res.status(500).json(helpers.response("500", "error", 'error generating invoice', error.message));
        // });
    }



  }
}






invoice.invoiceUpdate = async (req, res) => {
  try {
    console.log("invoiceUpdate API");
    const data = req.body;

    let { gst, note, footer, image_isenable } = data
    console.log("data", data)

    let tokenId = req.user.id
    console.log("tokenId", tokenId)

    const results = await knex.select("*").from("company_details").where("id", tokenId);
    if (results.length !== 1) {
      return res.status(400).json({ code: "400", status: "error", message: "userId not matched" });
    } else {
      await knex("company_details").where("id", tokenId).update(data);
      return res.status(200).json({ code: "200", status: "success", message: "Successfully Update", data: data });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error,

    });
  }
}









module.exports = invoice;







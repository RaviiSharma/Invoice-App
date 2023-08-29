const helpers = require("../helpers");
const knex = require('../db.js')


require("dotenv").config()

let cart = {};





cart.addCart100 = async (req, res) => {
  try {
    const qty = req.body.cart_quantity;
    const product_id = req.body.product_id;
    const token = req.user //decodedtoken
    const result0 = await knex("product_details").select("*").where("product_id", product_id);
    if (result0.length == 0) {
      return res.json({ code: "400", status: false, message: "product_id does not match", });
    };
    let pStock = result0[0].product_stock;
    let pStatus = result0[0].product_status;
    if (pStatus == 1 && pStock >= 0 && pStock >= qty) {
      var newPr = result0[0].product_stock - qty;
    } else {
      return res.json({ code: "400", status: false, message: "no stocks avilable", });
    };
    //update stock 
    await knex("product_details").where("product_id", product_id).update("product_stock", newPr);
    let cart_user_id = token.id;
    let cart_product_id = product_id;
    let cart_quantity = qty; //static values
    let product_mrp = result0[0].product_cost_price;
    let net_price = cart_quantity * product_mrp;
    let cart_status = 1;
    // Perform database insertion
    await knex("cart_details")
      .insert({
        cart_user_id: cart_user_id,
        cart_product_id: cart_product_id,
        cart_quantity: cart_quantity,
        product_mrp: product_mrp,
        net_price: net_price,
        cart_status: cart_status
      })
      .then((resp) => {
        return res.status(201).json({ code: "200", status: true, message: "Inserted successfully", });
      })
      .catch((error) => {
        return res.status(500).json({ code: "500", error: error.message });
      });
  } catch (error) {
    return res.status(500).json({ code: "500", error: error.message });
  }
}




cart.addCart200 = async (req, res) => {
  try {
    var users = req.user, qty = 0;
    let product = await knex.select('*').from('product_details').where({ 'product_id': req.body.product_id, 'product_status': "1", 'is_enable': 1 })
    if (product.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "product is invalid"));
    }
    else {
      let cart = await knex.select('*').from('cart_details').where({ 'cart_product_id': req.body.product_id, 'cart_user_id': users.id }).where("cart_status", 1)
      if (cart.length === 0) {
        if (req.body.type === 1) {
          if (product[0].product_quantity > JSON.parse(req.body.cart_quantity)) {
            let obj = {
              cart_user_id: users.id,
              cart_product_id: req.body.product_id,
              cart_quantity: req.body.cart_quantity,
              product_mrp: product[0].product_cost_price,
              cart_status: "1",
              created_by: users.id
            }
            obj.net_price = obj.product_mrp * obj.cart_quantity
            // obj.cart_product_quantity = product[0].product_quantity - obj.cart_quantity
            insertProduct(obj, product)
          } else {
            return res.status(500).json(helpers.response("500", "error", "out of stock1"));
          }
        }
        else {
          return res.status(400).json(helpers.response("400", "error", "choose type 1 for add the product"));
        }
      } else {
        if (JSON.parse(product[0].product_quantity) >= 0 && JSON.parse(product[0].product_quantity) >= req.body.cart_quantity) {
          qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
          if (req.body.type === 1) {//add
            if (req.body.cart_quantity > 1) {
              // qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
              let obj1 = {
                cart_user_id: users.id,
                cart_product_id: req.body.product_id,
                cart_quantity: qty,
                product_mrp: product[0].product_cost_price,
                cart_status: "1",
                updated_at: new Date(),
                updated_by: users.id
              }
              obj1.net_price = obj1.product_mrp * obj1.cart_quantity
              // obj1.cart_product_quantity = cart[0].cart_product_quantity - JSON.parse(req.body.product_quantity)
              updateQuantity(obj1, cart, product)
            }
            else {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) + 1,
                // product_sale_price: cart[0].product_sale_price
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              // obj.cart_product_quantity = cart[0].cart_product_quantity - 1
              updateQuantity(obj, cart, product)
            }
          }
          if (req.body.type === 2) { //sub
            if (JSON.parse(cart[0].cart_quantity) > 0) {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) - 1,
                // product_sale_price: cart[0].product_sale_price
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              // obj.cart_product_quantity = cart[0].cart_product_quantity + 1
              await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
              await knex("product_details").update("product_quantity", JSON.parse(product[0].product_quantity) + 1).where("product_id", req.body.product_id)
              return res.status(200).json(helpers.response("200", "success", "updated successfully"));
            }
            else {
              await knex('cart_details').del().where('cart_id', cart[0].cart_id)
              return res.status(200).json(helpers.response("200", "success", "Your product is removed from cart"));
            }
          }
        } else {
          return res.status(500).json(helpers.response("500", "error", "out of stock2"));
        }
      }
    }
  }
  catch (e) {
    console.log(e)
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
  async function updateQuantity(obj, cart, product) {
    if (JSON.parse(product[0].product_quantity) > JSON.parse(req.body.cart_quantity)) {
      await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
      updateProductQuantity(product)
    } else {
      return res.status(500).json(helpers.response("500", "error", "out of stock3"));
    }
  }
  async function insertProduct(obj, product) {
    console.log("obj:", obj)
    await knex('cart_details').insert(obj)
    updateProductQuantity(product)
  }
  async function updateProductQuantity(product) {
    if (product[0].product_quantity > req.body.cart_quantity) {
      var p = product[0].product_quantity - req.body.cart_quantity
      await knex('product_details').update({ "product_quantity": p }).where('product_id', req.body.product_id)
      return res.status(200).json(helpers.response("200", "success", "Your product is added to cart"));
    }
    else {
      return res.status(500).json(helpers.response("500", "error", "out of stock4"));
    }
  }
}



cart.addCartnewLast = async (req, res) => {
  try {
    console.log("req.body", req.body)
    var users = req.user, qty = 0;
    let product = await knex.select('*').from('product_details').where({ 'product_id': req.body.product_id, 'product_status': "1", 'is_enable': 1 })
    if (product.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "product is invalid"));
    }
    else {
      let cart = await knex.select('*').from('cart_details').where({ 'cart_product_id': req.body.product_id, 'cart_user_id': users.id }).where("cart_status", 1)
      if (cart.length === 0) {
        if (req.body.type === 1) {
          if (product[0].product_quantity > JSON.parse(req.body.cart_quantity)) {
            let obj = {
              cart_user_id: users.id,
              cart_product_id: req.body.product_id,
              cart_quantity: req.body.cart_quantity,
              product_mrp: product[0].product_sale_price,
              cart_status: "1",
              created_by: users.id
            }
            obj.net_price = obj.product_mrp * obj.cart_quantity
            insertProduct(obj, product)
          } else {
            return res.status(500).json(helpers.response("500", "error", "out of stock1"));
          }
        }
        else {
          return res.status(400).json(helpers.response("400", "error", "choose type 1 for add the product"));
        }
      } else {
        if (JSON.parse(product[0].product_quantity) >= 0 && JSON.parse(product[0].product_quantity) >= req.body.cart_quantity) {
          qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
          if (req.body.type === 1) {//add
            if (req.body.cart_quantity > 1) {
              qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
              let obj1 = {
                cart_user_id: users.id,
                cart_product_id: req.body.product_id,
                cart_quantity: qty,
                product_mrp: product[0].product_sale_price,
                cart_status: "1",
                updated_at: new Date(),
                updated_by: users.id
              }
              obj1.net_price = obj1.product_mrp * obj1.cart_quantity
              updateQuantity(obj1, cart, product)
            }
            else {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) + 1
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              updateQuantity(obj, cart, product)
            }
          }
          if (req.body.type === 2) { //sub
            if (JSON.parse(cart[0].cart_quantity) > 0) {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) - 1,
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
              await knex("product_details").update("product_quantity", JSON.parse(product[0].product_quantity) + 1).where("product_id", req.body.product_id)
              return res.status(200).json(helpers.response("200", "success", "updated successfully"));
            }
            else {
              await knex('cart_details').del().where('cart_id', cart[0].cart_id)
              return res.status(200).json(helpers.response("200", "success", "Your product is removed from cart"));
            }
          }
        } else {
          return res.status(500).json(helpers.response("500", "error", "out of stock2"));
        }
      }
    }
  }
  catch (e) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
  async function updateQuantity(obj, cart, product) {
    console.log("obj1:", obj)
    if (JSON.parse(product[0].product_quantity) > JSON.parse(req.body.cart_quantity)) {
      await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
      updateProductQuantity(product)
    } else {
      return res.status(500).json(helpers.response("500", "error", "out of stock3"));
    }
  }
  async function insertProduct(obj, product) {
    console.log("obj2:", obj)

    await knex('cart_details').insert(obj)
    updateProductQuantity(product)
  }
  async function updateProductQuantity(product) {
    console.log("product3:", product)

    if (product[0].product_quantity > req.body.cart_quantity) {
      var p = product[0].product_quantity - req.body.cart_quantity
      console.log("quantity234:", p)
      await knex('product_details').update({ "product_quantity": p }).where('product_id', req.body.product_id)
      return res.status(200).json(helpers.response("200", "success", "Your product is added to cart"));
    }
    else {
      return res.status(500).json(helpers.response("500", "error", "out of stock4"));
    }
  }
}


// cart.addCartlast = async (req, res) => {
//   try {
//     console.log("req.body",req.body)
//     var users = req.user, qty = 0;
//     let product = await knex.select('*').from('product_details').where({ 'product_id': req.body.product_id, 'product_status': "1", 'is_enable': 1 })
//     if (product.length === 0) {
//       return res.status(400).json(helpers.response("400", "error", "product is invalid"));
//     }
//     else {
//       let cart = await knex.select('*').from('cart_details').where({ 'cart_product_id': req.body.product_id, 'cart_user_id': users.id }).where("cart_status", 1)
//       if (cart.length === 0) {
//         if (req.body.type === 1) {
//           if (product[0].product_quantity > JSON.parse(req.body.cart_quantity)) {
//             let obj = {
//               cart_user_id: users.id,
//               cart_product_id: req.body.product_id,
//               cart_quantity: req.body.cart_quantity,
//               product_mrp: product[0].product_sale_price,
//               cart_status: "1",
//               created_by: users.id
//             }
//             obj.net_price = obj.product_mrp * obj.cart_quantity
//             insertProduct(obj, product)
//           } else {
//             return res.status(500).json(helpers.response("500", "error", "out of stock1"));
//           }
//         }
//         else {
//           return res.status(400).json(helpers.response("400", "error", "choose type 1 for add the product"));
//         }
//       } else {
//         if (JSON.parse(product[0].product_quantity) >= 0 && JSON.parse(product[0].product_quantity) >= req.body.cart_quantity) {
//           qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
//           if (req.body.type === 1) {//add
//             if (req.body.cart_quantity > 1) {
//               qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
//               let obj1 = {
//                 cart_user_id: users.id,
//                 cart_product_id: req.body.product_id,
//                 cart_quantity: qty,
//                 product_mrp: product[0].product_sale_price,
//                 cart_status: "1",
//                 updated_at: new Date(),
//                 updated_by: users.id
//               }
//               obj1.net_price = obj1.product_mrp * obj1.cart_quantity
//               updateQuantity(obj1, cart, product)
//             }
//             else {
//               let obj = {
//                 cart_quantity: JSON.parse(cart[0].cart_quantity) + 1
//               }
//               obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
//               updateQuantity(obj, cart, product)
//             }
//           }
//           if (req.body.type === 2) { //sub
//             if (JSON.parse(cart[0].cart_quantity) > 0) {
//               let obj = {
//                 cart_quantity: JSON.parse(cart[0].cart_quantity) - 1,
//               }
//               obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
//               await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
//               await knex("product_details").update("product_quantity", JSON.parse(product[0].product_quantity) + 1).where("product_id", req.body.product_id)
//               showDetails()
//               // return res.status(200).json(helpers.response("200", "success", "updated successfully"));
//             }
//             else {
//               await knex('cart_details').del().where('cart_id', cart[0].cart_id)
//               showDetails()
//               // return res.status(200).json(helpers.response("200", "success", "Your product is removed from cart"));
//             }
//           }
//         } else {
//           return res.status(500).json(helpers.response("500", "error", "out of stock2"));
//         }
//       }
//     }
//   }
//   catch (e) {
//     return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
//   }
//   async function updateQuantity(obj, cart, product) {
//     console.log("obj1:",obj)
//     if (JSON.parse(product[0].product_quantity) > JSON.parse(req.body.cart_quantity)) {
//       await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
//       updateProductQuantity(product)
//     } else {
//       return res.status(500).json(helpers.response("500", "error", "out of stock3"));
//     }
//   }
//   async function insertProduct(obj, product) {
//     console.log("obj2:",obj)

//     await knex('cart_details').insert(obj)
//     updateProductQuantity(product)
//   }
//   async function updateProductQuantity(product) {
//     console.log("product3:",product)

//     if (product[0].product_quantity > req.body.cart_quantity) {
//       var p = product[0].product_quantity - req.body.cart_quantity
//       console.log("quantity234:",p)
//       await knex('product_details').update({ "product_quantity": p }).where('product_id', req.body.product_id)
//       showDetails()
//       // return res.status(200).json(helpers.response("200", "success", "Your product is added to cart"));
//     }
//     else {
//       return res.status(500).json(helpers.response("500", "error", "out of stock4"));
//     }
//   }
//   async function showDetails(){
//       const tokenId = req.user.id;
//       const cartQuery = await knex.select("*").from("cart_details").where("cart_status",1).where("cart_user_id", tokenId);
//       if (cartQuery.length === 0) {
//         return res.send({ code: "400",status:"error", message: "No data found in cart_details" });
//       }else{
//         var qty=0
//         for(let i=0;i<cartQuery.length;i++){
//           qty=qty+JSON.parse(cartQuery[i].cart_quantity)
//         }
//         return res.json({ code: "200",status:"success", message: "Successful", data: cartQuery,net_quantity:qty });
//       }    
//   }

// }



cart.addCart = async (req, res) => {
  try {
    var users = req.user, qty = 0;
    console.log("addCart api")
    console.log("req.body", req.body, "addCart api")
    let product = await knex.select('*').from('product_details').where({ 'product_id': req.body.product_id, 'product_status': "1", 'is_enable': 1 })
    if (product.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "product is invalid"));
    }
    else {
      let cart = await knex.select('*').from('cart_details').where({ 'cart_product_id': req.body.product_id, 'cart_user_id': users.id }).where("cart_status", 1)
      if (cart.length === 0) {
        if (req.body.type === 1) {
          if (product[0].product_quantity > JSON.parse(req.body.cart_quantity)) {
            let obj = {
              cart_user_id: users.id,
              cart_product_id: req.body.product_id,
              cart_quantity: req.body.cart_quantity,
              product_mrp: product[0].product_sale_price,
              cart_status: "1",
              created_by: users.id
            }
            obj.net_price = obj.product_mrp * obj.cart_quantity
            insertProduct(obj, product)
          } else {
            return res.status(500).json(helpers.response("500", "error", "out of stock1"));
          }
        }
        else {
          return res.status(400).json(helpers.response("400", "error", "choose type 1 for add the product"));
        }
      } else {
        if (JSON.parse(product[0].product_quantity) >= 0 && JSON.parse(product[0].product_quantity) >= req.body.cart_quantity) {
          qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
          if (req.body.type === 1) {//add
            if (req.body.cart_quantity > 1) {
              qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
              let obj1 = {
                cart_user_id: users.id,
                cart_product_id: req.body.product_id,
                cart_quantity: qty,
                product_mrp: product[0].product_sale_price,
                cart_status: "1",
                updated_at: new Date(),
                updated_by: users.id
              }
              obj1.net_price = obj1.product_mrp * obj1.cart_quantity
              updateQuantity(obj1, cart, product)
            }
            else {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) + 1
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              updateQuantity(obj, cart, product)
            }
          }
          if (req.body.type === 2) { //sub
            if (JSON.parse(cart[0].cart_quantity) > 1) {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) - 1,
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
              await knex("product_details").update("product_quantity", JSON.parse(product[0].product_quantity) + 1).where("product_id", req.body.product_id)
              showDetails()
              // return res.status(200).json(helpers.response("200", "success", "updated successfully"));
            }
            else {
              await knex('cart_details').del().where('cart_id', cart[0].cart_id)
              //showDetails()
              return res.status(200).json(helpers.response("200", "success", "Your product is removed from cart"));
            }
          }
        } else {
          return res.status(500).json(helpers.response("500", "error", "out of stock2"));
        }
      }
    }
  }
  catch (e) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
  async function updateQuantity(obj, cart, product) {
    console.log("obj1:", obj)
    if (JSON.parse(product[0].product_quantity) > JSON.parse(req.body.cart_quantity)) {
      await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
      updateProductQuantity(product)
    } else {
      return res.status(500).json(helpers.response("500", "error", "out of stock3"));
    }
  }
  async function insertProduct(obj, product) {
    console.log("obj2:", obj)

    await knex('cart_details').insert(obj)
    updateProductQuantity(product)
  }
  async function updateProductQuantity(product) {
    console.log("product3:", product)

    if (product[0].product_quantity > req.body.cart_quantity) {
      var p = product[0].product_quantity - req.body.cart_quantity
      console.log("quantity234:", p)
      await knex('product_details').update({ "product_quantity": p }).where('product_id', req.body.product_id)
      showDetails()
      // return res.status(200).json(helpers.response("200", "success", "Your product is added to cart"));
    }
    else {
      return res.status(500).json(helpers.response("500", "error", "out of stock4"));
    }
  }



  async function showDetails() {
    const tokenId = req.user.id;
    const cartQuery = await knex.select("*").from("cart_details").where("cart_status", 1).where("cart_user_id", tokenId);
    if (cartQuery.length === 0) {
      return res.send({ code: "400", status: "error", message: "No data found in cart_details" });
    } else {
      var qty = 0
      for (let i = 0; i < cartQuery.length; i++) {
        qty = qty + JSON.parse(cartQuery[i].cart_quantity)
      }
      return res.json({ code: "200", status: "success", message: "Successful", data: cartQuery, net_quantity: qty });
    }
  }

}



cart.showcartdetails = async (req, res) => {
  try {
    console.log("showCartDetails API");
    let q = await knex("cart_details").select("*").where("cart_status", 1);
    res.json({ code: "200", message: " successfully ", data: q });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }

}


cart.showDetails100 = async (req, res) => {
  try {
    console.log("total API || showDetails api");

    const tokenId = req.user.id;
    console.log("tokenId", tokenId);

    const cartQuery = await knex
      .select("cart_product_id", "cart_quantity", "product_mrp", "net_price")
      .from("cart_details")
      .where("cart_user_id", tokenId).where("cart_status", 1)

    if (cartQuery.length === 0) {
      return res.send({ code: "400", message: "No data found in cart_details" });
    }

    const productIds = cartQuery.map((object) => object.cart_product_id);

    const productDetailsQuery = await knex
      .select("product_id", "product_name")
      .from("product_details")
      .whereIn("product_id", productIds);

    const productDetailsMap = productDetailsQuery.reduce((map, product) => {
      map[product.product_id] = product.product_name;
      return map;
    }, {});

    const items = cartQuery.map((object) => {
      const { cart_product_id, cart_quantity, product_mrp, net_price } = object;
      const product_name = productDetailsMap[cart_product_id];
      return { cart_product_id, cart_quantity, product_mrp, net_price, product_name };
    });

    const itemsWithProductNames = await Promise.all(items);

    let amount = 0;
    itemsWithProductNames.forEach((object) => {
      amount += object.net_price;
    });

    const companyDetailsQuery = await knex.select("gst").from("company_details").where("id", tokenId);

    let GST = 0;
    if (companyDetailsQuery.length > 0) {
      const gst = companyDetailsQuery[0].gst;
      console.log("gst:", gst);
      GST = (amount * gst) / 100;
    }

    const Tamount = amount + GST;
    console.log("Total amount:", Tamount);

    const Items = {
      cart_products: itemsWithProductNames,
      amount: amount,
      GST: GST,
      total_amount: Tamount,
    };

    return res.json({ code: "200", message: "Successfully", data: Items });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};



cart.showDetails = async (req, res) => {
  try {
    console.log("total API || showDetails api");
    const tokenId = req.user.id;
    console.log("tokenId", tokenId);
    const cartQuery = await knex
      .select("cart_product_id", "cart_quantity", "product_mrp", "net_price")
      .from("cart_details")
      .where("cart_user_id", tokenId);
    if (cartQuery.length === 0) {
      return res.send({ code: "400", message: "No data found in cart_details" });
    }
    const productIds = cartQuery.map((object) => object.cart_product_id);
    const productDetailsQuery = await knex
      .select("product_id", "product_name")
      .from("product_details")
      .whereIn("product_id", productIds);
    const productDetailsMap = productDetailsQuery.reduce((map, product) => {
      map[product.product_id] = product.product_name;
      return map;
    }, {});
    const items = cartQuery.map((object) => {
      const { cart_product_id, cart_quantity, product_mrp, net_price } = object;
      const product_name = productDetailsMap[cart_product_id];
      return { cart_product_id, cart_quantity, product_mrp, net_price, product_name };
    });
    const itemsWithProductNames = await Promise.all(items);
    let amount = 0;
    itemsWithProductNames.forEach((object) => {
      amount += object.net_price;
    });
    const companyDetailsQuery = await knex.select("gst").from("company_details").where("id", tokenId);

    let GST = 0;
    if (companyDetailsQuery[0].gst !== null) {
      var gst = companyDetailsQuery[0].gst;
      // GST = (amount * gst) / 100;
      GST = gst
      console.log(typeof GST)
      var Tamount = amount + (amount * gst) / 100;

    } else {
      GST = 0;
      var Tamount = amount;
    }

    // const Tamount = amount + (amount * gst) / 100;
    console.log("Total amount:", Tamount);

    const Items = {
      cart_products: itemsWithProductNames,
      amount: amount,
      GST: GST,
      total_amount: Tamount,
    };

    return res.json({ code: "200", message: "Successful", data: Items });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};



cart.cancelCartProducts100 = async (req, res) => {
  try {
    let token_id = req.user.id;
    let products_id = req.body.products_id;
    console.log("cancelCartProducts API", "token_id", token_id);

    if (products_id.length > 0) {
      console.log("products_id", products_id);
      await knex('cart_details').where('cart_product_id', 'in', products_id).update({ "cart_status": 2 }).andWhere("cart_status", 1)
        .then((resp) => {
          return res.status(200).json(helpers.response("200", "success", `products cancel successfully ${products_id}`));
        }).catch((e) => {

          return res.status(500).json(helpers.response("500", "error", "can not be cancel " + e + ""));
        })
    } else {
      q = await knex("cart_details").update("cart_status", 2).where("cart_status", 1).andWhere("cart_user_id", token_id);
      res.json({ code: "200", message: ` successfully updated ${token_id} cart_user_id `, data: `no of products cancel ${q} by id ${token_id}` });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }

};



cart.cancelCartProducts200 = async (req, res) => {
  try {
    var user = req.user
    if (req.body.product_id) {
      var c = []
      const cart = await knex.select("*").from("cart_details").where("cart_status", 1).where("cart_product_id", "in", req.body.product_id).where("cart_status", 1).where("cart_user_id", user.id)
      if (cart.length == 0) {
        return res.status(400).json(helpers.response("400", "error", "cart is empty"));
      }
      else {
        for (let i = 0; i < cart.length; i++) {
          c.push(cart[i].cart_id)
        }
        await knex("cart_details").del().where("cart_id", "in", c)
        return res.status(200).json(helpers.response("200", "success", "deleted"));
      }
    }
    else {
      var c = []
      const cart = await knex.select("*").from("cart_details").where("cart_status", 1).where("cart_user_id", user.id)
      if (cart.length == 0) {
        return res.status(400).json(helpers.response("400", "error", "cart is empty"));
      } else {
        for (let i = 0; i < cart.length; i++) {
          c.push(cart[i].cart_id)
        }
        await knex("cart_details").del().where("cart_id", "in", c)
        return res.status(200).json(helpers.response("200", "success", "deleted"));
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};


cart.cancelCartProducts = async (req, res) => {
  try {
    var user = req.user
    console.log("cancelCartProducts api ", "tokenid", req.user.id)
    console.log("productsArray", req.body.products_id)

    if (req.body.products_id.length > 0) {
      var c = []
      const cart = await knex.select("*").from("cart_details").where("cart_status", 1).where("cart_product_id", "in", req.body.products_id).where("cart_user_id", user.id).where("created_by", user.id)
      if (cart.length == 0) {
        return res.status(400).json(helpers.response("400", "error", "cart is empty1"));
      }
      else {
        for (let i = 0; i < cart.length; i++) {
          c.push(cart[i].cart_id)
        }
        await knex("cart_details").del().where("cart_id", "in", c).where("cart_user_id", user.id).where("created_by", user.id)
        console.log("c", c)
        return res.status(200).json(helpers.response("200", "success", "deleted1"));
      }
    }
    else {

      const cart = await knex.select("*").from("cart_details").where("cart_status", 1).where("cart_user_id", user.id).where("created_by", user.id)
      if (cart.length == 0) {
        return res.status(400).json(helpers.response("400", "error", "cart is empty2"));
      } else {
        await knex("cart_details").del().where("cart_user_id", user.id).where("created_by", user.id)
        return res.status(200).json(helpers.response("200", "success", "deleted2"));
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};



module.exports = cart
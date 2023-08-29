const helpers = require("../helpers");
const knex = require('../db.js')


require("dotenv").config()

let product = {};



product.insertProduct = async (req, res) => {
    try {
        var frombody = req.body
        console.log("frombody", frombody)
        var user = req.user
        if (req.body.insert_type == 1) {
            const category = await knex.select("*").from("category_details").where("category_id", req.body.product_category)
            if (category.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid category"))
            } else {
                delete frombody.insert_type
                delete frombody.product_id
                delete frombody.id
                frombody.product_quantity = parseInt(req.body.product_quantity);
                frombody.product_stock = parseInt(req.body.product_stock);
                frombody.product_cost_price = parseInt(req.body.product_cost_price);
                frombody.product_sale_price = parseInt(req.body.product_sale_price);
                frombody.product_tax = parseInt(req.body.product_tax);
                if (!isValidProductData(frombody)) {
                    return res.status(400).json(helpers.response("400", "error", "invalid input"));
                }
                else {
                    let obj = {
                        product_name: frombody.product_name,
                        product_company_id: frombody.product_company_id,
                        product_category: category[0].category_id,
                        product_quantity: frombody.product_quantity,
                        product_unit: JSON.stringify(frombody.product_unit),
                        product_stock: frombody.product_stock,
                        product_cost_price: frombody.product_cost_price,
                        product_sale_price: frombody.product_sale_price,
                        product_tax: frombody.product_tax,
                        product_status: 1,
                        is_enable: 1,
                        created_by: user.id
                    }
                    if (req.files) {
                        var image = req.files.product_image
                        image.mv("./product_images/" + image.name, async function (err, rslt) {
                            if (err) {
                                return res.status(500).json(helpers.response("500", "error", "can not be uploaded", err))
                            } else {
                                obj.product_image = image.name
                                var resp = await knex("product_details").insert(obj)
                                return res.status(200).json(helpers.response("200", "success", "successfully inserted", resp))
                            }
                        })
                    }
                    else {
                        var resp = await knex("product_details").insert(obj)
                        return res.status(200).json(helpers.response("200", "success", "successfully inserted", resp))
                    }
                }
            }
        }
        if (frombody.insert_type == 2) { //edit category
            delete frombody.category_code
            let valid = false;
            Object.keys(frombody).forEach((element) => {
                if (frombody[element] === null || frombody[element] === "") {
                    delete frombody[element];
                }
            });
            const keyname = Object.keys(frombody);
            for (let i = 0; i < keyname.length; i++) {
                switch (keyname[i]) {
                    case "product_name":
                        var value = "";
                        if (keyname[i] === "product_name") { value = frombody.product_name; }
                        valid = (/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/).test(value);
                        break;
                    case "product_quantity":
                        var value = "";
                        if (keyname[i] === "product_quantity") { value = frombody.product_quantity; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_unit":
                        var value = "";
                        if (keyname[i] === "product_unit") { value = frombody.product_unit; }
                        frombody.product_unit = JSON.stringify(frombody.product_unit)
                        break;
                    case "product_stock":
                        var value = "";
                        if (keyname[i] === "product_stock") { value = frombody.product_stock; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_cost_price":
                        var value = "";
                        if (keyname[i] === "product_cost_price") { value = frombody.product_cost_price; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_sale_price":
                        var value = "";
                        if (keyname[i] === "product_sale_price") { value = frombody.product_sale_price; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    default:
                        valid = true
                }
            }
            if (!valid) {
                return res.status(400).json(helpers.response("400", "error", "wrong and mismatch input"));
            }
            else {
                delete frombody.insert_type
                delete frombody.id
                frombody.updated_at = new Date()
                frombody.updated_by = user.id
                if (req.body.product_id) {
                    const prd = await knex.select("*").from("product_details").where("product_id", req.body.product_id)
                    if (prd.length === 0) {
                        return res.status(400).json(helpers.response("400", "error", "invalid product"))
                    } else {
                        if (req.files) {
                            var image = req.files.product_image
                            image.mv("./product_images/" + image.name, async function (err, rslt) {
                                if (err) {
                                    return res.status(500).json(helpers.response("500", "error", "can not be uploaded", err))
                                } else {
                                    frombody.product_image = image.name
                                    var resp = await knex("product_details").update(frombody).where("product_id", frombody.product_id)
                                    return res.status(200).json(helpers.response("200", "success", "successfully updated"))
                                }
                            })
                        }
                        else {
                            var resp = await knex('product_details').where('product_id', req.body.product_id).update(frombody)
                            return res.status(200).json(helpers.response("200", "success", "Successfully product details are updated"));
                        }

                    }
                } else {
                    return res.status(400).json(helpers.response("400", "error", "you must provide the product id"))
                }
            }
        }
        if (frombody.insert_type == 3) {//features enabled
            delete frombody.insert_type
            delete frombody.category_code
            var id = req.body.id
            knex('product_details').where('product_id', 'in', id).update({ "is_enable": 0 }).then((resp) => {
                return res.status(200).json(helpers.response("200", "success", "enabled successfully"));
            }).catch((e) => {

                return res.status(500).json(helpers.response("500", "error", "can not be enabled " + e + ""));
            })
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong", e))
    }
    function isValidProductData(data) {
        return (
            data &&
            typeof data.product_name === "string" &&
            // typeof data.product_category === "string" &&
            typeof data.product_quantity === "number" && data.product_quantity >= 0 &&
            // typeof data.product_unit === "number" && data.product_unit >= 0 &&
            typeof data.product_stock === "number" && data.product_stock >= 0 &&
            typeof data.product_cost_price === "number" && data.product_cost_price >= 0
            &&
            typeof data.product_sale_price === "number" && data.product_sale_price >= 0
            && typeof data.product_tax === "number" && data.product_tax >= 0
        );
    }




}

product.updateProductImage = async (req, res) => {
    try {

        var image = req.files.product_image
        console.log("image", image)
        image.mv("./product_images/" + image.name, async function (err, rslt) {
            if (err) {
                return res.status(400).json(helpers.response("400", "error", "can not be uploaded"))

            } else {
                knex("product_details").update({ product_image: image.name }).where("product_id", req.body.product_id).then((resp) => {
                    return res.status(200).json(helpers.response("200", "success", "updated successfully"))
                })
            }
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json(helpers.response("500", "error", "something went wrong", e))

    }
}




product.getProductDetails100 = async (req, res) => {
    try {
        var category = await knex.select("*").from("category_details").where("category_status", 1)
        if (category.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid category"));
        } else {
            var pr = []
            for (let i = 0; i < category.length; i++) {
                pr.push(category[i].category_code)
            }
            var product = await knex.select("*").from("product_details").where("product_status", 1).where("product_category", "in", pr)
            if (product.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid product"));
            } else {
                var o = {}
                var product_details = product.reduce(function (r, el) {
                    var e = el.product_category;
                    if (!o[e]) {
                        o[e] = {
                            category_name: (el.product_category.split('_').pop()).replace("\n", ""),
                            products: []
                        }
                        r.push(o[e]);
                    }
                    o[e].products.push({ product_id: el.product_id, product_name: el.product_name, product_quantity: el.product_quantity, product_unit: el.product_unit, product_stock: el.product_stock, product_cost_price: el.product_cost_price, product_sale_price: el.product_sale_price });
                    return r;
                }, [])
                return res.status(200).json(helpers.response("200", "success", "get details successfully", product_details));
            }
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
    }
}


product.getProductDetails = async (req, res) => {
    try {
        var user = req.user
        var product = await knex.select("*").from("category_details")
            .leftJoin("product_details", "category_details.category_id", "=", "product_details.product_category")
            .where("product_status", 1).where("category_status", 1).where("category_details.is_enable", 1).where("product_details.is_enable", 1).where("category_details.created_by", user.id)
        if (product.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid product"));
        } else {
            var o = {}
            var product_details = product.reduce(function (r, el) {
                var e = el.category_id;
                if (!o[e]) {
                    o[e] = {
                        category_id: el.category_id,
                        category_name: el.category_name,
                        products: []
                    }
                    r.push(o[e]);
                }
                o[e].products.push({ product_id: el.product_id, product_name: el.product_name, product_quantity: el.product_quantity, product_unit: el.product_unit, product_stock: el.product_stock, product_cost_price: el.product_cost_price, product_sale_price: el.product_sale_price });
                return r;
            }, [])
            return res.status(200).json(helpers.response("200", "success", "get details successfully", product_details));
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
    }
}


product.showProductDetails = async (req, res) => {
    try {
        var user = req.user
        console.log("showCartDetails API");
        let q = await knex("product_details").select("*").where("product_status", 1).where("is_enable", 1).where("created_by", user.id);
        if (q.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid product"));
        } else {
            return res.status(200).json(helpers.response("200", "success", "get product details successfully", q));
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


product.showProductDisable = async (req, res) => {
    try {
        console.log("showProductDesable API");
        var user = req.user
        let q = await knex("product_details").select("*").where("is_enable", 0).where("created_by", user.id);
        if (q.length == 0) {
            return res.status(400).json(helpers.response("400", "error", "no data found"));
        } else {
            return res.json({ code: "200", message: " successfully ", data: q });
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


product.getProductDetailsByCategory = async (req, res) => {
    try {
        var user = req.user
        var category = await knex.select("*").from("category_details").where("category_id", req.query.category_id).where("category_status", 1).where("is_enable", 1).where("created_by", user.id)
        if (category.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid category"));
        } else {
            var pr = []
            for (let i = 0; i < category.length; i++) {
                pr.push(category[i].category_id)
            }
            var product = await knex.select("*").from("product_details").where("product_status", 1).where("product_category", "in", pr)
            if (product.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid product"));
            } else {
                return res.status(200).json(helpers.response("200", "success", "get product details successfully", product));
            }
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
    }
}


product.getproductImageUrl = async (req, res) => {
    try {
        const targetPath = "./product_images/"
        var files = [], i;
        var arr = [];
        var query = url.parse(req.url, true).query;
        let pic = query.image;
        if (pic == undefined || pic == null) {
            fs.readdir(targetPath, function (err, list) {
                for (i = 0; i < list.length; i++) {
                    files.push(list[i]);
                    var image = "";
                    image = files[i];
                    arr.push({
                        id: i,
                        url: 'http://localhost:3010/getproductImageUrl?_format=json&image=' + image
                        // url: 'https://api-gym.redesk.in/api/getproductImageUrl?_format=json&image=' + image
                    });
                }
                return res.status(200).json(helpers.response("200", "success", arr));
            });
        } else {
            fs.readFile(targetPath + pic, function (err, content) {
                if (err) {
                    res.writeHead(404, { 'Content-type': 'text/html' })
                    res.end("No such image");
                } else {
                    res.writeHead(200, { 'Content-type': 'image/png' });
                    res.end(content);
                }
            });
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "something went wrong", e));
    }
}





module.exports = product;
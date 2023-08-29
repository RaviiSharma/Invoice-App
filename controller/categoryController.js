const helpers = require("../helpers");
const knex = require('../db.js')
const path = require('path');
const url = require('url');
const fs = require('fs');


require("dotenv").config()

let category = {};



category.createCategory100 = async (req, res) => {
    try {
        //insert_type=1 //create category, insert_type=2 //update category, insert_type=3 //features enable/disable
        const frombody = req.body;
        var user = req.user
        console.log("user:", user)
        if (frombody.insert_type == 1) { //insert category
            if (!typeof frombody.category_name == "string") {
                return res.status(400).json(helpers.response("400", "error", "invalid input"))
            }
            let obj = {
                category_name: frombody.category_name,
                category_status: 1,
                is_enable: 1,
                created_by: user.id
            }
            obj.category_code = JSON.parse(user.user_mobileno) + "-" + obj.category_name
            knex("category_details").insert(obj).then((resp) => {
                return res.status(200).json(helpers.response("200", "success", "successfully inserted"))
            }).catch((e) => {
                return res.status(400).json(helpers.response("400", "error", "can not be added", e))
            })
        }
        else if (frombody.insert_type == 2) { //edit category
            let valid = false;
            Object.keys(frombody).forEach((element) => {
                if (frombody[element] === null || frombody[element] === "") {
                    delete frombody[element];
                }
            });
            const keyname = Object.keys(frombody);
            for (let i = 0; i < keyname.length; i++) {
                switch (keyname[i]) {
                    case "category_name":
                        var value = "";
                        if (keyname[i] === "category_name") { value = frombody.category_name; }
                        valid = (/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/).test(value);
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
                if (req.body.category_name) frombody.category_code = JSON.parse(user.user_mobileno) + "_" + req.body.category_name
                console.log("frombody:", frombody)
                knex('category_details').where('category_id', req.body.category_id).update(frombody).then((resp) => {
                    return res.status(200).json(helpers.response("200", "success", "Successfully category details are updated"));
                }).catch((e) => {
                    return res.status(500).json(helpers.response("500", "error", "category details can not be updated " + e + ""));
                })
            }
        }
        else if (frombody.insert_type == 3) {//features enabled
            delete frombody.insert_type
            var id = req.body.id
            knex('category_details').where('category_id', 'in', id).update({ "is_enable": 0 }).then((resp) => {
                return res.status(200).json(helpers.response("200", "success", "enabled successfully"));
            }).catch((e) => {
                return res.status(500).json(helpers.response("500", "error", "can not be enabled " + e + ""));
            })
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""))
    }
}




category.createCategory = async (req, res) => {
    try {
        //insert_type=1 //create category, insert_type=2 //update category, insert_type=3 //features enable/disable
        const frombody = req.body;
        var user = req.user
        console.log("user:", user)
        if (frombody.insert_type == 1) { //insert category
            if (!typeof frombody.category_name == "string") {
                return res.status(400).json(helpers.response("400", "error", "invalid input"))
            }
            let obj = {
                category_name: frombody.category_name,
                company_id: user.id,
                category_status: 1,
                is_enable: 1,
                created_by: user.id
            }
            obj.category_code = JSON.parse(user.user_mobileno) + "-" + obj.category_name
            if (req.files) {
                var image = req.files.category_image
                obj.category_image = image.name
                image.mv('./category_images/' + image.name, async function (err, rslt) {
                    knex("category_details").insert(obj).then((resp) => {
                        return res.status(200).json(helpers.response("200", "success", "successfully inserted", resp))
                    }).catch((e) => {
                        return res.status(400).json(helpers.response("400", "error", "can not be added", e))
                    })
                })
            } else {
                knex("category_details").insert(obj).then((resp) => {
                    return res.status(200).json(helpers.response("200", "success", "successfully inserted", resp))
                }).catch((e) => {
                    return res.status(400).json(helpers.response("400", "error", "can not be added", e))
                })
            }

        }
        else if (frombody.insert_type == 2) { //edit category
            let valid = false;
            Object.keys(frombody).forEach((element) => {
                if (frombody[element] === null || frombody[element] === "") {
                    delete frombody[element];
                }
            });
            const keyname = Object.keys(frombody);
            for (let i = 0; i < keyname.length; i++) {
                switch (keyname[i]) {
                    case "category_name":
                        var value = "";
                        if (keyname[i] === "category_name") { value = frombody.category_name; }
                        valid = (/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/).test(value);
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
                if (req.body.category_name) frombody.category_code = JSON.parse(user.user_mobileno) + "_" + req.body.category_name
                if (req.files) {
                    var image = req.files.category_image
                    frombody.category_image = image.name
                    image.mv('./category_images/' + image.name, async function (err, rslt) {
                        knex("category_details").update(frombody).where('category_id', req.body.category_id).then((resp) => {
                            return res.status(200).json(helpers.response("200", "success", "successfully updated"))
                        }).catch((e) => {
                            return res.status(400).json(helpers.response("400", "error", "can not be added", e))
                        })
                    })
                } else {
                    knex('category_details').where('category_id', req.body.category_id).update(frombody).then((resp) => {
                        return res.status(200).json(helpers.response("200", "success", "Successfully category details are updated"));
                    }).catch((e) => {
                        return res.status(500).json(helpers.response("500", "error", "category details can not be updated " + e + ""));
                    })
                }
            }
        }
        else if (frombody.insert_type == 3) {//features enabled
            delete frombody.insert_type
            var id = req.body.id
            knex('category_details').where('category_id', 'in', id).update({ "is_enable": 0 }).then((resp) => {
                return res.status(200).json(helpers.response("200", "success", "enabled successfully"));
            }).catch((e) => {
                return res.status(500).json(helpers.response("500", "error", "can not be enabled " + e + ""));
            })
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""))
    }
}



category.updatecategoryImage = async (req, res) => {
    try {

        var image = req.files.category_image
        console.log("image", image)
        image.mv("./category_images/" + image.name, async function (err, rslt) {
            if (err) {
                return res.status(400).json(helpers.response("400", "error", "can not be uploaded"))

            } else {
                knex("category_details").update({ category_image: image.name }).where("category_id", req.body.category_id).then((resp) => {
                    return res.status(200).json(helpers.response("200", "success", "updated successfully"))
                })
            }
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json(helpers.response("500", "error", "something went wrong", e))

    }
}



category.showCategoryDetails = async (req, res) => {
    try {
        var user = req.user
        console.log("showCategoryDetails API");
        let q = await knex("category_details").select("*").where("is_enable", 1).andWhere("category_status", 1).where("created_by", user.id)
        if (q.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "no category found", q));
        } else {
            return res.json({ code: "200", message: " successful ", data: q });
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






category.getCategoryImageUrl = async (req, res) => {
    try {
        const targetPath = "./category_images/"
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
                        url: 'http://localhost:3010/getCategoryImageUrl?_format=json&image=' + image
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





category.getImageUrl100 = async (req, res) => {
    try {
        if (req.query.type == 1) {
            var targetPath = "./category_images/"
            geturl(targetPath, req.query.type)
        }
        else if (req.query.type == 2) {
            var targetPath = "./product_images/"
            geturl(targetPath, req.query.type)
        }
        else if (req.query.type == 3) {
            var targetPath = "./uploads/"
            geturl(targetPath, req.query.type)
        }
        else {
            return res.status(400).json(helpers.response("400", "error", "please insert 1 or 2 or 3 in type"));
        }
    }
    catch (e) {
        return res.status(500).json(helpers.response("500", "something went wrong", e));
    }
    async function geturl(targetPath, type) {
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
                        url: 'http://localhost:3010/getImageUrl?_format=json&image=' + image + "&type=" + type
                        // url: 'https://invoice.apptimates.com/getImageUrl?_format=json&image=' + image+"&type="+type
                    });
                }
                return res.status(200).json(helpers.response("200", "success", "targetPath:" + targetPath, arr));
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
    }
}




category.getImageUrl = async (req, res) => {
    try {
        if (req.query.type == 1) {
            var targetPath = "./category_images/"
            geturl(targetPath, req.query.type)
        }
        else if (req.query.type == 2) {
            var targetPath = "./product_images/"
            geturl(targetPath, req.query.type)
        }
        else if (req.query.type == 3) {
            var targetPath = "./uploads/"
            geturl(targetPath, req.query.type)
        }
        else {
            return res.status(400).json(helpers.response("400", "error", "please insert 1 or 2 or 3 in type"));
        }
    }
    catch (e) {
        return res.status(500).json(helpers.response("500", "something went wrong", e));
    }
    async function geturl(targetPath, type) {
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
                        // url: 'http://localhost:3010/getImageUrl?_format=json&image=' + image + "&type=" + type
                        // url: 'http://localhost:3010/getImageUrl?_format=json&type='+type+'&image='+image 
                        url: 'https://invoice.apptimates.com/getImageUrl?_format=json&type=' + type + '&image=' + image

                        // url: 'https://invoice.apptimates.com/getImageUrl?_format=json&image=' + image+"&type="+type
                    });
                }
                return res.status(200).json(helpers.response("200", "success", "targetPath:" + targetPath, arr));
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
    }
}






category.getImageUrlFinal = async (req, res) => {
    try {
        if (req.query.type == 1) {
            const cat = await knex.select("category_image").from("category_details").where("category_status", 1).where("is_enable", 1)
            if (cat.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid category"));
            }
            else {
                var targetPath = "./category_images/"
                geturl(targetPath, req.query.type, cat[0].category_image,cat[0].category_id,cat)
            }
        }
        else if (req.query.type == 2) {
            const pro = await knex.select("product_image").from("product_details").where("product_status", 1).where("is_enable", 1)
            if (pro.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid product"));
            }
            else {
                var targetPath = "./product_images/"
                geturl(targetPath, req.query.type, pro[0].product_image,pro[0].product_id,pro)
            }
        }
        else if (req.query.type == 3) {
            const com = await knex.select("company_logo").from("company_details").where("company_status", 1)
            if (com.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid company"));
            }
            else {
                var targetPath = "./uploads/"
                geturl(targetPath, req.query.type, com[0].company_logo,com[0].company_id,com)
            }
        }
        else {
            return res.status(400).json(helpers.response("400", "error", "please insert 1 or 2 or 3 in type"));
        }
    }
    catch (e) {
        return res.status(500).json(helpers.response("500", "something went wrong", e));
    }
    async function geturl(targetPath, type,img,id,doc) {
        var files = [], i;
        var arr = [];
        var query = url.parse(req.url, true).query;
        let pic = query.image;
        if (pic == undefined || pic == null) {
            fs.readdir(targetPath, function (err, list) {
                for (i = 0; i < doc.length; i++) {
                    arr.push({
                        id: id,
                        // url: 'http://localhost:3010/getImageUrl?_format=json&image=' + image + "&type=" + type
                        url: 'http://localhost:3010/getImageUrl?_format=json&type='+type+'&image='+img 
                        // url: 'https://invoice.apptimates.com/getImageUrl?_format=json&type=' + type + '&image=' + img

                        // url: 'https://invoice.apptimates.com/getImageUrl?_format=json&image=' + image+"&type="+type
                    });
                }
                return res.status(200).json(helpers.response("200", "success", "targetPath:" + targetPath, arr));
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
    }
}









module.exports = category;
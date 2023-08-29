const express = require("express");
const middleware = require("../middleware");
const helpers = require("../helpers");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const invoiceController = require("../controller/invoiceController");
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const clientController = require('../controller/clientController')
const customerController = require('../controller/customerController')


// const { userRole } = require('../config');
// const requireAuth = require('../middleware');
const auth = require('../middleware');

const router = express.Router();
require("dotenv").config()

router.route('/')
  .get((req, res) => {
    res.status(200).send(helpers.response("200", "success"))
  })


//middleware.checkAuth()


//category API
router.route("/createCategory").post(auth.authentication, auth.authorisation, categoryController.createCategory);

router.route("/showCategoryDetails").get(auth.authentication, auth.authorisation, categoryController.showCategoryDetails);


router.route("/updatecategoryImage").post(auth.authentication, auth.authorisation, categoryController.updatecategoryImage);

router.route("/getImageUrl").get(categoryController.getImageUrl);



//product API
router.route("/insertProduct").post(auth.authentication, auth.authorisation, productController.insertProduct);

router.route("/showProductDetails").get(auth.authentication, auth.authorisation, productController.showProductDetails);
router.route("/showProductDisable").get(auth.authentication, auth.authorisation, productController.showProductDisable);



//product API
router.route("/getProductDetails").get(auth.authentication, auth.authorisation, productController.getProductDetails);
router.route("/getProductDetailsByCategory").get(auth.authentication, auth.authorisation, productController.getProductDetailsByCategory);
router.route("/updateProductImage").post(auth.authentication, auth.authorisation, productController.updateProductImage);




//invoice API
router.route("/generateInvoice").get(auth.authentication, auth.authorisation, invoiceController.generateInvoice);
// router.route('/ExcelFiledownload/:file').post(invoiceController.ExcelFiledownload);
router.route("/pdfFile").get(invoiceController.pdfFile);
router.route("/invoiceList").get(auth.authentication, auth.authorisation, invoiceController.invoiceList);
router.route("/invoiceHistory").get(auth.authentication, auth.authorisation, invoiceController.invoiceHistory);
router.route("/invoiceUpdate").post(auth.authentication, auth.authorisation,invoiceController.invoiceUpdate);






//user api


router.route('/userRegister').post(userController.userRegister);

router.route('/Login').post(userController.Login);

router.route('/verifyOTP').post(userController.verifyOTP);

router.route('/editRegister').post(auth.authentication, auth.authorisation, userController.editRegister);

router.route('/userDetailsById').get(auth.authentication, auth.authorisation, userController.userDetailsById);



// router.post('/addCart',auth.authentication,auth.authorisation,cartController.addCart);
// router.post('/addCart',auth.authentication,auth.authorisation,cartController.addCart);

router.route('/addCart').post(auth.authentication, auth.authorisation, cartController.addCart);
router.route('/showcartdetails').get(auth.authentication, auth.authorisation, cartController.showcartdetails);
router.route('/showDetails').get(auth.authentication, auth.authorisation, cartController.showDetails);
router.route('/cancelCartProducts').post(auth.authentication, auth.authorisation, cartController.cancelCartProducts);


//client api
router.route('/clientList').get(auth.authentication, auth.authorisation, clientController.clientList);
router.route('/InvoiceListByClient').get(auth.authentication, auth.authorisation, clientController.InvoiceListByClient);



//customer api
router.route('/insertCustomerDetails').post(auth.authentication, auth.authorisation, customerController.insertCustomerDetails);
// getCustomerDetails
router.route('/getCustomerDetails').get(auth.authentication, auth.authorisation, customerController.getCustomerDetails);




// insertCustomerDetails




module.exports = router;

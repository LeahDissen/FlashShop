const router = require("express").Router();
const orderController = require("../controllers/ordersController");
const orderPaymentController = require("../controllers/orderPaymentController");
const orderEmailTemplatesController = require("../controllers/orderEmailTemplatesController");
const { auth, authAdmin, optionalAuth } = require("../middlewares/auth");
const { QuoteRateLimiter } = require("../middlewares/apiRate");

router.post("/", auth, orderController.createOrder);
router.post("/quote", QuoteRateLimiter, optionalAuth, orderController.quoteOrder);
router.get("/pending/user/:userId", auth, orderController.getPendingOrderForUser);
router.put("/pending/user/:userId", auth, orderController.updateOrder);
router.get("/user/:userId", auth, orderController.getOrdersByUserId);
router.get("/email-templates", authAdmin, orderEmailTemplatesController.getOrderEmailTemplates);
router.put("/email-templates/:status", authAdmin, orderEmailTemplatesController.updateOrderEmailTemplate);
router.get("/payment/check", authAdmin, orderPaymentController.checkPaymentConnection);
router.get("/", authAdmin, orderController.getOrders);
router.delete("/", authAdmin, orderController.deleteOrders);
router.get("/:id", auth, orderController.getOrderById);
router.put("/:id/status", authAdmin, orderController.updateOrderStatus);
router.post("/:id/payment/confirm", auth, orderPaymentController.confirmPayment);
router.post("/:id/drive", authAdmin, orderController.syncOrderDrive);

module.exports = router;
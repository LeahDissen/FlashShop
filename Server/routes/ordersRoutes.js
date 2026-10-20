const router = require("express").Router();
const orderController = require("../controllers/ordersController");
const { auth, authAdmin } = require("../middlewares/auth");

router.post("/", auth, orderController.createOrder);
router.post("/quote", auth, orderController.quoteOrder);
router.get("/pending/user/:userId", auth, orderController.getPendingOrderForUser);
router.put("/pending/user/:userId", auth, orderController.updateOrder);
router.get("/user/:userId", auth, orderController.getOrdersByUserId);
router.get("/email-templates", authAdmin, orderController.getOrderEmailTemplates);
router.put("/email-templates/:status", authAdmin, orderController.updateOrderEmailTemplate);
router.get("/payment/check", authAdmin, orderController.checkPaymentConnection);
router.get("/", authAdmin, orderController.getOrders);
router.delete("/", authAdmin, orderController.deleteOrders);
router.get("/:id", auth, orderController.getOrderById);
router.put("/:id/status", authAdmin, orderController.updateOrderStatus);
router.post("/:id/payment/confirm", auth, orderController.confirmPayment);
router.post("/:id/drive", authAdmin, orderController.syncOrderDrive);

module.exports = router;
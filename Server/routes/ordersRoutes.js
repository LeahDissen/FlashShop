const router = require("express").Router();
const orderController = require("../controllers/ordersController");

router.post('/', orderController.createOrder);
router.get('/pending/user/:userId', orderController.getPendingOrderForUser);
router.get('/', orderController.getOrders);
router.put('/pending/user/:userId', orderController.updateOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.get('/user/:userId', orderController.getOrdersByUserId);
router.get('/:id', orderController.getOrderById);

module.exports = router;
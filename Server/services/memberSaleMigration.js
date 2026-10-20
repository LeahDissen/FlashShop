const { ProductModel } = require("../models/productModel");

/**
 * One-time move from public sales to members-only sales (runs at start, does nothing once done):
 * a product on sale with a higher "price before the sale" gets that as its regular price, and its
 * sale price becomes the club members' final price. A sale with no previous price had no discount
 * to show, so it is just turned off.
 */
exports.migrateSalesToMemberDiscounts = async () => {
    const onSale = await ProductModel.find({ isOnSale: true, "memberDiscount.type": { $exists: false } })
        .select("price originalPrice").lean();
    let converted = 0;
    for (const product of onSale) {
        const price = Number(product.price);
        const previous = Number(product.originalPrice);
        const update = Number.isFinite(previous) && previous > price
            ? { $set: { price: previous, memberDiscount: { type: "price", value: price }, originalPrice: null } }
            : { $set: { isOnSale: false, originalPrice: null } };
        await ProductModel.updateOne({ _id: product._id }, update);
        converted += 1;
    }
    if (converted) console.log(`Member sales: ${converted} products moved to members-only sales`);
};

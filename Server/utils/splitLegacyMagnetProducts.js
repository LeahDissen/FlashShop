const { ProductModel } = require("../models/productModel");
const {
    DEFAULT_MAGNET_SIZES,
    parseMagnetSize,
    sizesMatch,
    isMagnetProductDoc,
    formatMagnetProductName,
} = require("./magnetSize");

function applySizeToProduct(product, size) {
    product.size = size.label;
    product.printWidth = size.width;
    product.printHeight = size.height;
    product.priceTiers = [];
    product.displayType = "magnet";
}

async function magnetAlreadyHasSize(size, excludeId) {
    const others = await ProductModel.find({
        _id: { $ne: excludeId },
        $or: [{ displayType: "magnet" }, { category: "מגנטים" }],
    }).lean();

    return others.some((other) =>
        sizesMatch(other.size || other.name, size),
    );
}

async function splitOneBundle(product) {
    const extracted = parseMagnetSize(product.size) || parseMagnetSize(product.name);
    const matchedDefault = extracted
        ? DEFAULT_MAGNET_SIZES.find((size) => sizesMatch(size, extracted))
        : null;
    const primary = matchedDefault || DEFAULT_MAGNET_SIZES[0];
    const originalName = product.name;

    applySizeToProduct(product, primary);
    product.price = matchedDefault ? (product.price || primary.price) : primary.price;
    product.name = extracted && !matchedDefault
        ? originalName
        : formatMagnetProductName(originalName, primary.label);
    await product.save();

    for (const size of DEFAULT_MAGNET_SIZES) {
        if (sizesMatch(size, primary)) continue;
        const exists = await magnetAlreadyHasSize(size, product._id);
        if (exists) continue;

        await ProductModel.create({
            name: formatMagnetProductName(originalName, size.label),
            description: product.description,
            price: size.price,
            image: product.image,
            category: product.category || "מגנטים",
            displayType: "magnet",
            stock: product.stock,
            printWidth: size.width,
            printHeight: size.height,
            size: size.label,
            captionIdeas: product.captionIdeas || [],
            priceTiers: [],
            allowOrientationToggle: Boolean(product.allowOrientationToggle),
        });
    }
}

async function stampSingleSize(product) {
    const extracted = parseMagnetSize(product.size) || parseMagnetSize(product.name);
    if (extracted) {
        applySizeToProduct(product, extracted);
        await product.save();
        return;
    }
    product.priceTiers = [];
    product.displayType = product.displayType || "magnet";
    await product.save();
}

async function splitLegacyMagnetProducts() {
    const magnets = await ProductModel.find({
        $or: [{ displayType: "magnet" }, { category: "מגנטים" }],
    });

    if (!magnets.length) return { processed: 0, split: 0 };

    const needsSize = magnets.filter((product) => !String(product.size || "").trim());
    const shouldSplitBundle = needsSize.length === 1 && magnets.length === 1;

    let split = 0;
    for (const product of magnets) {
        if (!isMagnetProductDoc(product)) continue;
        if (String(product.size || "").trim()) {
            if (Array.isArray(product.priceTiers) && product.priceTiers.length) {
                product.priceTiers = [];
                await product.save();
            }
            continue;
        }

        if (shouldSplitBundle) {
            await splitOneBundle(product);
            split += 1;
        } else {
            await stampSingleSize(product);
        }
    }

    return { processed: magnets.length, split };
}

module.exports = { splitLegacyMagnetProducts };

// A local server for checking admin pages in the browser, safely:
// an in-memory database, every external service switched off, the shop's public catalog copied from the
// live site (read-only GET requests), plus a test admin, a test customer and test orders.
//
//   node tests/dev-server.js            -> API on http://localhost:10300 (10200 is taken by the integration suites)
//   then the "client-testapi" preview   -> http://localhost:5174
//
// Test accounts (local only, exist only in this in-memory database):
//   admin:    admin@example.com / local-admin-123
//   customer: customer@example.com / local-customer-123
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
const LIVE_API = process.env.LIVE_API || "https://api.flaash.co.il";
const PORT = process.env.PORT || "10300";

const TEST_ADMIN = { name: "מנהלת בדיקה", email: "admin@example.com", password: "local-admin-123", role: "admin" };
const TEST_CUSTOMER = { name: "לקוחה בדיקה", email: "customer@example.com", password: "local-customer-123", role: "user" };

// Nothing real may be reached: these are set before the server reads .env (dotenv never overrides them)
const NEUTRAL_ENV = {
    JWT_SECRET: "local-dev-secret",
    PORT,
    // The test client runs on another port than the regular one (CORS)
    CLIENT_URL: "http://localhost:5174",
    HYP_MASOF: "", HYP_KEY: "", HYP_PASSP: "",
    EMAIL_PROVIDER: "", EMAIL_API_KEY: "", EMAIL_USER: "", EMAIL_PASS: "", SMTP_HOST: "", SMTP_PORT: "",
    CLOUDINARY_URL: "",
    GOOGLE_DRIVE_CLIENT_EMAIL: "", GOOGLE_DRIVE_PRIVATE_KEY: "", GOOGLE_DRIVE_ROOT_FOLDER_ID: "",
    GEMINI_API_KEY: "",
};

const fetchJson = async (route) => {
    const res = await fetch(`${LIVE_API}${route}`);
    if (!res.ok) throw new Error(`${route}: ${res.status}`);
    return res.json();
};
const listOf = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);

(async () => {
    const mongod = await MongoMemoryServer.create();
    Object.assign(process.env, NEUTRAL_ENV, { MONGO_URL: mongod.getUri() });

    const mongoose = req("mongoose");
    const bcrypt = req("bcrypt");
    await mongoose.connect(process.env.MONGO_URL);
    const model = (file, name) => require(path.join(SERVER, "models", file))[name];
    const ProductModel = model("productModel", "ProductModel");
    const DesignFrameModel = model("designFrameModel", "DesignFrameModel");
    const FrameCategoryModel = model("frameCategoryModel", "FrameCategoryModel");
    const EditorAssetModel = model("editorAssetModel", "EditorAssetModel");
    const UserModel = model("userModel", "UserModel");
    const OrderModel = model("ordersModel", "OrderModel");

    const copies = [
        ["/products", "products", ProductModel],
        ["/design-frames", "frames", DesignFrameModel],
        ["/frame-categories", "categories", FrameCategoryModel],
        ["/editor-assets", "assets", EditorAssetModel],
    ];
    for (const [route, key, Model] of copies) {
        const docs = listOf(await fetchJson(route), key);
        await Model.collection.insertMany(docs.map(({ _id, ...doc }) => ({ ...doc, _id: new mongoose.Types.ObjectId(_id) })))
            .catch((err) => console.warn(`copy ${route}:`, err.message));
        console.log(`copied ${docs.length} from ${route}`);
    }

    const users = {};
    for (const user of [TEST_ADMIN, TEST_CUSTOMER]) {
        users[user.role] = await UserModel.create({ ...user, password: await bcrypt.hash(user.password, 10) });
    }

    const [product] = await ProductModel.find().limit(1).lean();
    const customer = { name: TEST_CUSTOMER.name, phone: "0500000000", email: TEST_CUSTOMER.email };
    const photo = (n, size) => ({
        name: `פיתוח תמונה (photo-${n}.jpg)`,
        size,
        price: 2,
        quantity: n % 3 + 1,
        itemType: "photo-print",
        image: `https://picsum.photos/seed/flash${n}/600/400`,
    });
    await OrderModel.create([
        {
            user_id: users.user._id,
            status: "processing",
            fulfillment_method: "pickup",
            customer,
            items: [
                {
                    productId: product?._id,
                    name: `${product?.name || "מוצר"} בעיצוב אישי`,
                    price: product?.price || 50,
                    quantity: 2,
                    image: product?.image,
                    customDesign: { projectName: "עיצוב לבדיקה", copies: [{ image: product?.image }, { image: product?.image }] },
                },
                ...Array.from({ length: 6 }, (_, i) => photo(i + 1, i % 2 ? "13x18" : "10x15")),
            ],
            subtotal: 120,
            discount: 10,
            discounts: [{ kind: "member", label: "הנחת חברות מועדון", amount: 10 }],
            total_price: 110,
        },
        {
            user_id: users.user._id,
            status: "shipped",
            fulfillment_method: "delivery",
            customer,
            shipping_address: { city: "ירושלים", street: "יפו", houseNumber: "1" },
            shipping_fee: 25,
            items: [{
                productId: product?._id,
                name: product?.name || "מוצר",
                price: product?.price || 50,
                quantity: 1,
                image: product?.image,
                customization: { type: "designer-service", description: "בקשה לבדיקה", referenceImages: [product?.image].filter(Boolean) },
            }],
            subtotal: 50,
            total_price: 75,
        },
    ]);
    console.log("seeded test admin, customer and 2 orders");

    require(path.join(SERVER, "app.js"));
})().catch((err) => {
    console.error("dev server failed:", err);
    process.exit(1);
});

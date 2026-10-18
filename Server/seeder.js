const mongoose = require('mongoose');
require('dotenv').config(); 

// ==========================================
// 1. Define the schema and the model
// ==========================================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 100 }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ==========================================
// 2. Product list with fully secure links
// ==========================================
const photoProducts = [
  {
    name: "ספל קרמיקה לבן קלאסי",
    description: "ספל מאג איכותי מקרמיקה בצבע לבן מבריק. מתאים להדפסת סובלימציה של תמונות משפחתיות, הקדשות אישיות או לוגו עסקי.",
    price: 30.00,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80", // Plain white mug
    category: "כוסות וספלים",
    stock: 250
  },
  {
    name: "חולצת טי לבנה להדפסה",
    description: "חולצת טי חלקה ונקייה בצבע לבן אחיד, מוצגת בצילום סטודיו על רקע בהיר. מושלמת להדפסת סובלימציה של תמונות או לוגו.",
    price: 50.00,
    image: "https://upload.wikimedia.org/wikipedia/commons/2/24/White_T-Shirt_on_White_Background.jpg", // Plain white T-shirt in a studio
    category: "ביגוד",
    stock: 150
  },
  {
    name: "כובע מצחייה בייסבול",
    description: "כובע בייסבול בעיצוב קלאסי עם אזור קדמי חלק ונקי המיועד במיוחד להדפסה או רקמה.",
    price: 35.00,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80", // Plain cap
    category: "אקססוריז",
    stock: 200
  },
  {
    name: "הדפסה על קנבס איכותי",
    description: "בד קנבס אמנותי מתוח על מסגרת עץ אורן עמידה. הדפסה ברזולוציה גבוהה עם צבעים חיים שמחזיקים מעמד שנים.",
    price: 49.00,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80", // Canvas frame
    category: "תמונות וקירות",
    stock: 500
  },
  {
    name: "פאזל קרטון להדפסה",
    description: "פאזל חלק מקרטון קשיח ואיכותי בגוון נקי, המציג את טקסטורת החלקים המורכבים. מוכן לחלוטין להדפסת תמונה אישית.",
    price: 34.99,
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/White_puzzle.jpg", // A completely plain, clean classic puzzle
    category: "מתנות ומשחקים",
    stock: 120
  },
  {
    name: "שעון קיר מעוצב להדפסה",
    description: "שעון קיר עגול ונקי עם מנגנון שקט. מותאם להדפסת תמונה מלאה על כל שטח השעון.",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&q=80", // Plain clock
    category: "תמונות וקירות",
    stock: 60
  }
];

// ==========================================
// 3. Main management function
// ==========================================
async function runSeeder() {
  const url = process.env.MONGO_URL;
  
  if (!url) {
    console.error("❌ Error: no variable named MONGO_URL was found in your .env file!");
    process.exit(1);
  }

  try {
    console.log(`🔗 Trying to connect to MongoDB Atlas...`);
    await mongoose.connect(url, { serverSelectionTimeoutMS: 15000 });
    console.log('...Connected to MongoDB Atlas! ✅');

    console.log('🗑️ Clearing old products from the database...');
    await Product.deleteMany({});
    console.log(`🧼 The collection was cleared successfully.`);

    console.log('🚀 Inserting selected, safe photo products...');
    const insertedProducts = await Product.insertMany(photoProducts);
    console.log(`🎉 Done! Inserted ${insertedProducts.length} clean, secure products into the DB.`);
    
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Fatal error while running the script:", error);
    process.exit(1);
  }
}

runSeeder();
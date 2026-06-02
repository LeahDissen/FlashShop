const mongoose = require('mongoose');
require('dotenv').config(); 

// ==========================================
// 1. הגדרת המבנה (Schema) והמודל
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
// 2. רשימת מוצרים עם קישורים מאובטחים לחלוטין
// ==========================================
const photoProducts = [
  {
    name: "ספל קרמיקה לבן קלאסי",
    description: "ספל מאג איכותי מקרמיקה בצבע לבן מבריק. מתאים להדפסת סובלימציה של תמונות משפחתיות, הקדשות אישיות או לוגו עסקי.",
    price: 30.00,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80", // ספל לבן חלק
    category: "כוסות וספלים",
    stock: 250
  },
  {
    name: "חולצת טי לבנה להדפסה",
    description: "חולצת טי חלקה ונקייה בצבע לבן אחיד, מוצגת בצילום סטודיו על רקע בהיר. מושלמת להדפסת סובלימציה של תמונות או לוגו.",
    price: 50.00,
    image: "https://upload.wikimedia.org/wikipedia/commons/2/24/White_T-Shirt_on_White_Background.jpg", // חולצה לבנה חלקה לחלוטין בסטודיו
    category: "ביגוד",
    stock: 150
  },
  {
    name: "כובע מצחייה בייסבול",
    description: "כובע בייסבול בעיצוב קלאסי עם אזור קדמי חלק ונקי המיועד במיוחד להדפסה או רקמה.",
    price: 35.00,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80", // כובע חלק
    category: "אקססוריז",
    stock: 200
  },
  {
    name: "הדפסה על קנבס איכותי",
    description: "בד קנבס אמנותי מתוח על מסגרת עץ אורן עמידה. הדפסה ברזולוציה גבוהה עם צבעים חיים שמחזיקים מעמד שנים.",
    price: 49.00,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80", // מסגרת קנבס
    category: "תמונות וקירות",
    stock: 500
  },
  {
    name: "פאזל קרטון להדפסה",
    description: "פאזל חלק מקרטון קשיח ואיכותי בגוון נקי, המציג את טקסטורת החלקים המורכבים. מוכן לחלוטין להדפסת תמונה אישית.",
    price: 34.99,
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/White_puzzle.jpg", // פאזל קלאסי חלק ונקי לגמרי
    category: "מתנות ומשחקים",
    stock: 120
  },
  {
    name: "שעון קיר מעוצב להדפסה",
    description: "שעון קיר עגול ונקי עם מנגנון שקט. מותאם להדפסת תמונה מלאה על כל שטח השעון.",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&q=80", // שעון חלק
    category: "תמונות וקירות",
    stock: 60
  }
];

// ==========================================
// 3. פונקציית הניהול הראשית
// ==========================================
async function runSeeder() {
  const url = process.env.MONGO_URL;
  
  if (!url) {
    console.error("❌ שגיאה: לא נמצא משתנה בשם MONGO_URL בקובץ ה-.env שלך!");
    process.exit(1);
  }

  try {
    console.log(`🔗 מנסה להתחבר ל-MongoDB Atlas...`);
    await mongoose.connect(url, { serverSelectionTimeoutMS: 15000 });
    console.log('...החיבור ל-MongoDB Atlas הצליח! ✅');

    console.log('🗑️ מנקה מוצרים ישנים מסיס הנתונים...');
    await Product.deleteMany({});
    console.log(`🧼 ה-Collection נוקתה בהצלחה.`);

    console.log('🚀 מכניס מוצרי פוטו נבחרים ובטוחים...');
    const insertedProducts = await Product.insertMany(photoProducts);
    console.log(`🎉 סיימנו בהצלחה! הוכנסו ${insertedProducts.length} מוצרים נקיים ומאובטחים ל-DB.`);
    
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ תקלה חמורה במהלך הפעלת הסקריפט:", error);
    process.exit(1);
  }
}

runSeeder();
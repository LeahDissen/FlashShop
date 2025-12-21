# אפליקציית Flash Shop 📸

# סקירת האפליקציה
אתר חנות אונליין להדפסות על מוצרים ולפיתוח תמונות, כולל קטגוריות של מתנות, מוצרים נלווים וקורסים 
האתר מאפשר למשתמשים להעלות תמונה ולראות איך היא נראית על מוצרים שונים (כמו ספלים, חולצות, מגנטים ועוד).
המערכת כוללת:
* **ממשק משתמש (Frontend):** נבנה ב-React (Vite) עם Tailwind CSS לעיצוב ו-Zustand לניהול מצב.
* **שרת ראשי (Backend):** נבנה ב-Node.js ו-Express עם בסיס נתונים MongoDB.
* **שרת תוכן (CMS):** שירות נוסף מבוסס Redis לניהול תכנים דינמיים באתר (כמו טקסטים בדף הבית).


# התקנה והפעלה
כדי להריץ את האפליקציה באופן מקומי, עקוב אחרי השלבים הבאים:
מכיוון שהפרויקט מורכב משלושה חלקים (קליינט, שרת, ושרת-רדיס), יש להתקין כל אחד מהם.

- פתח את שורת הפקודה (Command Line):
(1. לחץ על מקש Windows + R, 2. הקלד cmd, 3. לחץ Enter)

- הורד את המאגר (repository) מגיטהאב:

    ```bash
    git clone https://github.com/Noa123715/FlashShop.git
    ```

    ```bash
    cd FlashShop
    ```

- התקן את התלויות (dependencies) גם בצד הלקוח וגם בצד השרת:

    ```bash
    cd client
    ```

    ```bash
    npm install
    ```

    ```bash
    cd ../Server
    ```

    ```bash 
    npm install
    ```

    ```bash
    cd ../Redis_Server
    ```

    ```bash 
    npm install
    ```

- הפעל את השרת (Backend):

    ```bash
    node index.js &
    ```

  ```bash
  cd ../Server
  ```

  ```bash
    npm run dev &
    ```

- הפעל את האפליקציה (Frontend):

    ```bash
    cd ../client
    ```

    ```bash
    npm run dev &
    ```

- אם הדפדפן לא נפתח אוטומטית, ניתן לגשת לכתובת: http://localhost:5173

# הוראות שימוש
לאחר שהאפליקציה פועלת, ניתן להשתמש בה כך:
*רכישת מוצרים ועיצוב אישי*
- בחר מוצר מתוך הרשימה (כגון ספל, חולצה, פוסטר וכו').
- העלה תמונה מהמחשב שלך.
- התצוגה תתעדכן מיידית ותראה לך איך התמונה נראית על גבי המוצר שנבחר.
- ניתן לבחור כמויות והמחיר יתעדכן בהתאם
- מתלבט? השאר את המוצרים בעגלה ותחזור בזמן מתאים יותר
- עכשיו אפשר לגשת לדף התשלום

*פיתוח תמונות*
- כנס לעמוד "פיתוח תמונות"
- אפשר להעלות כמות גדולה של תמונות בבת אחת.
- בחר גודל לכל תמונה (המחיר מתעדכן אוטומטית).

*אזור ניהול (Admin Dashboard)*
מנהלי האתר יכולים:
- לנהל הזמנות וסטטוסים.
- לערוך מוצרים ומחירים.
- לעדכן את הטקסטים והבאנרים באתר.
- לשלוח מיילים לחברי מועדון.

# נקודות קצה מרכזיות (API Endpoints)
השרת מספק את הנתיבים הבאים
*משתמשים:*
    POST /auth/login

    POST /auth/signup

*מוצרים:*
    GET /products

    POST /products/add

*הזמנות:*
    GET /orders/my-orders

    POST /orders

*פיתוח תמונות:*
    GET /photo-prices

*מועדון לקוחות:*
    POST /club/join

# צילומי מסך
*שימוש באתר ללקוחות*
- דף הבית:
  <img src="https://github.com/noa123715/FalshShop/blob/main/Screenshots/home_page_one.png"> <br><br>
  <img src="https://github.com/noa123715/FalshShop/blob/main/Screenshots/home_page_two.png"> <br><br>

- העורך:
  <img src="https://github.com/Noa123715/FlashShop/blob/main/Screenshots/editor.png"><br><br>

- דף הטיפים:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/tips.png"><br><br>
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/one_tip.png"><br><br>

- עגלה:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/cart.png"><br><br>
  
- מוצרים:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/products.png"><br><br>

- פיתוח תמונות:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/photo_developments.png"><br><br>

- פרופיל:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/profil.png"><br><br>

- הצטרפות למועדון:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/club.png"><br><br>

- תחתית האתר:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/footer.png"><br><br>

*ניהול האתר*
- דף הניהול:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/admin_dashboard.png"><br><br>

- ניהול מוצרים:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/admin_products.png"><br><br>

- עדכון ושינוי הקטלוג:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/catalog.png"><br><br>

- עדכון ושינוי המועדון:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/update_club.png"><br><br>


<br/><br/>

#### האפליקציה פותחה על-ידי חני חלמיש ונועה אבקסיס בנובמבר 2025.
#### זוהי הגרסה הראשונה של האפליקציה.
#### אני מקווה שתהנו להשתמש בה, ושהיא תעזור לעסקים וללקוחות לראות את החלום שלהם מתגשם בתמונה אחת ❤️

# שימוש מהנה 😊

# Flash Shop app 📸

# Overview
An online shop for printing on products and for photo development, including gift categories, accessories and courses.
The site lets users upload a photo and see how it looks on different products (such as mugs, shirts, magnets and more).
The system includes:
* **Frontend:** built with React (Vite), Tailwind CSS for styling and Zustand for state management.
* **Main server (Backend):** built with Node.js and Express, with a MongoDB database.
* **Dynamic content (CMS):** the texts and images the admin edits on the site are stored in MongoDB (the `pages` collection) and served by the main server under `/pages/:key`.


# Running
The site runs on Cloudflare (client) and Railway (server). Deploying the client:
```
cd client && npm run deploy        # vite build + wrangler deploy (requires wrangler login)
```
Deploying the server: `railway up` from the repo folder (or connecting GitHub in Railway).


# How to use
Once the app is running, it can be used like this:
*Buying products and personal design*
- Choose a product from the list (such as a mug, shirt, poster, etc.).
- Upload a photo from your computer.
- The preview updates instantly and shows how the photo looks on the chosen product.
- You can choose quantities and the price updates accordingly.
- Not sure yet? Leave the products in the cart and come back at a better time.
- Now you can go to the checkout page.

*Photo development*
- Go to the "Photo development" page.
- You can upload a large number of photos at once.
- Choose a size for each photo (the price updates automatically).

*Admin area (Admin Dashboard)*
Site admins can:
- Manage orders and statuses.
- Edit products and prices.
- Update the texts and banners on the site.
- Send emails to club members.

# Main API endpoints
The server provides the following routes
*Users:*
    POST /auth/login

    POST /auth/signup

*Products:*
    GET /products

    POST /products/add

*Orders:*
    GET /orders/my-orders

    POST /orders

*Photo development:*
    GET /photo-prices

*Customer club:*
    POST /club/join

# Screenshots
*Using the site as a customer*
- Home page:
  <img src="https://github.com/noa123715/FalshShop/blob/main/Screenshots/home_page_one.png"> <br><br>
  <img src="https://github.com/noa123715/FalshShop/blob/main/Screenshots/home_page_two.png"> <br><br>

- Editor:
  <img src="https://github.com/Noa123715/FlashShop/blob/main/Screenshots/editor.png"><br><br>

- Tips page:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/tips.png"><br><br>
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/one_tip.png"><br><br>

- Cart:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/cart.png"><br><br>
  
- Products:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/products.png"><br><br>

- Photo development:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/photo_developments.png"><br><br>

- Profile:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/profil.png"><br><br>

- Joining the club:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/club.png"><br><br>

- Site footer:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/footer.png"><br><br>

*Site management*
- Admin page:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/admin_dashboard.png"><br><br>

- Product management:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/admin_products.png"><br><br>

- Updating the catalog:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/catalog.png"><br><br>

- Updating the club:
  <img src="https://github.com/noa123715/FlashShop/blob/main/Screenshots/update_club.png"><br><br>


<br/><br/>

#### The app was developed by Hani Halamish and Noa Abekasis in November 2025.
#### This is the first version of the app.
#### I hope you enjoy using it, and that it helps businesses and customers see their dream come true in a single photo ❤️

# Enjoy 😊

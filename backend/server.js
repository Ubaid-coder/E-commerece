import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js'
import productRoutes from './routes/product.route.js'
import cartRoutes from './routes/cart.route.js'
import couponsRoutes from './routes/coupon.route.js'
import paymentRoutes from './routes/payment.route.js'
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000; 

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/payments", paymentRoutes);


app.listen(PORT, () => {
    console.log("Server Running On Port http://localhost:"+PORT)
})
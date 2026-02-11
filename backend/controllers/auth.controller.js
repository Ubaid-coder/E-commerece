import { redis } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });

    const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });

    return {accessToken, refreshToken};

}

const storeRefreshToken = async(userId, refreshToken) =>{
    await redis.set(`refresh_token:${userId}`,refreshToken,"EX",60*60*24*7); //7days
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken,{
        httpOnly: true, //prevent XSS attacks
        secure: process.env.NODE_ENV == "production", //true in production
        sameSite:"strict", //prevent CSRF attack
        maxAge: 1000*60*15 //15min
    
    })

    res.cookie("refreshToken", refreshToken,{
        httpOnly: true, //prevent XSS attacks
        secure: process.env.NODE_ENV == "production", //true in production
        sameSite:"strict", //prevent CSRF attack
        maxAge: 1000*60*60*24*7 //7d
    
    })
}

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({ name, email, password });

        // authenticate
        const {accessToken, refreshToken} = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({ user:{
            _id: user._id,
            name:user.name,
            email: user.email,
            role:user.role
        }, message: "User created successfully" });
    } catch (error) {
        return res.status(400).json({message:error.message});
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
}

export const logout = async (req, res) => {
    res.send("Logout request");
}
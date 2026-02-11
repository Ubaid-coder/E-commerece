import { redis } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });

    return { accessToken, refreshToken };

}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 60 * 60 * 24 * 7); //7days
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, //prevent XSS attacks
        secure: process.env.NODE_ENV == "production", //true in production
        sameSite: "strict", //prevent CSRF attack
        maxAge: 1000 * 60 * 15 //15min

    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, //prevent XSS attacks
        secure: process.env.NODE_ENV == "production", //true in production
        sameSite: "strict", //prevent CSRF attack
        maxAge: 1000 * 60 * 60 * 24 * 7 //7d

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
        const { accessToken, refreshToken } = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        const comparePassword = await user.comparePassword(password);

        if (user && comparePassword) {
            const { accessToken, refreshToken } = generateToken(user._id);
            await storeRefreshToken(user._id ,refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });

        }else{
            res.status(401).json({message: "Invalid email or password"});
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        console.log(refreshToken)
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const refreshToken = async(req,res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken){
            return res.status(401).json({message: "No refresh token provided"});
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        console.log(decoded)

        if(storedToken !== refreshToken){
            return res.status(401).json({message: "Invalid refresh token"});
        }

        const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"});

        res.cookie("accessToken", accessToken, {
        httpOnly: true, //prevent XSS attacks
        secure: process.env.NODE_ENV == "production", //true in production
        sameSite: "strict", //prevent CSRF attack
        maxAge: 1000 * 60 * 15 //15min

    });

    res.json({message: "Token refreshed successfully"});

    } catch (error) {
        res.status(500).json({message: "Server error", error:error.message});
    }
}

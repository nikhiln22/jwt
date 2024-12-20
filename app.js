const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config()

const app = express();

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log('connected to database successfully')
}).catch((error) => {
    console.log('error occured while connecting the database', error);
})

const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

const user = mongoose.model("user", userSchema);

app.use(express.json());

const userAuth = (req, res, next) => {
    const token = req.headers["x-access-token"];
    console.log('token:', token);
    if (!token) {
        return res.status(401).json({ message: "unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded:', decoded);
        req.userId = decoded.userId;
        next()
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Unauthorized" });
    }
}


app.post('/api/register', async (req, res) => {
    try {
        console.log('veryfing the user');
        const { username, password } = req.body;
        const userExists = await user.findOne({ username });
        if (userExists) {
            return res.status(401).json({ message: "user already exists" })
        }

        const newUser = new user({ username, password });

        await newUser.save();

        const token = await jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);

        console.log('token', token);

        res.status(200).json({ message: "user created successfully", token: token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal server error" })
    }
})


app.post('/api/login', async (req, res) => {
    try {
        console.log('handling the user login');
        const { username, password } = req.body;
        const user = await user.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "invalid user credentials" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "invalid user credentials" });
        }

        const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        console.log('token:', token);

        res.status(200).json({ message: "Login successful", token: token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal server error" });
    }
});


app.get('/api/protected', userAuth, (req, res) => {
    res.status(200).json({ message: "protected Resource" });
})


app.get('/api/user', userAuth, async (req, res) => {
    try {
        console.log(req.userId);
        const userData = await user.findById(req.userId);

        console.log('user:', userData );

        if (!userData ) {
            return res.status(404).json({ message: "user not found" })
        }

        res.status(200).json({ message: userData.username });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal server error" });
    }
});



app.listen(3000, () => {
    console.log('server is ruuning at http://localhost:3000')
})
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// ✅ CORRECT: ONLY ONE CORS CONFIGURATION
// ✅ BEST: Allow both development and production
app.use(cors({
  origin: ['http://localhost:3000', 'https://form-react-1-xfbw.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



// Middleware
app.use(express.json());

// Configuration
const SECRET = process.env.JWT_SECRET || "1234";
// const GOOGLE_CLIENT_ID = "732537579525-0vh7jkpkhp5c8dt4k6fh1aelcu53hame.apps.googleusercontent.com";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0 && req.path !== '/api/auth/google') {
    console.log('📦 Request body:', JSON.stringify(req.body));
  }
  next();
});

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};
connectDB();

// ================= MODELS =================
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  googleId: String,
  createdAt: { type: Date, default: Date.now }
});

const UserDetailsSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  fullName: String,
  email: { type: String, required: true },
  phone: String,
  dob: Date,
  gender: String,
  maritalStatus: String,
  occupation: String,
  company: String,
  annualIncome: String,
  investmentExperience: String,
  riskTolerance: String,
  goals: [String],
  preferredCommunication: [String],
  acceptTerms: Boolean,
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema, "users");
const UserDetails = mongoose.model("UserDetails", UserDetailsSchema, "user_details");

// ================= GOOGLE LOGIN ROUTE =================
app.post("/api/auth/google", async (req, res) => {
  console.log("🔐 Google login request received");
  console.log("📦 Request body keys:", Object.keys(req.body));
  
  try {
    // Try both field names for compatibility
    const id_token = req.body.id_token || req.body.tokenId || req.body.credential;
    
    if (!id_token) {
      console.error("❌ No token provided in request body");
      console.error("❌ Full request body:", req.body);
      return res.status(400).json({ 
        success: false, 
        message: "Token ID is required" 
      });
    }

    console.log("🔑 Google token received, length:", id_token.length);

    // Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    console.log("✅ Google token verified for:", email);

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = await User.create({ 
        name, 
        email, 
        googleId,
        password: null 
      });
      console.log("✅ New Google user created:", email);
    } else {
      // Update existing user with googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      console.log("✅ Existing user logged in via Google:", email);
    }

    // Create JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email 
      },
      SECRET,
      { expiresIn: "24h" }
    );

    console.log("✅ JWT token generated, length:", token.length);

    res.json({
      success: true,
      message: "Google login successful",
      token,
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email 
      }
    });
  } catch (error) {
    console.error("❌ Google login error:", error);
    console.error("❌ Error stack:", error.stack);
    
    // More specific error messages
    if (error.message.includes('Token used too late')) {
      return res.status(400).json({
        success: false,
        message: "Google token has expired. Please try again."
      });
    }
    
    if (error.message.includes('audience')) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google client ID configuration."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Google login failed",
      error: error.message
    });
  }
});

// ================= MIDDLEWARE =================
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log("🔐 Token received:", token ? "Yes" : "No");
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Access token required" 
      });
    }
    
    // Verify token
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) {
        console.error("❌ JWT Error:", err.message);
        console.error("❌ Token:", token.substring(0, 50) + "...");
        return res.status(403).json({ 
          success: false,
          message: "Invalid or expired token",
          error: err.message
        });
      }
      
      console.log("✅ Token decoded successfully:", decoded);
      
      req.user = {
        id: decoded.id.toString(), // Ensure it's a string
        email: decoded.email
      };
      
      console.log("👤 User set to:", req.user);
      next();
    });
  } catch (error) {
    console.error("🚨 Auth middleware error:", error);
    res.status(500).json({ 
      success: false,
      message: "Authentication error" 
    });
  }
};

// ================= DEBUG ENDPOINTS =================
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true,
    status: "OK", 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

app.get("/api/test-token", (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.json({ 
      success: false,
      message: "No token provided in header" 
    });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({
      success: true,
      message: "Token is valid",
      decoded,
      tokenPreview: token.substring(0, 30) + "..."
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Token verification failed",
      error: err.message,
      tokenPreview: token.substring(0, 30) + "..."
    });
  }
});

// ================= AUTHENTICATION ROUTES =================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword 
    });
    
    const token = jwt.sign({ 
      id: user._id.toString(),
      email: user.email 
    }, SECRET, { expiresIn: "24h" });
    
    console.log("✅ User registered:", user.email);
    console.log("✅ Token created, length:", token.length);
    
    res.json({
      success: true,
      message: "User registered successfully",
      token,
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email 
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed", 
      error: error.message 
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const token = jwt.sign({ 
      id: user._id.toString(),
      email: user.email 
    }, SECRET, { expiresIn: "24h" });
    
    console.log("✅ User logged in:", user.email);
    console.log("✅ Token created, length:", token.length);
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email 
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: error.message 
    });
  }
});

// ================= USER DETAILS ROUTES =================
app.get("/api/user/details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🔍 Fetching details for user ID:", userId);
    
    const details = await UserDetails.findOne({ userId });
    
    if (!details) {
      console.log("ℹ️ No details found for user:", userId);
      return res.json({ 
        success: true,
        exists: false 
      });
    }
    
    console.log("✅ Details found for user:", userId);
    res.json({
      success: true,
      exists: true,
      details: {
        fullName: details.fullName,
        email: details.email,
        phone: details.phone,
        dob: details.dob ? details.dob.toISOString().split('T')[0] : '',
        gender: details.gender,
        maritalStatus: details.maritalStatus,
        occupation: details.occupation,
        company: details.company,
        annualIncome: details.annualIncome,
        investmentExperience: details.investmentExperience,
        riskTolerance: details.riskTolerance,
        goals: details.goals || [],
        preferredCommunication: details.preferredCommunication || [],
        acceptTerms: details.acceptTerms,
        submittedAt: details.submittedAt,
        updatedAt: details.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch user details", 
      error: error.message 
    });
  }
});

app.post("/api/user/details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    
    console.log("💾 Saving details for user:", userId);
    console.log("📦 Data received:", userData);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    const existingDetails = await UserDetails.findOne({ userId });
    if (existingDetails) {
      return res.status(400).json({ 
        success: false,
        message: "Details already exist. Use PUT to update." 
      });
    }
    
    const detailsData = {
      userId,
      email: user.email,
      ...userData,
      dob: userData.dob ? new Date(userData.dob) : null,
      submittedAt: new Date(),
      updatedAt: new Date()
    };
    
    const details = await UserDetails.create(detailsData);
    
    console.log("✅ Details saved for user:", userId);
    res.json({
      success: true,
      message: "User details saved successfully",
      details: {
        fullName: details.fullName,
        email: details.email,
        phone: details.phone,
        dob: details.dob ? details.dob.toISOString().split('T')[0] : '',
        gender: details.gender,
        maritalStatus: details.maritalStatus,
        occupation: details.occupation,
        company: details.company,
        annualIncome: details.annualIncome,
        investmentExperience: details.investmentExperience,
        riskTolerance: details.riskTolerance,
        goals: details.goals || [],
        preferredCommunication: details.preferredCommunication || [],
        acceptTerms: details.acceptTerms,
        submittedAt: details.submittedAt,
        updatedAt: details.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ Error saving user details:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "User details already exist for this account" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to save user details", 
      error: error.message 
    });
  }
});

app.put("/api/user/details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    console.log("📝 Updating details for user:", userId);
    
    const formattedData = {
      ...updateData,
      dob: updateData.dob ? new Date(updateData.dob) : null,
      updatedAt: new Date()
    };
    
    const details = await UserDetails.findOneAndUpdate(
      { userId },
      formattedData,
      { new: true, runValidators: true }
    );
    
    if (!details) {
      return res.status(404).json({ 
        success: false,
        message: "User details not found" 
      });
    }
    
    console.log("✅ Details updated for user:", userId);
    res.json({
      success: true,
      message: "User details updated successfully",
      details: {
        fullName: details.fullName,
        email: details.email,
        phone: details.phone,
        dob: details.dob ? details.dob.toISOString().split('T')[0] : '',
        gender: details.gender,
        maritalStatus: details.maritalStatus,
        occupation: details.occupation,
        company: details.company,
        annualIncome: details.annualIncome,
        investmentExperience: details.investmentExperience,
        riskTolerance: details.riskTolerance,
        goals: details.goals || [],
        preferredCommunication: details.preferredCommunication || [],
        acceptTerms: details.acceptTerms,
        submittedAt: details.submittedAt,
        updatedAt: details.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ Error updating user details:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update user details", 
      error: error.message 
    });
  }
});

// ================= ERROR HANDLING =================
app.use((req, res) => {
  console.error("❌ Route not found:", req.method, req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: "API endpoint not found",
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error("🚨 Server error:", err);
  res.status(500).json({ 
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Test token: http://localhost:${PORT}/api/test-token`);
  console.log(`🔐 User details API: http://localhost:${PORT}/api/user/details`);
  console.log(`🔐 Google login API: http://localhost:${PORT}/api/auth/google`);
});``
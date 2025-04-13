import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes from "./routes/authRoutes.js";
import rebateRoutes from "./routes/rebateRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import priceSettingsRoutes from "./routes/priceSettingsRoutes.js";
import { testConnection } from "./config/db.js";
import config from "./config/config.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(session(config.session));

// Routes
app.use("/api", authRoutes);
app.use("/api/rebate", rebateRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/price-settings", priceSettingsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log(`Server running in ${config.server.env} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

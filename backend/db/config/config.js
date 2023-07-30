const dotenv = require("dotenv");
if (process.env.NODE_ENV !== "production") dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || "your_default_username",
    password: process.env.DB_PASSWORD || "your_default_password",
    database: process.env.DB_NAME || "your_default_database",
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || "your_default_host",
    dialect: "postgres",
  },
  test: {
    username: process.env.TEST_DB_USERNAME || "your_test_username",
    password: process.env.TEST_DB_PASSWORD || "your_test_password",
    database: process.env.TEST_DB_NAME || "your_test_database",
    host: process.env.TEST_DB_HOST || "your_test_host",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
  },
  production: {
    username: process.env.PROD_DB_USERNAME || "your_production_username",
    password: process.env.PROD_DB_PASSWORD || "your_production_password",
    database: process.env.PROD_DB_NAME || "your_production_database",
    host: process.env.PROD_DB_HOST || "your_production_host",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
  },
};

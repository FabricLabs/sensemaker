-- Initialize the Sensemaker database
CREATE DATABASE IF NOT EXISTS db_sensemaker;

-- Create the user if it doesn't exist
CREATE USER IF NOT EXISTS 'db_user_sensemaker'@'%' IDENTIFIED BY 'sensemaker_password';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON db_sensemaker.* TO 'db_user_sensemaker'@'%';

-- Flush privileges to ensure they take effect
FLUSH PRIVILEGES;

-- Select the database
USE db_sensemaker;

-- Create a simple test table to verify connectivity
CREATE TABLE IF NOT EXISTS connection_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message VARCHAR(255) DEFAULT 'Database connection successful'
);
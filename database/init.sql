-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS rotasense;

-- Use the database
USE rotasense;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON rotasense.* TO 'rotasense'@'%';
FLUSH PRIVILEGES;

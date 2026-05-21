CREATE DATABASE IF NOT EXISTS bewerbungen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bewerbungen;

CREATE TABLE IF NOT EXISTS applications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    company     VARCHAR(255) NOT NULL,
    jobtitle    VARCHAR(255),
    link        VARCHAR(2048),
    contact_name     VARCHAR(255),
    contact_email    VARCHAR(255),
    contact_phone    VARCHAR(100),
    contact_position VARCHAR(255),
    app_date    DATE NOT NULL,
    status      ENUM('Beworben','Interview','Warten','Abgelehnt','Angebot') DEFAULT 'Beworben',
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

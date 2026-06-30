CREATE DATABASE IF NOT EXISTS `shelter_of_light`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `shelter_of_light`;

CREATE TABLE IF NOT EXISTS `Users` (
    `User_ID`               INT           AUTO_INCREMENT PRIMARY KEY,
    `Username`              VARCHAR(50)   NOT NULL UNIQUE,
    `Password`              VARCHAR(255)  NOT NULL  COMMENT 'Bcrypt hash via PASSWORD_DEFAULT',
    `Role`                  ENUM('Admin','User') NOT NULL DEFAULT 'User',
    `Full_Name`             VARCHAR(150)  DEFAULT NULL,
    `Contact_Number`        VARCHAR(25)   DEFAULT NULL,
    `Email`                 VARCHAR(150)  DEFAULT NULL UNIQUE,
    `Emergency_Contact_Name` VARCHAR(150) DEFAULT NULL,
    `Emergency_Contact_Num`  VARCHAR(25)  DEFAULT NULL,
    `Availability`          VARCHAR(100)  DEFAULT NULL  COMMENT 'e.g. Weekdays, Weekends',
    `Volunteer_Preference`  VARCHAR(100)  DEFAULT NULL  COMMENT 'e.g. On-Site, Virtual',
    `Created_At`            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Rescues` (
    `Rescue_ID`      INT           AUTO_INCREMENT PRIMARY KEY,
    `AddedBy_UserID` INT           DEFAULT NULL,
    `Name`           VARCHAR(100)  NOT NULL,
    `Species`        VARCHAR(50)   DEFAULT NULL,
    `Breed`          VARCHAR(100)  DEFAULT NULL,
    `Status`         ENUM(
                         'Newly Admitted',
                         'Under Treatment',
                         'Under Observation',
                         'Special Needs',
                         'Looking for Foster',
                         'Adopted',
                         'Rainbow Bridge'
                     ) NOT NULL DEFAULT 'Newly Admitted',
    `Photo_Path`     VARCHAR(255)  DEFAULT NULL  COMMENT 'Path relative to web root: /uploads/rescues/',
    `Memorial_Note`  TEXT          DEFAULT NULL  COMMENT 'Populated only when Status = Rainbow Bridge',
    `Created_At`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rescue_user`
        FOREIGN KEY (`AddedBy_UserID`) REFERENCES `Users`(`User_ID`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Clinics` (
    `Clinic_ID`       INT           AUTO_INCREMENT PRIMARY KEY,
    `Clinic_Name`     VARCHAR(150)  NOT NULL,
    `Veterinarian`    VARCHAR(100)  DEFAULT NULL,
    `Contact_Details` VARCHAR(255)  DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Medical_Records` (
    `Record_ID`      INT  AUTO_INCREMENT PRIMARY KEY,
    `Rescue_ID`      INT  NOT NULL,
    `Clinic_ID`      INT  DEFAULT NULL,
    `Treatment_Date` DATE NOT NULL,
    `Diagnosis`      TEXT DEFAULT NULL,
    CONSTRAINT `fk_medrec_rescue`
        FOREIGN KEY (`Rescue_ID`) REFERENCES `Rescues`(`Rescue_ID`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_medrec_clinic`
        FOREIGN KEY (`Clinic_ID`) REFERENCES `Clinics`(`Clinic_ID`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Donations` (
    `Donation_ID`         INT            AUTO_INCREMENT PRIMARY KEY,
    `Rescue_ID`           INT            DEFAULT NULL  COMMENT 'Nullable — general fund allowed',
    `Sender_Name`         VARCHAR(150)   NOT NULL,
    `Transaction_Date`    DATE           NOT NULL,
    `Amount_PHP`          DECIMAL(12,2)  NOT NULL,
    `Payment_Channel`     VARCHAR(50)    DEFAULT NULL  COMMENT 'GCash, Maya, PayPal, BDO, etc.',
    `Reference_Number`    VARCHAR(100)   DEFAULT NULL,
    `Screenshot_Path`     VARCHAR(255)   DEFAULT NULL,
    `Optional_Message`    TEXT           DEFAULT NULL,
    `Verification_Status` ENUM('Pending','Verified') NOT NULL DEFAULT 'Pending',
    `Created_At`          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_donation_rescue`
        FOREIGN KEY (`Rescue_ID`) REFERENCES `Rescues`(`Rescue_ID`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Adoption_Applications` (
    `Application_ID`  INT          AUTO_INCREMENT PRIMARY KEY,
    `Rescue_ID`       INT          NOT NULL,
    `Tracker_Code`    VARCHAR(20)  NOT NULL UNIQUE  COMMENT 'Auto-generated 8-char alphanumeric',
    `Applicant_Name`  VARCHAR(150) NOT NULL,
    `Applicant_Email` VARCHAR(150) NOT NULL,
    `Status`          ENUM('Under Review','For Interview','Approved','On Hold')
                      NOT NULL DEFAULT 'Under Review',
    `Motivation`      TEXT         DEFAULT NULL,
    `Submitted_At`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_app_rescue`
        FOREIGN KEY (`Rescue_ID`) REFERENCES `Rescues`(`Rescue_ID`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Admin account  | username: admin | password: Admin@SoL2026!
-- IMPORTANT: Regenerate the hash in PHP before deploying to production:
--   echo password_hash('Admin@SoL2026!', PASSWORD_DEFAULT);
INSERT INTO `Users`
    (`Username`, `Password`, `Role`, `Full_Name`, `Email`)
VALUES (
    'admin',
    '$2y$10$RcbqBTEKA7Mh2iFOPdKOoOzrRPnTPEQcEqbRmJpB.VVrdMBTfG8y',
    'Admin',
    'Shelter Administrator',
    'admin@shelteroflight.com'
);

-- Partner Clinics
INSERT INTO `Clinics` (`Clinic_Name`, `Veterinarian`, `Contact_Details`) VALUES
    ('CuddlyCare Veterinary Clinic', 'Dr. Maria Santos', '09171234567 | cuddlycare@clinic.com'),
    ('PawsFirst Animal Hospital',    'Dr. Jose Reyes',   '09281234567 | pawsfirst@clinic.com'),
    ('ShelterCare Mobile Vet',       'Dr. Ana Dizon',    '09351234567 | sheltercare@clinic.com');

ALTER TABLE `Rescues` 
ADD COLUMN `Spayed_Neutered` BOOLEAN DEFAULT FALSE,
ADD COLUMN `Found_Location` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `Found_Age` VARCHAR(50) DEFAULT NULL,
ADD COLUMN `Current_Health_Status` TEXT DEFAULT NULL,
ADD COLUMN `Veterinary_Clinic` VARCHAR(255) DEFAULT NULL;

-- Data
INSERT INTO `Rescues` 
(`Name`, `Species`, `Breed`, `Status`, `Spayed_Neutered`, `Found_Location`, `Found_Age`, `Current_Health_Status`, `Veterinary_Clinic`) 
VALUES

-- Newly Admitted (6 pets)
('Luna', 'Cat', 'Persian', 'Newly Admitted', 1, 'Quezon City', '2 years', 'Healthy', 'CuddlyCare'),
('Bantay', 'Dog', 'Aspin', 'Newly Admitted', 0, 'Cavite', '4 years', 'Good', 'PawsFirst'),
('Milo', 'Cat', 'Siamese', 'Newly Admitted', 1, 'Manila', '1 year', 'Healthy', 'ShelterCare'),
('Bella', 'Dog', 'Poodle', 'Newly Admitted', 1, 'Laguna', '3 years', 'Healthy', 'CuddlyCare'),
('Max', 'Dog', 'Bulldog', 'Newly Admitted', 1, 'Pasig', '5 years', 'Good', 'PawsFirst'),
('Shadow', 'Cat', 'Domestic', 'Newly Admitted', 0, 'Makati', '2 years', 'Healthy', 'ShelterCare'),

-- Under Treatment (7 pets)
('Simba', 'Cat', 'Domestic', 'Under Treatment', 1, 'Makati', '1 year', 'Viral Infection', 'CuddlyCare'),
('Daisy', 'Dog', 'Golden Retriever', 'Under Treatment', 1, 'Pasig', '3 years', 'Distemper', 'ShelterCare'),
('Cleo', 'Cat', 'Persian', 'Under Treatment', 0, 'Manila', '2 years', 'Recovering', 'PawsFirst'),
('Oliver', 'Cat', 'Siamese', 'Under Treatment', 1, 'Taguig', '6 months', 'Flu', 'CuddlyCare'),
('Rocco', 'Dog', 'Bulldog', 'Under Treatment', 1, 'Cavite', '4 years', 'Skin Allergy', 'ShelterCare'),
('Hazel', 'Dog', 'Shih Tzu', 'Under Treatment', 1, 'Quezon City', '2 years', 'Good', 'PawsFirst'),
('Jasper', 'Cat', 'Domestic', 'Under Treatment', 0, 'Alabang', '3 years', 'Fungal Infection', 'CuddlyCare'),

-- Under Observation (8 pets)
('Mimi', 'Cat', 'Siamese', 'Under Observation', 0, 'Manila', '6 months', 'Post-surgery', 'CuddlyCare'),
('Rex', 'Dog', 'Bulldog', 'Under Observation', 1, 'Taguig', '5 years', 'Diet Monitor', 'PawsFirst'),
('Sophie', 'Cat', 'Maine Coon', 'Under Observation', 1, 'Paranaque', '1 year', 'Recovering', 'ShelterCare'),
('Teddy', 'Dog', 'Beagle', 'Under Observation', 1, 'Pasig', '4 years', 'Good', 'CuddlyCare'),
('Toby', 'Dog', 'Aspin', 'Under Observation', 0, 'Cavite', '3 years', 'Health check', 'PawsFirst'),
('Mia', 'Cat', 'Domestic', 'Under Observation', 1, 'Makati', '2 years', 'Good', 'ShelterCare'),
('Chloe', 'Cat', 'Ragdoll', 'Under Observation', 1, 'Pasay', '1 year', 'Recovery', 'CuddlyCare'),
('Sam', 'Dog', 'Poodle', 'Under Observation', 1, 'Laguna', '2 years', 'Monitor', 'PawsFirst'),

-- Special Needs (9 pets)
('Lucky', 'Cat', 'Maine Coon', 'Special Needs', 1, 'Alabang', '4 years', 'Blind in one eye', 'ShelterCare'),
('Choco', 'Dog', 'Poodle', 'Special Needs', 1, 'Cubao', '8 years', 'Arthritis', 'PawsFirst'),
('Paws', 'Dog', 'Shih Tzu', 'Special Needs', 1, 'Quezon City', '6 years', 'Diabetic', 'CuddlyCare'),
('Snowy', 'Cat', 'Persian', 'Special Needs', 1, 'Manila', '3 years', 'Deaf', 'ShelterCare'),
('Bear', 'Dog', 'Bulldog', 'Special Needs', 0, 'Makati', '7 years', 'Joint issues', 'PawsFirst'),
('Olive', 'Cat', 'Domestic', 'Special Needs', 1, 'Taguig', '2 years', 'Missing leg', 'CuddlyCare'),
('Peanut', 'Dog', 'Aspin', 'Special Needs', 0, 'Cavite', '5 years', 'Epilepsy', 'ShelterCare'),
('Goldie', 'Cat', 'Siamese', 'Special Needs', 1, 'Pasig', '4 years', 'Heart condition', 'PawsFirst'),
('Rocky', 'Dog', 'Golden Retriever', 'Special Needs', 1, 'Alabang', '9 years', 'Blind', 'CuddlyCare'),

-- Looking for Foster (10 pets)
('Bella', 'Cat', 'Calico', 'Looking for Foster', 1, 'Paranaque', '2 years', 'Healthy', 'CuddlyCare'),
('Bruno', 'Dog', 'Beagle', 'Looking for Foster', 1, 'Mandaluyong', '3 years', 'Healthy', 'PawsFirst'),
('Oscar', 'Cat', 'Domestic', 'Looking for Foster', 1, 'Quezon City', '1 year', 'Healthy', 'ShelterCare'),
('Sadie', 'Dog', 'Shih Tzu', 'Looking for Foster', 1, 'Makati', '2 years', 'Healthy', 'CuddlyCare'),
('Millie', 'Cat', 'Persian', 'Looking for Foster', 1, 'Pasig', '4 years', 'Healthy', 'PawsFirst'),
('Duke', 'Dog', 'Aspin', 'Looking for Foster', 0, 'Manila', '5 years', 'Healthy', 'ShelterCare'),
('Ruby', 'Cat', 'Siamese', 'Looking for Foster', 1, 'Alabang', '2 years', 'Healthy', 'CuddlyCare'),
('Cooper', 'Dog', 'Bulldog', 'Looking for Foster', 1, 'Cavite', '3 years', 'Healthy', 'PawsFirst'),
('Rosie', 'Cat', 'Domestic', 'Looking for Foster', 1, 'Paranaque', '1 year', 'Healthy', 'ShelterCare'),
('Jack', 'Dog', 'Poodle', 'Looking for Foster', 1, 'Taguig', '2 years', 'Healthy', 'CuddlyCare'),

-- Adopted (5 pets)
('Felix', 'Cat', 'Domestic', 'Adopted', 1, 'Quezon City', '1 year', 'Healthy', 'CuddlyCare'),
('Ginger', 'Dog', 'Aspin', 'Adopted', 1, 'Manila', '2 years', 'Healthy', 'PawsFirst'),
('Jasper', 'Cat', 'Siamese', 'Adopted', 1, 'Makati', '3 years', 'Healthy', 'ShelterCare'),
('Daisy', 'Dog', 'Shih Tzu', 'Adopted', 1, 'Pasay', '2 years', 'Healthy', 'CuddlyCare'),
('Luna', 'Cat', 'Ragdoll', 'Adopted', 1, 'Laguna', '1 year', 'Healthy', 'PawsFirst');
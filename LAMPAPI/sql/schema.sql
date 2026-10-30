-- Import from the project root: mysql -u root -p < LAMPAPI/sql/schema.sql
-- Set DB_NAME=COP4331 in the project-root .env file.
CREATE DATABASE IF NOT EXISTS `COP4331`;

CREATE TABLE `COP4331`.`Users` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
  `LastName` VARCHAR(50) NOT NULL DEFAULT '',
  `Login` VARCHAR(50) NOT NULL DEFAULT '',
  `Password` VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
);

CREATE TABLE `COP4331`.`Colors` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(50) NOT NULL DEFAULT '',
  `UserID` INT NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
);


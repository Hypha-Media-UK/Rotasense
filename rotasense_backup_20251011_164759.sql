-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: rotasense
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `buildings_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
INSERT INTO `buildings` VALUES (1,'Hartshead Building','2025-10-04 10:13:44.590','2025-10-04 10:13:44.590'),(2,'Ladysmith Building','2025-10-04 10:13:44.890','2025-10-04 10:13:44.890'),(3,'Macmillan Unit','2025-10-04 10:13:44.993','2025-10-04 10:13:44.993'),(4,'Charlesworth Building','2025-10-04 10:13:45.013','2025-10-04 10:13:45.013');
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_overrides`
--

DROP TABLE IF EXISTS `daily_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `staffId` int NOT NULL,
  `departmentId` int DEFAULT NULL,
  `serviceId` int DEFAULT NULL,
  `overrideType` enum('TEMPORARY_ALLOCATION','ABSENCE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endTime` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_overrides_staffId_fkey` (`staffId`),
  KEY `daily_overrides_departmentId_fkey` (`departmentId`),
  KEY `daily_overrides_serviceId_fkey` (`serviceId`),
  CONSTRAINT `daily_overrides_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `daily_overrides_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `daily_overrides_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_overrides`
--

LOCK TABLES `daily_overrides` WRITE;
/*!40000 ALTER TABLE `daily_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buildingId` int NOT NULL,
  `operationalDays` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minStaff` int NOT NULL DEFAULT '1',
  `displayOnHome` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `is24x7` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_buildingId_key` (`name`,`buildingId`),
  KEY `departments_buildingId_fkey` (`buildingId`),
  CONSTRAINT `departments_buildingId_fkey` FOREIGN KEY (`buildingId`) REFERENCES `buildings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'AMU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]','08:00','20:00',2,1,'2025-10-04 10:13:44.603','2025-10-11 15:39:25.146',0),(2,'IAU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.625','2025-10-11 15:37:14.095',0),(3,'SDEC',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.635','2025-10-11 15:37:14.095',0),(4,'ISGU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.644','2025-10-11 15:37:14.095',0),(5,'ITU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.652','2025-10-11 15:41:18.947',1),(6,'A+E',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]','08:00','20:00',2,1,'2025-10-04 10:13:44.662','2025-10-11 15:39:19.314',1),(7,'Discharge Lounge',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.671','2025-10-11 15:37:14.095',0),(8,'Green Suite',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.679','2025-10-11 15:37:14.095',0),(9,'Theatres North',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.688','2025-10-11 15:37:14.095',0),(10,'Theatres South',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.697','2025-10-11 15:37:14.095',0),(11,'G/F Xray',1,'[\"monday\",\"tuesday\",\"thursday\",\"friday\",\"wednesday\"]','08:00','20:00',2,1,'2025-10-04 10:13:44.706','2025-10-11 15:39:38.942',0),(12,'L/G/F Xray',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',1,1,'2025-10-04 10:13:44.718','2025-10-11 15:39:45.387',1),(13,'CT Scan',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',1,1,'2025-10-04 10:13:44.727','2025-10-11 15:39:32.614',1),(14,'MRI',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.737','2025-10-11 15:37:14.095',0),(15,'Blue Suite',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.746','2025-10-11 15:37:14.095',0),(16,'Yellow Suite',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.755','2025-10-11 15:37:14.095',0),(17,'Clinics A-F',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.764','2025-10-11 15:37:14.095',0),(18,'Swan Room',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.772','2025-10-11 15:37:14.095',0),(19,'South Reception',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.781','2025-10-11 15:37:14.095',0),(20,'Children\'s Outpatients',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.789','2025-10-11 15:37:14.095',0),(21,'Pharmacy',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.797','2025-10-11 15:37:14.095',0),(22,'Children\'s Ward',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.806','2025-10-11 15:37:14.095',0),(23,'Children\'s O+A',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.817','2025-10-11 15:37:14.095',0),(24,'DSEU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.826','2025-10-11 15:37:14.095',0),(25,'EOU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.835','2025-10-11 15:37:14.095',0),(26,'POU',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.843','2025-10-11 15:37:14.095',0),(27,'Pathology',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.852','2025-10-11 15:37:14.095',0),(28,'Mortuary',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.862','2025-10-11 15:37:14.095',0),(29,'Rose Cottage',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.872','2025-10-11 15:37:14.095',0),(30,'Walk in Center',1,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.881','2025-10-11 15:37:14.095',0),(31,'Ward 40',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.898','2025-10-11 15:37:14.095',0),(32,'Ward 41',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.907','2025-10-11 15:37:14.095',0),(33,'Ward 42',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.918','2025-10-11 15:37:14.095',0),(34,'Ward 43',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.927','2025-10-11 15:37:14.095',0),(35,'Ward 44',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.938','2025-10-11 15:37:14.095',0),(36,'Ward 45',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.953','2025-10-11 15:37:14.095',0),(37,'Ward 46',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.967','2025-10-11 15:37:14.095',0),(38,'Xray 4',2,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:44.982','2025-10-11 15:37:14.095',0),(39,'Macmillan',3,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.005','2025-10-11 15:37:14.095',0),(40,'Ward 31',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.022','2025-10-11 15:37:14.095',0),(41,'Ward 30',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.031','2025-10-11 15:37:14.095',0),(42,'Ward 27',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.040','2025-10-11 15:37:14.095',0),(43,'NICU',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.049','2025-10-11 15:37:14.095',0),(44,'Acorn Birth Center',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.058','2025-10-11 15:37:14.095',0),(45,'Labour Ward',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.069','2025-10-11 15:37:14.095',0),(46,'Women\'s Health',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.078','2025-10-11 15:37:14.095',0),(47,'Maternity Triage',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.087','2025-10-11 15:37:14.095',0),(48,'Labour Theatre One',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.096','2025-10-11 15:37:14.095',0),(49,'Labour Theatre Two',4,'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,0,'2025-10-04 10:13:45.104','2025-10-11 15:37:14.095',0);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operationalDays` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minStaff` int NOT NULL DEFAULT '1',
  `displayOnHome` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `is24x7` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `services_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (2,'Patient Transport','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,1,'2025-10-04 10:13:45.938','2025-10-11 15:40:32.320',1),(4,'Laundry','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,1,'2025-10-11 13:57:17.704','2025-10-11 15:40:24.918',0),(5,'Blood Drivers','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',4,1,'2025-10-11 13:59:38.080','2025-10-11 15:40:16.334',0),(6,'Medical Records','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',3,1,'2025-10-11 14:00:28.157','2025-10-11 15:40:28.757',0),(7,'Post','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,1,'2025-10-11 14:01:00.062','2025-10-11 15:40:36.326',0),(8,'Ad-Hoc','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','08:00','20:00',2,1,'2025-10-11 14:05:05.918','2025-10-11 15:40:12.235',0),(9,'External Waste','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]','08:00','20:00',1,1,'2025-10-11 14:06:19.847','2025-10-11 15:40:20.801',0);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timeFormat` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '24',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `zeroStartDates` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'24','2025-10-04 10:13:44.499','2025-10-11 13:28:53.291','[{\"id\":\"1760189330891\",\"name\":\"Shift One\",\"date\":\"2025-09-01\"}]');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('REGULAR','RELIEF','SUPERVISOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REGULAR',
  `defaultStartTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '08:00',
  `defaultEndTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '20:00',
  `contractedDays` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `daysOff` int DEFAULT NULL,
  `daysOn` int DEFAULT NULL,
  `scheduleType` enum('DAILY','SHIFT_CYCLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DAILY',
  `shiftOffset` int DEFAULT NULL,
  `zeroStartDateId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'AJ','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.113','2025-10-11 15:27:52.137',4,4,'SHIFT_CYCLE',0,'1760189330891'),(2,'Alan Clark','REGULAR','13:00','01:00','[]','2025-10-04 10:13:45.123','2025-10-11 15:28:50.960',4,4,'SHIFT_CYCLE',4,'1760189330891'),(3,'Alan Kelly','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.133','2025-10-11 15:42:05.278',4,4,'SHIFT_CYCLE',0,'1760189330891'),(4,'Allen Butler','REGULAR','14:00','22:00','[]','2025-10-04 10:13:45.143','2025-10-11 15:28:16.715',4,4,'SHIFT_CYCLE',0,'1760189330891'),(5,'Andrew Gibson','REGULAR','09:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.151','2025-10-11 15:29:13.802',NULL,NULL,'DAILY',NULL,NULL),(6,'Andrew Hassall','REGULAR','13:00','01:00','[]','2025-10-04 10:13:45.160','2025-10-11 15:29:04.888',4,4,'SHIFT_CYCLE',4,'1760189330891'),(7,'Andrew Trudgeon','REGULAR','10:00','22:00','[]','2025-10-04 10:13:45.168','2025-10-11 13:53:38.398',4,4,'SHIFT_CYCLE',0,'1760189330891'),(8,'Andy Clayton','REGULAR','07:00','15:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.177','2025-10-11 14:16:03.521',NULL,NULL,'DAILY',NULL,NULL),(9,'Brian Cassidy','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.186','2025-10-11 14:03:17.453',4,4,'SHIFT_CYCLE',0,'1760189330891'),(10,'Carla Barton','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.194','2025-10-11 14:07:10.749',4,4,'SHIFT_CYCLE',0,'1760189330891'),(11,'Charlotte Rimmer','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.203','2025-10-11 14:07:28.265',4,4,'SHIFT_CYCLE',0,'1760189330891'),(12,'Chris Huckaby','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.211','2025-10-11 14:16:20.819',NULL,NULL,'DAILY',NULL,NULL),(13,'Chris Roach','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.221','2025-10-11 14:07:50.889',4,4,'SHIFT_CYCLE',0,'1760189330891'),(14,'Chris Wardle','REGULAR','08:00','16:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.229','2025-10-11 14:15:42.229',NULL,NULL,'DAILY',NULL,NULL),(15,'Colin Bromley','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.238','2025-10-11 14:17:11.589',4,4,'SHIFT_CYCLE',0,'1760189330891'),(16,'Craig Butler','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.247','2025-10-04 10:13:45.247',NULL,NULL,'DAILY',NULL,NULL),(17,'Darren Flowers','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.256','2025-10-11 14:09:53.460',4,4,'SHIFT_CYCLE',0,'1760189330891'),(18,'Darren Milhench','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.265','2025-10-11 14:38:49.402',4,4,'SHIFT_CYCLE',0,'1760189330891'),(19,'Darren Mycroft','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.274','2025-10-11 14:10:26.152',4,4,'SHIFT_CYCLE',0,'1760189330891'),(20,'David Sykes','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.282','2025-10-11 14:10:38.299',4,4,'SHIFT_CYCLE',0,'1760189330891'),(21,'Dean Pickering','REGULAR','08:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.290','2025-10-11 14:10:49.895',NULL,NULL,'DAILY',NULL,NULL),(22,'Duane Kulikowski','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.299','2025-10-11 14:17:43.834',NULL,NULL,'DAILY',NULL,NULL),(23,'Edward Collier','REGULAR','10:00','18:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.309','2025-10-11 14:15:14.969',NULL,NULL,'DAILY',NULL,NULL),(24,'Eloisa Andrew','REGULAR','08:00','16:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.318','2025-10-11 14:15:26.369',NULL,NULL,'DAILY',NULL,NULL),(25,'Gary Booth','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.326','2025-10-11 14:16:50.195',4,4,'SHIFT_CYCLE',0,'1760189330891'),(26,'Gary Bromley','REGULAR','08:00','16:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.335','2025-10-11 14:15:00.738',NULL,NULL,'DAILY',NULL,NULL),(27,'Gavin Marsden','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.344','2025-10-11 14:37:31.225',4,4,'SHIFT_CYCLE',4,'1760189330891'),(28,'Ian Moss','REGULAR','13:00','01:00','[]','2025-10-04 10:13:45.352','2025-10-11 14:17:53.879',4,4,'SHIFT_CYCLE',0,'1760189330891'),(29,'Ian Speakes','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.361','2025-10-04 10:13:45.361',NULL,NULL,'DAILY',NULL,NULL),(30,'Jake Moran','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.369','2025-10-04 10:13:45.369',NULL,NULL,'DAILY',NULL,NULL),(31,'James Bennett','REGULAR','06:00','14:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.379','2025-10-11 14:13:56.629',NULL,NULL,'DAILY',NULL,NULL),(32,'James Mitchell','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.387','2025-10-11 14:14:12.732',4,4,'SHIFT_CYCLE',0,'1760189330891'),(33,'Jason Newton','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.395','2025-10-11 14:14:49.051',NULL,NULL,'DAILY',NULL,NULL),(34,'Jeff Robinson','REGULAR','11:00','18:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.404','2025-10-11 14:18:25.687',NULL,NULL,'DAILY',NULL,NULL),(35,'Joe Redfearn','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.412','2025-10-11 14:18:42.285',4,4,'SHIFT_CYCLE',0,'1760189330891'),(36,'John Evans','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.422','2025-10-11 14:18:50.270',4,4,'SHIFT_CYCLE',0,'1760189330891'),(37,'Jordon Fish','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.431','2025-10-11 14:18:56.044',4,4,'SHIFT_CYCLE',0,'1760189330891'),(38,'Julie Greenough','REGULAR','08:30','16:30','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.440','2025-10-11 14:19:26.888',NULL,NULL,'DAILY',NULL,NULL),(39,'Karen Blackett','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.449','2025-10-11 14:19:40.386',4,4,'SHIFT_CYCLE',0,'1760189330891'),(40,'Kevin Gaskell','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.457','2025-10-11 14:19:50.970',4,4,'SHIFT_CYCLE',0,'1760189330891'),(41,'Kevin Tomlinson','REGULAR','12:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.466','2025-10-11 14:20:28.823',NULL,NULL,'DAILY',NULL,NULL),(42,'Kyle Blackshaw','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.476','2025-10-04 10:13:45.476',NULL,NULL,'DAILY',NULL,NULL),(43,'Kyle Sanderson','REGULAR','08:00','16:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.485','2025-10-11 14:20:53.412',NULL,NULL,'DAILY',NULL,NULL),(44,'Lee Stafford','REGULAR','09:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.493','2025-10-11 14:21:42.041',NULL,NULL,'DAILY',NULL,NULL),(45,'Lewis Yearsley','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.502','2025-10-11 14:22:04.317',4,4,'SHIFT_CYCLE',0,'1760189330891'),(46,'Lucy Redfearn','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.511','2025-10-11 14:22:18.730',4,4,'SHIFT_CYCLE',0,'1760189330891'),(47,'Lynne Warner','REGULAR','12:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.519','2025-10-11 14:22:37.020',NULL,NULL,'DAILY',NULL,NULL),(48,'Mark Dickinson','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.529','2025-10-04 10:13:45.529',NULL,NULL,'DAILY',NULL,NULL),(49,'Mark Haughton','REGULAR','07:00','15:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.561','2025-10-11 15:43:35.763',NULL,NULL,'DAILY',NULL,NULL),(50,'Mark Lloyd','REGULAR','08:00','16:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.571','2025-10-11 14:23:36.625',NULL,NULL,'DAILY',NULL,NULL),(51,'Mark Walton','REGULAR','06:00','14:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.581','2025-10-11 14:23:56.513',NULL,NULL,'DAILY',NULL,NULL),(52,'Martin Hobson','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.590','2025-10-11 14:51:37.144',4,4,'SHIFT_CYCLE',0,'1760189330891'),(53,'Martin Kenyon','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.597','2025-10-11 14:24:47.502',4,4,'SHIFT_CYCLE',0,'1760189330891'),(54,'Matthew Bennett','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.605','2025-10-11 14:25:07.364',4,4,'SHIFT_CYCLE',0,'1760189330891'),(55,'Matthew Cope','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.614','2025-10-11 14:25:13.504',4,4,'SHIFT_CYCLE',0,'1760189330891'),(56,'Matthew Rushton','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.623','2025-10-11 14:25:20.416',4,4,'SHIFT_CYCLE',0,'1760189330891'),(57,'Merv Permalloo','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.633','2025-10-11 14:25:25.321',4,4,'SHIFT_CYCLE',0,'1760189330891'),(58,'Michael Shaw','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.644','2025-10-11 14:25:30.239',4,4,'SHIFT_CYCLE',0,'1760189330891'),(59,'Mike Brennan','REGULAR','07:00','15:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.654','2025-10-11 14:25:55.967',NULL,NULL,'DAILY',NULL,NULL),(60,'Nicola Benger','REGULAR','13:00','01:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.662','2025-10-11 14:26:19.784',NULL,NULL,'DAILY',NULL,NULL),(61,'Nigel Beesley','REGULAR','08:30','16:30','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.672','2025-10-11 14:26:52.610',NULL,NULL,'DAILY',NULL,NULL),(62,'Paul Berry','REGULAR','09:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.681','2025-10-11 14:27:16.167',NULL,NULL,'DAILY',NULL,NULL),(63,'Paul Fisher','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.692','2025-10-11 14:37:44.548',4,4,'SHIFT_CYCLE',4,'1760189330891'),(64,'Paul Flowers','REGULAR','07:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.701','2025-10-11 14:27:49.959',NULL,NULL,'DAILY',NULL,NULL),(65,'Peter Moss','REGULAR','08:00','16:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.712','2025-10-11 14:28:13.772',NULL,NULL,'DAILY',NULL,NULL),(66,'Phil Hollinshead','REGULAR','09:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.724','2025-10-11 14:28:43.906',NULL,NULL,'DAILY',NULL,NULL),(67,'Regan Stringer','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.733','2025-10-11 14:28:51.944',4,4,'SHIFT_CYCLE',0,'1760189330891'),(68,'Rob Mcpartland','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.743','2025-10-11 14:29:02.298',4,4,'SHIFT_CYCLE',0,'1760189330891'),(69,'Robert Frost','REGULAR','09:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.752','2025-10-11 14:29:26.931',NULL,NULL,'DAILY',NULL,NULL),(70,'Roy Harris','REGULAR','12:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.761','2025-10-11 14:29:41.412',NULL,NULL,'DAILY',NULL,NULL),(71,'Scott Cartledge','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.806','2025-10-11 14:29:53.414',4,4,'SHIFT_CYCLE',0,'1760189330891'),(72,'Simon Collins','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.822','2025-10-04 10:13:45.822',NULL,NULL,'DAILY',NULL,NULL),(73,'Soloman Offei','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.830','2025-10-04 10:13:45.830',NULL,NULL,'DAILY',NULL,NULL),(74,'Stepen Bowater','REGULAR','13:00','01:00','[]','2025-10-04 10:13:45.837','2025-10-11 14:30:27.464',4,4,'SHIFT_CYCLE',0,'1760189330891'),(75,'Stephen Burke','REGULAR','09:00','17:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.847','2025-10-11 14:30:55.828',NULL,NULL,'DAILY',NULL,NULL),(76,'Stephen Cooper','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.856','2025-10-11 14:31:14.857',4,4,'SHIFT_CYCLE',0,'1760189330891'),(77,'Stephen Kirk','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.864','2025-10-11 14:31:28.285',4,4,'SHIFT_CYCLE',0,'1760189330891'),(78,'Stephen Scarsbrook','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.873','2025-10-11 14:31:33.598',4,4,'SHIFT_CYCLE',0,'1760189330891'),(79,'Steven Richardson','REGULAR','08:00','20:00','[]','2025-10-04 10:13:45.882','2025-10-11 14:31:40.600',4,4,'SHIFT_CYCLE',0,'1760189330891'),(80,'Stuart Ford','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.892','2025-10-11 14:32:06.907',NULL,NULL,'DAILY',NULL,NULL),(81,'Stuart Lomas','REGULAR','08:00','20:00','[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]','2025-10-04 10:13:45.901','2025-10-04 10:13:45.901',NULL,NULL,'DAILY',NULL,NULL),(82,'Tomas Konkol','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.909','2025-10-11 14:32:25.128',4,4,'SHIFT_CYCLE',0,'1760189330891'),(83,'Tony Batters','REGULAR','20:00','08:00','[]','2025-10-04 10:13:45.918','2025-10-11 14:32:37.945',4,4,'SHIFT_CYCLE',0,'1760189330891');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_allocations`
--

DROP TABLE IF EXISTS `staff_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staffId` int NOT NULL,
  `departmentId` int DEFAULT NULL,
  `serviceId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `staff_allocations_staffId_fkey` (`staffId`),
  KEY `staff_allocations_departmentId_fkey` (`departmentId`),
  KEY `staff_allocations_serviceId_fkey` (`serviceId`),
  CONSTRAINT `staff_allocations_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `staff_allocations_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `staff_allocations_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_allocations`
--

LOCK TABLES `staff_allocations` WRITE;
/*!40000 ALTER TABLE `staff_allocations` DISABLE KEYS */;
INSERT INTO `staff_allocations` VALUES (44,2,NULL,2,'2025-10-11 13:51:44.429','2025-10-11 13:51:44.429'),(45,6,NULL,2,'2025-10-11 13:52:12.854','2025-10-11 13:52:12.854'),(46,5,NULL,5,'2025-10-11 14:01:31.317','2025-10-11 14:01:31.317'),(47,33,NULL,8,'2025-10-11 14:14:47.699','2025-10-11 14:14:47.699'),(48,26,NULL,7,'2025-10-11 14:14:59.065','2025-10-11 14:14:59.065'),(49,23,13,NULL,'2025-10-11 14:15:11.559','2025-10-11 14:15:11.559'),(50,24,NULL,7,'2025-10-11 14:15:25.129','2025-10-11 14:15:25.129'),(51,14,NULL,6,'2025-10-11 14:15:41.112','2025-10-11 14:15:41.112'),(52,8,NULL,4,'2025-10-11 14:16:01.560','2025-10-11 14:16:01.560'),(53,12,NULL,8,'2025-10-11 14:16:19.146','2025-10-11 14:16:19.146'),(54,25,NULL,2,'2025-10-11 14:16:48.442','2025-10-11 14:16:48.442'),(55,15,NULL,2,'2025-10-11 14:17:10.410','2025-10-11 14:17:10.410'),(56,22,12,NULL,'2025-10-11 14:17:42.595','2025-10-11 14:17:42.595'),(57,28,NULL,2,'2025-10-11 14:17:52.813','2025-10-11 14:17:52.813'),(58,38,13,NULL,'2025-10-11 14:19:13.384','2025-10-11 14:19:13.384'),(59,43,NULL,6,'2025-10-11 14:20:51.997','2025-10-11 14:20:51.997'),(60,44,6,NULL,'2025-10-11 14:21:40.735','2025-10-11 14:21:40.735'),(61,50,11,NULL,'2025-10-11 14:23:35.694','2025-10-11 14:23:35.694'),(62,52,6,NULL,'2025-10-11 14:24:18.649','2025-10-11 14:24:18.649'),(63,53,12,NULL,'2025-10-11 14:24:46.473','2025-10-11 14:24:46.473'),(64,60,6,NULL,'2025-10-11 14:26:18.566','2025-10-11 14:26:18.566'),(65,61,NULL,5,'2025-10-11 14:26:51.488','2025-10-11 14:26:51.488'),(66,62,NULL,5,'2025-10-11 14:27:15.278','2025-10-11 14:27:15.278'),(67,63,NULL,2,'2025-10-11 14:27:31.070','2025-10-11 14:27:31.070'),(68,64,NULL,4,'2025-10-11 14:27:49.119','2025-10-11 14:27:49.119'),(69,65,NULL,6,'2025-10-11 14:28:12.785','2025-10-11 14:28:12.785'),(70,66,12,NULL,'2025-10-11 14:28:42.997','2025-10-11 14:28:42.997'),(71,69,NULL,5,'2025-10-11 14:29:25.883','2025-10-11 14:29:25.883'),(72,74,NULL,2,'2025-10-11 14:30:26.497','2025-10-11 14:30:26.497'),(73,80,6,NULL,'2025-10-11 14:32:05.642','2025-10-11 14:32:05.642'),(74,27,NULL,2,'2025-10-11 14:33:05.878','2025-10-11 14:33:05.878'),(82,49,NULL,9,'2025-10-11 15:43:34.527','2025-10-11 15:43:34.527');
/*!40000 ALTER TABLE `staff_allocations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-11 15:48:00

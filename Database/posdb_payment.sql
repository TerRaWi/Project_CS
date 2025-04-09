-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: posdb
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินรวม',
  `payment_method` varchar(20) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่และเวลาชำระเงิน',
  `status` char(1) NOT NULL DEFAULT 'S' COMMENT 'สถานะ: S=Success, F=Failed, P=Pending',
  `reference` varchar(50) DEFAULT NULL COMMENT 'เลขอ้างอิงการชำระเงิน (ถ้ามี)',
  `order_id` int NOT NULL COMMENT 'รหัสออเดอร์',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payment_order_idx` (`order_id`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES (92,206.00,'ชำระแล้ว','2025-03-23 19:40:59','S',NULL,200,'2025-03-23 19:40:59','2025-03-23 19:40:59'),(93,479.00,'ชำระแล้ว','2025-03-23 19:51:56','S',NULL,201,'2025-03-23 19:51:56','2025-03-23 19:51:56'),(94,89.00,'ชำระแล้ว','2025-03-23 19:54:19','S',NULL,202,'2025-03-23 19:54:19','2025-03-23 19:54:19'),(95,89.00,'ชำระแล้ว','2025-03-23 20:00:36','S',NULL,203,'2025-03-23 20:00:36','2025-03-23 20:00:36'),(96,89.00,'ชำระแล้ว','2025-03-23 20:07:08','S',NULL,204,'2025-03-23 20:07:08','2025-03-23 20:07:08'),(97,89.00,'ชำระแล้ว','2025-03-23 20:05:37','S',NULL,205,'2025-03-23 20:05:37','2025-03-23 20:05:37'),(98,89.00,'ชำระแล้ว','2025-03-23 20:15:14','S',NULL,207,'2025-03-23 20:15:14','2025-03-23 20:15:14');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-10  0:30:22

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
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'ชื่อสินค้า',
  `price` decimal(10,2) NOT NULL COMMENT 'ราคาสินค้า',
  `status` char(1) NOT NULL DEFAULT 'A' COMMENT 'สถานะ: A=Active, I=Inactive',
  `image_url` varchar(255) DEFAULT NULL COMMENT 'URL รูปภาพสินค้า',
  `category_id` int NOT NULL COMMENT 'รหัสหมวดหมู่',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_product_category_idx` (`category_id`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตารางเก็บข้อมูลสินค้า';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (8,'ตับหมู',0.00,'A','/uploads/1739701886171.png',6,'2025-02-16 10:31:26','2025-03-14 13:11:28'),(9,'เบคอนสไลด์',0.00,'A','/uploads/1739701908711.png',6,'2025-02-16 10:31:48','2025-03-14 10:41:23'),(10,'สันคอสไลด์',0.00,'A','/uploads/1739702558413.png',6,'2025-02-16 10:42:38','2025-02-16 10:42:38'),(11,'หมูเด้ง',0.00,'A','/uploads/1739702573315.png',6,'2025-02-16 10:42:53','2025-03-14 18:02:14'),(12,'หมูเด้งหอชีส',39.00,'A','/uploads/1739702595764.png',6,'2025-02-16 10:43:15','2025-03-14 12:11:39'),(13,'หมูหมักนุ่ม',0.00,'A','/uploads/1739702611303.png',6,'2025-02-16 10:43:31','2025-03-14 18:06:24'),(15,'เด็กโต',129.00,'A','/uploads/1741700952094.png',7,'2025-02-16 10:49:16','2025-03-14 13:02:08'),(16,'เด็กเล็ก',89.00,'A','/uploads/1741700943000.png',7,'2025-02-16 10:49:28','2025-03-14 13:11:54'),(17,'ผู้ใหญ่',199.00,'A','/uploads/1741700957466.png',7,'2025-02-22 03:58:58','2025-03-14 10:47:55');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-15  2:05:04

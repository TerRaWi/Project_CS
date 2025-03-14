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
-- Table structure for table `order_detail`
--

DROP TABLE IF EXISTS `order_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int NOT NULL COMMENT 'จำนวนที่สั่ง',
  `unit_price` decimal(10,2) NOT NULL COMMENT 'ราคาต่อหน่วย',
  `status` char(1) NOT NULL DEFAULT 'P' COMMENT 'สถานะ: P=Processing, C=Completed, V=Void',
  `order_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สั่งอาหารแต่ละรายการ',
  `order_id` int NOT NULL COMMENT 'รหัสออเดอร์',
  `product_id` int NOT NULL COMMENT 'รหัสสินค้า',
  `cancel_reason_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_detail_order_idx` (`order_id`),
  KEY `fk_detail_product_idx` (`product_id`),
  KEY `fk_detail_cancel_reason_idx` (`cancel_reason_id`),
  CONSTRAINT `fk_detail_cancel_reason` FOREIGN KEY (`cancel_reason_id`) REFERENCES `cancel_reason` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=650 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตารางเก็บรายละเอียดการสั่งอาหาร';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_detail`
--

LOCK TABLES `order_detail` WRITE;
/*!40000 ALTER TABLE `order_detail` DISABLE KEYS */;
INSERT INTO `order_detail` VALUES (643,2,199.00,'C','2025-03-14 18:58:14',195,17,NULL,'2025-03-14 18:58:14','2025-03-14 18:58:14'),(644,1,0.00,'C','2025-03-14 18:58:29',195,13,NULL,'2025-03-14 18:58:29','2025-03-14 18:59:43'),(645,1,0.00,'C','2025-03-14 18:58:29',195,9,NULL,'2025-03-14 18:58:29','2025-03-14 18:59:43'),(646,1,0.00,'C','2025-03-14 18:58:29',195,10,NULL,'2025-03-14 18:58:29','2025-03-14 18:59:43'),(647,3,199.00,'C','2025-03-14 18:58:45',196,17,NULL,'2025-03-14 18:58:45','2025-03-14 18:58:45'),(648,2,0.00,'C','2025-03-14 18:59:09',195,13,NULL,'2025-03-14 18:59:09','2025-03-14 18:59:22'),(649,2,0.00,'C','2025-03-14 18:59:09',195,10,NULL,'2025-03-14 18:59:09','2025-03-14 18:59:27');
/*!40000 ALTER TABLE `order_detail` ENABLE KEYS */;
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

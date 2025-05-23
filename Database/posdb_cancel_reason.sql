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
-- Table structure for table `cancel_reason`
--

DROP TABLE IF EXISTS `cancel_reason`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancel_reason` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'ชื่อเหตุผลในการยกเลิก',
  `description` varchar(255) DEFAULT NULL COMMENT 'คำอธิบายเพิ่มเติม',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตารางเก็บเหตุผลในการยกเลิกรายการอาหาร';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cancel_reason`
--

LOCK TABLES `cancel_reason` WRITE;
/*!40000 ALTER TABLE `cancel_reason` DISABLE KEYS */;
INSERT INTO `cancel_reason` VALUES (1,'สินค้าหมด','วัตถุดิบหรือสินค้าหมด ไม่สามารถทำได้','2025-03-08 20:08:06','2025-03-08 20:08:06'),(2,'ลูกค้ายกเลิก','ลูกค้าแจ้งยกเลิกรายการหลังจากสั่งไปแล้ว','2025-03-08 20:08:06','2025-03-08 20:08:06'),(3,'สั่งผิด','พนักงานหรือลูกค้าสั่งผิดรายการ','2025-03-08 20:08:06','2025-03-08 20:08:06'),(4,'อื่นๆ','เหตุผลอื่นๆ ที่ไม่ได้ระบุไว้','2025-03-08 20:08:06','2025-03-08 20:08:06');
/*!40000 ALTER TABLE `cancel_reason` ENABLE KEYS */;
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

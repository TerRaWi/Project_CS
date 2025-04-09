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
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตารางเก็บข้อมูลสินค้า';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (8,'ตับหมู',0.00,'A','/uploads/1739701886171.png',6,'2025-02-16 10:31:26','2025-03-14 13:11:28'),(9,'เบคอนสไลด์',0.00,'A','/uploads/1739701908711.png',6,'2025-02-16 10:31:48','2025-03-14 10:41:23'),(10,'สันคอสไลด์',0.00,'A','/uploads/1739702558413.png',6,'2025-02-16 10:42:38','2025-04-09 17:23:23'),(11,'หมูเด้ง',0.00,'A','/uploads/1739702573315.png',6,'2025-02-16 10:42:53','2025-03-14 18:02:14'),(12,'หมูเด้งหอชีส',39.00,'A','/uploads/1739702595764.png',6,'2025-02-16 10:43:15','2025-03-14 12:11:39'),(13,'หมูหมักนุ่ม',0.00,'A','/uploads/1739702611303.png',6,'2025-02-16 10:43:31','2025-03-14 18:06:24'),(15,'เด็กโต',129.00,'A','/uploads/1741700952094.png',7,'2025-02-16 10:49:16','2025-03-14 13:02:08'),(16,'เด็กเล็ก',89.00,'A','/uploads/1741700943000.png',7,'2025-02-16 10:49:28','2025-03-14 13:11:54'),(17,'ผู้ใหญ่',199.00,'A','/uploads/1741700957466.png',7,'2025-02-22 03:58:58','2025-03-20 20:17:06'),(19,'เนื้อวัวสไลด์',0.00,'A','/uploads/1744219189451.png',13,'2025-03-20 20:20:27','2025-04-09 17:19:49'),(20,'เนื้อวัวหมักนุ่ม',0.00,'A','/uploads/1744219247440.png',13,'2025-03-20 20:20:45','2025-04-09 17:20:47'),(21,'สไบนาง',0.00,'A','/uploads/1744219251775.png',13,'2025-03-20 20:20:58','2025-04-09 17:20:51'),(22,'ไก่ห่อสาหร่าย',0.00,'A','/uploads/1744219255771.png',14,'2025-03-20 20:21:28','2025-04-09 17:20:55'),(23,'เกี๊ยวกุ้ง',39.00,'A','/uploads/1744219259836.png',15,'2025-03-20 20:21:44','2025-04-09 17:20:59'),(24,'กุ้งขาว',0.00,'A','/uploads/1744219263422.png',15,'2025-03-20 20:22:01','2025-04-09 17:21:03'),(25,'กุ้งดองซอสเกาหลี',69.00,'A','/uploads/1744219419596.png',15,'2025-03-20 20:22:23','2025-04-09 17:23:39'),(26,'ท้องปลาแซลม่อน',0.00,'A','/uploads/1744219424872.png',15,'2025-03-20 20:22:48','2025-04-09 17:23:44'),(27,'แมงกะพรุน',0.00,'A','/uploads/1744219430241.png',15,'2025-03-20 20:23:08','2025-04-09 17:23:50'),(28,'ปูอัด',0.00,'A','/uploads/1744219435755.png',15,'2025-03-20 20:23:32','2025-04-09 17:23:55'),(29,'ลูกชิ้นปลา',0.00,'A','/uploads/1744219445122.png',15,'2025-03-20 20:23:58','2025-04-09 17:24:05'),(30,'ข้าโพดหวาน',0.00,'A','/uploads/1744219452480.png',17,'2025-03-20 20:24:12','2025-04-09 17:24:12'),(31,'ข้าวโพดอ่อน',0.00,'A','/uploads/1744219456883.png',17,'2025-03-20 20:24:25','2025-04-09 17:24:16'),(32,'เต้าหู้ไข่',0.00,'A','/uploads/1744219461127.png',19,'2025-03-20 20:25:01','2025-04-09 17:24:21'),(33,'ผักบุ้ง',0.00,'A','/uploads/1744219496852.png',17,'2025-03-20 20:25:17','2025-04-09 17:24:56'),(34,'ฟองเต้าหู้',39.00,'A','/uploads/1744219502260.png',19,'2025-03-20 20:25:35','2025-04-09 17:25:02'),(35,'เห็ดชิเมจิ',0.00,'A','/uploads/1744219507629.png',17,'2025-03-20 20:26:22','2025-04-09 17:25:07'),(36,'เต้าหู้ชีส',39.00,'A','/uploads/1744219511274.png',16,'2025-03-20 20:26:55','2025-04-09 17:25:11'),(37,'เต้าหู้ปลา',0.00,'A','/uploads/1744219515677.png',16,'2025-03-20 20:27:08','2025-04-09 17:25:15'),(38,'สาหร่ายวากาเมะ',0.00,'A','/uploads/1744219520720.png',17,'2025-03-20 20:27:29','2025-04-09 17:25:20'),(39,'เห็ดเข็มทอง',0.00,'A','/uploads/1744219525001.png',17,'2025-03-20 20:27:44','2025-04-09 17:25:25'),(40,'ไข่ไก่',10.00,'A','/uploads/1744219530220.png',19,'2025-03-20 20:28:01','2025-04-09 17:25:30'),(41,'วุ้นเส้น',0.00,'A','/uploads/1744219535486.png',19,'2025-03-20 20:28:15','2025-04-09 17:25:35'),(42,'น้ำเปล่าใหญ่',30.00,'A','/uploads/1744219540219.png',18,'2025-03-20 20:28:47','2025-04-09 17:25:40'),(43,'น้ำอัดลมใหญ่',40.00,'A','/uploads/1744219544058.png',18,'2025-03-20 20:29:01','2025-04-09 17:25:44'),(44,'น้ำแข็ง',20.00,'A','/uploads/1744219548813.png',18,'2025-03-20 20:29:31','2025-04-09 17:25:48');
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

-- Dump completed on 2025-04-10  0:30:22

-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: posdb
-- ------------------------------------------------------
-- Server version	8.0.39

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
  `name` varchar(45) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` char(1) DEFAULT NULL,
  `category_id` int NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`,`category_id`),
  KEY `fk_product_category1_idx` (`category_id`),
  CONSTRAINT `fk_product_category1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'ตับหมู',0.00,NULL,1,'/uploads/1736829439645.png'),(2,'เบคอนสไลด์',0.00,NULL,1,'/uploads/1736681628385.png'),(3,'สันคอสไลด์',0.00,NULL,1,'/uploads/1736681631857.png'),(4,'หมูเด้ง',0.00,NULL,1,'/uploads/1736681635668.png'),(5,'หมูเด้งห่อชีส',39.00,NULL,1,'/uploads/1736681640011.png'),(6,'หมูหมักนุ่ม',0.00,NULL,1,'/uploads/1736681648119.png'),(7,'เนื้อวัวสไลด์',0.00,NULL,2,'/uploads/1736681653061.png'),(8,'เนื้อวัวหมักนุ่ม',0.00,NULL,2,'/uploads/1736681657366.png'),(9,'สไบนาง',0.00,NULL,2,'/uploads/1736681660899.png'),(10,'ไก่ห่อสาหร่าย',0.00,NULL,3,'/uploads/1736681663823.png'),(13,'เกี๊ยวกุ้ง',39.00,NULL,4,'/uploads/1736681669817.png'),(14,'กุ้งขาว',0.00,NULL,4,'/uploads/1736681673927.png'),(15,'กุ้งดองซอสเกาหลี',69.00,NULL,4,'/uploads/1736681677683.png'),(16,'ท้องปลาแซลม่อน',0.00,NULL,4,'/uploads/1736681681585.png'),(18,'แมงกะพรุน',0.00,NULL,4,'/uploads/1736681686115.png'),(19,'หมึกกรอบ',0.00,NULL,4,'/uploads/1736681690532.png'),(24,'เต้าหู้ชีส',39.00,NULL,5,'/uploads/1736681697823.png'),(25,'เต้าหู้ปลา',0.00,NULL,5,'/uploads/1736681718036.png'),(26,'ปูอัด',0.00,NULL,5,'/uploads/1736681723285.png'),(27,'ลูกชิ้นปลา',0.00,NULL,5,'/uploads/1736681729578.png'),(30,'ข้าวโพดหวาน',0.00,NULL,6,'/uploads/1736681734993.png'),(31,'ข้าวโพดอ่อน',0.00,NULL,6,'/uploads/1736681738908.png'),(33,'เต้าหู้ไข่',0.00,NULL,6,'/uploads/1736681747550.png'),(36,'ผักบุ้ง',0.00,NULL,6,'/uploads/1736681751433.png'),(37,'ฟองเต้าหู้',39.00,NULL,6,'/uploads/1736681756091.png'),(38,'สาหร่ายวากาเมะ',0.00,NULL,6,'/uploads/1736681760855.png'),(40,'เห็ดเข็มทอง',0.00,NULL,6,'/uploads/1736681764941.png'),(41,'เห็ดชิเมจิ',0.00,NULL,6,'/uploads/1736681771393.png'),(42,'น้ำแข็ง',20.00,NULL,7,'/uploads/1736593973202.png'),(43,'น้ำเปล่าใหญ่',30.00,NULL,7,'/uploads/1736678250490.png'),(44,'น้ำอัดลมใหญ่',40.00,NULL,7,'/uploads/1736594004809.png'),(45,'ไข่ไก่',10.00,NULL,8,'/uploads/1736681777422.png'),(49,'วุ้นเส้น',0.00,NULL,8,'/uploads/1736681782177.png');
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

-- Dump completed on 2025-01-21  3:15:34

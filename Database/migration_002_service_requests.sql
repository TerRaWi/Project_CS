-- Migration 002: ลูกค้ากดเรียกพนักงานจากหน้า QR + หน้าแจ้งเตือนของพนักงาน
-- รันครั้งเดียวกับฐานข้อมูลเดิม (หลัง migration_001_customer_qr.sql)
--   mysql -u root -p posdb < Database/migration_002_service_requests.sql
-- ถ้าสร้างฐานข้อมูลใหม่จาก posdb-schema.sql ไม่ต้องรันไฟล์นี้ (มีตารางแล้ว)

CREATE TABLE IF NOT EXISTS `posdb`.`service_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `table_id` INT NOT NULL COMMENT 'รหัสโต๊ะ',
  `order_id` INT NOT NULL COMMENT 'รหัสออเดอร์',
  `service_type` VARCHAR(100) NOT NULL COMMENT 'ประเภทคำขอ เช่น เรียกพนักงาน, เรียกชำระเงิน',
  `note` TEXT NULL DEFAULT NULL COMMENT 'ข้อความเพิ่มเติม',
  `status` ENUM('pending', 'in-progress', 'completed', 'canceled') NOT NULL DEFAULT 'pending' COMMENT 'pending=รอรับเรื่อง, in-progress=รับเรื่องแล้ว, completed=เสร็จแล้ว, canceled=ยกเลิก',
  `request_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่ลูกค้าส่งคำขอ',
  `complete_time` TIMESTAMP NULL DEFAULT NULL COMMENT 'เวลาที่ปิดคำขอ',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_service_request_table_idx` (`table_id` ASC),
  INDEX `fk_service_request_order_idx` (`order_id` ASC),
  INDEX `service_request_status_idx` (`status` ASC),
  CONSTRAINT `fk_service_request_table`
    FOREIGN KEY (`table_id`)
    REFERENCES `posdb`.`dining_table` (`id`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_service_request_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `posdb`.`order` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = 'ตารางเก็บคำขอบริการจากลูกค้า (เรียกพนักงาน ฯลฯ)';

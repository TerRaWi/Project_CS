-- Migration 001: ลูกค้าสแกน QR สั่งอาหารเอง
-- รันครั้งเดียวกับฐานข้อมูลที่สร้างจากไฟล์เดิม (รวมถึงหลัง import ไฟล์ posdb_order.sql / posdb_order_detail.sql)
--   mysql -u root -p posdb < Database/migration_001_customer_qr.sql
-- ถ้าสร้างฐานข้อมูลใหม่จาก posdb-schema.sql ไม่ต้องรันไฟล์นี้ (มีคอลัมน์แล้ว)

ALTER TABLE `order`
  ADD COLUMN `access_token` CHAR(32) NULL DEFAULT NULL COMMENT 'รหัสสุ่มใน QR ให้ลูกค้าสั่งอาหารเอง' AFTER `table_id`,
  ADD UNIQUE INDEX `access_token_UNIQUE` (`access_token` ASC);

ALTER TABLE `order_detail`
  ADD COLUMN `source` CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'ผู้สั่ง: S=Staff, C=Customer (QR)' AFTER `cancel_reason_id`;

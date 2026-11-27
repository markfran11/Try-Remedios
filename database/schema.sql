DROP DATABASE IF EXISTS remediosdb;
CREATE DATABASE remediosdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE remediosdb;


CREATE TABLE user_account (
  account_id  INT           NOT NULL AUTO_INCREMENT,
  first_name  VARCHAR(100)  NOT NULL,
  last_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  username    VARCHAR(100)  NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  UNIQUE KEY uq_email    (email),
  UNIQUE KEY uq_username (username)
) ENGINE=InnoDB;


CREATE TABLE customer (
  customer_id     INT          NOT NULL AUTO_INCREMENT,
  customer_name   VARCHAR(100) NOT NULL,
  contact_number  VARCHAR(30)  NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id)
) ENGINE=InnoDB;


CREATE TABLE product (
  product_id      INT              NOT NULL AUTO_INCREMENT,
  owner_id        INT              NOT NULL,
  product_name    VARCHAR(100)     NOT NULL,
  category        VARCHAR(100)     NOT NULL,
  description     VARCHAR(255)     NULL,
  price           DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  stock_quantity  INT              NOT NULL DEFAULT 0,
  reorder_level   INT              NOT NULL DEFAULT 10,
  image           MEDIUMTEXT       NULL,
  status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  UNIQUE KEY uq_product_name_category (product_name, category),
  CONSTRAINT fk_product_owner
    FOREIGN KEY (owner_id)
    REFERENCES user_account (account_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE promotion (
  promotion_id      INT              NOT NULL AUTO_INCREMENT,
  owner_id          INT              NOT NULL,
  promotion_name    VARCHAR(100)     NOT NULL,
  description       VARCHAR(255)     NULL,
  discount_type     ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  discount_value    DECIMAL(10,2)    NOT NULL,
  voucher_code      VARCHAR(50)      NULL,
  start_date        DATE             NULL,
  end_date          DATE             NULL,
  usage_limit       INT              NULL,
  usage_count       INT              NOT NULL DEFAULT 0,
  promotion_status  ENUM('active','inactive','expired') NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (promotion_id),
  UNIQUE KEY uq_voucher_code (voucher_code),
  CONSTRAINT fk_promotion_owner
    FOREIGN KEY (owner_id)
    REFERENCES user_account (account_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE promotion_product (
  promo_prod_id  INT  NOT NULL AUTO_INCREMENT,
  promotion_id   INT  NOT NULL,
  product_id     INT  NOT NULL,
  PRIMARY KEY (promo_prod_id),
  UNIQUE KEY uq_promo_product (promotion_id, product_id),
  CONSTRAINT fk_promoprod_promotion
    FOREIGN KEY (promotion_id)
    REFERENCES promotion (promotion_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_promoprod_product
    FOREIGN KEY (product_id)
    REFERENCES product (product_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE customer_order (
  order_id        INT          NOT NULL AUTO_INCREMENT,
  account_id      INT          NOT NULL,
  order_no        VARCHAR(20)  NULL,
  order_date      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  order_status    ENUM('Pending','Confirmed','Completed','Cancelled')
                               NOT NULL DEFAULT 'Pending',
  payment_method  ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
  payment_status  ENUM('Unpaid','Paid','Refunded') NOT NULL DEFAULT 'Unpaid',
  payment_ref_no  VARCHAR(100) NULL,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_custorder_account
    FOREIGN KEY (account_id)
    REFERENCES user_account (account_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE order_details (
  order_details_id  INT           NOT NULL AUTO_INCREMENT,
  order_id          INT           NOT NULL,
  product_id        INT           NOT NULL,
  promotion_id      INT           NULL,
  quantity          INT           NOT NULL DEFAULT 1,
  unit_price        DECIMAL(10,2) NOT NULL,
  discount_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sub_total         DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_details_id),
  CONSTRAINT fk_orderdet_order
    FOREIGN KEY (order_id)
    REFERENCES customer_order (order_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderdet_product
    FOREIGN KEY (product_id)
    REFERENCES product (product_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orderdet_promo
    FOREIGN KEY (promotion_id)
    REFERENCES promotion (promotion_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE sale (
  sale_id         INT           NOT NULL AUTO_INCREMENT,
  customer_id     INT           NOT NULL,
  owner_id        INT           NOT NULL,
  order_id        INT           NULL,
  sale_type       ENUM('direct','order') NOT NULL DEFAULT 'direct',
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sale_date       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method  ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
  receipt_no      VARCHAR(20)   NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sale_id),
  UNIQUE KEY uq_receipt_no (receipt_no),
  CONSTRAINT fk_sale_customer
    FOREIGN KEY (customer_id)
    REFERENCES customer (customer_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sale_owner
    FOREIGN KEY (owner_id)
    REFERENCES user_account (account_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sale_order
    FOREIGN KEY (order_id)
    REFERENCES customer_order (order_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE sale_details (
  sale_details_id  INT           NOT NULL AUTO_INCREMENT,
  sale_id          INT           NOT NULL,
  product_id       INT           NOT NULL,
  promotion_id     INT           NULL,
  quantity         INT           NOT NULL DEFAULT 1,
  unit_price       DECIMAL(10,2) NOT NULL,
  discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sub_total        DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (sale_details_id),
  CONSTRAINT fk_saledet_sale
    FOREIGN KEY (sale_id)
    REFERENCES sale (sale_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_saledet_product
    FOREIGN KEY (product_id)
    REFERENCES product (product_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_saledet_promo
    FOREIGN KEY (promotion_id)
    REFERENCES promotion (promotion_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE stock_movement (
  id              INT          NOT NULL AUTO_INCREMENT,
  product_id      INT          NOT NULL,
  movement_type   ENUM('stock_in','adjustment','sale') NOT NULL DEFAULT 'stock_in',
  previous_stock  INT          NOT NULL,
  quantity_change INT          NOT NULL,
  updated_stock   INT          NOT NULL,
  reason          VARCHAR(255) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_stockmov_product
    FOREIGN KEY (product_id)
    REFERENCES product (product_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;



INSERT INTO user_account (first_name, last_name, email, username, password, role)
VALUES (
  'Admin', 'Remedios',
  'admin@remedios.com',
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LtXtjJPC4De',
  'admin'
);


INSERT INTO customer (customer_name, contact_number)
VALUES ('Walk-in Customer', NULL);


INSERT INTO product
  (owner_id, product_name, category, price, stock_quantity, reorder_level, status)
VALUES
  (1, 'Native Hat',    'Native Products', 180.00, 24, 10, 'active'),
  (1, 'Plastic Basin', 'Plasticware',     180.00,  6, 10, 'active'),
  (1, 'Rattan Bag',    'Bags',            250.00, 15,  5, 'active'),
  (1, 'Plastic Pail',  'Plasticware',      95.00, 30, 10, 'active');


INSERT INTO stock_movement
  (product_id, movement_type, previous_stock, quantity_change, updated_stock, reason, created_at)
VALUES
  (1, 'stock_in', 10, 14, 24, 'Initial supplier delivery', '2024-10-21 09:00:00');

-- Meli Outfit · Modelo de datos (MySQL 8)
-- Etapa 1: tablas base de la tienda

CREATE DATABASE IF NOT EXISTS meli_outfit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE meli_outfit;

-- Tipos de prenda: remeras, shorts, jeans, buzos...
CREATE TABLE categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  slug       VARCHAR(80)  NOT NULL UNIQUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Producto "padre": lo que ve la clienta en el catálogo
CREATE TABLE products (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NULL,
  price       DECIMAL(10,2) NOT NULL,
  gender      ENUM('mujer','hombre','unisex') NOT NULL DEFAULT 'unisex',
  season      ENUM('verano','invierno','todo_el_anio') NOT NULL DEFAULT 'todo_el_anio',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,   -- 0 = oculto (sin borrarlo)
  created_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_filters (is_active, gender, season, category_id)
) ENGINE=InnoDB;

-- Variantes: cada combinación talle + color con su stock.
-- Un producto único (un solo talle y color) es un producto con UNA variante.
CREATE TABLE product_variants (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  size       VARCHAR(20) NOT NULL DEFAULT 'Único',
  color      VARCHAR(40) NOT NULL DEFAULT 'Único',
  stock      INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_variant (product_id, size, color)
) ENGINE=InnoDB;

-- Fotos (1 a 3 por producto; el límite se controla desde el backend).
-- Se guarda la URL de Cloudinary, no el archivo.
CREATE TABLE product_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  public_id  VARCHAR(200) NULL,        -- id en Cloudinary, para poder borrarla
  position   TINYINT UNSIGNED NOT NULL DEFAULT 1,  -- 1 = foto principal
  CONSTRAINT fk_images_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_image_position (product_id, position)
) ENGINE=InnoDB;

-- Acceso al panel (por ahora solo Melina)
CREATE TABLE admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,   -- nunca la contraseña en texto plano
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categorías iniciales (las podés ajustar con ella)
INSERT INTO categories (name, slug) VALUES
  ('Remeras',    'remeras'),
  ('Camisetas',  'camisetas'),
  ('Shorts',     'shorts'),
  ('Buzos',      'buzos'),
  ('Jeans',      'jeans');
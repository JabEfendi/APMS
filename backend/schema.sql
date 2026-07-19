-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('requester', 'validator', 'approver', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Items table
CREATE TABLE IF NOT EXISTS master_items (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  vin VARCHAR(100),
  photo_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  inquiry_no VARCHAR(50) UNIQUE NOT NULL,
  customer VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  vin VARCHAR(100),
  part_number VARCHAR(100),
  part_name VARCHAR(255),
  quantity INTEGER,
  urgency VARCHAR(50),
  internal_external VARCHAR(20),
  status VARCHAR(50) DEFAULT 'new',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New Item Requests table
CREATE TABLE IF NOT EXISTS new_item_requests (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER REFERENCES inquiries(id),
  part_number VARCHAR(100) NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  vin VARCHAR(100),
  photo_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'validation',
  validated_by INTEGER REFERENCES users(id),
  validated_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

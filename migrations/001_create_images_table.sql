-- Migration: Create images table for storing uploaded images in PostgreSQL
-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  data TEXT NOT NULL, -- base64 encoded image data
  size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add comment explaining the table
COMMENT ON TABLE images IS 'Stores uploaded images as base64 encoded data for complete deletion capability';

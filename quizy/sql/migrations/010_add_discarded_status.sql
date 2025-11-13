-- Migración 010: Agregar estado 'discarded' a tickets de soporte
-- Fecha: 2025-11-06
-- Descripción: Permitir a los admins descartar tickets inútiles

-- Agregar columnas para guardar quién descartó el ticket y cuándo
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS discarded_by VARCHAR(255);

ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMP;

COMMENT ON COLUMN support_tickets.discarded_by IS 'Nombre del admin que descartó el ticket';
COMMENT ON COLUMN support_tickets.discarded_at IS 'Fecha y hora en que se descartó el ticket';

-- Nota: El campo 'status' ya permite valores VARCHAR, 
-- simplemente usaremos 'discarded' como un valor más

-- Adiciona coluna para armazenar o avatar como blob (bytea)
ALTER TABLE usuarios ADD COLUMN avatar_blob bytea;
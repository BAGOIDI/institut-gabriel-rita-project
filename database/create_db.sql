SELECT 'CREATE DATABASE institut_gabriel_rita_db'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'institut_gabriel_rita_db'
) \gexec

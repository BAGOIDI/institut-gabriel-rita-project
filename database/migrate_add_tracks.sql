DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tracks') THEN
    CREATE TABLE public.tracks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT
    );
  END IF;
END$$;

INSERT INTO public.tracks (name, code, description) VALUES ('Agroalimentaire', 'AGRO', 'Filière Agroalimentaire') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Bâtiment', 'BAT', 'Filière Bâtiment') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Génie Civil', 'GC', 'Filière Génie Civil') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Hôtellerie', 'HOTEL', 'Filière Hôtellerie') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Mécanique', 'MEC', 'Filière Mécanique') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Métallurgie', 'METAL', 'Filière Métallurgie') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Réseaux & Sécurité', 'RESEAUX', 'Filière Réseaux & Sécurité') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Télécommunications', 'TELECOM', 'Filière Télécommunications') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Topographie', 'TOPO', 'Filière Topographie') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Tourisme', 'TOUR', 'Filière Tourisme') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Urbanisme', 'URB', 'Filière Urbanisme') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.tracks (name, code, description) VALUES ('Restauration', 'RESTO', 'Filière Restauration') ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='specialties' AND column_name='track_id'
  ) THEN
    ALTER TABLE public.specialties ADD COLUMN track_id INTEGER;
  END IF;
END$$;

UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='AGRO')
WHERE s.name ILIKE '%BAKERY%' OR s.name ILIKE '%FOOD%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='BAT')
WHERE s.name ILIKE '%BUILDING%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='GC')
WHERE s.name ILIKE '%CIVIL%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='HOTEL')
WHERE s.name ILIKE '%HÔTELLERIE%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='MEC')
WHERE s.name ILIKE '%MECHANICAL%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='METAL')
WHERE s.name ILIKE '%METAL%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='RESEAUX')
WHERE s.name ILIKE '%NETWORKS%' OR s.name ILIKE '%SECURITY%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='TELECOM')
WHERE s.name ILIKE '%TELECOMMUNICATION%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='TOPO')
WHERE s.name ILIKE '%TOPOGRAPH%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='TOUR')
WHERE s.name ILIKE '%TOURISME%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='URB')
WHERE s.name ILIKE '%URBAN%';
UPDATE public.specialties s SET track_id = (SELECT id FROM public.tracks WHERE code='RESTO')
WHERE s.name ILIKE '%RESTAURATION%';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.specialties WHERE track_id IS NULL) THEN
    UPDATE public.specialties s
    SET track_id = (SELECT id FROM public.tracks WHERE code='GC')
    WHERE s.track_id IS NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
   WHERE tc.table_schema='public'
     AND tc.table_name='specialties'
     AND tc.constraint_type='FOREIGN KEY'
     AND kcu.column_name='track_id'
  ) THEN
    ALTER TABLE public.specialties
    ADD CONSTRAINT specialties_track_fk FOREIGN KEY (track_id) REFERENCES public.tracks(id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.specialties WHERE track_id IS NOT NULL)
  THEN
    ALTER TABLE public.specialties ALTER COLUMN track_id SET NOT NULL;
  END IF;
END$$;

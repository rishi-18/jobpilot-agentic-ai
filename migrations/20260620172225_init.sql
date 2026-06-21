-- db/migrations/0001_init.sql
-- Feature 04 -- Database Schema for JobPilot
-- Applies profiles, agent_runs, jobs, agent_logs and per-user RLS to the
-- InsForge project. Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text,
  email               text,
  phone               text,
  location            text,
  current_title       text,
  experience_level    text CHECK (experience_level IS NULL OR experience_level IN ('junior','mid','senior','lead')),
  years_experience    integer CHECK (years_experience IS NULL OR years_experience >= 0),
  skills              text[] NOT NULL DEFAULT '{}',
  industries          text[] NOT NULL DEFAULT '{}',
  work_experience     jsonb NOT NULL DEFAULT '[]'::jsonb,
  education           jsonb NOT NULL DEFAULT '{}'::jsonb,
  job_titles_seeking  text[] NOT NULL DEFAULT '{}',
  remote_preference   text CHECK (remote_preference IS NULL OR remote_preference IN ('remote','onsite','hybrid','any')),
  preferred_locations text[] NOT NULL DEFAULT '{}',
  salary_expectation  text,
  cover_letter_tone   text CHECK (cover_letter_tone IS NULL OR cover_letter_tone IN ('formal','casual','enthusiastic')),
  linkedin_url        text,
  portfolio_url       text,
  work_authorization  text CHECK (work_authorization IS NULL OR work_authorization IN ('citizen','permanent_resident','visa_required')),
  resume_pdf_url      text,
  is_complete         boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (id);

-- ---------------------------------------------------------------------------
-- agent_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status             text NOT NULL CHECK (status IN ('running','completed','failed')),
  job_title_searched text,
  location_searched  text,
  jobs_found         integer NOT NULL DEFAULT 0 CHECK (jobs_found >= 0),
  started_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_user_started_idx
  ON public.agent_runs (user_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                      uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  user_id                     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source                      text NOT NULL CHECK (source IN ('search','url')),
  source_url                  text,
  external_apply_url          text,
  title                       text NOT NULL,
  company                     text NOT NULL,
  location                    text,
  salary                      text,
  job_type                    text CHECK (job_type IS NULL OR job_type IN ('fulltime','parttime','contract')),
  about_role                  text,
  responsibilities            text[] NOT NULL DEFAULT '{}',
  requirements                text[] NOT NULL DEFAULT '{}',
  nice_to_have                text[] NOT NULL DEFAULT '{}',
  benefits                    text[] NOT NULL DEFAULT '{}',
  about_company               text,
  match_score                 integer CHECK (match_score IS NULL OR (match_score BETWEEN 0 AND 100)),
  match_reason                text,
  matched_skills              text[] NOT NULL DEFAULT '{}',
  missing_skills              text[] NOT NULL DEFAULT '{}',
  tailored_resume_url         text,
  tailored_cover_letter_url   text,
  tailored_at                 timestamptz,
  company_research            jsonb,
  found_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_user_found_idx
  ON public.jobs (user_id, found_at DESC);
CREATE INDEX IF NOT EXISTS jobs_user_score_idx
  ON public.jobs (user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS jobs_run_idx
  ON public.jobs (run_id);

-- ---------------------------------------------------------------------------
-- agent_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     uuid REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    text NOT NULL,
  level      text NOT NULL CHECK (level IN ('info','success','warning','error')),
  job_id     uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_logs_user_created_idx
  ON public.agent_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_logs_run_idx
  ON public.agent_logs (run_id);

-- ---------------------------------------------------------------------------
-- Row Level Security -- owner-only on every table.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_owner_all'
  ) THEN
    CREATE POLICY profiles_owner_all ON public.profiles
      FOR ALL TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_runs'
      AND policyname = 'agent_runs_owner_all'
  ) THEN
    CREATE POLICY agent_runs_owner_all ON public.agent_runs
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jobs'
      AND policyname = 'jobs_owner_all'
  ) THEN
    CREATE POLICY jobs_owner_all ON public.jobs
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_logs'
      AND policyname = 'agent_logs_owner_all'
  ) THEN
    CREATE POLICY agent_logs_owner_all ON public.agent_logs
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$do$;

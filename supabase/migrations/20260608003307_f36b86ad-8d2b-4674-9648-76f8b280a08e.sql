BEGIN;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _role public.app_role;
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    company_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'job_seeker');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS work_mode text,
  ADD COLUMN IF NOT EXISTS shift_timing text,
  ADD COLUMN IF NOT EXISTS openings integer,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS laptop_policy text,
  ADD COLUMN IF NOT EXISTS benefits text,
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS application_deadline timestamp with time zone;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS current_location text,
  ADD COLUMN IF NOT EXISTS years_experience text,
  ADD COLUMN IF NOT EXISTS notice_period text,
  ADD COLUMN IF NOT EXISTS resume_path text,
  ADD COLUMN IF NOT EXISTS resume_file_name text;

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "recruiter_create_jobs" ON public.jobs;
CREATE POLICY "recruiter_create_jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = recruiter_id
  AND public.has_role(auth.uid(), 'recruiter'::public.app_role)
);

DROP POLICY IF EXISTS "recruiter_update_jobs" ON public.jobs;
CREATE POLICY "recruiter_update_jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = recruiter_id)
WITH CHECK (
  auth.uid() = recruiter_id
  AND public.has_role(auth.uid(), 'recruiter'::public.app_role)
);

DROP POLICY IF EXISTS "recruiter_delete_jobs" ON public.jobs;
CREATE POLICY "recruiter_delete_jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (
  auth.uid() = recruiter_id
  AND public.has_role(auth.uid(), 'recruiter'::public.app_role)
);

DROP POLICY IF EXISTS "recruiter_update_app" ON public.applications;
CREATE POLICY "recruiter_update_app"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
      AND public.has_role(auth.uid(), 'recruiter'::public.app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
      AND public.has_role(auth.uid(), 'recruiter'::public.app_role)
  )
);

DROP POLICY IF EXISTS "job seekers manage own resume uploads" ON storage.objects;
DROP POLICY IF EXISTS "recruiters view applicant resume uploads" ON storage.objects;

CREATE POLICY "job seekers manage own resume uploads"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'candidate-resumes'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'candidate-resumes'
  AND owner = auth.uid()
);

CREATE POLICY "recruiters view applicant resume uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-resumes'
  AND EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.resume_path = storage.objects.name
      AND j.recruiter_id = auth.uid()
      AND public.has_role(auth.uid(), 'recruiter'::public.app_role)
  )
);

COMMIT;
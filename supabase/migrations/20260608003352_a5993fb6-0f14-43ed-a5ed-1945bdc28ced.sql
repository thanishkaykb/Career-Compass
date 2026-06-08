BEGIN;

DROP POLICY IF EXISTS "recruiter_create_jobs" ON public.jobs;
CREATE POLICY "recruiter_create_jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = recruiter_id
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
);

DROP POLICY IF EXISTS "recruiter_update_jobs" ON public.jobs;
CREATE POLICY "recruiter_update_jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = recruiter_id)
WITH CHECK (
  auth.uid() = recruiter_id
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
);

DROP POLICY IF EXISTS "recruiter_delete_jobs" ON public.jobs;
CREATE POLICY "recruiter_delete_jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (
  auth.uid() = recruiter_id
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
);

DROP POLICY IF EXISTS "recruiter_update_app" ON public.applications;
CREATE POLICY "recruiter_update_app"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE j.id = applications.job_id
      AND j.recruiter_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE j.id = applications.job_id
      AND j.recruiter_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
);

DROP POLICY IF EXISTS "recruiter_view_applicant_profile" ON public.profiles;
CREATE POLICY "recruiter_view_applicant_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE a.user_id = profiles.id
      AND j.recruiter_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
);

DROP POLICY IF EXISTS "recruiters view applicant resume uploads" ON storage.objects;
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
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE a.resume_path = storage.objects.name
      AND j.recruiter_id = auth.uid()
      AND ur.role = 'recruiter'::public.app_role
  )
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

COMMIT;
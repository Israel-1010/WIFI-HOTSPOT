-- Function to increment survey responses count
CREATE OR REPLACE FUNCTION increment_survey_responses(survey_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.surveys
  SET responses_count = COALESCE(responses_count, 0) + 1
  WHERE id = survey_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_survey_responses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_survey_responses(UUID) TO anon;

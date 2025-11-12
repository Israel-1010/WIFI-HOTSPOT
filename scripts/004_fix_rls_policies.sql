-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can manage vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Users can view active vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins can manage surveys" ON public.surveys;
DROP POLICY IF EXISTS "Users can view active surveys" ON public.surveys;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Admins can manage gamification" ON public.gamification;
DROP POLICY IF EXISTS "Users can view active gamification" ON public.gamification;
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can update their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can insert their own points" ON public.user_points;
DROP POLICY IF EXISTS "Admins can view all user points" ON public.user_points;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON public.analytics;

-- Create a helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Separate admin policy that doesn't create recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Campaigns policies
CREATE POLICY "Admins can manage campaigns" ON public.campaigns
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view active campaigns" ON public.campaigns
  FOR SELECT USING (status = 'active' OR public.is_admin());

-- Vouchers policies
CREATE POLICY "Admins can manage vouchers" ON public.vouchers
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view active vouchers" ON public.vouchers
  FOR SELECT USING (is_active = true OR public.is_admin());

-- Surveys policies
CREATE POLICY "Admins can manage surveys" ON public.surveys
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view active surveys" ON public.surveys
  FOR SELECT USING (status = 'active' OR public.is_admin());

-- Survey responses policies
CREATE POLICY "Users can insert their own responses" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own responses" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can view all responses" ON public.survey_responses
  FOR SELECT USING (public.is_admin());

-- Gamification policies
CREATE POLICY "Admins can manage gamification" ON public.gamification
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view active gamification" ON public.gamification
  FOR SELECT USING (is_active = true OR public.is_admin());

-- User points policies
CREATE POLICY "Users can view their own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own points" ON public.user_points
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points" ON public.user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user points" ON public.user_points
  FOR SELECT USING (public.is_admin());

-- Analytics policies
CREATE POLICY "Admins can view all analytics" ON public.analytics
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert analytics" ON public.analytics
  FOR INSERT WITH CHECK (true);

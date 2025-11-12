-- ============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Execute this script to set up the entire database
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if any)
-- ============================================
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.gamification CASCADE;
DROP TABLE IF EXISTS public.survey_responses CASCADE;
DROP TABLE IF EXISTS public.surveys CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('popup', 'banner', 'fullscreen')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  modal_position TEXT DEFAULT 'center' CHECK (modal_position IN ('center', 'top', 'bottom', 'left', 'right')),
  target_audience JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  campaign_id UUID REFERENCES public.campaigns(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  response_count INTEGER DEFAULT 0,
  campaign_id UUID REFERENCES public.campaigns(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  responses JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gamification table
CREATE TABLE public.gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('points', 'badges', 'levels', 'challenges')),
  description TEXT,
  rules JSONB DEFAULT '{}',
  rewards JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  campaign_id UUID REFERENCES public.campaigns(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user points table
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create analytics table
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  user_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('connection', 'disconnection', 'authentication', 'voucher_redeemed', 'survey_completed', 'points_earned')),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  mac_address TEXT,
  device_info TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_vouchers_code ON public.vouchers(code);
CREATE INDEX idx_surveys_status ON public.surveys(status);
CREATE INDEX idx_analytics_campaign_id ON public.analytics(campaign_id);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE FUNCTIONS
-- ============================================

-- Helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  );
  
  -- Create initial user points record
  INSERT INTO public.user_points (user_id, points, level)
  VALUES (NEW.id, 0, 1);
  
  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment survey response count
CREATE OR REPLACE FUNCTION public.increment_survey_responses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.surveys
  SET response_count = response_count + 1
  WHERE id = NEW.survey_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gamification_updated_at BEFORE UPDATE ON public.gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Survey response count trigger
CREATE TRIGGER increment_survey_response_count
  AFTER INSERT ON public.survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_survey_responses();

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Activity logs policies
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- INSERT SEED DATA
-- ============================================

-- Note: The admin user will be created through Supabase Auth
-- After running this script, you can create an admin user by:
-- 1. Going to /auth/register and creating an account with role 'admin'
-- 2. Or running the script below to create a test admin

-- Sample campaigns
INSERT INTO public.campaigns (name, description, type, status, content, start_date, end_date) VALUES
('Welcome Campaign', 'Welcome new users with a special offer', 'popup', 'active', '{"title": "Welcome!", "message": "Get 20% off your first purchase"}', NOW(), NOW() + INTERVAL '30 days'),
('Summer Sale', 'Summer promotion campaign', 'banner', 'active', '{"title": "Summer Sale", "message": "Up to 50% off on selected items"}', NOW(), NOW() + INTERVAL '60 days');

-- Sample vouchers
INSERT INTO public.vouchers (code, title, description, discount_type, discount_value, max_uses, expires_at, is_active) VALUES
('WELCOME20', 'Welcome Discount', 'Get 20% off your first purchase', 'percentage', 20.00, 100, NOW() + INTERVAL '30 days', true),
('SUMMER50', 'Summer Sale', 'Get 50% off on selected items', 'percentage', 50.00, 50, NOW() + INTERVAL '60 days', true),
('FREESHIP', 'Free Shipping', 'Free shipping on orders over $50', 'fixed', 10.00, 200, NOW() + INTERVAL '90 days', true);

-- Sample surveys
INSERT INTO public.surveys (title, description, questions, status) VALUES
('Customer Satisfaction', 'Help us improve our service', '[{"id": "q1", "type": "rating", "question": "How satisfied are you with our service?", "required": true}, {"id": "q2", "type": "text", "question": "What can we improve?", "required": false}]', 'active'),
('Product Feedback', 'Tell us about your experience', '[{"id": "q1", "type": "multiple", "question": "Which features do you use most?", "options": ["Feature A", "Feature B", "Feature C"], "required": true}]', 'active');

-- Sample gamification
INSERT INTO public.gamification (name, type, description, rules, rewards, is_active) VALUES
('First Login', 'points', 'Earn points for your first login', '{"points": 10}', '{"badge": "Newcomer"}', true),
('Survey Master', 'badges', 'Complete 5 surveys', '{"surveys_required": 5}', '{"badge": "Survey Master", "points": 50}', true),
('Loyal Customer', 'levels', 'Reach level 5', '{"level_required": 5}', '{"discount": "10%"}', true);

-- Sample activity logs
INSERT INTO public.activity_logs (user_name, user_email, type, action, details) VALUES
('System', 'system@example.com', 'authentication', 'Database initialized', '{"message": "Initial setup completed"}');

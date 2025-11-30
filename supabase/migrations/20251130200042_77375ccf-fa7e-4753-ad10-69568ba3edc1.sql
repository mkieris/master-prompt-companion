-- =============================================
-- ENTERPRISE SEO TOOLBOX - DATABASE SCHEMA
-- =============================================

-- 1. USER ROLES ENUM
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- 2. ORGANIZATIONS (Teams/Workspaces)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. ORGANIZATION MEMBERS (with roles)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. USER PROFILES (extended)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  current_organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. DOMAIN KNOWLEDGE (Crawled website data)
CREATE TABLE public.domain_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  crawl_status TEXT NOT NULL DEFAULT 'pending',
  pages_crawled INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  
  -- Extracted knowledge
  company_name TEXT,
  company_description TEXT,
  industry TEXT,
  target_audience TEXT,
  main_products_services JSONB DEFAULT '[]'::jsonb,
  unique_selling_points JSONB DEFAULT '[]'::jsonb,
  brand_voice TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  competitors JSONB DEFAULT '[]'::jsonb,
  
  -- Raw crawl data
  crawl_data JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  
  crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_knowledge ENABLE ROW LEVEL SECURITY;

-- 6. CONTENT PROJECTS (Save generated content)
CREATE TABLE public.content_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  page_type TEXT NOT NULL,
  focus_keyword TEXT NOT NULL,
  
  -- Form data & generated content
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_content JSONB,
  seo_score INTEGER,
  
  -- Organization
  folder TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_projects ENABLE ROW LEVEL SECURITY;

-- 7. CONTENT VERSIONS (History)
CREATE TABLE public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.content_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  form_data JSONB NOT NULL,
  generated_content JSONB NOT NULL,
  seo_score INTEGER,
  change_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- 8. CONTENT PLANNER (Content Calendar)
CREATE TABLE public.content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  page_type TEXT,
  target_keyword TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'idea',
  
  planned_date DATE,
  published_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user has a specific role in an organization
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  )
$$;

-- Check if user is member of an organization (any role)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- ORGANIZATIONS: Users can see orgs they belong to
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can update organizations"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  public.has_org_role(auth.uid(), id, 'owner') OR 
  public.has_org_role(auth.uid(), id, 'admin')
);

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- ORGANIZATION MEMBERS
CREATE POLICY "Members can view their org members"
ON public.organization_members FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can manage members"
ON public.organization_members FOR ALL
TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR 
  public.has_org_role(auth.uid(), organization_id, 'admin')
);

CREATE POLICY "Users can join organizations"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- PROFILES
CREATE POLICY "Users can view all profiles in their orgs"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- DOMAIN KNOWLEDGE
CREATE POLICY "Org members can view domain knowledge"
ON public.domain_knowledge FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Editors and above can manage domain knowledge"
ON public.domain_knowledge FOR ALL
TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR 
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- CONTENT PROJECTS
CREATE POLICY "Org members can view projects"
ON public.content_projects FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Editors and above can manage projects"
ON public.content_projects FOR ALL
TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR 
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- CONTENT VERSIONS
CREATE POLICY "Org members can view versions"
ON public.content_versions FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.content_projects 
    WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Editors can create versions"
ON public.content_versions FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM public.content_projects cp
    WHERE public.has_org_role(auth.uid(), cp.organization_id, 'owner') OR 
          public.has_org_role(auth.uid(), cp.organization_id, 'admin') OR
          public.has_org_role(auth.uid(), cp.organization_id, 'editor')
  )
);

-- CONTENT PLANS
CREATE POLICY "Org members can view content plans"
ON public.content_plans FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Editors and above can manage content plans"
ON public.content_plans FOR ALL
TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR 
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domain_knowledge_updated_at
BEFORE UPDATE ON public.domain_knowledge
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_projects_updated_at
BEFORE UPDATE ON public.content_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_plans_updated_at
BEFORE UPDATE ON public.content_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add creator as owner when organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  
  -- Set as current organization for user
  UPDATE public.profiles 
  SET current_organization_id = NEW.id 
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();
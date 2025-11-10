-- Create table for storing SEO projects
CREATE TABLE public.seo_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  page_type TEXT NOT NULL,
  focus_keyword TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.seo_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (später kann man das auf User einschränken)
CREATE POLICY "Allow public read access to seo_projects" 
ON public.seo_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to seo_projects" 
ON public.seo_projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to seo_projects" 
ON public.seo_projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to seo_projects" 
ON public.seo_projects 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_seo_projects_updated_at
BEFORE UPDATE ON public.seo_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_seo_projects_created_at ON public.seo_projects(created_at DESC);
CREATE INDEX idx_seo_projects_focus_keyword ON public.seo_projects(focus_keyword);
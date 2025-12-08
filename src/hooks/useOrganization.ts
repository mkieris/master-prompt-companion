import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Session } from '@supabase/supabase-js';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  current_organization_id: string | null;
}

interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export function useOrganization(session: Session | null) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    loadUserData();
  }, [session]);

  const loadUserData = async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);

      // Get user profile - use maybeSingle to handle missing profiles gracefully
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast({
          title: 'Profil-Fehler',
          description: 'Dein Profil konnte nicht geladen werden. Bitte versuche es erneut.',
          variant: 'destructive',
        });
      }

      // If no profile exists, create one
      if (!profileData && !profileError) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          profileData = newProfile;
        }
      }

      // Get user's organizations
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', session.user.id);

      if (membershipsError) {
        console.error('Error loading memberships:', membershipsError);
      }

      if (!memberships || memberships.length === 0) {
        setNeedsOnboarding(true);
        setIsLoading(false);
        return;
      }

      // Get organization details
      const orgIds = memberships.map(m => m.organization_id);
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgsError) {
        console.error('Error loading organizations:', orgsError);
      }

      setProfile(profileData);
      setOrganizations(orgsData || []);

      // Set current organization
      let currentOrgId = profileData?.current_organization_id;
      if (!currentOrgId && orgsData && orgsData.length > 0) {
        currentOrgId = orgsData[0].id;
      }

      const currentOrgData = orgsData?.find(o => o.id === currentOrgId) || orgsData?.[0];
      setCurrentOrg(currentOrgData || null);

      // Set user role in current org
      const membership = memberships?.find(m => m.organization_id === currentOrgData?.id);
      setUserRole(membership?.role || null);

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error in loadUserData:', error);
      toast({
        title: 'Ladefehler',
        description: 'Benutzerdaten konnten nicht geladen werden. Bitte Seite neu laden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async (name: string, website?: string) => {
    if (!session?.user) return { error: 'Not authenticated' };

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Insert without .select() to avoid RLS SELECT policy blocking the return
    // The AFTER INSERT trigger will add the user as owner
    const { error: insertError } = await supabase
      .from('organizations')
      .insert({ name, slug, website });

    if (insertError) return { error: insertError.message };

    // Refresh user data to get the new organization
    await loadUserData();
    
    // Query for the organization by slug to return it
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    return { data: orgData };
  };

  const switchOrganization = async (orgId: string) => {
    if (!session?.user) return;

    await supabase
      .from('profiles')
      .update({ current_organization_id: orgId })
      .eq('id', session.user.id);

    await loadUserData();
  };

  return {
    organizations,
    currentOrg,
    profile,
    userRole,
    isLoading,
    needsOnboarding,
    createOrganization,
    switchOrganization,
    refresh: loadUserData,
  };
}

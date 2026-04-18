"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export default function PhoneBarrier() {
  const { setUser, setLoading: setGlobalLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (mounted) {
            setUser(profile || null);
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setGlobalLoading(false);
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (mounted) {
            setUser(profile || null);
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setGlobalLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setGlobalLoading]);

  return null;
}

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { isCurrentUserAdmin } from '../../../utils/auth';

const AdminRoute: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking, true/false

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately for the current session,
    // so no separate getUser() call is needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setIsAdmin(false);
      } else {
        const admin = await isCurrentUserAdmin();
        setIsAdmin(admin);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50 dark:bg-slate-900 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-sky-500/20" />
        <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;

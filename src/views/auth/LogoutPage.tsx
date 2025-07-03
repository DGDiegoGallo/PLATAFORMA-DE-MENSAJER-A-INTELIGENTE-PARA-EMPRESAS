import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * LogoutPage ensures that the logout logic is executed exactly **once** and then
 * redirects the user to the login page. We cannot rely solely on a <Navigate />
 * element because we also need to clear the authentication data stored in
 * localStorage and global auth context state.
 */
const LogoutPage: React.FC = () => {
  const { logout } = useAuthContext();
  // React 18 StrictMode mounts components twice in development causing side
  // effects to run twice.  We use a ref to guarantee the logout logic is only
  // triggered once per real user interaction.
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!hasLoggedOut.current) {
      logout();
      hasLoggedOut.current = true;
    }
  }, [logout]);

  // Immediately redirect to the login page after executing logout.
  return <Navigate to="/auth/login" replace />;
};

export default LogoutPage;

import React, { useState, useEffect, memo } from "react";
import { Navigate } from "react-router-dom";
import { checkLoginStatus } from "../api";

const ProtectedRoute = memo(({ element: Element, ...rest }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const response = await checkLoginStatus();
        if (isMounted) {
          setAuthState({
            isLoggedIn: response.loggedIn,
            isLoading: false
          });
        }
      } catch (error) {
        if (isMounted) {
          setAuthState({
            isLoggedIn: false,
            isLoading: false
          });
        }
      }
    };

    verifyAuth();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  if (authState.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return authState.isLoggedIn ? (
    <Element {...rest} />
  ) : (
    <Navigate to="/" replace />
  );
});

export default ProtectedRoute;

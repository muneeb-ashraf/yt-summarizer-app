'use client';

import { SchematicProvider } from "@schematichq/schematic-react";
import { useEffect } from 'react';
import { useSchematicEvents } from '@schematichq/schematic-react';
import { useAuth } from '@clerk/nextjs';

// Create a custom hook that matches the expected interface in the documentation
function useAuthContext() {
  const auth = useAuth();
  
  // Map Clerk's auth data to the expected format
  return {
    user: auth.isSignedIn ? {
      keys: {
        userId: auth.userId || ''
      },
      name: auth.userId || '',
      traits: {}
    } : undefined,
    
    company: auth.isSignedIn && auth.orgId ? {
      keys: {
        orgId: auth.orgId
      },
      name: auth.orgSlug || 'Organization'
    } : undefined
  };
}

const SchematicWrapped: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { identify } = useSchematicEvents();
  const authContext = useAuthContext();

  useEffect(() => {
    const { company, user } = authContext ?? {};
    if (company && user) {
      void identify({
        company: {
          keys: company.keys,
          name: company.name,
        },
        keys: user.keys,
        name: user.name,
        traits: user.traits,
      });
    }
  }, [authContext, identify]);

  return children;
};

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const schematicPubKey = process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY;
  if (!schematicPubKey) {
    throw new Error(
      "No Schematic Publishable Key found. Please add it to your .env.local file."
    );
  }

  return (
    <SchematicProvider publishableKey={schematicPubKey}>
      <SchematicWrapped>{children}</SchematicWrapped>
    </SchematicProvider>
  );
}
import React, { createContext, useContext, useMemo, useState } from "react";
import type { SignupDraft } from "../types/user";

type SignupContextValue = {
  draft: SignupDraft;
  updateDraft: (patch: Partial<SignupDraft>) => void;
  clearDraft: () => void;
};

const SignupContext = createContext<SignupContextValue | undefined>(undefined);

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft>({});

  const value = useMemo<SignupContextValue>(
    () => ({
      draft,
      updateDraft: (patch) => {
        setDraft((current) => ({
          ...current,
          ...patch,
        }));
      },
      clearDraft: () => setDraft({}),
    }),
    [draft]
  );

  return (
    <SignupContext.Provider value={value}>
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const value = useContext(SignupContext);

  if (!value) {
    throw new Error("useSignup must be used inside SignupProvider");
  }

  return value;
}
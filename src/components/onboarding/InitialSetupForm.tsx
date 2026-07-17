import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { ProfileFormValues } from '../../types/profile';
import { ProfileForm } from './ProfileForm';

export function InitialSetupForm() {
  const { saveProfile, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const draftKey = session?.user.id ? `initial-profile-draft:${session.user.id}` : undefined;

  const handleSubmit = async (values: ProfileFormValues) => {
    setLoading(true);

    try {
      await saveProfile(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell setup-shell">
      <ProfileForm
        title="Primeiro acesso"
        description="Configure seus dados para começar a organizar suas finanças."
        submitLabel="Concluir configuração"
        loading={loading}
        draftKey={draftKey}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

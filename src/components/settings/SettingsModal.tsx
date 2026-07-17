import { X } from 'lucide-react';
import { useState } from 'react';
import type { ProfileFormValues, UserSettingsProfile } from '../../types/profile';
import { ProfileForm } from '../onboarding/ProfileForm';

interface SettingsModalProps {
  profile: UserSettingsProfile;
  onClose: () => void;
  onSave: (values: ProfileFormValues) => Promise<void>;
}

export function SettingsModal({ profile, onClose, onSave }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    setSuccessMessage('');

    try {
      await onSave(values);
      setSuccessMessage('Configurações salvas.');
      window.setTimeout(onClose, 450);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-backdrop" role="dialog" aria-modal="true" aria-label="Editar configurações">
      <div className="settings-modal">
        <button className="settings-close" type="button" aria-label="Fechar configurações" onClick={onClose} disabled={loading}>
          <X size={18} />
        </button>
        <ProfileForm
          title="Configurações"
          description="Edite os dados usados no primeiro acesso."
          submitLabel="Salvar configurações"
          profile={profile}
          loading={loading}
          successMessage={successMessage}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

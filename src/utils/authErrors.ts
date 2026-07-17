export function getFriendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (message.includes('already registered') || message.includes('already exists') || message.includes('user already')) {
    return 'Se o cadastro for válido, verifique seu e-mail para continuar.';
  }

  if (message.includes('password') && (message.includes('short') || message.includes('weak'))) {
    return 'A senha está muito curta.';
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Tente novamente mais tarde.';
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch')) {
    return 'Não foi possível conectar ao servidor.';
  }

  if (message.includes('supabase nao configurado') || message.includes('supabase não configurado')) {
    return 'Supabase não está configurado neste ambiente.';
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

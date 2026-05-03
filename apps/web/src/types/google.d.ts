// Tipos mínimos do Google Identity Services (GIS) que usamos.
// Doc: https://developers.google.com/identity/gsi/web

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    },
  ): void;
  prompt(): void;
  cancel(): void;
  disableAutoSelect(): void;
}

interface GoogleAccountsOAuth2 {
  initCodeClient(config: {
    client_id: string;
    scope: string;
    ux_mode?: 'popup' | 'redirect';
    redirect_uri?: string;
    callback: (response: { code?: string; error?: string; state?: string }) => void;
    error_callback?: (err: { type: string; message?: string }) => void;
  }): {
    requestCode: () => void;
  };
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
      oauth2: GoogleAccountsOAuth2;
    };
  };
}

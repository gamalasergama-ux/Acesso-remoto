import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
export function buildConfig({ hostname = 'localhost', email, production = false, dataDir, webDir, port = 8443 }) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Porta inválida.');
  if (production && (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname) || hostname.endsWith('.localhost'))) throw new Error('Informe um domínio DNS público, sem https://, caminho ou porta.');
  if (!production && hostname !== 'localhost') throw new Error('Modo local aceita somente localhost.');
  if (production && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw new Error('E-mail necessário para o certificado TLS.');
  const config = {
    settings: {
      cert: production ? hostname : 'gama.localhost', WANonly: true, port, aliasPort: production ? 443 : port,
      portBind: production ? '0.0.0.0' : '127.0.0.1',
      redirPort: production ? 8080 : 0, redirAliasPort: production ? 80 : undefined,
      mpsPort: 0, exactPorts: true, sessionKey: randomBytes(48).toString('hex'),
      sessionTime: 60, sessionSameSite: 'strict', allowFraming: false,
      allowLoginToken: false, webRTC: false, selfUpdate: false,
      maxInvalidLogin: { time: 10, count: 5, coolofftime: 15 },
      maxInvalid2fa: { time: 10, count: 5, coolofftime: 15 },
      authLog: resolve(dataDir, 'auth.log'),
      agentPing: 30, browserPing: 30,
      dbExpire: { events: 7776000, powerevents: 2592000, statsevents: 2592000 }
    },
    domains: { '': {
      title: 'Gama Remote', title2: 'Acesso remoto autorizado',
      welcomeText: 'Controle seus computadores pelo navegador. Acesso somente com autorização.',
      newAccounts: false, minify: true, language: 'pt-br',
      webPublicPath: resolve(webDir),
      passwordRequirements: { min: 14, max: 128, upper: 1, lower: 1, numeric: 1, nonalpha: 1, force2factor: true },
      twoFactorCookieDurationDays: 0, userSessionIdleTimeout: 15, logoutOnIdleSessionTimeout: true,
      userConsentFlags: { desktopnotify: true, terminalnotify: true, filenotify: true, desktopprompt: true, terminalprompt: true, fileprompt: true, desktopprivacybar: true },
      consentMessages: { title: 'Gama Remote', desktop: '{0} solicita controlar este computador. Autorizar?', terminal: '{0} solicita acesso ao terminal. Autorizar?', files: '{0} solicita acesso aos arquivos. Autorizar?', consentTimeout: 30, autoAcceptOnTimeout: false, autoAcceptIfNoUser: false },
      notificationMessages: { title: 'Gama Remote', desktop: '{0} iniciou acesso à tela.', terminal: '{0} iniciou acesso ao terminal.', files: '{0} iniciou acesso aos arquivos.' },
      desktopPrivacyBarText: 'Gama Remote — sessão com {0}',
      agentCustomization: { displayName: 'Gama Remote', description: 'Agente de acesso remoto autorizado da Gama Remote', companyName: 'Gama Laser', serviceName: 'GamaRemote', fileName: 'GamaRemoteAgent' },
      lockAgentDownload: true, agentInviteCodes: false, guestDeviceSharing: false, allowSavingDeviceCredentials: false,
      limits: { maxSingleUserSessions: 5 }
    } }
  };
  if (production) config.letsencrypt = { email, names: hostname, production: true };
  return config;
}
export function validateConfig(config) {
  const s = config.settings, d = config.domains?.[''];
  if (!s || !d || d.newAccounts !== false) throw new Error('Cadastro público deve permanecer desativado.');
  if (typeof s.sessionKey !== 'string' || s.sessionKey.length < 64) throw new Error('Chave de sessão inválida.');
  if (!d.passwordRequirements?.force2factor) throw new Error('2FA obrigatório.');
  if (!d.userConsentFlags?.desktopprompt || !d.userConsentFlags?.desktopprivacybar) throw new Error('Consentimento e barra de sessão obrigatórios.');
  if (d.consentMessages?.autoAcceptOnTimeout !== false || d.consentMessages?.autoAcceptIfNoUser !== false) throw new Error('Não aceitar controle sem aprovação local.');
  if (s.tlsOffload || s.allowFraming || s.allowLoginToken || s.selfUpdate) throw new Error('Configuração fora do perfil suportado.');
  if (s.cert === 'gama.localhost' && s.portBind !== '127.0.0.1') throw new Error('Modo local não pode ser exposto na rede.');
  return config;
}

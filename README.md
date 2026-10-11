# Gama Remote

Controle de computadores Windows pelo navegador do Android, sem aplicativo de controle no celular. **Versão 0.2.0 de desenvolvimento; ainda não homologada para produção.**

O projeto está separado do Gama Estoque: repositório, banco, certificados, usuários, volumes e serviço próprios. O motor é **MeshCentral 1.2.5**, fixado no `package-lock.json`. Não se trata de um agente remoto reescrito do zero.

## O que foi integrado

- Servidor HTTPS e WebSocket relay, captura de tela e entrada de mouse/teclado pelo motor MeshCentral.
- Agente Windows nativo do MeshCentral, identificado como **Gama Remote**, instalado de forma visível pelo próprio painel e executado como serviço.
- Interface web com dispositivos online/offline, grupos, permissões, usuários e eventos do motor.
- Interface móvel nativa e barra **Controles Gama**: toque direto, touchpad, clique direito, arrastar segurando, rolagem e atalhos. Nenhum APK.
- Administrador criado localmente; sem primeira conta pública; 2FA obrigatório, cookies protegidos, limite de tentativas e timeout de inatividade.
- Aprovação local em cada sessão, notificações e barra de privacidade. Acesso não assistido **desativado**.
- Docker Compose, diagnóstico HTTPS, backup offline, scripts PowerShell de instalação assistida/diagnóstico, testes e GitHub Actions.

**A transmissão usa relay HTTPS, não WebRTC nesta versão.** Não exige TURN nem redirecionamento de portas no Windows. O servidor é parte da fronteira de confiança e precisa ser protegido; não se promete criptografia ponta a ponta entre navegador e agente.

## Impedimentos atuais

1. `npm audit` ainda aponta vulnerabilidade de alta severidade em `node-forge` (GHSA-86w9-cpqp-85rv), sem correção publicada no momento da implementação. A etapa de segurança da CI deve falhar até resolver. **Não expor esta versão à internet como produção.**
2. Ainda faltam testes reais Windows ↔ Android em redes diferentes, validação visual em navegador, UAC, reinicialização, teclado ABNT2, desempenho e revogação durante a sessão.
3. Docker e emissão/renovação Let's Encrypt foram preparados, mas não executados neste ambiente. Não há servidor publicado nem agente instalado nos seus computadores.

Veja [resultados dos testes](docs/testes.md) e [segurança](docs/seguranca.md).

## Executar localmente

Servidor: **Linux e Node.js 22 ou 24**. Windows é o computador controlado; o servidor Windows não faz parte do perfil validado.

```bash
git clone https://github.com/gamalasergama-ux/Acesso-remoto.git
cd Acesso-remoto
npm ci
npm run setup
npm run admin -- --username administrador
npm start
```

A senha é solicitada sem eco no terminal, nunca por argumento de comando. Acesse `https://gama.localhost:8443` no computador do servidor. Se o sistema não resolver esse nome, associe `gama.localhost` a `127.0.0.1` no arquivo hosts. O certificado local é de desenvolvimento; não use esse modo para testar acesso pela internet. O nome com ponto permite a interface de 2FA do MeshCentral.

`npm run setup` não sobrescreve configuração existente. Nunca apague `var/` para atualizar: ela contém a identidade do servidor e todos os dispositivos.

```bash
npm test
npm run test:integration
npm run doctor           # em outro terminal, com servidor iniciado
npm run audit:security   # falha enquanto houver o alerta upstream
```

Para usar de verdade: siga [instalação e publicação](docs/instalacao.md), depois [guia Windows e Android](docs/windows-android.md). A publicação depende de domínio e servidor próprios, resolução do alerta de segurança e homologação. GitHub armazena código; GitHub Pages não executa este serviço.

## Estrutura

| Caminho | Finalidade |
|---|---|
| `server.js`, `src/` | Inicialização, validação e exclusão mútua entre serviço/manutenção |
| `scripts/` | Configuração, administrador, diagnóstico, backup e adaptações versionadas |
| `web/` | Tema, ajuda e controles Touch Gama |
| `windows/` | Instalação assistida e diagnóstico do agente oficial |
| `var/` | Dados privados locais, ignorados pelo Git |
| `test/` | Testes de configuração, gestos e integração com servidor real |
| `docs/` | Arquitetura, operação, segurança e homologação |

## Licenças e atualizações

MeshCentral e MeshAgent são projetos de terceiros, com licenças próprias (MeshCentral: Apache-2.0). Os binários do agente vêm do pacote oficial e são preparados pelo servidor; não são incluídos neste repositório. Conserve os avisos de terceiros.

Não execute `npm audit fix --force`: a sugestão automática pode fazer downgrade inadequado do motor. Atualizações devem revisar `scripts/patch-engine.js`, o lockfile, os testes e os controles móveis. Auto-update do servidor está desativado para manter versões reproduzíveis.

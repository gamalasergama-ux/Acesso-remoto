# Segurança e bloqueio de produção

Revisão de 11/10/2026. O resultado da auditoria é temporal: repita após qualquer alteração.

## Pendência real

`node-forge` 1.4.0 é afetado por **GHSA-86w9-cpqp-85rv / CVE-2026-85393**, validação insuficiente de estrutura DigestAlgorithm em assinatura RSA PKCS#1 v1.5. A base consultada informa que não existe versão corrigida. Não foi produzida uma correção criptográfica improvisada. MeshCentral e ACME dependem da biblioteca; **produção bloqueada até remediação/revisão**. Não foi determinado neste trabalho se todas as condições de exploração são alcançáveis pelos protocolos habilitados.

Fonte: https://github.com/advisories/GHSA-86w9-cpqp-85rv

A CI roda `npm audit --omit=dev --audit-level=moderate`, sem ignorar falhas. Ela ficará vermelha por esta pendência, mesmo com os testes funcionais passando. Não confundir auditoria automatizada com pentest ou certificação.

## Correções aplicadas nas dependências

- `compression` 1.8.2: atualização para corrigir vazamento/DoS (GHSA-vc2v-76pw-4v95).
- `qs` 6.16.0: atualização das correções conhecidas de parsing/DoS.
- `axios` 1.20.0: substitui 0.26.1 herdado de ACME; adaptação usa API pública `getAdapter('http')`. O transporte HTTP local foi testado, mas emissão/renovação ACME real não.

MeshCentral verifica versões em runtime separadamente do lockfile. `scripts/patch-engine.js` alinha a versão de compression e corrige a importação privada do adapter ACME. A adaptação é pequena, idempotente e falha se os marcadores mudarem. Não use `npm ci --ignore-scripts` nesta aplicação. Ao trocar a versão do motor, reavalie/reduza estes patches.

## Fronteiras e operação

- Servidor e administrador são confiáveis e podem controlar computadores inscritos. Comprometimento do VPS tem impacto elevado.
- TLS direto; sem alegação de E2EE entre Android e Windows. Não desative verificação de certificados.
- Cadastro público fechado e primeira conta exclusivamente local antes do servidor iniciar.
- Senha forte + 2FA; sem credenciais no código. Proteja `var/`, EXEs inscritos e snapshots. Não envie certificados, banco ou logs privados a issues.
- Consentimento/indicador sempre ligados no perfil. Nada de acesso oculto, autoaprovação ou instalação silenciosa.
- Instalação como serviço permite iniciar junto do Windows, mas não elimina a exigência de consentimento.
- NeDB: uma instância por volume. Backup offline e teste de restauração antes de produção.
- Retenção de eventos configurada em 90 dias. Logs de autenticação exigem política própria de rotação/retenção.
- Sem gravação de tela automática ou coleta de conteúdo de teclado pelo código Gama. O motor registra eventos operacionais.
- Sem scanner de rede/AMT ou necessidade de abrir RDP/VNC no roteador do Windows.

## Antes da liberação

Resolver alerta upstream; executar auditoria e CI; revisar permissões; testar negação e timeout de consentimento, isolamento entre contas/grupos, MFA, bloqueio de tentativas, logout, revogação durante sessão, reinício, perda de rede, restauração e certificados públicos. Ver matriz em `testes.md`.

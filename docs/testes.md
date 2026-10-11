# Validação — 11/10/2026

## Ambiente e alcance

Linux, Node.js 24.19.0, npm 11.9.0. O teste de integração sobe **o MeshCentral real**, com banco temporário, certificados TLS próprios, administrador temporário e clientes HTTP/WebSocket locais. Não usa um simulador de servidor. Nenhum agente Windows foi conectado.

## Testes automatizados

- `npm test`: 12 testes de configuração, validação de domínio/portas, obrigatoriedade de MFA/consentimento, gestos, cancelamento, limites do cursor, dois dedos e adapter ACME/Axios contra HTTP local.
- `npm run test:integration`: inicialização bloqueada antes de criar administrador; login HTTPS; assets Gama; cadastro público negado; senha errada; cookies HttpOnly/Secure; cadastro TOTP pela API autenticada; rejeição sem segundo fator/com código inválido e aceitação com TOTP válido; relay anônimo; trava entre instâncias e persistência após reinício.
- `npm run audit:security`: **falha esperada por alerta não resolvido de node-forge**, também atribuído aos dependentes MeshCentral e acme-client. São três entradas de alta severidade para uma origem restante. Não foi ignorado nem reclassificado.
- Verificação sintática dos scripts JavaScript e `git diff --check`.

O teste de relay usa ID de sessão não autorizado. Um WebSocket sem ID pode aguardar identificação e não representa sozinho controle concedido. A troca de fechamento do relay pode demorar cerca de 30 segundos, pois o motor pausa o socket durante autenticação; o teste aguarda o fechamento. Isso não comprova revogação instantânea de uma sessão real já ativa.

## Não executado neste ambiente

- Navegador visual: tentativa de instalar Chromium pelo Playwright falhou no download (arquivo inválido/truncado). Não há screenshot ou validação visual alegada.
- Windows, PowerShell, instalação, assinatura percebida pelo Windows, serviço, captura/entrada/UAC e reinício.
- Android/Chrome real, teclado IME/ABNT2, touchscreen, landscape e zoom.
- Docker/Compose: binário Docker indisponível. O workflow inclui build e validação do Compose, mas resultado depende da execução no GitHub.
- Certificado Let's Encrypt real, renovação e redes distintas.
- Pentest, carga, retenção/rotação prolongada e restauração em servidor novo.

## Homologação obrigatória antes de produção

Registre versão Windows, modelo/versão Android/Chrome, commit, data, rede e evidências sem credenciais. Não marque “aprovado” apenas porque um botão aparece.

| Cenário | Resultado esperado | Estado |
|---|---|---|
| TLS público e login/2FA Android | Certificado válido; segundo fator exigido | Pendente |
| Instalação Windows x64 autorizada | Agente visível, grupo correto, status online | Pendente |
| Reiniciar Windows | Serviço reinicia; sem permitir sessão sem consentimento | Pendente |
| Aceitar, negar e ignorar solicitação | Só aceitar libera tela/entrada; 30s sem resposta nega | Pendente |
| Tela com escala 100/125/150% | Cursor alinhado, sem deslocamento | Pendente |
| Clique, duplo, direito e arrastar | Aplicativos respondem sem cliques duplicados | Pendente |
| Interromper arraste/perder foco | Botão não permanece pressionado | Pendente |
| Dois dedos/rolagem | Direção e velocidade corretas | Pendente |
| Teclado Gboard/Samsung e ABNT2 | Acentos, ç, números e atalhos corretos | Pendente |
| Retrato/paisagem, zoom, tela cheia | Barra acessível sem cobrir ações essenciais | Pendente |
| Dois monitores | Monitor selecionado e coordenadas corretos | Pendente |
| UAC, tela bloqueada, login Windows | Comportamento observado e limites registrados | Pendente |
| 4G/5G ↔ Wi-Fi | Sessão HTTPS estável por pelo menos 15 minutos | Pendente |
| Perder/restaurar internet | Sessão encerra/reconecta de forma compreensível | Pendente |
| Conta sem permissão de um grupo | Não lista/não controla dispositivo restrito | Pendente |
| Remover permissão durante acesso | Bloqueia novas sessões; verificar término da aberta | Pendente |
| Logout e códigos MFA reutilizados | Sessão/código não autorizam novos acessos indevidos | Pendente |
| Desinstalar agente | Serviço removido, não reinscreve após reinício | Pendente |
| Restaurar backup em ambiente isolado | Contas, certificados e agente reconectam | Pendente |
| Atualizar e rollback | Identidade e dados preservados | Pendente |

## Critério de conclusão

A entrega de código não equivale a sistema concluído. Liberação exige auditoria sem pendências relevantes, CI verificada, instalação em ambiente real e matriz acima documentada. Desempenho semelhante ao AnyDesk ainda não foi medido.

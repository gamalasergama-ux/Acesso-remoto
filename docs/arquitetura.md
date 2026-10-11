# Arquitetura implementada — Gama Remote 0.2

## Decisão

O repositório inicial não continha servidor, frontend ou agente: somente README, plano e dependências. Em vez de inventar captura Windows, protocolo de entrada e autenticação, integramos MeshCentral 1.2.5 e seu MeshAgent. O Gama Remote adiciona configuração restrita, bootstrap local, identidade, controles Touch, operação e testes.

## Caminho de uma sessão

1. Administrador cria usuário e grupo pelo painel. Credenciais ficam no banco próprio do MeshCentral.
2. Agente instalado explicitamente no Windows faz conexão de saída autenticada ao servidor HTTPS.
3. Android abre o servidor no navegador, faz login/2FA e escolhe um computador autorizado.
4. O motor verifica usuário, grupo e dispositivo. O agente pede consentimento local; timeout de 30s rejeita.
5. O relay WebSocket sobre TLS transporta tela e entradas. Os controles Gama enviam apenas pela conexão autenticada do motor.
6. O usuário encerra; eventos ficam no banco e autenticações em `data/auth.log`.

O servidor tem uma única instância e armazenamento NeDB persistente. A trava `runtime.lock` impede manutenção simultânea pelo wrapper. Não execute MeshCentral diretamente nem compartilhe o volume entre réplicas; isso contornaria a trava. Redis, Supabase, APIs do Gama Estoque e segredos comerciais não são utilizados.

## Autenticação e consentimento

Cadastro público fechado, bootstrap via CLI com senha oculta e hash enviado por stdin ao subprocesso. O servidor recusa iniciar sem administrador existente, pois o motor permite a primeira conta quando o banco está vazio. 2FA obrigatório; o usuário precisa cadastrar o segundo fator no primeiro acesso e guardar códigos de recuperação. Não é necessário instalar um app de controle Android; o segundo fator pode exigir autenticador/chave compatível.

Consentimento para desktop, arquivos e terminal obrigatório no servidor, com notificações e barra visível. Sem acesso não assistido, shell oculto ou instalação silenciosa. Instalar o serviço não libera automaticamente a sessão. A disponibilidade do recurso de bloquear UAC, tela de login ou sessão bloqueada não é prometida; com consentimento obrigatório, pode não ser possível autorizar nesses estados.

## TLS e transporte

TLS termina no próprio MeshCentral. Portas do contêiner: 8443 (HTTPS) e 8080 (HTTP, redirecionamento e ACME), publicadas como 443/80. AMT/MPS desativado. HTTP puro para controle, TLS offload e login por token não fazem parte deste perfil.

Relay HTTPS é a base funcional; WebRTC está desativado. A escolha dispensa TURN, mas usa banda e CPU do servidor. Não há medição real de latência, FPS ou capacidade. Sem promessa de equivalência de desempenho com AnyDesk.

## Interface e limites da integração

`webPublicPath` usa o mecanismo de extensões do MeshCentral para carregar `styles/custom.css` e `scripts/custom.js`. A implementação de gestos é separada e testável. A barra Gama só fica visível quando uma conexão de desktop está ativa e as permissões conhecidas permitem entrada. Troca de sessão, perda de foco e cancelamento liberam botões pressionados.

O adaptador depende de APIs globais da interface MeshCentral 1.2.5. Por isso o motor está fixado e toda atualização requer teste de compatibilidade. Os controles nativos continuam disponíveis quando Touch Gama está desativado. Não são mantidos templates inteiros copiados do motor.

## O que não foi implementado como produto próprio

Pareamento por código efêmero, instalador Windows próprio assinado por autoridade pública, MFA próprio, aplicativo Android, codec de vídeo próprio e acesso não assistido. A inscrição usa download autenticado do agente específico de um grupo; o arquivo contém a configuração de inscrição e deve ser tratado como sensível. Um instalador vazado precisa de resposta operacional e rotação/recriação do grupo; revogar um usuário não invalida por si só todo instalador já baixado.

# Instalação e publicação

## Estado antes de publicar

Esta entrega é para desenvolvimento/homologação. Há uma dependência criptográfica com alerta alto sem correção publicada; veja `seguranca.md`. Não foi contratado/configurado servidor, domínio ou DNS. As instruções abaixo ficam preparadas para a publicação **depois** de resolver o alerta e concluir a homologação. Não existe URL pública nesta entrega.

## Teste local Linux

Use Node 22/24, `npm ci`, `npm run setup`, `npm run admin -- --username administrador` e `npm start`. Senha de 14–128 caracteres com maiúscula, minúscula, número e símbolo, digitada em terminal interativo. Abra `https://gama.localhost:8443` somente no host local; associação hosts `127.0.0.1 gama.localhost` se necessário. O certificado é local. Em produção não ignore alertas de certificado.

Dados em `var/data`, uploads em `var/files`, backups em `var/backups`. Pode mudar a raiz com `GAMA_HOME`, que não é um segredo. Gere a configuração na mesma localização onde executará o servidor: ela contém caminhos absolutos.

Se o processo terminar abruptamente, a trava pode persistir. Confirme pelo gerenciador de processos que o Gama Remote e o MeshCentral pararam antes de excluir `var/runtime.lock`. Nunca remova a trava apenas para iniciar uma segunda instância.

## VPS Linux com Docker Compose

Use servidor dedicado ao projeto, disco persistente, domínio próprio e acesso administrativo. Um ponto de partida de laboratório é 2 vCPU e 2 GB de RAM; não é dimensionamento medido. Faça backup fora do servidor. Não use serviço que suspende processos ou apaga discos efêmeros.

1. Crie registro DNS A do domínio para o VPS. Se houver AAAA, configure IPv6 corretamente ou remova o registro inválido. Comece sem proxy/CDN no DNS.
2. Clone o repositório, copie `.env.example` para `.env` e construa:

```bash
docker compose build
docker compose run --rm gama-remote node scripts/setup.js --production --hostname remote.seudominio.com.br --email voce@seudominio.com.br
docker compose run --rm gama-remote node scripts/admin.js --username administrador
```

Troque os exemplos por domínio/e-mail reais. O comando `run` não publica portas e permite criar o administrador antes de expor o servidor. O volume mantém a identidade. Não rode `setup` novamente para atualizar nem apague o volume.

3. Execute testes e auditoria no código. **A auditoria desta revisão falha por um alerta conhecido; não prossiga enquanto não estiver resolvido.** Após correção e homologação, ajuste `GAMA_BIND_ADDRESS=0.0.0.0` no `.env`, permita TCP 80/443 no firewall do VPS e inicie:

```bash
docker compose up -d
docker compose logs --tail=100 gama-remote
docker compose exec gama-remote node scripts/doctor.js
```

A emissão Let's Encrypt usa HTTP-01 na porta 80 e requer DNS/porta acessíveis externamente. O primeiro início gera certificados e prepara agentes; pode levar minutos. Aguarde certificado público válido antes de login real ou inscrição dos computadores. O healthcheck deve falhar se o servidor ainda estiver usando certificado local em produção. Porta 80 permanece para renovação/redirecionamento; desktop passa por HTTPS.

4. Abra `https://remote.seudominio.com.br`, configure 2FA, guarde códigos de recuperação e crie grupo de computadores. Use uma conta operacional com permissões mínimas; não compartilhe o administrador. Instale um único agente de teste primeiro.
5. Execute a matriz de `testes.md` em Windows e Android. Só amplie a instalação após resultados registrados.

O Compose usa usuário não root, sem capacidades Linux, `no-new-privileges`, reinício automático e rotação dos logs Docker. Logs em `data/auth.log` não têm rotação própria neste wrapper: configure rotação offline no host e controle espaço. Não monte o socket Docker nem diretórios do Gama Estoque.

## Backup, restauração e atualização

Backup requer serviço parado para consistência do NeDB:

```bash
docker compose stop gama-remote
docker compose run --rm gama-remote node scripts/backup.js
docker compose up -d
```

O snapshot fica no volume, em `var/backups/`, e contém certificados privados, configuração, contas e dados. **Não é criptografado.** Transfira uma cópia criptografada para armazenamento separado; apenas deixar no mesmo volume não protege contra perda do VPS. Não envie esse material ao GitHub. Não há política automática de retenção.

Para restaurar, pare o serviço, guarde uma cópia do estado atual e restaure as pastas `data/` e `files/` do snapshot em um volume vazio, mantendo o domínio e os caminhos `/app/var`/`/app/web`. Ajuste propriedade para UID/GID 1000. Não restaure `runtime.lock`. Valide login, segundo fator, certificado e reconexão do agente. Recriar certificados de agente rompe a confiança dos dispositivos. Restauração em outro domínio exige planejamento/reinscrição; não basta alterar DNS.

Atualização: pare, faça backup, atualize código e lockfile revisados, rode testes/auditoria e reconstrua a imagem. O script de patch falha com versão de motor diferente até ser revisado. Retenha imagem anterior e snapshot consistente para rollback. Migrações do motor podem impedir downgrade do banco; nunca inicie versão antiga sobre dados novos sem verificar compatibilidade.

## Onde publicar

GitHub é o código. GitHub Pages e hospedagem estática não servem. A configuração fornecida visa VPS Linux com Docker e acesso direto 80/443; Render e proxies externos ainda precisam de configuração e testes próprios. Não reutilize banco, credenciais, domínio de aplicação ou serviço do Gama Estoque.

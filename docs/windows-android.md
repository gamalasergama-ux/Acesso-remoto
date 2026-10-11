# Windows e Android

## Inscrever um Windows autorizado

1. Após homologar o servidor, faça login com 2FA pelo navegador do Windows.
2. Crie um grupo de computadores, atribua as permissões necessárias ao usuário operacional e clique em adicionar agente. Escolha Windows e a arquitetura correta, normalmente x64.
3. Baixe o EXE **do seu servidor**. Não publique o instalador nem o `.msh` em repositório: eles carregam dados de inscrição do grupo.
4. Execute o instalador visível, aceite o UAC e selecione instalar. O serviço deve aparecer como `GamaRemote`/Gama Remote e iniciar junto do Windows. Use o diagnóstico para confirmar; nome/assinatura e reinício ainda dependem de teste real.
5. Aguarde o computador ficar online no painel e renomeie para algo reconhecível, por exemplo `Escritorio-01`.

O script opcional `windows/Install-GamaRemote.ps1` verifica disponibilidade HTTPS, mostra hash/assinatura e abre o EXE com elevação, depois de confirmação. Ele não baixa binários, não instala silenciosamente e não ignora antivírus. Pode executar o instalador diretamente pela interface se sua política PowerShell não permitir scripts. Não desative proteções do Windows.

```powershell
.\windows\Install-GamaRemote.ps1 -AgentPath "$env:USERPROFILE\Downloads\GamaRemoteAgent.exe" -ServerUri "https://remote.seudominio.com.br/"
.\windows\Test-GamaRemote.ps1 -ServerUri "https://remote.seudominio.com.br/"
```

## Controlar pelo Android

Abra o endereço HTTPS no Chrome, entre com sua conta/2FA, selecione o computador e abra Área de trabalho. Toque em Conectar e aceite o pedido no Windows. Tela cheia e modo paisagem ajudam.

A interface nativa tem teclado, clique direito, toque e touchpad. A barra opcional **Controles Gama** oferece:

| Ação | Controle |
|---|---|
| Mover cursor sem cobrir alvo | Touchpad |
| Clicar onde tocou | Toque direto |
| Clique esquerdo/duplo | Um/dois toques |
| Arrastar | Manter parado por 450 ms, mover e soltar |
| Rolagem | Dois dedos ou botões ↑/↓ |
| Contexto | Clique direito |
| Texto | Teclado da interface móvel |
| Atalhos | Enter, Tab, Esc, Ctrl+C, Ctrl+V |
| Encerrar | Desconectar |

Ctrl+C/V atuam no Windows; não sincronizam automaticamente a área de transferência do Android. Zoom usa o recurso nativo da tela, não um novo gesto de pinça do Gama. A barra não envia comandos sem sessão autenticada ativa e permissões conhecidas de entrada.

## Encerrar/revogar

Desconecte no celular e confirme que o Windows deixou de mostrar sessão ativa. Para interromper localmente, use a barra de privacidade do agente quando disponível; se necessário, pare o serviço GamaRemote pelo gerenciador de serviços com uma conta autorizada. A reação a cada mecanismo ainda deve ser medida na homologação.

Para remover permanentemente um computador, desinstale o agente pelo instalador/gerenciador do Windows e remova o registro no painel. Apenas apagar o computador do painel pode permitir reinscrição do agente instalado. Para revogar uma pessoa, remova direitos dos grupos, encerre sessões e bloqueie/exclua a conta. **Teste a interrupção de sessão já aberta**: não presuma revogação instantânea sem verificar.

Sem ninguém no Windows para aceitar, este perfil não autoriza acesso. Desempenho, múltiplos monitores, teclado ABNT2, tela bloqueada e UAC não foram homologados.

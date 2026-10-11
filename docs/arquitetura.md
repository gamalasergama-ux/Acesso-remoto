# Gama Remote — arquitetura inicial

## Objetivo
Controlar um computador Windows autorizado pelo navegador do celular Android, sem instalar app no celular.

## Componentes
1. **Web client (PWA)**: interface responsiva, exibição da tela e entrada Touch/mouse/teclado.
2. **Signaling server**: autenticação, autorização, estabelecimento de sessão WebRTC e estado online/offline.
3. **Windows agent**: serviço/aplicativo local instalado com consentimento do proprietário, captura de tela e injeção de entradas autorizadas.
4. **STUN/TURN**: conexão WebRTC através de NAT/firewalls; TURN exige infraestrutura e pode gerar custos.
5. **Supabase**: usuários, dispositivos autorizados, sessões e auditoria (sem armazenar senhas ou tokens em código).

## MVP — ordem
- [ ] Login seguro e cadastro de dispositivos
- [ ] Agente Windows com pareamento explícito e opção de revogar acesso
- [ ] Canal de sinalização autenticado
- [ ] Streaming de tela WebRTC com criptografia
- [ ] Controle Touch: toque=clique, arrastar, clique direito, rolagem e teclado virtual
- [ ] Encerrar sessão imediatamente e registrar acessos
- [ ] Teste Android Chrome ↔ Windows em redes distintas

## Regras de segurança
- Nenhuma porta de controle remoto aberta diretamente à internet.
- Acesso somente a dispositivos de propriedade do usuário ou expressamente autorizados.
- Pareamento por código temporário e confirmação local inicial.
- Acesso não assistido desativado por padrão; ativação explícita com autenticação forte.
- Tokens de curta duração; credenciais apenas em variáveis de ambiente/secret manager.
- TLS obrigatório, autorização em cada sessão, logs de auditoria e botão de revogação.
- Não oferecer modo invisível ou instalação silenciosa.

## Limites técnicos
O GitHub hospeda o código, **não** executa o controle remoto. O celular usa somente navegador; o Windows requer agente nativo instalado. O Render pode hospedar sinalização, mas a conectividade TURN pode precisar de outro provedor. Captura de tela, UAC, tela de login e sessões bloqueadas exigem tratamento específico e testes no Windows.

## Próximos passos
Criar o esqueleto do frontend e servidor; implementar o pareamento e depois integrar o agente Windows. Não considerar o acesso remoto funcional até testar ponta a ponta.

#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$AgentPath,
    [Parameter(Mandatory=$true)][uri]$ServerUri
)
$ErrorActionPreference = 'Stop'
if ($ServerUri.Scheme -ne 'https' -or $ServerUri.UserInfo -or $ServerUri.Query -or $ServerUri.Fragment -or $ServerUri.AbsolutePath -ne '/') {
    throw 'Use somente a origem HTTPS do seu servidor, sem usuário, caminho ou token.'
}
$resolved = (Resolve-Path -LiteralPath $AgentPath).Path
if ([IO.Path]::GetExtension($resolved) -ne '.exe') { throw 'Selecione o agente .exe baixado do seu próprio Gama Remote.' }
# Does not bypass certificate verification, SmartScreen or antivirus.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$response = Invoke-WebRequest -Uri $ServerUri -UseBasicParsing -TimeoutSec 15
if ($response.StatusCode -ne 200) { throw 'Servidor indisponível.' }
$signature = Get-AuthenticodeSignature -FilePath $resolved
$hash = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash
Write-Host "Servidor: $($ServerUri.AbsoluteUri)"
Write-Host "Arquivo: $resolved"
Write-Host "SHA256: $hash"
Write-Host "Assinatura: $($signature.Status)"
if ($signature.Status -eq 'HashMismatch') { throw 'Assinatura indica arquivo adulterado.' }
Write-Host 'Confira a origem e o hash com o administrador. O agente do servidor pode usar assinatura privada não reconhecida pelo Windows.'
Write-Host 'A instalação será VISÍVEL. Clique em Install na janela do agente; ele iniciará com o Windows.'
if ((Read-Host 'Para abrir o instalador neste computador autorizado, digite INSTALAR') -cne 'INSTALAR') { throw 'Instalação cancelada.' }
Start-Process -FilePath $resolved -Verb RunAs -Wait
Write-Host 'Instalador encerrado. Confira no painel se o computador ficou online. Isto não confirma a instalação nem o controle remoto.'

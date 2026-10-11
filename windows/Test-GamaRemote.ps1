#Requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory=$true)][uri]$ServerUri)
$ErrorActionPreference = 'Stop'
if ($ServerUri.Scheme -ne 'https' -or $ServerUri.UserInfo -or $ServerUri.Query -or $ServerUri.Fragment -or $ServerUri.AbsolutePath -ne '/') { throw 'Use a origem HTTPS do servidor.' }
$service = Get-Service -Name 'GamaRemote' -ErrorAction SilentlyContinue
if ($null -eq $service) { Write-Host 'Serviço GamaRemote não encontrado. Verifique a instalação ou o nome no services.msc.' }
else { $service | Select-Object Name, Status, StartType | Format-Table }
$tcp = Test-NetConnection -ComputerName $ServerUri.DnsSafeHost -Port $ServerUri.Port -WarningAction SilentlyContinue
Write-Host "TCP acessível: $($tcp.TcpTestSucceeded)"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$r = Invoke-WebRequest -Uri $ServerUri -UseBasicParsing -TimeoutSec 15
Write-Host "HTTPS: $($r.StatusCode)"
Write-Host 'Próximo teste: Android em outra rede, login + 2FA, conexão à tela e aprovação local. Diagnóstico não comprova sessão remota.'
if ($null -eq $service -or $service.Status -ne 'Running' -or !$tcp.TcpTestSucceeded) { exit 1 }

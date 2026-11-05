
# NEBULA ROBLOX FACTORY PRO
# Local VirtualBox Agent
# Run in PowerShell on your own Windows PC.

$ErrorActionPreference = "Stop"
$Port = 8765
$VmName = "NEBULA-WINDOWS-10"
$Ram = 8192
$Cpu = 4
$Disk = 80
$Root = "$env:USERPROFILE\NEBULA"

New-Item -ItemType Directory -Force -Path $Root | Out-Null

function Get-VBox {
    $cmd = Get-Command VBoxManage.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $paths = @(
        "$env:ProgramFiles\Oracle\VirtualBox\VBoxManage.exe",
        "${env:ProgramFiles(x86)}\Oracle\VirtualBox\VBoxManage.exe"
    )

    foreach ($path in $paths) {
        if (Test-Path $path) { return $path }
    }

    return $null
}

function Run-VBox($argsList) {
    $vbox = Get-VBox
    if (-not $vbox) {
        throw "VirtualBox не найден"
    }

    $result = & $vbox @argsList 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($result -join "`n")
    }

    return ($result -join "`n")
}

function Get-VMList {
    Run-VBox @("list", "vms")
}

function Get-VMStatus {
    Run-VBox @("showvminfo", $VmName, "--machinereadable")
}

function Create-VM {
    $existing = Run-VBox @("list", "vms")

    if ($existing -match [regex]::Escape($VmName)) {
        return "VM уже существует"
    }

    Run-VBox @(
        "createvm",
        "--name", $VmName,
        "--ostype", "Windows10_64",
        "--register"
    ) | Out-Null

    Run-VBox @(
        "modifyvm", $VmName,
        "--memory", "$Ram",
        "--cpus", "$Cpu"
    ) | Out-Null

    Run-VBox @(
        "createmedium", "disk",
        "--filename", "$Root\$VmName.vdi",
        "--size", "$($Disk * 1024)"
    ) | Out-Null

    Run-VBox @(
        "storagectl", $VmName,
        "--name", "SATA",
        "--add", "sata",
        "--controller", "IntelAhci"
    ) | Out-Null

    Run-VBox @(
        "storageattach", $VmName,
        "--storagectl", "SATA",
        "--port", "0",
        "--device", "0",
        "--type", "hdd",
        "--medium", "$Root\$VmName.vdi"
    ) | Out-Null

    return "VM создана"
}

function Send-Response($stream, $status, $body) {
    $bytes = [Text.Encoding]::UTF8.GetBytes(
        ($body | ConvertTo-Json -Depth 5)
    )

    $header = "HTTP/1.1 $status`r`n" +
              "Content-Type: application/json; charset=utf-8`r`n" +
              "Access-Control-Allow-Origin: http://localhost`r`n" +
              "Access-Control-Allow-Methods: GET,POST,OPTIONS`r`n" +
              "Access-Control-Allow-Headers: Content-Type`r`n" +
              "Content-Length: $($bytes.Length)`r`n" +
              "Connection: close`r`n`r`n"

    $headBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headBytes, 0, $headBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
}

$vbox = Get-VBox
if (-not $vbox) {
    Write-Host "VirtualBox не найден. Установи его с virtualbox.org" -ForegroundColor Red
    exit 1
}

$listener = [Net.Sockets.TcpListener]::new(
    [Net.IPAddress]::Loopback, $Port
)

$listener.Start()

Write-Host "NEBULA Agent запущен: http://127.0.0.1:$Port"
Write-Host "Остановить: Ctrl+C"

while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()

    try {
        $reader = [IO.StreamReader]::new($stream)
        $request = $reader.ReadLine()
        $parts = $request.Split(" ")

        $method = $parts[0]
        $path = $parts[1]

        while ($reader.ReadLine() -ne "") {}

        if ($method -eq "OPTIONS") {
            Send-Response $stream "204 No Content" @{}
        }
        elseif ($path -eq "/health") {
            Send-Response $stream "200 OK" @{
                online = $true
                virtualBox = $true
            }
        }
        elseif ($path -eq "/vms") {
            Send-Response $stream "200 OK" @{
                result = Get-VMList
            }
        }
        elseif ($path -eq "/create") {
            Send-Response $stream "200 OK" @{
                result = Create-VM
            }
        }
        elseif ($path -eq "/start") {
            Run-VBox @("startvm", $VmName, "--type", "gui") | Out-Null
            Send-Response $stream "200 OK" @{ result = "VM запущена" }
        }
        elseif ($path -eq "/stop") {
            Run-VBox @("controlvm", $VmName, "acpipowerbutton") | Out-Null
            Send-Response $stream "200 OK" @{ result = "Команда остановки отправлена" }
        }
        elseif ($path -eq "/status") {
            Send-Response $stream "200 OK" @{
                result = Get-VMStatus
            }
        }
        else {
            Send-Response $stream "404 Not Found" @{
                error = "Unknown endpoint"
            }
        }
    }
    catch {
        Send-Response $stream "500 Internal Server Error" @{
            error = $_.Exception.Message
        }
    }
    finally {
        $stream.Dispose()
        $client.Close()
    }
}

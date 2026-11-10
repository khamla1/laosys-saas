$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d `"C:\Multi-Tenant SaaS`" && npx tsx scripts/backup.ts"
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$TaskName = "LAOSYS_Daily_Backup"

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Runs daily MongoDB backup for LAOSYS at 2:00 AM" -Force
Write-Host "Scheduled task $TaskName has been successfully created to run daily at 2:00 AM."

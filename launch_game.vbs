Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "F:\AI Angentic\Airobiz Supersonic Clone"
WshShell.Run """node_modules\electron\dist\electron.exe"" electron\main.cjs", 0, False

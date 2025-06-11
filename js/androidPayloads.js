// Android specific logic for payload generation and UI updates

function updateAndroidPayloadFields(initialType = null, initialValue = '') {
    const payloadTypeSelect = document.getElementById('androidPayloadType');
    const androidPayloadFieldsContainer = document.getElementById('androidPayloadFields');
    const selectedType = initialType || payloadTypeSelect.value;

    let fieldsHtml = '';
    switch (selectedType) {
        case 'adb_command':
            fieldsHtml = `
                <label for="adbCommand">ADB Shell Command:</label>
                <input type="text" id="adbCommand" value="${initialValue}" placeholder="e.g., pm list packages">
                <small>Command to run on the device via 'adb shell'. Requires ADB enabled.</small>
            `;
            break;
        case 'termux_script':
            fieldsHtml = `
                <label for="termuxScript">Termux Script:</label>
                <textarea id="termuxScript" rows="10" placeholder="e.g., pkg install figlet\nfiglet HACKED">${initialValue}</textarea>
                <small>Script to be executed within the Termux app on Android.</small>
            `;
            break;
        case 'social_engineering':
            fieldsHtml = `
                <label for="socialEngText">Social Engineering Message:</label>
                <textarea id="socialEngText" rows="5" placeholder="e.g., Your phone has been compromised! Click here to fix: [LINK]">${initialValue}</textarea>
                <small>Text for a pop-up, notification, or message to trick the user. (This is theoretical, Digispark does not directly display messages on Android without a custom script/app)</small>
            `;
            break;
    }
    androidPayloadFieldsContainer.innerHTML = fieldsHtml;
    attachAndroidEventListeners();
    generateAndroidCode(); // Regenerate code after updating fields
}

function generateAndroidCode() {
    const payloadType = document.getElementById('androidPayloadType').value;
    let code = '';

    switch (payloadType) {
        case 'adb_command':
            const adbCommand = document.getElementById('adbCommand')?.value || '';
            if (adbCommand) {
                code = `# ADB Command for Android Device (Requires USB Debugging Enabled & Authorized)\n`;
                code += `# Run this command from your computer's terminal:\n\n`;
                code += `adb shell "${adbCommand}"\n`;
            } else {
                code = `// Enter an ADB command to generate the payload.\n`;
            }
            break;
        case 'termux_script':
            const termuxScript = document.getElementById('termuxScript')?.value || '';
            if (termuxScript) {
                code = `# Termux Script for Android Device (Requires Termux App)\n`;
                code += `# Copy this script to a file (e.g., 'script.sh') on your Android device and run with 'bash script.sh' in Termux.\n\n`;
                code += `#!/bin/bash\n\n`;
                code += termuxScript;
            } else {
                code = `// Enter a Termux script to generate the payload.\n`;
            }
            break;
        case 'social_engineering':
            const socialEngText = document.getElementById('socialEngText')?.value || '';
            if (socialEngText) {
                code = `// Social Engineering Text / Message (For Manual Delivery or Integration with another tool)\n\n`;
                code += `"${socialEngText}"\n`;
                code += `\n// This is not a direct executable payload. It's content for a phishing attempt or a fake notification.\n`;
            } else {
                code = `// Enter social engineering text to generate the payload.\n`;
            }
            break;
    }
    document.getElementById('outputCode').value = code;
}

function attachAndroidEventListeners() {
    document.getElementById('androidPayloadType').removeEventListener('change', generateAndroidCode);
    document.getElementById('androidPayloadType').addEventListener('change', generateAndroidCode);

    document.getElementById('androidPayloadFields').querySelectorAll('input, textarea').forEach(element => {
        element.removeEventListener('input', generateAndroidCode);
        element.addEventListener('input', generateAndroidCode);
    });
}

function getAndroidPayloadValue() {
    const payloadType = document.getElementById('androidPayloadType').value;
    switch (payloadType) {
        case 'adb_command':
            return document.getElementById('adbCommand')?.value || '';
        case 'termux_script':
            return document.getElementById('termuxScript')?.value || '';
        case 'social_engineering':
            return document.getElementById('socialEngText')?.value || '';
        default:
            return '';
    }
}
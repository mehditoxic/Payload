// Utility functions shared across different payload types

function copyCode() {
    const outputCode = document.getElementById('outputCode');
    outputCode.select();
    document.execCommand('copy');
    alert('Payload copied to clipboard!');
}

function downloadCode() {
    const outputCode = document.getElementById('outputCode');
    const activeTab = document.querySelector('.tab-button.active').id;
    let filename = '';
    let fileExtension = '';

    if (activeTab === 'digispark-tab' || activeTab === 'blueprints-tab') { // Check if Digispark or a blueprint generating Digispark code
        filename = "payload.ino";
        fileExtension = "ino";
    } else if (activeTab === 'android-tab') {
        filename = "android_payload.sh";
        fileExtension = "sh";
    } else {
        filename = "payload.txt";
        fileExtension = "txt";
    }

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputCode.value));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');

    // Activate the corresponding tab button
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');

    // Regenerate code for the newly active tab
    if (tabId === 'digispark') {
        generateDigisparkCode();
    } else if (tabId === 'android') {
        generateAndroidCode();
    } else if (tabId === 'blueprints') {
        // Blueprints will regenerate on selection
        document.getElementById('blueprintSelect').value = ''; // Reset blueprint selection
        document.getElementById('blueprintDescription').innerHTML = '<p>Select a blueprint to see its description and generated payload.</p>';
        document.getElementById('outputCode').value = ''; // Clear output
    }
}

// Function to save configuration
function saveConfig() {
    const currentTab = document.querySelector('.tab-button.active').id;
    let config = {};

    if (currentTab === 'digispark-tab' || currentTab === 'blueprints-tab') {
        config = {
            type: 'digispark',
            os: document.getElementById('osSelect').value,
            initialDelay: document.getElementById('initialDelay').value,
            actions: []
        };

        document.querySelectorAll('#digisparkPayloadActions .action-item').forEach(actionItem => {
            const actionId = actionItem.id;
            const type = actionItem.querySelector('select').value;
            const delay = parseInt(actionItem.querySelector(`#${actionId}-delay`).value);
            let value = '';

            switch (type) {
                case 'keyboard':
                    value = actionItem.querySelector(`#${actionId}-text`).value;
                    break;
                case 'press_key':
                    value = actionItem.querySelector(`#${actionId}-key`).value;
                    break;
                case 'combined_keys':
                    const modifiers = Array.from(actionItem.querySelectorAll(`input[type="checkbox"]`))
                        .filter(cb => cb.checked)
                        .map(cb => cb.dataset.modifier);
                    const combinedKey = actionItem.querySelector(`#${actionId}-combined-key`).value;
                    value = { modifiers, key: combinedKey };
                    break;
                case 'mouse_move':
                    const mouseX = parseInt(actionItem.querySelector(`#${actionId}-mouse-x`).value);
                    const mouseY = parseInt(actionItem.querySelector(`#${actionId}-mouse-y`).value);
                    value = `${mouseX},${mouseY}`;
                    break;
                case 'mouse_click':
                    value = actionItem.querySelector(`#${actionId}-mouse-button`).value;
                    break;
                case 'mouse_scroll':
                    value = parseInt(actionItem.querySelector(`#${actionId}-mouse-scroll`).value);
                    break;
           //     case 'consumer_control':
              //      value = actionItem.querySelector(`#${actionId}-consumer`).value;
              //      break;
                case 'run_dialog':
                    value = actionItem.querySelector(`#${actionId}-command`).value;
                    break;
                case 'delay':
                    value = parseInt(actionItem.querySelector(`#${actionId}-custom-delay`).value);
                    break;
                case 'comment':
                    value = actionItem.querySelector(`#${actionId}-comment-text`).value;
                    break;
            }
            config.actions.push({ type, value, delay });
        });
    } else if (currentTab === 'android-tab') {
        config = {
            type: 'android',
            payloadType: document.getElementById('androidPayloadType').value,
            value: getAndroidPayloadValue()
        };
    } else if (currentTab === 'blueprints-tab') {
        // Blueprints don't have their own config to save beyond selection,
        // but if a blueprint was loaded, it would have generated Digispark/Android config.
        // For simplicity, we'll save the currently selected blueprint ID.
        config = {
            type: 'blueprint',
            selectedBlueprint: document.getElementById('blueprintSelect').value
        };
    }


    localStorage.setItem('payloadForgeConfig', JSON.stringify(config));
    alert('Configuration saved!');
}

// Function to load configuration
function loadConfig() {
    const savedConfig = localStorage.getItem('payloadForgeConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);

        if (config.type === 'digispark') {
            showTab('digispark');
            document.getElementById('osSelect').value = config.os;
            document.getElementById('initialDelay').value = config.initialDelay;

            document.getElementById('digisparkPayloadActions').innerHTML = '';
            digisparkActionCounter = 0; // Reset counter for Digispark

            config.actions.forEach(action => {
                addDigisparkAction(action.type, action.value, action.delay);
            });
            generateDigisparkCode();
        } else if (config.type === 'android') {
            showTab('android');
            document.getElementById('androidPayloadType').value = config.payloadType;
            updateAndroidPayloadFields(config.payloadType, config.value);
            generateAndroidCode();
        } else if (config.type === 'blueprint') {
            showTab('blueprints');
            document.getElementById('blueprintSelect').value = config.selectedBlueprint;
            loadBlueprint(); // Load the selected blueprint
        }
        alert('Configuration loaded!');
    } else {
        alert('No saved configuration found.');
    }
}

const payloadActionsContainer = document.getElementById('payloadActions');
const outputCode = document.getElementById('outputCode');
const osSelect = document.getElementById('osSelect');
const initialDelayInput = document.getElementById('initialDelay');

let actionCounter = 0; // برای ID های منحصر به فرد

// نگاشت کلیدهای سیستم عامل (برای Digispark)
const osKeyMap = {
    windows: {
        gui: 'KEY_GUI',
        enter: 'KEY_ENTER',
        tab: 'KEY_TAB',
        esc: 'KEY_ESC',
        space: 'KEY_SPACE',
        backspace: 'KEY_BACKSPACE',
        capslock: 'KEY_CAPSLOCK',
        left_arrow: 'KEY_LEFT_ARROW',
        right_arrow: 'KEY_RIGHT_ARROW',
        up_arrow: 'KEY_UP_ARROW',
        down_arrow: 'KEY_DOWN_ARROW',
        delete: 'KEY_DELETE',
        f1: 'KEY_F1', f2: 'KEY_F2', f3: 'KEY_F3', f4: 'KEY_F4', f5: 'KEY_F5',
        f6: 'KEY_F6', f7: 'KEY_F7', f8: 'KEY_F8', f9: 'KEY_F9', f10: 'KEY_F10',
        f11: 'KEY_F11', f12: 'KEY_F12'
    },
    mac: {
        gui: 'KEY_COMMAND',
        enter: 'KEY_ENTER',
        tab: 'KEY_TAB',
        esc: 'KEY_ESC',
        space: 'KEY_SPACE',
        backspace: 'KEY_BACKSPACE',
        capslock: 'KEY_CAPSLOCK',
        left_arrow: 'KEY_LEFT_ARROW',
        right_arrow: 'KEY_RIGHT_ARROW',
        up_arrow: 'KEY_UP_ARROW',
        down_arrow: 'KEY_DOWN_ARROW',
        delete: 'KEY_DELETE', // Mac delete is Backspace in Digispark terms sometimes, but this is usually fine
        f1: 'KEY_F1', f2: 'KEY_F2', f3: 'KEY_F3', f4: 'KEY_F4', f5: 'KEY_F5',
        f6: 'KEY_F6', f7: 'KEY_F7', f8: 'KEY_F8', f9: 'KEY_F9', f10: 'KEY_F10',
        f11: 'KEY_F11', f12: 'KEY_F12'
    },
    linux: { // اغلب مشابه ویندوز
        gui: 'KEY_GUI',
        enter: 'KEY_ENTER',
        tab: 'KEY_TAB',
        esc: 'KEY_ESC',
        space: 'KEY_SPACE',
        backspace: 'KEY_BACKSPACE',
        capslock: 'KEY_CAPSLOCK',
        left_arrow: 'KEY_LEFT_ARROW',
        right_arrow: 'KEY_RIGHT_ARROW',
        up_arrow: 'KEY_UP_ARROW',
        down_arrow: 'KEY_DOWN_ARROW',
        delete: 'KEY_DELETE',
        f1: 'KEY_F1', f2: 'KEY_F2', f3: 'KEY_F3', f4: 'KEY_F4', f5: 'KEY_F5',
        f6: 'KEY_F6', f7: 'KEY_F7', f8: 'KEY_F8', f9: 'KEY_F9', f10: 'KEY_F10',
        f11: 'KEY_F11', f12: 'KEY_F12'
    }
};

// نگاشت کلیدهای ترکیبی
const modifierKeys = {
    'CTRL': 'MOD_CTRL',
    'ALT': 'MOD_ALT',
    'SHIFT': 'MOD_SHIFT',
    'GUI': 'MOD_GUI' // یا MOD_COMMAND برای مک
};

// تابع اضافه کردن یک عملیات جدید
function addAction(actionType = 'keyboard', value = '', delay = 100) {
    const actionId = `action-${actionCounter++}`;
    const actionHtml = `
        <div class="action-item" id="${actionId}">
            <div class="form-group">
                <label for="${actionId}-type">نوع عملیات:</label>
                <select id="${actionId}-type" onchange="updateActionFields('${actionId}')">
                    <option value="keyboard" ${actionType === 'keyboard' ? 'selected' : ''}>کیبورد (تایپ/کلید)</option>
                    <option value="press_key" ${actionType === 'press_key' ? 'selected' : ''}>فشردن کلید خاص</option>
                    <option value="combined_keys" ${actionType === 'combined_keys' ? 'selected' : ''}>کلیدهای ترکیبی</option>
                    <option value="mouse_move" ${actionType === 'mouse_move' ? 'selected' : ''}>موس (حرکت)</option>
                    <option value="mouse_click" ${actionType === 'mouse_click' ? 'selected' : ''}>موس (کلیک)</option>
                    <option value="mouse_scroll" ${actionType === 'mouse_scroll' ? 'selected' : ''}>موس (اسکرول)</option>
                    <option value="consumer_control" ${actionType === 'consumer_control' ? 'selected' : ''}>کنترل مصرف‌کننده (صدا/رسانه)</option>
                    <option value="run_dialog" ${actionType === 'run_dialog' ? 'selected' : ''}>اجرای دستور (Run Dialog)</option>
                    <option value="delay" ${actionType === 'delay' ? 'selected' : ''}>تاخیر</option>
                    <option value="comment" ${actionType === 'comment' ? 'selected' : ''}>کامنت (توضیح)</option>
                </select>
            </div>
            <div class="form-group action-value-field">
                </div>
            <div class="form-group action-delay-field">
                <label for="${actionId}-delay">تاخیر بعد از عملیات (میلی‌ثانیه):</label>
                <input type="number" id="${actionId}-delay" value="${delay}" min="0">
            </div>
            <div class="action-controls">
                <button onclick="removeAction('${actionId}')"><i class="fas fa-trash-alt"></i> حذف</button>
            </div>
        </div>
    `;
    payloadActionsContainer.insertAdjacentHTML('beforeend', actionHtml);
    updateActionFields(actionId, actionType, value); // مقداردهی اولیه فیلدها
    attachEventListeners(); // اضافه کردن Listenerها به فیلدهای جدید
}

// تابع برای به‌روزرسانی فیلدهای ورودی بر اساس نوع عملیات
function updateActionFields(actionId, initialType = null, initialValue = '') {
    const actionItem = document.getElementById(actionId);
    const typeSelect = actionItem.querySelector('select');
    const valueFieldContainer = actionItem.querySelector('.action-value-field');
    const selectedType = initialType || typeSelect.value;

    let valueHtml = '';
    switch (selectedType) {
        case 'keyboard':
            valueHtml = `
                <label for="${actionId}-text">متن برای تایپ:</label>
                <input type="text" id="${actionId}-text" value="${initialValue}">
            `;
            break;
        case 'press_key':
            const os = osSelect.value;
            const osKeys = osKeyMap[os];
            let keyOptions = '';
            for (const key in osKeys) {
                const displayKey = key.replace(/_/g, ' ').toUpperCase();
                keyOptions += `<option value="${osKeys[key]}" ${initialValue === osKeys[key] ? 'selected' : ''}>${displayKey}</option>`;
            }
            valueHtml = `
                <label for="${actionId}-key">کلید برای فشردن:</label>
                <select id="${actionId}-key">
                    ${keyOptions}
                </select>
            `;
            break;
        case 'combined_keys':
            let modifierOptions = '';
            for (const mod in modifierKeys) {
                modifierOptions += `
                    <label>
                        <input type="checkbox" data-modifier="${modifierKeys[mod]}" ${initialValue.includes(modifierKeys[mod]) ? 'checked' : ''}> ${mod}
                    </label>
                `;
            }
            valueHtml = `
                <label>کلیدهای Modifier:</label>
                <div class="checkbox-group">${modifierOptions}</div>
                <label for="${actionId}-combined-key">کلید اصلی:</label>
                <input type="text" id="${actionId}-combined-key" value="${Array.isArray(initialValue) && initialValue.length > 1 ? initialValue[initialValue.length - 1] : ''}" placeholder="مثل A, 1, F1">
                <small>کلید اصلی (مانند 'A' یا 'KEY_F1')</small>
            `;
            break;
        case 'mouse_move':
            const [x, y] = initialValue.split(',').map(Number);
            valueHtml = `
                <label for="${actionId}-mouse-x">حرکت X:</label>
                <input type="number" id="${actionId}-mouse-x" value="${x || 0}">
                <label for="${actionId}-mouse-y">حرکت Y:</label>
                <input type="number" id="${actionId}-mouse-y" value="${y || 0}">
            `;
            break;
        case 'mouse_click':
            valueHtml = `
                <label for="${actionId}-mouse-button">دکمه موس:</label>
                <select id="${actionId}-mouse-button">
                    <option value="LEFT" ${initialValue === 'LEFT' ? 'selected' : ''}>چپ</option>
                    <option value="RIGHT" ${initialValue === 'RIGHT' ? 'selected' : ''}>راست</option>
                    <option value="MIDDLE" ${initialValue === 'MIDDLE' ? 'selected' : ''}>وسط</option>
                </select>
            `;
            break;
        case 'mouse_scroll':
            valueHtml = `
                <label for="${actionId}-mouse-scroll">مقدار اسکرول:</label>
                <input type="number" id="${actionId}-mouse-scroll" value="${initialValue || 0}">
                <small>مثبت برای بالا، منفی برای پایین</small>
            `;
            break;
        case 'consumer_control':
            valueHtml = `
                <label for="${actionId}-consumer">کنترل مصرف‌کننده:</label>
                <select id="${actionId}-consumer">
                    <option value="MEDIA_VOLUME_UP" ${initialValue === 'MEDIA_VOLUME_UP' ? 'selected' : ''}>افزایش صدا</option>
                    <option value="MEDIA_VOLUME_DOWN" ${initialValue === 'MEDIA_VOLUME_DOWN' ? 'selected' : ''}>کاهش صدا</option>
                    <option value="MEDIA_MUTE" ${initialValue === 'MEDIA_MUTE' ? 'selected' : ''}>بی‌صدا</option>
                    <option value="MEDIA_PLAY_PAUSE" ${initialValue === 'MEDIA_PLAY_PAUSE' ? 'selected' : ''}>پخش/مکث</option>
                    <option value="MEDIA_NEXT" ${initialValue === 'MEDIA_NEXT' ? 'selected' : ''}>بعدی</option>
                    <option value="MEDIA_PREVIOUS" ${initialValue === 'MEDIA_PREVIOUS' ? 'selected' : ''}>قبلی</option>
                </select>
            `;
            break;
        case 'run_dialog':
            valueHtml = `
                <label for="${actionId}-command">دستور برای اجرا (Run Dialog):</label>
                <input type="text" id="${actionId}-command" value="${initialValue}" placeholder="مثال: notepad.exe">
            `;
            break;
        case 'delay':
            valueHtml = `
                <label for="${actionId}-custom-delay">تاخیر سفارشی (میلی‌ثانیه):</label>
                <input type="number" id="${actionId}-custom-delay" value="${initialValue || 1000}" min="0">
            `;
            break;
        case 'comment':
            valueHtml = `
                <label for="${actionId}-comment-text">متن کامنت:</label>
                <input type="text" id="${actionId}-comment-text" value="${initialValue}" placeholder="توضیحات برای کد">
            `;
            break;
    }
    valueFieldContainer.innerHTML = valueHtml;
    attachEventListeners(); // دوباره attach کردن event listeners بعد از تغییر DOM
}

// تابع حذف یک عملیات
function removeAction(id) {
    document.getElementById(id).remove();
    generateCode(); // بلافاصله کد را به روز کن
}

// تابع اصلی تولید کد Digispark
function generateCode() {
    const os = osSelect.value;
    const initialDelay = parseInt(initialDelayInput.value);
    const guiKey = osKeyMap[os].gui;

    let code = `#include <DigiKeyboard.h>\n\n`;
    code += `void setup() {\n`;
    code += `  DigiKeyboard.delay(${initialDelay});\n`; // تاخیر اولیه
    code += `}\n\n`;
    code += `void loop() {\n`;

    const actions = payloadActionsContainer.querySelectorAll('.action-item');
    actions.forEach(actionItem => {
        const actionId = actionItem.id;
        const type = actionItem.querySelector('select').value;
        const delay = parseInt(actionItem.querySelector(`#${actionId}-delay`).value);

        switch (type) {
            case 'keyboard':
                const text = actionItem.querySelector(`#${actionId}-text`).value;
                if (text) {
                    code += `  DigiKeyboard.print("${text}");\n`;
                }
                break;
            case 'press_key':
                const key = actionItem.querySelector(`#${actionId}-key`).value;
                if (key) {
                    code += `  DigiKeyboard.sendKeyStroke(${key});\n`;
                }
                break;
            case 'combined_keys':
                const modifiers = Array.from(actionItem.querySelectorAll(`input[type="checkbox"]`))
                    .filter(cb => cb.checked)
                    .map(cb => cb.dataset.modifier);
                let combinedKey = actionItem.querySelector(`#${actionId}-combined-key`).value;

                // اگر کلید اصلی یک حرف است، آن را به حالت بزرگ تبدیل کن و به 'KEY_A' تبدیل کن
                if (combinedKey.length === 1 && combinedKey.match(/[a-z]/i)) {
                    combinedKey = `KEY_` + combinedKey.toUpperCase();
                } else if (combinedKey.length === 1 && combinedKey.match(/[0-9]/)) {
                    // برای اعداد مستقیم استفاده میشه
                    combinedKey = `KEY_` + combinedKey;
                } else if (!combinedKey.startsWith('KEY_')) {
                    // اگر مثلا F12 وارد شد، به KEY_F12 تبدیل کن
                    combinedKey = `KEY_` + combinedKey.toUpperCase();
                }

                if (modifiers.length > 0 && combinedKey) {
                    const modifierString = modifiers.join(' | ');
                    code += `  DigiKeyboard.sendKeyStroke(${combinedKey}, ${modifierString});\n`;
                } else if (combinedKey) {
                     code += `  DigiKeyboard.sendKeyStroke(${combinedKey});\n`;
                }
                break;
            case 'mouse_move':
                const mouseX = parseInt(actionItem.querySelector(`#${actionId}-mouse-x`).value);
                const mouseY = parseInt(actionItem.querySelector(`#${actionId}-mouse-y`).value);
                code += `  DigiKeyboard.move(${mouseX}, ${mouseY}, 0);\n`; // 0 برای اسکرول
                break;
            case 'mouse_click':
                const mouseButton = actionItem.querySelector(`#${actionId}-mouse-button`).value;
                code += `  DigiKeyboard.click(MOUSE_BUTTON_${mouseButton});\n`;
                break;
            case 'mouse_scroll':
                const mouseScroll = parseInt(actionItem.querySelector(`#${actionId}-mouse-scroll`).value);
                code += `  DigiKeyboard.scroll(${mouseScroll});\n`;
                break;
            case 'consumer_control':
                const consumerAction = actionItem.querySelector(`#${actionId}-consumer`).value;
                code += `  DigiKeyboard.sendKeyStroke(${consumerAction});\n`;
                break;
            case 'run_dialog':
                const command = actionItem.querySelector(`#${actionId}-command`).value;
                if (command) {
                    code += `  DigiKeyboard.sendKeyStroke(${guiKey}, KEY_R);\n`;
                    code += `  DigiKeyboard.delay(500);\n`; // کمی تاخیر برای باز شدن Run
                    code += `  DigiKeyboard.print("${command}");\n`;
                    code += `  DigiKeyboard.sendKeyStroke(${osKeyMap[os].enter});\n`;
                }
                break;
            case 'delay':
                const customDelay = parseInt(actionItem.querySelector(`#${actionId}-custom-delay`).value);
                code += `  DigiKeyboard.delay(${customDelay});\n`;
                break;
            case 'comment':
                const commentText = actionItem.querySelector(`#${actionId}-comment-text`).value;
                if (commentText) {
                    code += `  // ${commentText}\n`;
                }
                break;
        }

        // اضافه کردن تاخیر بعد از هر عملیات (اگر صفر نباشد)
        if (delay > 0) {
            code += `  DigiKeyboard.delay(${delay});\n`;
        }
    });

    code += `  // Loop forever (or remove if you want a single execution)\n`;
    code += `  for(;;);\n`; // Digispark loop should not exit
    code += `}\n`;

    outputCode.value = code;
}

// کپی کردن کد به کلیپ‌بورد
function copyCode() {
    outputCode.select();
    document.execCommand('copy');
    alert('کد کپی شد!');
}

// دانلود کد به عنوان فایل .ino
function downloadCode() {
    const filename = "digispark_payload.ino";
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputCode.value));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// ذخیره تنظیمات در Local Storage
function saveConfig() {
    const config = {
        os: osSelect.value,
        initialDelay: initialDelayInput.value,
        actions: []
    };

    const actions = payloadActionsContainer.querySelectorAll('.action-item');
    actions.forEach(actionItem => {
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
                value = [...modifiers, combinedKey]; // ذخیره به صورت آرایه
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
            case 'consumer_control':
                value = actionItem.querySelector(`#${actionId}-consumer`).value;
                break;
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

    localStorage.setItem('digisparkPayloadConfig', JSON.stringify(config));
    alert('تنظیمات ذخیره شد!');
}

// بارگذاری تنظیمات از Local Storage
function loadConfig() {
    const savedConfig = localStorage.getItem('digisparkPayloadConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);

        osSelect.value = config.os;
        initialDelayInput.value = config.initialDelay;

        // پاک کردن عملیات‌های موجود
        payloadActionsContainer.innerHTML = '';
        actionCounter = 0; // ریست کردن شمارنده

        config.actions.forEach(action => {
            addAction(action.type, action.value, action.delay);
        });
        generateCode();
        alert('تنظیمات بارگذاری شد!');
    } else {
        alert('تنظیمات ذخیره شده‌ای یافت نشد.');
    }
}

// Attach event listeners to relevant elements for live code generation
function attachEventListeners() {
    document.querySelectorAll('.action-item select, .action-item input[type="text"], .action-item input[type="number"], .action-item input[type="checkbox"]').forEach(element => {
        element.removeEventListener('input', generateCode); // برای جلوگیری از listener های تکراری
        element.removeEventListener('change', generateCode);

        if (element.tagName === 'SELECT' || element.type === 'checkbox') {
            element.addEventListener('change', generateCode);
        } else {
            element.addEventListener('input', generateCode);
        }
    });

    osSelect.removeEventListener('change', generateCode);
    osSelect.addEventListener('change', generateCode);
    initialDelayInput.removeEventListener('input', generateCode);
    initialDelayInput.addEventListener('input', generateCode);

    // برای تغییر OS باید فیلدهای کلیدهای خاص هم به‌روز شوند
    osSelect.addEventListener('change', () => {
        document.querySelectorAll('.action-item').forEach(item => {
            const typeSelect = item.querySelector('select');
            if (typeSelect.value === 'press_key') {
                updateActionFields(item.id, 'press_key', item.querySelector(`#${item.id}-key`).value);
            }
        });
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    addAction('keyboard', 'Hello World!'); // افزودن یک عملیات پیش‌فرض
    generateCode();
    attachEventListeners();
});
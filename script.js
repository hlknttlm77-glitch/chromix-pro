/**
 * ====================================
 * CHROMIX PRO - JAVASCRIPT الرئيسي
 * ====================================
 */

// ===== المتغيرات العامة =====
let currentColor = '#6366F1';
let currentFormat = 'hex';
let favorites = JSON.parse(localStorage.getItem('chromixFavorites')) || [];
let currentPalette = [];

// ===== عناصر DOM =====
const baseColorInput = document.getElementById('baseColor');
const baseColorHex = document.getElementById('baseColorHex');
const colorSchemesDiv = document.getElementById('colorSchemes');
const themeBtn = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');
const copyAllBtn = document.getElementById('copyAllBtn');
const exportBtn = document.getElementById('exportBtn');
const invertBtn = document.getElementById('invertBtn');
const shareBtn = document.getElementById('shareBtn');
const qrBtn = document.getElementById('qrBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const harmonyScoreDiv = document.getElementById('harmonyScore');
const favoritesModal = document.getElementById('favoritesModal');
const qrModal = document.getElementById('qrModal');
const favoritesList = document.getElementById('favoritesList');
const qrContainer = document.getElementById('qrContainer');

// ===== 1. تهيئة الموقع =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Chromix Pro started!');
    
    // تحميل التفضيلات
    loadThemePreference();
    
    // توليد الألوان الأولية
    generateAllSchemes(currentColor);
    
    // تحديث تقييم التناسق
    updateHarmonyScore(currentColor);
    
    // إضافة المستمعين
    addEventListeners();
});

// ===== 2. دوال تحويل الألوان =====
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    
    if (k === 1) {
        c = m = y = 0;
    } else {
        c = (c - k) / (1 - k);
        m = (m - k) / (1 - k);
        y = (y - k) / (1 - k);
    }
    
    return {
        c: Math.round(c * 100),
        m: Math.round(m * 100),
        y: Math.round(y * 100),
        k: Math.round(k * 100)
    };
}

function formatColor(color, format) {
    const rgb = hexToRgb(color);
    
    switch(format) {
        case 'hex':
            return color.toUpperCase();
        case 'rgb':
            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        case 'hsl':
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        case 'cmyk':
            const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
            return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
        default:
            return color;
    }
}

// ===== 3. دوال توليد الأنظمة اللونية =====
function generateMonochromatic(color) {
    const colors = [];
    const { r, g, b } = hexToRgb(color);
    
    for (let i = 0; i < 5; i++) {
        const factor = 0.2 + (i * 0.2);
        const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
        colors.push(rgbToHex(newR, newG, newB));
    }
    
    return colors;
}

function generateComplementary(color) {
    const rgb = hexToRgb(color);
    const compR = 255 - rgb.r;
    const compG = 255 - rgb.g;
    const compB = 255 - rgb.b;
    
    return [
        color,
        rgbToHex(compR, compG, compB),
        rgbToHex(Math.round((rgb.r + compR) / 2), Math.round((rgb.g + compG) / 2), Math.round((rgb.b + compB) / 2)),
        rgbToHex(Math.round(rgb.r * 0.7), Math.round(rgb.g * 0.7), Math.round(rgb.b * 0.7)),
        rgbToHex(Math.round(compR * 0.7), Math.round(compG * 0.7), Math.round(compB * 0.7))
    ];
}

function generateAnalogous(color) {
    const hsl = rgbToHsl(...Object.values(hexToRgb(color)));
    const colors = [];
    
    for (let i = -2; i <= 2; i++) {
        let h = (hsl.h + i * 30) % 360;
        if (h < 0) h += 360;
        colors.push(hslToHex(h, hsl.s, hsl.l));
    }
    
    return colors;
}

function generateTriadic(color) {
    const hsl = rgbToHsl(...Object.values(hexToRgb(color)));
    
    return [
        color,
        hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s * 0.7, hsl.l),
        hslToHex(hsl.h, hsl.s * 1.3, hsl.l)
    ];
}

function generateTetradic(color) {
    const hsl = rgbToHsl(...Object.values(hexToRgb(color)));
    
    return [
        color,
        hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s * 0.5, hsl.l * 0.8)
    ];
}

function generateSplitComplementary(color) {
    const hsl = rgbToHsl(...Object.values(hexToRgb(color)));
    
    return [
        color,
        hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s * 0.8, hsl.l * 0.9),
        hslToHex(hsl.h, hsl.s * 0.6, hsl.l * 1.1)
    ];
}

function generateSquare(color) {
    const hsl = rgbToHsl(...Object.values(hexToRgb(color)));
    
    return [
        color,
        hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s * 0.8, hsl.l * 1.1)
    ];
}

function generateShades(color) {
    const { r, g, b } = hexToRgb(color);
    const colors = [];
    
    for (let i = 0; i < 5; i++) {
        const factor = i / 4;
        const newR = Math.round(r * (1 - factor));
        const newG = Math.round(g * (1 - factor));
        const newB = Math.round(b * (1 - factor));
        colors.push(rgbToHex(newR, newG, newB));
    }
    
    return colors;
}

function generateTints(color) {
    const { r, g, b } = hexToRgb(color);
    const colors = [];
    
    for (let i = 0; i < 5; i++) {
        const factor = i / 4;
        const newR = Math.round(r + (255 - r) * factor);
        const newG = Math.round(g + (255 - g) * factor);
        const newB = Math.round(b + (255 - b) * factor);
        colors.push(rgbToHex(newR, newG, newB));
    }
    
    return colors;
}

function generateAllSchemes(color) {
    currentPalette = [];
    
    const schemes = [
        { name: 'أحادي اللون', colors: generateMonochromatic(color) },
        { name: 'تكاملي', colors: generateComplementary(color) },
        { name: 'متجاور', colors: generateAnalogous(color) },
        { name: 'ثلاثي', colors: generateTriadic(color) },
        { name: 'رباعي', colors: generateTetradic(color) },
        { name: 'تكاملي منقسم', colors: generateSplitComplementary(color) },
        { name: 'مربع', colors: generateSquare(color) },
        { name: 'تدرج داكن', colors: generateShades(color) },
        { name: 'تدرج فاتح', colors: generateTints(color) }
    ];
    
    currentPalette = schemes;
    renderSchemes(schemes);
}

// ===== 4. عرض الأنظمة اللونية =====
function renderSchemes(schemes) {
    let html = '';
    
    schemes.forEach(scheme => {
        html += `
            <div class="scheme-card">
                <div class="scheme-header">
                    <span class="scheme-title">🎨 ${scheme.name}</span>
                </div>
                <div class="scheme-colors">
                    ${scheme.colors.map(color => `
                        <div class="color-item" style="background-color: ${color}" onclick="copyColor('${color}')">
                            <span class="color-code">${formatColor(color, currentFormat)}</span>
                            <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${color}')">
                                <img src="assets/icons/${isFavorite(color) ? 'heart-filled.svg' : 'heart.svg'}" alt="Favorite">
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    colorSchemesDiv.innerHTML = html;
}

// ===== 5. دوال المفضلة =====
function toggleFavorite(color) {
    const index = favorites.indexOf(color);
    
    if (index === -1) {
        favorites.push(color);
        showNotification('✅ تمت الإضافة إلى المفضلة');
    } else {
        favorites.splice(index, 1);
        showNotification('🗑️ تمت الإزالة من المفضلة');
    }
    
    localStorage.setItem('chromixFavorites', JSON.stringify(favorites));
    generateAllSchemes(currentColor);
}

function isFavorite(color) {
    return favorites.includes(color);
}

function renderFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">لا توجد ألوان مفضلة بعد</p>';
        return;
    }
    
    let html = '';
    favorites.forEach(color => {
        html += `
            <div class="favorite-item">
                <div class="favorite-color" style="background-color: ${color}"></div>
                <div class="favorite-info">
                    <div style="font-family: monospace; font-weight: 600;">${color}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${formatColor(color, currentFormat)}</div>
                </div>
                <span class="favorite-remove" onclick="removeFavorite('${color}')">✕</span>
            </div>
        `;
    });
    
    favoritesList.innerHTML = html;
}

function removeFavorite(color) {
    const index = favorites.indexOf(color);
    if (index !== -1) {
        favorites.splice(index, 1);
        localStorage.setItem('chromixFavorites', JSON.stringify(favorites));
        renderFavorites();
        generateAllSchemes(currentColor);
        showNotification('🗑️ تمت الإزالة من المفضلة');
    }
}

// ===== 6. دوال النسخ =====
window.copyColor = function(color) {
    const textToCopy = formatColor(color, currentFormat);
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification(`📋 تم نسخ ${textToCopy}`);
    }).catch(() => {
        alert('فشل النسخ');
    });
};

function copyAllColors() {
    const allColors = currentPalette.flatMap(scheme => scheme.colors);
    const uniqueColors = [...new Set(allColors)];
    const textToCopy = uniqueColors.map(color => formatColor(color, currentFormat)).join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification(`📋 تم نسخ ${uniqueColors.length} لون`);
    });
}

// ===== 7. دوال التصدير =====
function exportToCSS() {
    let css = `/* ===== Chromix Pro - Color Palette ===== */\n\n`;
    css += `:root {\n`;
    
    currentPalette.forEach((scheme, index) => {
        scheme.colors.forEach((color, colorIndex) => {
            const name = scheme.name.replace(/ /g, '-').toLowerCase();
            css += `    --color-${name}-${colorIndex + 1}: ${color};\n`;
        });
    });
    
    css += `}\n`;
    
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chromix-palette.css';
    a.click();
    
    showNotification('✅ تم تصدير ملف CSS');
}

// ===== 8. عكس الألوان =====
function invertColors() {
    const rgb = hexToRgb(currentColor);
    const inverted = rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
    currentColor = inverted;
    baseColorInput.value = inverted;
    baseColorHex.textContent = inverted;
    generateAllSchemes(inverted);
    updateHarmonyScore(inverted);
    showNotification('🔄 تم عكس الألوان');
}

// ===== 9. تقييم التناسق =====
function updateHarmonyScore(color) {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // حساب درجة التناسق (خوارزمية بسيطة)
    let score = 85; // درجة أساسية
    
    // تقييم التشبع
    if (hsl.s > 70) score += 5;
    else if (hsl.s < 30) score -= 5;
    
    // تقييم الإضاءة
    if (hsl.l > 80) score -= 5;
    else if (hsl.l < 20) score -= 5;
    else score += 5;
    
    // تقييم Hue
    if (hsl.h >= 180 && hsl.h <= 300) score += 5;
    
    // تحديد الوصف
    let label = '';
    if (score >= 90) label = 'ممتاز ⭐';
    else if (score >= 80) label = 'جيد جداً ✨';
    else if (score >= 70) label = 'جيد 👍';
    else if (score >= 60) label = 'مقبول 👌';
    else label = 'تحتاج تحسين 💪';
    
    harmonyScoreDiv.innerHTML = `
        <div class="score-value">${Math.min(100, score)}%</div>
        <div class="score-label">${label}</div>
        <div class="score-meter">
            <div class="score-fill" style="width: ${Math.min(100, score)}%"></div>
        </div>
    `;
}

// ===== 10. الوضع المظلم =====
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        themeIcon.src = 'assets/icons/moon.svg';
        themeIcon.alt = 'Dark Mode';
        localStorage.setItem('chromixTheme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.src = 'assets/icons/sun.svg';
        themeIcon.alt = 'Light Mode';
        localStorage.setItem('chromixTheme', 'dark');
    }
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('chromixTheme');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.src = 'assets/icons/sun.svg';
        themeIcon.alt = 'Light Mode';
    }
}

// ===== 11. مشاركة البالت =====
function sharePalette() {
    const colors = currentPalette[0].colors; // أول نظام لوني
    const colorString = colors.join(',');
    const url = `${window.location.origin}${window.location.pathname}?palette=${encodeURIComponent(colorString)}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Chromix Pro Palette',
            text: 'تحقق من لوحة الألوان هذه',
            url: url
        }).catch(() => {
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
        showNotification('🔗 تم نسخ رابط المشاركة');
    }
}

// ===== 12. QR Code =====
function generateQR() {
    const colors = currentPalette[0].colors;
    const data = colors.join(',');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
    
    qrContainer.innerHTML = `<img src="${url}" alt="QR Code" style="width: 100%; max-width: 300px; margin: 0 auto; display: block;">`;
    qrModal.classList.add('active');
}

// ===== 13. نافذة منبثقة =====
function showNotification(message) {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-color);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 9999;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== 14. تحميل الألوان من URL =====
function loadPaletteFromURL() {
    const params = new URLSearchParams(window.location.search);
    const palette = params.get('palette');
    
    if (palette) {
        const colors = palette.split(',');
        if (colors.length > 0) {
            currentColor = colors[0];
            baseColorInput.value = currentColor;
            baseColorHex.textContent = currentColor;
            generateAllSchemes(currentColor);
        }
    }
}

// ===== 15. إضافة المستمعين =====
function addEventListeners() {
    // تغيير اللون الأساسي
    baseColorInput.addEventListener('input', function(e) {
        currentColor = e.target.value;
        baseColorHex.textContent = currentColor;
        generateAllSchemes(currentColor);
        updateHarmonyScore(currentColor);
    });
    
    // تغيير صيغة العرض
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFormat = this.dataset.format;
            generateAllSchemes(currentColor);
        });
    });
    
    // أزرار الأدوات
    themeBtn.addEventListener('click', toggleTheme);
    copyAllBtn.addEventListener('click', copyAllColors);
    exportBtn.addEventListener('click', exportToCSS);
    invertBtn.addEventListener('click', invertColors);
    shareBtn.addEventListener('click', sharePalette);
    
    // QR Code
    qrBtn.addEventListener('click', generateQR);
    
    // المفضلة
    favoritesBtn.addEventListener('click', function() {
        renderFavorites();
        favoritesModal.classList.add('active');
    });
    
    // إغلاق النوافذ
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // إغلاق بالنقر خارج النافذة
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// ===== 16. تشغيل عند التحميل =====
loadPaletteFromURL();
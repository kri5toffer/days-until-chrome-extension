let currentTarget = null;

// Parse date string in YYYY-MM-DD format
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Load target date from Chrome's local storage
function loadTargetDate(callback) {
    chrome.storage.local.get("countdownDate", (data) => {
        currentTarget = data.countdownDate 
            ? parseDate(data.countdownDate)
            : new Date(); // Default to current date
        callback();
    });
}

// Calculate days remaining until target date
function calculateDaysRemaining() {
    const now = new Date();
    const diffMs = currentTarget - now;
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Update extension badge with days remaining
function updateBadge() {
    if (!currentTarget) {
        loadTargetDate(updateBadge);
        return;
    }
    const days = calculateDaysRemaining();
    chrome.action.setBadgeText({ text: days.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#4a5d4a" });
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    loadTargetDate(() => {
        updateBadge();
        chrome.alarms.create("dailyUpdate", { periodInMinutes: 1 });
    });
});

// Handle periodic updates
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyUpdate") {
        updateBadge();
    }
    else if (alarm.name.startsWith("goggins_")) {
        playMotivationalSound();
    }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "refreshBadge") {
        loadTargetDate(updateBadge);
    }
    else if (msg.action === "toggleGogginsStyle") {
        if (msg.enabled) {
            scheduleGogginsAlarms();
        } else {
            clearAllGogginsAlarms();
        }
    }
    else if (msg.action === "updateFrequency") {
        // Reschedule alarms with new frequency
        scheduleGogginsAlarms();
    }
    else if (msg.action === "testSound") {
        playMotivationalSound();
    }
});

// Schedule multiple Goggins alarms based on frequency
function scheduleGogginsAlarms() {
    chrome.storage.local.get("gogginsFrequency", (data) => {
        const frequency = data.gogginsFrequency || 1;
        const intervalMinutes = (24 * 60) / frequency; // Distribute evenly across 24 hours
        
        clearAllGogginsAlarms();
        
        for (let i = 0; i < frequency; i++) {
            const delayMinutes = Math.floor(intervalMinutes * i) + Math.random() * 60; // Add some randomness
            chrome.alarms.create(`goggins_${i}`, { 
                delayInMinutes: delayMinutes,
                periodInMinutes: 24 * 60 // Repeat every 24 hours
            });
        }
    });
}

// Clear all Goggins alarms
function clearAllGogginsAlarms() {
    for (let i = 0; i < 24; i++) {
        chrome.alarms.clear(`goggins_${i}`);
    }
}

// Play motivational sound
async function playMotivationalSound() {
    try {
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        
        if (existingContexts.length === 0) {
            await chrome.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: ['AUDIO_PLAYBACK'],
                justification: 'Play motivational sound for Goggins Style'
            });
        }
        
        await chrome.runtime.sendMessage({
            action: 'playSound',
            soundFile: 'goggins-motivation.mp3'
        });
        
    } catch (error) {
        console.error('Error playing sound:', error);
    }
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'GOGGINS MOTIVATION',
        message: "WHO'S GONNA CARRY THE BOATS?! Stay hard! 💪"
    });
}
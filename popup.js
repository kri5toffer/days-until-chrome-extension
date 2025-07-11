/*
 * CHROME EXTENSION POPUP SCRIPT WORKFLOW
 * 
 * This script runs when the user clicks the extension icon and opens the popup.
 * It handles:
 * 1. Loading and displaying the current target date
 * 2. Showing real-time countdown in the popup
 * 3. Saving new target dates chosen by the user
 * 4. Communicating with the background script
 */

/*
 * STEP 1: GET REFERENCES TO HTML ELEMENTS
 * These elements are defined in popup.html
 */

// Get references to the HTML elements we need to interact with
const dateInput = document.getElementById("targetDate");     // Date picker input
const saveButton = document.getElementById("saveButton");     // Save button
const daysDisplay = document.getElementById("daysDisplay");   // Large number display

/*
 * STEP 2: POPUP INITIALIZATION
 * This runs immediately when the popup opens
 */

// WORKFLOW START: User clicks extension icon → popup opens → this code runs
console.log("Popup opened - loading saved data...");

// Load any previously saved target date from Chrome's local storage
chrome.storage.local.get("countdownDate", (data) => {
    if (data.countdownDate) {
        // console.log("Found saved date:", data.countdownDate);
        
        // Populate the date input field with the saved date
        dateInput.value = data.countdownDate;
        
        // Calculate and display the current countdown in the popup
        updateDaysDisplay(data.countdownDate);
    } else {
        // console.log("No saved date found - using default display");
        // If no saved date, the display will show "--" as set in HTML
    }
});

/*
 * STEP 3: COUNTDOWN CALCULATION AND DISPLAY
 * This function calculates days remaining and updates the popup display
 */

// Calculate and display the number of days until the target date
function updateDaysDisplay(targetDate) {
    // console.log("Calculating days remaining for:", targetDate);
    
    // Get current date and target date
    const now = new Date();
    const target = new Date(targetDate);
    const diffMs = target - now; // Difference in milliseconds
    
    // If target date has already passed, show 0
    if (diffMs <= 0) {
        daysDisplay.textContent = "0";
        // console.log("Target date has passed - showing 0");
        return;
    }
    
    // Convert milliseconds to days: ms → seconds → minutes → hours → days
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Update the large number display in the popup
    daysDisplay.textContent = days.toString();
    // console.log("Days remaining:", days);
}

/*
 * STEP 4: SAVE BUTTON FUNCTIONALITY
 * This handles when the user clicks "Save" after selecting a date
 */

// Listen for clicks on the Save button
saveButton.addEventListener("click", () => {
    // console.log("Save button clicked");
    
    // Get the date the user selected
    const targetDate = dateInput.value;
    
    // Validate that a date was actually selected
    if (!targetDate) {
        alert("Please select a target date");
        // console.log("No date selected - showing alert");
        return;
    }
    
    // console.log("Saving date:", targetDate);
    
    // Save the selected date to Chrome's local storage
    chrome.storage.local.set({ countdownDate: targetDate }, () => {
        // console.log("Date saved successfully");
        
        // 1. Update button text to show success
        saveButton.textContent = "Saved!";
        
        // 2. Update the countdown display in the popup immediately
        updateDaysDisplay(targetDate);
        
        // 3. Send message to background script to update the badge
        chrome.runtime.sendMessage({ action: "refreshBadge" });
        // console.log("Refresh message sent to background script");
        
        // 4. Reset button text back to "Save" after 2 seconds
        setTimeout(() => {
            saveButton.textContent = "Save";
            // console.log("Button text reset");
        }, 2000);
    });
});

/*
 * STEP 5: LIVE PREVIEW FUNCTIONALITY
 * This updates the countdown display as the user changes the date (before saving)
 */

// Listen for changes to the date input field
dateInput.addEventListener("change", () => {
    // console.log("Date input changed to:", dateInput.value);
    
    // If a valid date is selected, show the countdown immediately
    if (dateInput.value) {
        updateDaysDisplay(dateInput.value);
        // console.log("Updated display with new date preview");
    }
});

/*
 * STEP 6: GOGGINS STYLE TOGGLE FUNCTIONALITY
 * This handles the toggle switch and daily motivational sounds
 */

const toggleSwitch = document.getElementById("toggleSwitch");
const frequencySlider = document.getElementById("frequencySlider");
const frequencyValue = document.getElementById("frequencyValue");

// Load saved toggle state and frequency
chrome.storage.local.get(["gogginsStyle", "gogginsFrequency"], (data) => {
    if (data.gogginsStyle) {
        toggleSwitch.classList.add("active");
        // console.log("Goggins Style is enabled");
    }
    
    if (data.gogginsFrequency) {
        frequencySlider.value = data.gogginsFrequency;
        frequencyValue.textContent = data.gogginsFrequency;
    }
});

// Handle toggle click
toggleSwitch.addEventListener("click", () => {
    const isActive = toggleSwitch.classList.toggle("active");
    
    // Save toggle state
    chrome.storage.local.set({ gogginsStyle: isActive }, () => {
        // console.log("Goggins Style:", isActive ? "enabled" : "disabled");
        
        // Send message to background script to handle daily sound scheduling
        chrome.runtime.sendMessage({ 
            action: "toggleGogginsStyle", 
            enabled: isActive 
        });
        
        // Test sound immediately when toggled on
        if (isActive) {
            chrome.runtime.sendMessage({ action: "testSound" });
        }
    });
});

// Handle frequency slider change
frequencySlider.addEventListener("input", () => {
    const frequency = frequencySlider.value;
    frequencyValue.textContent = frequency;
    
    // Save frequency setting
    chrome.storage.local.set({ gogginsFrequency: parseInt(frequency) }, () => {
        // console.log("Frequency saved:", frequency);
        
        // Update background script if Goggins Style is active
        chrome.storage.local.get("gogginsStyle", (data) => {
            if (data.gogginsStyle) {
                chrome.runtime.sendMessage({ 
                    action: "updateFrequency", 
                    frequency: parseInt(frequency) 
                });
            }
        });
    });
});

/*
 * COMPLETE POPUP WORKFLOW SUMMARY:
 * 
 * 1. User clicks extension icon → popup.html opens → this script runs
 * 2. Script loads any saved target date from storage
 * 3. If saved date exists, populate date input and show countdown
 * 4. User can change the date in the date picker
 * 5. As user changes date, countdown updates in real-time (preview)
 * 6. When user clicks "Save":
 *    - Validate date is selected
 *    - Save date to Chrome storage
 *    - Update popup display
 *    - Send message to background script
 *    - Background script updates the badge
 *    - Show "Saved!" confirmation
 * 7. User can close popup or change date again
 * 
 * COMMUNICATION FLOW:
 * Popup ←→ Chrome Storage ←→ Background Script ←→ Extension Badge
 */
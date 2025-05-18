// Hey there! This is the brain of our Anime Fight Simulator!
// It handles all the cool stuff like playing the video, managing health,
// making the screen shake, and switching between different fights.

// Let's grab the important elements from our HTML page
const video = document.getElementById('animeVideo'); // Our video player
const healthBar = document.getElementById('healthBar'); // The enemy's health bar
const gameOverOverlay = document.getElementById('gameOverOverlay'); // The red overlay for defeat
const retryButton = document.getElementById('retryButton'); // The button to try again
const controls = document.getElementById('controls'); // The container for our attack buttons
const videoContainer = document.getElementById('videoContainer'); // The main container holding the video
const punchSFX = document.getElementById('punchSFX'); // The sound effect for attacks
const fightSelect = document.getElementById('fightSelect'); // The dropdown to choose fights


// These variables help us keep track of what's happening during an attack animation
let stopTimestamp = -1; // Where the current attack animation should stop in the video
let shakeTimestamp = -1; // When the screen should start shaking during the attack
let shakeDuration = 0; // How long the shake effect should last
let shakeTimeout = null; // We'll use this to cancel the shake timeout if needed
let currentDamage = 0; // How much damage the current attack will deal when it finishes
let isDeathScenePlaying = false; // A flag to know if we're currently showing the enemy's defeat


// Let's set up the enemy's health!
let maxHealth = 100; // The starting health for the enemy
let currentHealth = maxHealth; // The enemy's current health


// This is where we define all the different fights you can choose from!
// Each fight has its own video, enemy health, death scene timing, and attack buttons.
const fights = [
    {
        name: "Shanks", // The name that appears in the dropdown
        videoSrc: "assets/shanks.mp4", // The video file for this fight
        maxHealth: 100, // Max health for this enemy
        deathFrameTimestamp: 0, // The time in the video where the death scene starts
        deathSceneEndTime: 2.6, // The time in the video where the death scene ends
        buttons: [ // The attack buttons for this fight
            // Each button has properties like text, keyboard shortcut key,
            // video timestamps, shake timing, and damage.
            { text: "🤜 Left Punch", key: "a", timestamp: 0, stopTimestamp: 0.6, shakeTimestamp: 0.2, shakeDuration: 300, damage: 10 },
            { text: "🤛 Right Punch", key: "s", timestamp: 0.7, stopTimestamp: 1.1, shakeTimestamp: 0.9, shakeDuration: 150, damage: 15 },
            // Feel free to add more buttons here for different attacks!
        ]
    },
    {
        name: "Ippo vs. Mashiba", // Another fight option!
        videoSrc: "assets/ippo.mp4", // The video for this fight
        maxHealth: 150, // This enemy is a bit tougher!
         deathFrameTimestamp: 6.6, // Death scene start time for this video
         deathSceneEndTime: 8.6, // Death scene end time for this video
        buttons: [
            { text: "✊ Uppercut", key: "a", timestamp: 0.4, stopTimestamp: 0.8, shakeTimestamp: 0.5, shakeDuration: 100, damage: 30 },
            { text: "🤜 Left Hook", key: "s", timestamp: 1.6, stopTimestamp: 2.0, shakeTimestamp: 1.7, shakeDuration: 100, damage: 20 },
            { text: "🤛 Body Shot", key: "d", timestamp: 2.1, stopTimestamp: 2.7, shakeTimestamp: 2.2, shakeDuration: 100, damage: 40 }, // Changed key to 'd'
             // Add more buttons here!
        ]
    },
     // You can add even more fight objects here to create new challenges!
];

let currentFightIndex = 0; // We start with the first fight in the list


// This function updates the health bar's appearance and text
function updateHealthBar() {
    const healthPercentage = (currentHealth / maxHealth) * 100; // Calculate health as a percentage
    healthBar.style.width = healthPercentage + '%'; // Set the width of the health bar element
    healthBar.textContent = Math.max(0, currentHealth) + '%'; // Display the health percentage (make sure it doesn't show negative)

    // Change the health bar color based on how much health is left
    healthBar.classList.remove('low', 'medium'); // Remove previous color classes
    if (healthPercentage <= 30) {
        healthBar.classList.add('low'); // Red for low health
    } else if (healthPercentage <= 60) {
        healthBar.classList.add('medium'); // Orange for medium health
    }

    // If health drops to 0 or below, it's game over!
    if (currentHealth <= 0 && !isDeathScenePlaying) { // Make sure we only trigger once
        endGame();
    }
}

// This function handles what happens when you click one of the attack buttons
function handleButtonClick() {
    // 'this' inside this function refers to the button that was clicked

     // If the enemy is already defeated or the death scene is playing, ignore the click
    if (currentHealth <= 0 || isDeathScenePlaying) {
        return;
    }

    // Clear any ongoing shake effect and its timer
    if (shakeTimeout) {
        clearTimeout(shakeTimeout);
        video.classList.remove('shake-effect');
    }

    // Get the attack details from the button's data attributes
    const button = this;
    const startTimestamp = parseFloat(button.dataset.timestamp);
    stopTimestamp = parseFloat(button.dataset.stopTimestamp);
    shakeTimestamp = parseFloat(button.dataset.shakeTimestamp);
    shakeDuration = parseInt(button.dataset.shakeDuration);
    currentDamage = parseInt(button.dataset.damage); // Store the damage for this attack


    // Jump the video to the start of the attack animation
    video.currentTime = startTimestamp;

    // Play the video!
    video.play();

    // Play the punch sound effect
    punchSFX.currentTime = 0; // Rewind the sound to the beginning
    punchSFX.play();


    // We need to listen for the video's time changing to know when to stop
    // and apply damage. We remove any old listener first to avoid duplicates.
    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('timeupdate', handleTimeUpdate);
}


// This function is called constantly as the video plays
function handleTimeUpdate() {
    // Check if the video has reached the stop point for the current animation
    // We use a small buffer (0.05s) to account for timing inaccuracies
    if (stopTimestamp !== -1 && video.currentTime >= stopTimestamp - 0.05) {
        video.pause(); // Pause the video at the stop point

        // Now, let's see if this pause is the end of the death scene or a regular attack
        if (isDeathScenePlaying) {
            // Yep, the death scene animation is done!
            isDeathScenePlaying = false; // Reset the flag
            stopTimestamp = -1; // Clear the stop timestamp

            // Time for the game over visuals!
            video.classList.add('game-over-shake-effect'); // Intense shake for defeat

            // Show the red overlay and make sure it covers the video perfectly
            gameOverOverlay.classList.add('visible');
            updateOverlayPosition();

            // Hide the attack buttons and show the retry button
            controls.classList.add('hidden');
            retryButton.classList.remove('hidden');

            // Start listening for window resizes to keep the overlay in place
            window.addEventListener('resize', updateOverlayPosition);

            // We don't need the timeupdate listener anymore since the game is over
            video.removeEventListener('timeupdate', handleTimeUpdate);

            console.log("Death scene finished. Game Over!");

        } else {
            // This was just a regular attack animation finishing
            stopTimestamp = -1; // Clear the stop timestamp

            // Apply the damage stored for this attack
            if (currentDamage > 0) {
                currentHealth -= currentDamage; // Reduce enemy health
                 // Make sure health doesn't go below zero
                currentHealth = Math.max(0, currentHealth);
                updateHealthBar(); // Update the health bar display
                currentDamage = 0; // Reset the damage for the next attack
            }
             // Keep the timeupdate listener active for the next attack
        }
    }

    // Check if the video has reached the timestamp to start the shake effect
    if (shakeTimestamp !== -1 && video.currentTime >= shakeTimestamp - 0.05) {
        // Add the shake effect class to the video element
        video.classList.add('shake-effect');

        // Set a timer to remove the shake class after the specified duration
        shakeTimeout = setTimeout(() => {
            video.classList.remove('shake-effect');
        }, shakeDuration);

        // Reset these variables so the shake only triggers once per attack
        shakeTimestamp = -1;
        shakeDuration = 0;
    }
}

// This function is called when the enemy's health reaches zero
function endGame() {
    video.pause(); // Stop whatever the video was doing
    video.removeEventListener('timeupdate', handleTimeUpdate); // Temporarily remove the listener

    // Get the start and end times for the death scene from our fight data
    const deathFrameTimestamp = fights[currentFightIndex].deathFrameTimestamp;
    const deathSceneEndTime = fights[currentFightIndex].deathSceneEndTime;


    // If we have valid timestamps for the death scene, play it!
    if (deathFrameTimestamp !== undefined && deathSceneEndTime !== undefined) {
         video.currentTime = deathFrameTimestamp; // Jump to the start of the death scene
         stopTimestamp = deathSceneEndTime; // Set the stop point for the death scene
         isDeathScenePlaying = true; // Set the flag to indicate we're in the death scene

         video.play(); // Play the death scene animation

         // Re-add the timeupdate listener specifically to catch the end of the death scene
         video.addEventListener('timeupdate', handleTimeUpdate);

    } else {
         // If no death scene timestamps are provided, just show the game over visuals immediately
         console.warn("Death scene timestamps not defined for this fight. Skipping death animation.");

         // Apply game over visual effects directly
         video.classList.add('game-over-shake-effect'); // More intense shake for game over

         // Show the red overlay and position it over the video
         gameOverOverlay.classList.add('visible');
         updateOverlayPosition();

         // Hide controls and show retry button
         controls.classList.add('hidden');
         retryButton.classList.remove('hidden');

         // Add resize listener to keep overlay positioned correctly
         window.addEventListener('resize', updateOverlayPosition);

          // Remove the timeupdate listener as game is over
         video.removeEventListener('timeupdate', handleTimeUpdate);
    }

     // Let everyone know the enemy is defeated!
    console.log("Game Over! Enemy Defeated!");
}

// This function resets everything to start a new game
function resetGame() {
    // Reset enemy health to the max for the current fight
    currentHealth = fights[currentFightIndex].maxHealth;
    updateHealthBar(); // Update the health bar display

    // Remove any game over effects
    video.classList.remove('game-over-shake-effect');
    gameOverOverlay.classList.remove('visible');

    // Clear any dynamic styles applied to the overlay
    gameOverOverlay.style.top = '';
    gameOverOverlay.style.left = '';
    gameOverOverlay.style.width = '';
    gameOverOverlay.style.height = '';

    // Stop listening for window resizes for the overlay
    window.removeEventListener('resize', updateOverlayPosition);


    // Show the attack buttons again and hide the retry button
    controls.classList.remove('hidden');
    retryButton.classList.add('hidden');

    // Reset the video to the beginning and pause it
    video.currentTime = 0;
    video.pause();

    // Clear any pending shake timers and remove the shake class
    if (shakeTimeout) {
        clearTimeout(shakeTimeout);
        video.classList.remove('shake-effect');
    }

    // Reset all the state variables
    stopTimestamp = -1;
    shakeTimestamp = -1;
    shakeDuration = 0;
    currentDamage = 0;
    isDeathScenePlaying = false; // Make sure the death scene flag is off


     // Ensure the timeupdate listener is removed (it will be added again when an attack button is clicked)
    video.removeEventListener('timeupdate', handleTimeUpdate);
}

// This function fills the fight selection dropdown with options from our 'fights' array
function populateFightSelect() {
    fightSelect.innerHTML = ''; // Clear any existing options
    fights.forEach((fight, index) => {
        const option = document.createElement('option');
        option.value = index; // The value is the index in the fights array
        option.textContent = fight.name; // The text shown in the dropdown
        fightSelect.appendChild(option); // Add the option to the dropdown
    });
}

// This is the main function to load a specific fight scene
function loadFight(fightIndex) {
    console.log("Loading fight:", fights[fightIndex].name); // Just a little log to see which fight is loading
    currentFightIndex = fightIndex; // Keep track of the current fight
    const fight = fights[currentFightIndex]; // Get the data for the selected fight

    // Set the video source and load the video
    video.src = fight.videoSrc;
    video.load();

    // Reset health for the new fight
    maxHealth = fight.maxHealth;
    currentHealth = maxHealth;
    updateHealthBar(); // Update the health bar display

    // Clear out the old attack buttons
    controls.innerHTML = '';
    console.log("Controls div cleared.");

    // Create and add the new attack buttons for this fight
    console.log("Creating buttons from data:", fight.buttons);
    fight.buttons.forEach(buttonData => {
        const button = document.createElement('button');
        button.classList.add('action-button'); // Add the action-button class
        // Set data attributes with the button's properties
        button.dataset.timestamp = buttonData.timestamp;
        button.dataset.stopTimestamp = buttonData.stopTimestamp;
        button.dataset.shakeTimestamp = buttonData.shakeTimestamp;
        button.dataset.shakeDuration = buttonData.shakeDuration;
        button.dataset.damage = buttonData.damage;
        button.dataset.key = buttonData.key;
        // Set the button text and add the keyboard shortcut hint
        button.innerHTML = `${buttonData.text} <span class="shortcut-hint">(${buttonData.key.toUpperCase()})</span>`;

        // Add the click event listener to the new button
        button.addEventListener('click', handleButtonClick);

        controls.appendChild(button); // Add the button to the controls container
        console.log("Button appended:", buttonData.text);
    });

    // Reset game state variables for the new fight
    stopTimestamp = -1;
    shakeTimestamp = -1;
    shakeDuration = 0;
    currentDamage = 0;
    isDeathScenePlaying = false; // Make sure this is false when a new fight loads
    if (shakeTimeout) {
        clearTimeout(shakeTimeout);
        video.classList.remove('shake-effect');
    }

    // Ensure the timeupdate listener is active for the new video
    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Hide game over elements and show controls
    gameOverOverlay.classList.remove('visible');
    retryButton.classList.add('hidden');
    controls.classList.remove('hidden');

     // Clear any dynamic overlay styles
    gameOverOverlay.style.top = '';
    gameOverOverlay.style.left = '';
    gameOverOverlay.style.width = '';
    gameOverOverlay.style.height = '';

    // Remove any existing resize listener for the overlay
    window.removeEventListener('resize', updateOverlayPosition);

    video.currentTime = 0; // Go to the beginning of the video
    video.pause(); // Pause the video until an attack button is clicked
    console.log("Fight loaded and video reset.");
}


// This function makes sure the game over overlay stays perfectly over the video
// even if the window is resized.
function updateOverlayPosition() {
     // Only do this if the overlay is actually visible
    if (gameOverOverlay.classList.contains('visible')) {
        const videoRect = video.getBoundingClientRect(); // Get the video's position and size
        const containerRect = videoContainer.getBoundingClientRect(); // Get the container's position and size

        // Calculate the overlay's position relative to the container
        const top = videoRect.top - containerRect.top;
        const left = videoRect.left - containerRect.left;

        // Apply the calculated position and the video's size to the overlay
        gameOverOverlay.style.top = top + 'px';
        gameOverOverlay.style.left = left + 'px';
        gameOverOverlay.style.width = videoRect.width + 'px';
        gameOverOverlay.style.height = videoRect.height + 'px';
    }
}


// This listener handles what happens if the user manually pauses the video
video.addEventListener('pause', () => {
    // Only reset things if the game isn't over and we're not in the middle of the death scene
    if (currentHealth > 0 && !isDeathScenePlaying) {
        stopTimestamp = -1; // Clear the stop timestamp
        shakeTimestamp = -1; // Clear the shake timestamp
        shakeDuration = 0; // Reset shake duration
        currentDamage = 0; // Clear any pending damage if the animation was interrupted
        if (shakeTimeout) {
            clearTimeout(shakeTimeout); // Cancel any pending shake timer
            video.classList.remove('shake-effect'); // Remove the shake class
        }
        video.removeEventListener('timeupdate', handleTimeUpdate); // Remove the timeupdate listener
    }
});

// This listener handles what happens if the video reaches its natural end
video.addEventListener('ended', () => {
     // Only reset things if the game isn't over and we're not in the middle of the death scene
     if (currentHealth > 0 && !isDeathScenePlaying) {
        stopTimestamp = -1;
        shakeTimestamp = -1;
        shakeDuration = 0;
        currentDamage = 0; // Clear any pending damage
        if (shakeTimeout) {
            clearTimeout(shakeTimeout);
            video.classList.remove('shake-effect');
        }
        video.removeEventListener('timeupdate', handleTimeUpdate);
     }
});


// This listens for keyboard presses to trigger attacks
document.addEventListener('keydown', (event) => {
    // If the game is over or the death scene is playing, only listen for the retry shortcut
    if (currentHealth <= 0 || isDeathScenePlaying) {
         // If the 'R' key is pressed, reset the game!
         if (event.key.toLowerCase() === 'r') {
            resetGame();
         }
        return; // Ignore other key presses
    }

    // Find the button that matches the pressed key
    const currentFightButtons = fights[currentFightIndex].buttons; // Get the buttons for the current fight

    currentFightButtons.forEach((buttonData, index) => {
        const shortcutKey = buttonData.key;
        // Check if the pressed key matches a button's shortcut key (case-insensitive)
        if (shortcutKey && event.key.toLowerCase() === shortcutKey.toLowerCase()) {
            // Prevent the default browser action for this key (like scrolling with spacebar)
            event.preventDefault();
            // Find the actual button element in the HTML
            const buttonElement = controls.querySelectorAll('.action-button')[index];
            if (buttonElement) {
                 // If an animation is already playing, ignore the key press
                if (stopTimestamp !== -1) {
                    console.log("Animation is currently playing, please wait.");
                    return;
                }
                // Trigger the button's click event!
                buttonElement.click();
            }
        }
    });
});

// Listen for clicks on the retry button to reset the game
retryButton.addEventListener('click', resetGame);

// Listen for changes in the fight selection dropdown
fightSelect.addEventListener('change', (event) => {
    // Load the fight corresponding to the selected option's value
    loadFight(parseInt(event.target.value));
});


// This is where we start everything when the page loads!
populateFightSelect(); // Fill the fight dropdown
loadFight(0); // Load the first fight to begin with

// Set up an observer to watch the video element for size changes
// This helps keep the game over overlay positioned correctly on resize.
const resizeObserver = new ResizeObserver(() => {
     updateOverlayPosition();
});
resizeObserver.observe(video); // Start observing the video element


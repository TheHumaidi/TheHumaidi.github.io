/**
 * Konami Code Easter Egg Implementation
 * Detects the famous ↑ ↑ ↓ ↓ ← → ← → B A sequence on both keyboard and Xbox controller
 * Plays an audio clip when the complete sequence is entered
 */

class KonamiCode {
	constructor() {
		// The classic Konami Code sequence for keyboard input
		this.sequence = [
			'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
			'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
			'KeyB', 'KeyA'
		];

		// WASD alternative sequence
		this.wasdSequence = [
			'KeyW', 'KeyW', 'KeyS', 'KeyS',
			'KeyA', 'KeyD', 'KeyA', 'KeyD',
			'KeyB', 'KeyA'
		];

		// Xbox controller button mapping for the same sequence
		this.controllerSequence = [
			'up', 'up', 'down', 'down',
			'left', 'right', 'left', 'right',
			'b', 'a'
		];

		this.currentSequence = [];
		this.audioUrl = 'https://www.myinstants.com/media/sounds/lissan-al-gaib.mp3';
		this.audio = null;
		this.hasPlayedThisSession = false;

		// Gamepad state tracking
		this.gamepadIndex = -1;
		this.previousButtonStates = {};
		this.previousDpadStates = {};

		this.init();
	}

	/**
	 * Initialize the Konami Code detection system
	 */
	init() {
		// Preload the audio file
		this.preloadAudio();

		// Set up keyboard input detection
		this.setupKeyboardListener();

		// Set up Xbox controller input detection
		this.setupGamepadListener();
	}

	/**
	 * Preload the audio file for faster playback
	 */
	preloadAudio() {
		try {
			this.audio = new Audio();
			this.audio.preload = 'auto';
			this.audio.src = this.audioUrl;
			this.audio.volume = 0.7;
		} catch (error) {
			console.warn('Could not preload Konami Code audio:', error);
		}
	}

	/**
	 * Set up keyboard event listener for detecting key presses
	 */
	setupKeyboardListener() {
		document.addEventListener('keydown', (event) => {
			this.handleKeyboardInput(event.code);
		});
	}

	/**
	 * Set up gamepad connection detection and polling
	 */
	setupGamepadListener() {
		// Listen for controller connections
		window.addEventListener('gamepadconnected', (event) => {
			console.log('Xbox controller connected:', event.gamepad.index);
			this.gamepadIndex = event.gamepad.index;
			this.startGamepadPolling();
		});

		window.addEventListener('gamepaddisconnected', (event) => {
			console.log('Xbox controller disconnected:', event.gamepad.index);
			if (this.gamepadIndex === event.gamepad.index) {
				this.gamepadIndex = -1;
			}
		});

		// Check if any controllers are already connected
		this.checkExistingGamepads();
	}

	/**
	 * Check for gamepads that are already connected when the page loads
	 */
	checkExistingGamepads() {
		const gamepads = navigator.getGamepads();
		for (let i = 0; i < gamepads.length; i++) {
			if (gamepads[i]) {
				this.gamepadIndex = i;
				this.startGamepadPolling();
				break;
			}
		}
	}

	/**
	 * Start polling the gamepad for button presses
	 */
	startGamepadPolling() {
		if (this.gamepadPolling) return;

		this.gamepadPolling = setInterval(() => {
			this.pollGamepad();
		}, 50); // Poll every 50ms for responsive input
	}

	/**
	 * Poll the connected gamepad for button states
	 */
	pollGamepad() {
		if (this.gamepadIndex === -1) return;

		const gamepad = navigator.getGamepads()[this.gamepadIndex];
		if (!gamepad) {
			this.gamepadIndex = -1;
			clearInterval(this.gamepadPolling);
			this.gamepadPolling = null;
			return;
		}

		// Xbox controller D-pad button mapping
		const dpadUp = gamepad.buttons[12]?.pressed;
		const dpadDown = gamepad.buttons[13]?.pressed;
		const dpadLeft = gamepad.buttons[14]?.pressed;
		const dpadRight = gamepad.buttons[15]?.pressed;

		// Xbox controller face buttons (A and B)
		const aButton = gamepad.buttons[0]?.pressed;
		const bButton = gamepad.buttons[1]?.pressed;

		// Check for button press events (not just held states)
		this.checkButtonPress('up', dpadUp);
		this.checkButtonPress('down', dpadDown);
		this.checkButtonPress('left', dpadLeft);
		this.checkButtonPress('right', dpadRight);
		this.checkButtonPress('a', aButton);
		this.checkButtonPress('b', bButton);
	}

	/**
	 * Check if a button was just pressed (not held)
	 * @param {string} button - The button identifier
	 * @param {boolean} isPressed - Current pressed state
	 */
	checkButtonPress(button, isPressed) {
		const wasPressed = this.previousButtonStates[button] || false;

		// Only trigger on the initial press, not while held
		if (isPressed && !wasPressed) {
			this.handleControllerInput(button);
		}

		this.previousButtonStates[button] = isPressed;
	}

	/**
	 * Handle keyboard input for the Konami Code sequence
	 * @param {string} keyCode - The key code that was pressed
	 */
	handleKeyboardInput(keyCode) {
		if (this.hasPlayedThisSession) return;

		// Check for both Arrow and WASD sequences
		const expectedKeyArrow = this.sequence[this.currentSequence.length];
		const expectedKeyWASD = this.wasdSequence[this.currentSequence.length];

		if (keyCode === expectedKeyArrow || keyCode === expectedKeyWASD) {
			this.currentSequence.push(keyCode);

			if (this.currentSequence.length === this.sequence.length) {
				this.playKonamiAudio();
				this.resetSequence();
			}
		} else {
			// Wrong key - reset the sequence
			this.resetSequence();

			// Check if this key is the start of a new sequence for either
			if (keyCode === this.sequence[0] || keyCode === this.wasdSequence[0]) {
				this.currentSequence.push(keyCode);
			}
		}
	}

	/**
	 * Handle controller input for the Konami Code sequence
	 * @param {string} input - The controller input that was pressed
	 */
	handleControllerInput(input) {
		if (this.hasPlayedThisSession) return;

		// Check if this input matches the next expected input in the sequence
		const expectedInput = this.controllerSequence[this.currentSequence.length];

		if (input === expectedInput) {
			this.currentSequence.push(input);

			// Check if the complete sequence has been entered
			if (this.currentSequence.length === this.controllerSequence.length) {
				this.playKonamiAudio();
				this.resetSequence();
			}
		} else {
			// Wrong input - reset the sequence
			this.resetSequence();

			// But check if this input is the start of a new sequence
			if (input === this.controllerSequence[0]) {
				this.currentSequence.push(input);
			}
		}
	}

	/**
	 * Play the Konami Code activation audio
	 */
	playKonamiAudio() {
		if (this.hasPlayedThisSession) return;

		try {
			if (this.audio) {
				this.audio.currentTime = 0; // Reset audio to beginning
				this.audio.play().catch(error => {
					console.warn('Could not play Konami Code audio:', error);
				});
				this.hasPlayedThisSession = true;

				// Reset the session flag after 10 seconds to allow replay
				setTimeout(() => {
					this.hasPlayedThisSession = false;
				}, 10000);
			}
		} catch (error) {
			console.warn('Error playing Konami Code audio:', error);
		}
	}

	/**
	 * Reset the current input sequence
	 */
	resetSequence() {
		this.currentSequence = [];
	}
}

// Initialize the Konami Code detection when the page loads
document.addEventListener('DOMContentLoaded', () => {
	new KonamiCode();
});


if (document.readyState === 'loading') {

} else {

	setTimeout(() => {
		new KonamiCode();
	}, 100);
}

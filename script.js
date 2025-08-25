
// --- Firebase Configuration ---
const firebaseConfig = {
	apiKey: "AIzaSyA1nP6GuOZ201uX9IpgG5luRxO_6OPyBS0",
	authDomain: "timeego-35df7.firebaseapp.com",
	projectId: "timeego-35df7",
	storageBucket: "timeego-35df7.appspot.com",
	messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
	appId: "1:10386311177:web:0842e821cda6e7af9190d8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// --- Global State Variables ---
let plans = [], // Will be populated from Firestore
	selectedPlanCodePrefix = '',
	isUpgradeMode = false,
	countdownInterval,
	currentUserData = null,
	wrongAttemptCounts = {},
	suspensionEndTime = {},
	vendorAdmins = [], // Will be populated from Firestore
	contactLinksData = [];

// --- Utility Functions ---
function setAccentColor(color) {
	document.documentElement.style.setProperty('--accent-color', color);
}

function messageAdmin(message, number) {
	window.location.href = `https://wa.me/+234${number}?text=${encodeURIComponent(message)}`;
}

// --- Firebase Data Fetching ---
async function fetchPlansAndVendors() {
	loaderContainer.style.display = 'flex';
	try {
		// Fetch plans
		const plansSnapshot = await db.collection('plans').orderBy('price').get();
		plans = plansSnapshot.docs.map(doc => doc.data());
		// Fetch vendors
		const vendorsSnapshot = await db.collection('vendors').orderBy('name').get();
		vendorAdmins = vendorsSnapshot.docs.map(doc => doc.data());
		// Fetch the specific contactLinks document
		const contactsSnapshot = await db.collection('contactLinks').orderBy('id').get();
		contactLinksData = contactsSnapshot.docs.map(doc => doc.data());
		
	} catch (error) {
		console.error("Error fetching data:", error);
		showAlert("Failed to load application data. Please try again later.");
	} finally {
		loaderContainer.style.display = 'none';
	}
}

//document.addEventListener('DOMContentLoaded', async () => {
// Fetch initial data from Firestore
await fetchPlansAndVendors();
//await fetchFaqAndContactLinks()

// Function to clear all error messages
const clearErrors = () => {
	usernameError.textContent = '';
	emailError.textContent = '';
	passwordError.textContent = '';
	confirmPasswordError.textContent = '';
	activationCodeError.textContent = '';
	termsError.textContent = '';
	formMessage.textContent = '';
	//for login error clear
	loginEmailError.textContent = '';
	loginPasswordError.textContent = '';
	loginFormMessage.textContent = '';
	//  resetEmailError.textContent = '';
};

// Basic validation function
const validateInput = (input, errorElement, message) => {
	if (input.value.trim() === '') {
		errorElement.textContent = message;
		return false;
	} else {
		errorElement.textContent = '';
		return true;
	}
};

// Email format validation
const validateEmail = (input, errorElement) => {
	const email = input.value.trim();
	if (email === '') {
		errorElement.textContent = 'Email is required.';
		return false;
	} else if (!/\S+@\S+\.\S+/.test(email)) {
		errorElement.textContent = 'Invalid email format.';
		return false;
	} else {
		errorElement.textContent = '';
		return true;
	}
};


// --- REFINED: Signup Form Submission Logic (from Firebase section) ---
signupForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	clearErrors();
	
	let isValid = true;
	if (!validateInput(usernameInput, usernameError, 'Username is required.')) isValid = false;
	if (!validateEmail(emailInput, emailError)) isValid = false;
	if (!validateInput(passwordInput, passwordError, 'Password is required.')) isValid = false;
	if (!validateInput(confirmPasswordInput, confirmPasswordError, 'Confirm password is required.')) isValid = false;
	if (!validateInput(activationCodeInput, activationCodeError, 'Activation code is required.')) isValid = false;
	if (usernameInput.value.length < 2 || usernameInput.value.length > 10 || usernameInput.value.includes('@') || usernameInput.value.includes('.')) {
		usernameError.textContent = 'Invalid Name format or length';
		isValid = false;
	}
	if (passwordInput.value.length < 6) {
		passwordError.textContent = 'Password must be at least 6 characters.';
		isValid = false;
	}
	if (passwordInput.value !== confirmPasswordInput.value) {
		confirmPasswordError.textContent = 'Passwords do not match.';
		isValid = false;
	}
	if (!termsCheckbox.checked) {
		termsError.textContent = 'You must agree to the terms and conditions.';
		isValid = false;
	}
	
	if (!isValid) {
		formMessage.textContent = 'Please fix the errors above to proceed.';
		return;
	}
	if (!selectedPlanInfo.textContent.includes("Selected")) {
		showAlert("Please choose plan type to proceed!");
		return
	}
	
	if (isUpgradeMode) {
		// Handle upgrade logic, which is a separate listener
		return;
	}
	
	loaderContainer.style.display = 'flex';
	if (isValid) {
		try {
			const username = usernameInput.value.trim();
			const email = emailInput.value.trim();
			const password = passwordInput.value;
			const activationCode = activationCodeInput.value.trim();
			
			
			
			const activationCodesRef = db.collection('activationCodes');
			const codeQuery = await activationCodesRef
				.where('code', '==', activationCode)
				.where('isUsed', '==', false)
				.limit(1)
				.get();
			
			if (codeQuery.empty) {
				showAlert('The activation code is invalid or has already expired.');
				loaderContainer.style.display = 'none';
				handleWrongAttempt(activationCode.split('_')[0] || 'invalid_code');
				return;
			}
			
			const codeDocRef = codeQuery.docs[0].ref;
			const codeData = codeQuery.docs[0].data();
			const acctPlanCode = codeData.planPrefix;
			const planData = plans.find(p => p.codePrefix === acctPlanCode);
			//console.log(plans.find(p => p.codePrefix))
			if (!planData) {
				showAlert('Activation code links to an unknown plan. Please contact support.');
				loaderContainer.style.display = 'none';
				return;
			}
			/*
			await db.runTransaction(async (transaction) => {
				const freshCodeDoc = await transaction.get(codeDocRef);
				if (freshCodeDoc.data().isUsed) {
					throw new Error('This code was just used by another user. Please try a different code.');
				}
				transaction.update(codeDocRef, { isUsed: true });
			});*/
			
			const userCredential = await auth.createUserWithEmailAndPassword(email, password);
			const user = userCredential.user;
			
			const referralCode = referralCodeInput.value === "" ? 'TIMEEGO' : referralCodeInput.value;
			// Use a fallback value if a property is undefined
			const initialBalance = planData.initialBalance !== undefined ? planData.initialBalance : 0;
			// ... rest of the code ...
			await db.collection('TimeEgo-users').doc(user.uid).set({
				acctType: "user",
				username: username,
				email: user.email,
				acctPlan: acctPlanCode,
				userid: user.uid,
				ib: initialBalance,
				totalTaskBal: 0,
				refPoints: 0, // All new users start with 0 points
				referrerUid: referralCode || null,
				referralAwarded: false, // Flag to track if points have been awarded
				pic: '',
				emailVerified: false,
				wBonus: initialBalance,
				savedTheme: 'light',
				wrongAttemptCounts: {},
				suspensionEndTime: {},
				createdAt: firebase.firestore.FieldValue.serverTimestamp()
			});
			
			await user.sendEmailVerification();
			showAlert('Account created! Please check your email to verify your account and log in.');
			signupForm.reset();
			showPage("login-page")
			//	window.location.href = "/accounts/login.html";
		} catch (error) {
			loaderContainer.style.display = 'none';
			let errorMessage = 'Signup failed. Please try again.';
			if (error.code === 'auth/email-already-in-use') {
				errorMessage = 'An account with this email already exists.';
			} else if (error.message.includes('code was just used')) {
				errorMessage = error.message;
			} else {
				console.error("Signup Error:", error);
			}
			showAlert(errorMessage);
		}
	}
});
// Optional: Add blur listeners for real-time feedback (basic)
usernameInput.addEventListener('blur', () => validateInput(usernameInput, usernameError, 'Username is required.'));
emailInput.addEventListener('blur', () => validateEmail(emailInput, emailError));
passwordInput.addEventListener('blur', () => {
	validateInput(passwordInput, passwordError, 'Password is required.');
	if (passwordInput.value.length < 6 && passwordInput.value.length > 0) {
		passwordError.textContent = 'Password must be at least 6 characters.';
	}
});
confirmPasswordInput.addEventListener('blur', () => {
	validateInput(confirmPasswordInput, confirmPasswordError, 'Confirm password is required.');
	if (confirmPasswordInput.value !== passwordInput.value && confirmPasswordInput.value !== '') {
		confirmPasswordError.textContent = 'Passwords do not match.';
	}
});
activationCodeInput.addEventListener('blur', () => validateInput(activationCodeInput, activationCodeError, 'Activation code is required.'));


// --- REFINED: Account Deletion ---
deleteAccountBtn.addEventListener('click', () => {
	showConfirm(
		'Are you sure you want to delete your account? This action cannot be undone.',
		async () => {
			if (!auth.currentUser) {
				showAlert('You are not logged in.');
				return;
			}
			try {
				await db.collection('TimeEgo-users').doc(auth.currentUser.uid).delete();
				await auth.currentUser.delete();
				setAccentColor('#4285f4');
				showAlert('Your account has been successfully deleted.');
				showPage('signup-page');
			} catch (error) {
				console.error('Error deleting account:', error);
				if (error.code === 'auth/requires-recent-login') {
					showAlert('Please re-login to delete your account. This action requires a recent authentication.');
					showPage("login-page")
				} else {
					showAlert('An error occurred while deleting your account. Please try again.');
				}
			}
		}, () => {}
	);
});
// --- REFINED: Account logout ---
logoutAccountBtn.addEventListener('click', () => {
	showConfirm(
		'Logout account?',
		async () => {
			if (!auth.currentUser) {
				showAlert('You are not logged in.');
				return;
			}
			try {
				//await db.collection('TimeEgo-users').doc(auth.currentUser.uid).delete();
				//	await auth.signOut();
				await auth.currentUser.signOut();
				setAccentColor('#4285f4');
				showAlert('Logged out successfully.');
				showPage('login-page');
			} catch (error) {
				console.error('Error logging out account:', error);
				if (error.code === 'auth/requires-recent-login') {
					showAlert('Please re-login to your account. This action requires a recent authentication.');
					showPage("login-page")
				} else {
					showAlert('An error occurred while logging out your account. Please try again later.');
				}
			}
		}, () => {}
	);
});

// --- REFINED: Upgrade Logic ---
upgradePlanBtn.addEventListener('click', async () => {
	if (!currentUserData || !auth.currentUser) {
		showAlert('User data not found. Please log in first.');
		showPage('login-page');
		return;
	}
	//prepare upgrade environment 
	isUpgradeMode = true;
	document.title = "Plan Upgrade";
	upgradeForm.querySelector("#upgrade-email").value = currentUserData.email;
	const currentPlan = plans.find(p => p.codePrefix === currentUserData.acctPlan);
	upgradeForm.querySelector(".login-hint").textContent = `You are upgrading your plan from ${currentPlan?.name || 'your current plan'}.`;
	showPage('upgrade-page');
});

// New Event Listener for the upgrade submission (separated from the signup listener)
upgradeForm.addEventListener('submit', async (event) => {
	if (!isUpgradeMode) return;
	event.preventDefault();
	clearErrors();
	loaderContainer.style.display = 'flex';
	try {
		const activationCode = upgradeForm.querySelector("#upgrade-code").value.trim();
		const userDocRef = db.collection('TimeEgo-users').doc(auth.currentUser.uid);
		const activationCodesRef = db.collection('activationCodes');
		const codeQuery = await activationCodesRef.where('code', '==', activationCode).where('isUsed', '==', false).limit(1).get();
		
		if (codeQuery.empty) {
			showAlert('This upgrade code is invalid or has expired.');
			loaderContainer.style.display = 'none';
			handleWrongAttempt(activationCode.split('_')[0] || 'invalid_code');
			return;
		}
		
		const codeDocRef = codeQuery.docs[0].ref;
		const codeData = codeQuery.docs[0].data();
		const acctPlanCode = codeData.planPrefix;
		if (acctPlanCode === currentUserData.acctPlan) {
			showAlert('You are already on this plan. Please select a different plan to upgrade.');
			loaderContainer.style.display = 'none';
			return;
		}
		/*
		await db.runTransaction(async (transaction) => {
			const freshCodeDoc = await transaction.get(codeDocRef);
			if (freshCodeDoc.data().isUsed) throw new Error('This code was just used or is invalid.');
			transaction.update(codeDocRef, { isUsed: true });
		});
		*/
		const newPlanData = plans.find(p => p.codePrefix === acctPlanCode);
		if (!newPlanData) {
			showAlert('Upgrade code is invalid . Please contact support.');
			loaderContainer.style.display = 'none';
			return;
		}
		const newBalance = currentUserData.ib + newPlanData.initialBalance;
		await userDocRef.update({ acctPlan: acctPlanCode, ib: newBalance, wBonus: newPlanData.initialBalance });
		showAlert('Plan upgraded successfully! Redirecting to dashboard.');
		loaderContainer.style.display = 'none';
		setTimeout(() => {
			window.location.href = '/main/home.html';
		}, 1000);
	} catch (error) {
		loaderContainer.style.display = 'none';
		console.error('Upgrade failed:', error);
		showAlert(error.message || 'An error occurred during upgrade. Please try again or contact support.');
	}
	isUpgradeMode = false;
	upgradeForm.reset();
});

// --- REFINED: Suspension Logic ---
function checkSuspension(planPrefix, userDocData) {
	if (!userDocData) return false;
	wrongAttemptCounts = userDocData.wrongAttemptCounts || {};
	suspensionEndTime = userDocData.suspensionEndTime || {};
	const now = Date.now();
	const suspensionEnd = suspensionEndTime[planPrefix];
	if (suspensionEnd && now < suspensionEnd) {
		const timeLeft = suspensionEnd - now;
		const minutes = Math.ceil(timeLeft / (1000 * 60));
		countdownTimer.textContent = `${minutes} minute(s)`;
		startCountdown(suspensionEnd, planPrefix);
		showPage('admin-contact-page');
		return true;
	}
	return false;
}

async function handleWrongAttempt(planPrefix) {
	//	if (!currentUserData || !auth.currentUser) return;
	try {
		const userDocRef = db.collection('TimeEgo-users').doc(auth.currentUser.uid);
		const userDoc = await userDocRef.get();
		const userData = userDoc.data();
		wrongAttemptCounts = userData.wrongAttemptCounts || {};
		suspensionEndTime = userData.suspensionEndTime || {};
		wrongAttemptCounts[planPrefix] = (wrongAttemptCounts[planPrefix] || 0) + 1;
		const attempts = wrongAttemptCounts[planPrefix];
		let updatedData = { wrongAttemptCounts: wrongAttemptCounts };
		if (attempts % 3 === 0) {
			const suspensionDurationMinutes = (attempts / 3) * 30;
			const suspensionEnd = Date.now() + suspensionDurationMinutes * 60 * 1000;
			suspensionEndTime[planPrefix] = suspensionEnd;
			updatedData.suspensionEndTime = suspensionEndTime;
			showAlert(`Too many incorrect attempts. You are suspended for ${suspensionDurationMinutes} minutes.`);
			checkSuspension(planPrefix, updatedData);
		}
		await userDocRef.update(updatedData);
	} catch (error) {
		console.error("Error handling wrong attempt:", error);
	}
}

function startCountdown(endTime, planPrefix) {
	clearInterval(countdownInterval);
	countdownInterval = setInterval(async () => {
		const now = Date.now();
		const timeLeft = endTime - now;
		if (timeLeft <= 0) {
			clearInterval(countdownInterval);
			if (auth.currentUser) {
				const userDocRef = db.collection('TimeEgo-users').doc(auth.currentUser.uid);
				await userDocRef.update({
					[`wrongAttemptCounts.${planPrefix}`]: firebase.firestore.FieldValue.delete(),
					[`suspensionEndTime.${planPrefix}`]: firebase.firestore.FieldValue.delete(),
				});
			}
			showAlert('Your suspension has ended. You can now request review.')
			reviewBtn.setAttribute("disabled", false);
		} else {
			const minutes = Math.floor(timeLeft / (1000 * 60));
			const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
			countdownTimer.textContent = `${minutes}m ${seconds}s`;
		}
	}, 1000);
}

reviewBtn.addEventListener('click', () => {
	const currentPlanPrefix = currentUserData ? currentUserData.acctPlan : selectedPlanCodePrefix;
	showAlert("Sorry, our system flagged your actions Inappropriately ")
	if (currentUserData) {
		if (!checkSuspension(currentPlanPrefix, currentUserData)) {
			//	displayWelcomePage(currentUserData);
			showPage("login-page")
		} else {
			showAlert('You are still suspended. Please wait for the countdown to finish.');
		}
	} else {
		if (!checkSuspension(currentPlanPrefix, { wrongAttemptCounts, suspensionEndTime })) {
			showPage('login/-page');
		} else {
			showAlert('You are still suspended. Please wait for the countdown to finish.');
		}
	}
});

// --- REFINED: Initial Load Logic ---
function initializeApp() {
	auth.onAuthStateChanged(async (user) => {
		loaderContainer.style.display = 'flex';
		if (user) {
			try {
				const userDoc = await db.collection('TimeEgo-users').doc(user.uid).get();
				if (userDoc.exists) {
					currentUserData = userDoc.data();
					//	console.log(currentUserData)
					const isSuspended = checkSuspension(currentUserData.acctPlan, currentUserData);
					if (!isSuspended /*&& tab === 'welcome-page'*/ ) {
						displayWelcomePage(currentUserData);
					}
				} else {
					await auth.signOut();
					showPage('login-page');
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
				showAlert("Error loading user data. Please try again.");
				await auth.signOut();
				//   showPage('plan-display');
			}
		} else {
			currentUserData = null;
			displayPlans();
			displayVendors();
			//	showPage('plan-display');
		}
		loaderContainer.style.display = 'none';
	});
}

// --- REFINED: displayWelcomePage ---
function displayWelcomePage(currentUserData) {
	if (!currentUserData || !currentUserData.username) {
		console.error("Invalid user data for displayWelcomePage:", currentUserData);
		showPage('signup-page');
		return;
	}
	displayUsername.textContent = currentUserData.username;
	const currentPlan = plans.find(p => p.codePrefix === currentUserData.acctPlan);
	displayAcctPlan.textContent = currentPlan ? currentPlan.name : 'Unknown Plan';
	displayUserid.textContent = currentUserData.userid;
	//		window.location.href = "/accounts/login.html";
	if (currentPlan) {
		setAccentColor(currentPlan.accentColor);
	} else {
		setAccentColor('#4285f4');
	}
	if (currentUserData.acctPlan === 'Pm') {
		upgradePlanBtn.style.display = 'none';
	} else {
		upgradePlanBtn.style.display = 'inline-block';
	}
	if (!auth.currentUser) {
		showAlert('You must be logged in to access this page.');
		setTimeout(() => {
			showPage("login-page");
		}, 2000);
		return;
	}
	showPage('welcome-page');
}

// --- Other Original Functions and Event Listeners ---
// Dynamically displays plan cards from fetched data
function displayPlans() {
	planCardsContainer.innerHTML = '';
	plans.forEach(plan => {
		const planCard = document.createElement('div');
		planCard.classList.add('plan-card');
		if (plan.codePrefix === 'gD') planCard.classList.add('gold');
		if (plan.codePrefix === 'Pm') planCard.classList.add('premium');
		let featuresHtml = '<ul>';
		plan.features.forEach(feature => {
			featuresHtml += `<li>${feature.charAt(0).toUpperCase()+feature.slice(1)}</li>`;
		});
		featuresHtml += '</ul>';
		planCard.innerHTML = `
                <h2>${plan.name}</h2>
                <p class="price">${plan.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</p>
                ${featuresHtml}
                <button data-plan-prefix="${plan.codePrefix}">Select ${plan.name}</button>
            `;
		planCardsContainer.appendChild(planCard);
		planCard.querySelector('button').addEventListener('click', (event) => {
			selectedPlanCodePrefix = event.target.dataset.planPrefix;
			const selectedPlanName = plans.find(p => p.codePrefix === selectedPlanCodePrefix).name;
			selectedPlanInfo.textContent = `Selected: ${selectedPlanName}`;
			isUpgradeMode = false;
			showPage('signup-page');
		});
	});
}

function displayVendors() {
	const vendorContainer = document.querySelector('.vendor-cards-grid');
	if (!vendorContainer) return;
	vendorContainer.innerHTML = '';
	
	vendorAdmins.forEach(vendor => {
		const vendorCard = document.createElement('div');
		vendorCard.classList.add('vendor-card');
		vendorCard.innerHTML = `
                               
                        <div class="vendor-avatar-wrapper">
                            <img src="${vendor.pic}" alt="${vendor.name}">
                        </div>
                        <h3 class="vendor-name" data-account="${vendor.number}">${vendor.name}</h3><br>
                        <button class="chat-button" data-vendor-number="${vendor.number}">Chat</button>
            `;
		vendorContainer.appendChild(vendorCard);
	});
	document.querySelectorAll('.chat-button').forEach(button => {
		button.addEventListener('click', function() {
			const vendorName = this.closest('.vendor-card').querySelector('.vendor-name').textContent;
			const vendorNumber = this.dataset.vendorNumber;
			showAlert(`Connecting you with Vendor ${vendorName}!`);
			setTimeout(() => {
				messageAdmin(`Hello there am in need of the TimeEgo activation code, ${auth.currentUser ? auth.currentUser.uid : 'as a user.'}.`, vendorNumber);
			}, 2000);
		});
	});
}

/**
 * Renders the contact links to the UI from the hardcoded data.
 */
function renderContactLinks() {
	//	contactLinksContainer.innerHTML = ''; // Clear existing links
	if (contactLinksData.length === 0) {
		noContactLinksMessage.style.display = 'block'; // Show "No contact links" message
	} else {
		noContactLinksMessage.style.display = 'none'; // Hide message
		contactLinksData.forEach(link => {
			const anchor = document.createElement('a');
			anchor.href = link.url;
			anchor.target = '_blank'; // Open in new tab
			anchor.rel = 'noopener noreferrer'; // Security best practice
			anchor.className = 'contact-link-item';
			
			const icon = document.createElement('i');
			icon.className = link.icon; // Font Awesome class
			
			const nameSpan = document.createElement('span');
			nameSpan.textContent = link.name;
			
			anchor.appendChild(icon);
			anchor.appendChild(nameSpan);
			contactLinksContainer.appendChild(anchor);
		});
	}
}

/**
 * Renders the FAQs to the UI from the hardcoded data and sets up accordion-like toggling.
 */
function renderFAQs() {
	faqContainer.innerHTML = ''; // Clear existing FAQs
	if (faqData.length === 0) {
		noFaqMessage.style.display = 'block'; // Show "No FAQs" message
	} else {
		noFaqMessage.style.display = 'none'; // Hide message
		faqData.forEach(faq => {
			const faqItem = document.createElement('div');
			faqItem.className = 'faq-item';
			
			const questionDiv = document.createElement('div');
			questionDiv.className = 'faq-question';
			questionDiv.textContent = faq.question;
			
			const arrowSpan = document.createElement('span');
			arrowSpan.className = 'arrow';
			arrowSpan.textContent = '▼'; // Down arrow
			
			questionDiv.appendChild(arrowSpan);
			
			const answerDiv = document.createElement('div');
			answerDiv.className = 'faq-answer';
			answerDiv.textContent = faq.answer;
			
			// Toggle functionality for FAQ
			questionDiv.addEventListener('click', () => {
				// Close other open answers
				document.querySelectorAll('.faq-answer.open').forEach(openAnswer => {
					if (openAnswer !== answerDiv) {
						openAnswer.classList.remove('open');
						openAnswer.previousElementSibling.classList.remove('active'); // Deactivate question
					}
				});
				
				// Toggle current answer
				answerDiv.classList.toggle('open');
				questionDiv.classList.toggle('active'); // For rotating arrow
			});
			
			faqItem.appendChild(questionDiv);
			faqItem.appendChild(answerDiv);
			faqContainer.appendChild(faqItem);
		});
	}
}


// Add functionality to filter buttons
document.querySelectorAll('.filter-button').forEach(button => {
	button.addEventListener('click', function() {
		document.querySelectorAll('.filter-button').forEach(btn => { btn.classList.remove('active'); });
		this.classList.add('active');
		console.log(`Filter selected: ${this.textContent}`);
	});
});

// Call the initialization function when the DOM is ready
initializeApp();
displayPlans();
displayVendors()
renderContactLinks()
renderFAQs()


document.addEventListener('DOMContentLoaded', async () => {
	await fetchPlansAndVendors();
	
});


/**
 * Validates a single input field and displays an error message if it's empty.
 * @param {HTMLInputElement} input - The input element to validate.
 * @param {HTMLElement} errorElement - The element to display the error message.
 * @param {string} message - The error message to display.
 * @returns {boolean} True if the input is valid, false otherwise.
 */
// --- Login Form Submission ---
loginForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	clearErrors();
	loaderContainer.style.display = 'flex';
	let isValid = true;
	if (!validateInput(loginEmailInput, loginEmailError, 'Email is required.')) isValid = false;
	if (!validateInput(loginPasswordInput, loginPasswordError, 'Password is required.')) isValid = false;
	if (!isValid) {
		loginFormMessage.textContent = 'Please fix the errors above to proceed.';
		return;
	}
	
	try {
		const email = loginEmailInput.value.trim();
		const password = loginPasswordInput.value
		// Set Firebase persistence to LOCAL for a long-lasting session (up to 30 days)
		await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
		
		// Sign in with Firebase Authentication
		const userCredential = await auth.signInWithEmailAndPassword(email, password);
		const user = userCredential.user;
		
		// Fetch user data from Firestore using the user's UID
		const userDoc = await db.collection('TimeEgo-users').doc(user.uid).get();
		if (userDoc.exists) {
			const userData = userDoc.data();
			// Store non-sensitive user data in local storage for quick access
			localStorage.setItem('loggedInUser', JSON.stringify({
				username: userData.username,
				email: userData.email,
				plan: userData.acctPlan,
				userid: userData.userid,
				refferer: userData.referrerUid,
			}));
			//		await user.sendEmailVerification();
			showAlert('Login successful!');
			loginForm.reset();
			setTimeout(() => {
				window.location.href = '/main/home.html';
			}, 1000);
		} else {
			// User document not found, log out the user and show an error
			await auth.signOut();
			showAlert('This account does not exist.');
			console.error('Firestore document for user does not exist.');
		}
		
	} catch (error) {
		let errorMessage = 'Login failed. Please check your credentials.';
		if (error.code === 'auth/wrong-password') {
			errorMessage = 'Invalid password.';
		} else if (error.code === 'auth/user-not-found') {
			errorMessage = 'No user found with that email.';
		} else if (error.code === 'auth/invalid-email') {
			errorMessage = 'Invalid email format.';
		} else {
			console.error("Login Error:", error);
		}
		showAlert(errorMessage);
	} finally {
		loaderContainer.style.display = 'none';
	}
});
// Optional: Add blur listeners for real-time feedback
loginEmailInput.addEventListener('blur', () => !validateInput(emailInput, loginEmailError, 'Email is required.'));
loginPasswordInput.addEventListener('blur', () => !validateInput(passwordInput, loginPasswordError, 'Password is required.'));

//For user reset link 
const resetForm = document.getElementById("resetForm");
resetForm.addEventListener("submit", async (e) => {
	e.preventDefault()
	clearErrors();
	const resetEmailInput = resetForm.querySelector('#resetEmail');
	loaderContainer.style.display = 'flex';
	try {
		const email = resetEmailInput.value.trim();
		await auth.sendPasswordResetEmail(email);
		showAlert('A password reset link has been sent to your email. Please check your inbox or spam folder.');
		showPage('login-page');
	} catch (error) {
		
		if (error.code === 'auth/user-not-found') {
			showAlert("This Email isn't registered yet");
		} else if (error.code === 'auth/invalid-email') {
			showAlert('The email address you entered is not valid.');
		} else {
			console.error("Password Reset Error:", error);
		}
		showAlert("Failed to send password reset email. Please try again.");
	} finally {
		loaderContainer.style.display = 'none';
		resetForm.reset();
	}
});

document.querySelectorAll('form').forEach((form) => {
	form.querySelector("button").addEventListener('blur', () => {
		form.querySelector("button").innerHTML = `<div class="spinner"></div>`;
		setTimeout(() => { form.querySelector("button").innerHTML = `Proceed`; }, 2000)
	})
})
// --- DOM Elements ---
const planCardsContainer = document.querySelector('.plan-cards');
const submitSignupBtn = document.getElementById('submit-signup');
const usernameInput = document.getElementById('username');
const activationCodeInput = document.getElementById('activationCode');
const displayUsername = document.getElementById('display-username');
const displayAcctPlan = document.getElementById('display-acctPlan');
const displayUserid = document.getElementById('display-userid');
const selectedPlanInfo = document.getElementById('selected-plan-info');
const upgradePlanBtn = document.getElementById('upgrade-plan-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const logoutAccountBtn = document.getElementById('logout-btn');
const countdownTimer = document.getElementById('countdown-timer');
const idNum = document.getElementById('idNum');
const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const referralCodeInput = document.getElementById('referralCode');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');
const usernameError = document.getElementById('usernameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');

//for login Dom
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginForm = document.getElementById('loginForm')
const upgradeForm = document.getElementById("upgradeForm")
const loginEmailError = document.getElementById('loginEmailError');
const loginPasswordError = document.getElementById('loginPasswordError');
const loginFormMessage = document.getElementById('loginFormMessage');

const activationCodeError = document.getElementById('activationCodeError');
const termsError = document.getElementById('termsError');
const formMessage = document.getElementById('formMessage');
const adminContactPage = document.getElementById('admin-contact-page');
//for Faq
const contactLinksContainer = document.getElementById('contactLinksContainer');
const faqContainer = document.getElementById('faqContainer');
const noContactLinksMessage = document.getElementById('noContactLinksMessage');
const noFaqMessage = document.getElementById('noFaqMessage');
const loaderContainer = document.getElementById('loader-container');
const customAlertModal = document.getElementById('custom-alert-modal');
const alertMessage = document.getElementById('alert-message');
const alertOkButton = document.getElementById('alert-ok-button');
const closeAlertButton = document.querySelector('#custom-alert-modal .close-button');
const menuToggle = document.querySelector('.menu-button');
const mainNav = document.querySelector('.mobile-menu-overlay');
const reviewBtn = document.querySelector("#request-review");
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesButton = document.getElementById('confirm-yes-button');
const confirmNoButton = document.getElementById('confirm-no-button');

// to get object params from searchlist
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref'),
	upgradeParam = urlParams.get('upgrade'),
	tabParam = urlParams.get('tab');

if (refParam) {
	referralCodeInput.value = refParam;
	referralCodeInput.setAttribute('disabled', true);
	referralCodeInput.style.opacity = '.5';
}
//for others SPA, coming soon
if (upgradeParam === 'true') {
	upgradePlanBtn.click();
}

function showAlert(message) {
	alertMessage.textContent = message;
	customAlertModal.style.display = 'flex';
}

function showConfirm(message, onConfirm, onCancel) {
	confirmMessage.textContent = message;
	customConfirmModal.style.display = 'flex';
	
	const handleConfirm = () => {
		customConfirmModal.style.display = 'none';
		confirmYesButton.removeEventListener('click', handleConfirm);
		confirmNoButton.removeEventListener('click', handleCancel);
		onConfirm();
	};
	
	const handleCancel = () => {
		customConfirmModal.style.display = 'none';
		confirmYesButton.removeEventListener('click', handleConfirm);
		confirmNoButton.removeEventListener('click', handleCancel);
		onCancel();
	};
	
	confirmYesButton.addEventListener('click', handleConfirm);
	confirmNoButton.addEventListener('click', handleCancel);
}

alertOkButton.addEventListener('click', () => {
	customAlertModal.style.display = 'none';
});

closeAlertButton.addEventListener('click', () => {
	customAlertModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
	if (event.target === customAlertModal) {
		customAlertModal.style.display = 'none';
	}
	if (event.target === customConfirmModal) {
		customConfirmModal.style.display = 'none';
	}
	if (event.target === mainNav) {
		mainNav.classList.remove('active');
		menuToggle.innerHTML = `<svg class="h-6 w-6" fill="none" width="30px" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
		
	}
});

const faqData = [
	{ id: 'a1', question: 'How can I reset my password?', answer: 'You can reset your password by visiting the "Forgot Password" link on the login page and following the instructions sent to your email.' },
	{ id: 'a2', question: 'What payment methods do you accept?', answer: 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers.' },
	{ id: 'a3', question: 'How do I contact customer support?', answer: 'You can reach our customer support team via email at support@timeego.com, or through our live chat feature available on our website during business hours.' },
	{ id: 'a4', question: 'Can I change my order after it has been placed?', answer: 'Unfortunately, once an order is placed, it cannot be modified. Please contact support immediately if you need to cancel or make changes.' },
	{ id: 'a5', question: 'What is your return policy?', answer: 'Our return policy allows returns within 30 days of purchase, provided the item is in its original condition. Please see our full policy for details.' }
];


function togglePassword(password) {
	if (password && password.type === 'text') {
		password.type = 'password';
	} else if (password) {
		password.type = 'text';
	}
}

if (menuToggle && mainNav) {
	menuToggle.addEventListener('click', () => {
		mainNav.classList.toggle('active');
		//   menuToggle.querySelector('i').classList.toggle('fa-bars');
		if (mainNav.classList.contains('active')) {
			menuToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" fill="currentColor" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
		} else {
			menuToggle.innerHTML = `<svg class="h-6 w-6" fill="none" width="30px" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
		}
	});
	
	// Close menu when a nav link is clicked (for smooth scrolling)
	mainNav.querySelectorAll('li').forEach(link => {
		link.addEventListener('click', () => {
			if (mainNav.classList.contains('active')) {
				mainNav.classList.remove('active');
				menuToggle.innerHTML = `<svg class="h-6 w-6" fill="none" width="30px" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
			}
		});
	});
	
}

//For a dark Ui
const html = document.documentElement;
html.setAttribute('data-theme', JSON.parse(localStorage.getItem("savedTheme")))

function switchTheme() {
	const currentTheme = html.getAttribute('data-theme');
	const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
	localStorage.setItem("savedTheme", JSON.stringify(newTheme));
	html.setAttribute('data-theme', newTheme);
}

/**
 * Switches the active page, handles loader, updates history, and persists state.
 * This function is exported to be potentially used by other modules.
 * @param {string} tabId - The ID of the page container to show (e.g., 'home-page').
 * @param {boolean} [isPopState=false] - True if called from popstate event, false otherwise.
 */
const pageContainers = document.querySelectorAll('.page');
// --- Tab Switching Functionality
function showPage(tabId, isPopState = false) {
	if (!navigator.online) {
		console.warn('Something went wrong, Please Connect to the internet');
		//   showAlert('Something went wrong, Please Connect to the internet');
		// return;
	}
	// Ensure the tabId corresponds to an existing page
	const targetPageElement = document.getElementById(tabId);
	if (!targetPageElement) {
		console.error(`Page with ID "${tabId}" not found. Defaulting to home-page.`);
		tabId = 'login-page'; // Default to home if invalid tabId
	}
	loaderContainer.style.display = "flex";
	setTimeout(function() {
		pageContainers.forEach(div => {
			div.classList.remove('active');
		});
		// Show the target page container and apply fade-in
		document.getElementById(tabId).classList.add('active');
		localStorage.setItem('savedTab', JSON.stringify(tabId));
		loaderContainer.style.display = "none";
		// Update document title
		document.title = `Timeego - ${tabId.replace('-page', '').charAt(0).toUpperCase() + tabId.replace('Tab', ' Page').slice(1)}`;
		
		
		urlParams.set("tab", tabId);
		const updatedUrl = window.location.origin + window.location.pathname + '?' + urlParams.toString();
		console.log(updatedUrl)
		window.history.pushState({}, '', updatedUrl);
		
		// Only push state if not a popstate event (to avoid adding duplicate history entries)
		if (!isPopState) {
			history.pushState({ page: tabId }, '', `#${tabId}`);
		}
	}, 1500); //2000
}

const savedTab = JSON.parse(localStorage.getItem("savedTab"))
window.onpopstate = function(event) {
	if (event.state && event.state.page) {
		showPage(event.state.page, true); // Pass true to indicate it's a popstate event
	} else {
		const pathPage = window.location.hash.substring(1) || 'login-page';
		showPage(pathPage, true);
	}
};

const autoPage = !tabParam ? savedTab : tabParam;
const initialPageFromHash = window.location.hash.substring(1);
const initialPage = initialPageFromHash || autoPage || 'login-page';
history.replaceState({ page: initialPage }, '', `#${initialPage}`);
// Render the initial page
showPage(initialPage);
//showPage("upgrade-page")


//for form offline control
document.querySelectorAll('form').forEach((form) => {
	form.addEventListener('submit', (e) => {
		e.preventDefault()
	})

})
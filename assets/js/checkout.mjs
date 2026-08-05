import checkoutConfig from './checkout-config.mjs';

const REQUIRED_PRODUCTS = Object.freeze(['validate', 'rotshield', 'bundle']);
const PADDLE_SCRIPT_URL = 'https://cdn.paddle.com/paddle/v2/paddle.js';

const exactKeys = (object, expected) => {
	if (!object || typeof object !== 'object' || Array.isArray(object)) return false;
	const actual = Object.keys(object).sort();
	return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
};

// Classify checkout configuration as one indivisible set. A partial setup must
// never enable one button while the public product/price contract is incomplete.
export function classifyCheckoutConfig(config, requiredProducts = REQUIRED_PRODUCTS) {
	if (!exactKeys(config, ['environment', 'clientToken', 'prices', 'capabilityMatrix'])) {
		return { state: 'invalid', reason: 'unexpected_config_shape' };
	}
	if (!exactKeys(config.prices, requiredProducts)) return { state: 'invalid', reason: 'unexpected_price_shape' };
	if (!exactKeys(config.capabilityMatrix, ['status', 'version', 'sourceCommit'])) {
		return { state: 'invalid', reason: 'unexpected_matrix_shape' };
	}

	const prices = requiredProducts.map((product) => config.prices[product]);
	const deliberatelyDisabled = config.environment === 'disabled'
		&& config.clientToken === ''
		&& prices.every((price) => price === '')
		&& config.capabilityMatrix.status === 'pending'
		&& config.capabilityMatrix.version === ''
		&& config.capabilityMatrix.sourceCommit === '';
	if (deliberatelyDisabled) return { state: 'disabled', reason: 'release_gates_pending' };

	if (!['sandbox', 'live'].includes(config.environment)) return { state: 'invalid', reason: 'invalid_environment' };
	const tokenPrefix = config.environment === 'sandbox' ? 'test_' : 'live_';
	if (typeof config.clientToken !== 'string'
		|| !config.clientToken.startsWith(tokenPrefix)
		|| !/^(?:test|live)_[A-Za-z0-9]{12,}$/.test(config.clientToken)) {
		return { state: 'invalid', reason: 'invalid_client_token' };
	}
	if (!prices.every((price) => typeof price === 'string' && /^pri_[a-z0-9]{8,}$/.test(price))) {
		return { state: 'invalid', reason: 'invalid_price' };
	}
	if (config.capabilityMatrix.status !== 'verified'
		|| !/^v\d+\.\d+\.\d+$/.test(config.capabilityMatrix.version)
		|| !/^[0-9a-f]{40}$/.test(config.capabilityMatrix.sourceCommit)) {
		return { state: 'invalid', reason: 'unverified_capability_matrix' };
	}
	return { state: 'enabled', reason: 'complete' };
}

// Produce only Paddle's public price intent; credentials stay in Initialize().
export function checkoutIntent(config, product) {
	if (classifyCheckoutConfig(config).state !== 'enabled' || !REQUIRED_PRODUCTS.includes(product)) {
		throw new Error('checkout_unavailable');
	}
	return { items: [{ priceId: config.prices[product], quantity: 1 }] };
}

export function checkoutStatusForEvent(event, completedAlready = false) {
	if (completedAlready || event?.name === 'checkout.completed') {
		return 'Payment received. Paddle will email your receipt; Mecha license delivery follows separately.';
	}
	if (event?.name === 'checkout.closed') return 'Checkout closed. No purchase was completed; you can reopen it.';
	if (event?.name === 'checkout.error' || event?.name === 'checkout.payment.failed') {
		return 'Checkout did not complete. No license was issued by this page; you can reopen it.';
	}
	return null;
}

const loadPaddle = (documentObject, windowObject) => new Promise((resolve, reject) => {
	if (windowObject.Paddle) { resolve(windowObject.Paddle); return; }
	const script = documentObject.createElement('script');
	script.src = PADDLE_SCRIPT_URL;
	script.async = true;
	script.crossOrigin = 'anonymous';
	script.addEventListener('load', () => resolve(windowObject.Paddle));
	script.addEventListener('error', () => reject(new Error('checkout_library_unavailable')));
	documentObject.head.appendChild(script);
});

export async function mountCheckout(documentObject, windowObject, paddleLoader = loadPaddle, config = checkoutConfig) {
	const buttons = [...documentObject.querySelectorAll('[data-checkout-product]')];
	if (buttons.length === 0) return { state: 'absent' };
	const status = documentObject.getElementById('validate-checkout-status');
	const classification = classifyCheckoutConfig(config);
	if (classification.state !== 'enabled') {
		if (status) status.textContent = classification.state === 'disabled'
			? 'Checkout is not live. No payment can be taken.'
			: 'Checkout configuration is incomplete. No payment can be taken.';
		return classification;
	}

	let paddle;
	try {
		paddle = await paddleLoader(documentObject, windowObject);
		if (!paddle?.Initialize || !paddle?.Checkout?.open) throw new Error('checkout_library_unavailable');
	} catch {
		if (status) status.textContent = 'Checkout could not load. No payment can be taken; please try again later.';
		return { state: 'unavailable', reason: 'library_load_failed' };
	}

	let completed = false;
	try {
		if (config.environment === 'sandbox') paddle.Environment.set('sandbox');
		paddle.Initialize({
			token: config.clientToken,
			eventCallback(event) {
				if (event?.name === 'checkout.completed') completed = true;
				const message = checkoutStatusForEvent(event, completed);
				if (message && status) status.textContent = message;
			},
		});
	} catch {
		if (status) status.textContent = 'Checkout could not initialize. No payment can be taken; please try again later.';
		return { state: 'unavailable', reason: 'initialization_failed' };
	}

	for (const button of buttons) {
		const product = button.dataset.checkoutProduct;
		button.disabled = false;
		button.setAttribute('aria-disabled', 'false');
		button.textContent = button.dataset.enabledLabel;
		button.addEventListener('click', () => {
			completed = false;
			if (status) status.textContent = 'Opening secure Paddle checkout…';
			paddle.Checkout.open({
				...checkoutIntent(config, product),
				settings: { displayMode: 'overlay', theme: 'dark' },
			});
		});
	}
	if (status) status.textContent = 'Secure checkout is ready.';
	return classification;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
	mountCheckout(document, window);
}

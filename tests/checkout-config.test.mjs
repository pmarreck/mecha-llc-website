import {
	classifyCheckoutConfig,
	checkoutIntent,
	checkoutStatusForEvent,
	mountCheckout,
} from '../assets/js/checkout.mjs';

let pass = 0, fail = 0;
const ok = (condition, description) => {
	if (condition) { pass++; console.log(`ok ${pass + fail} - ${description}`); }
	else { fail++; console.log(`not ok ${pass + fail} - ${description}`); }
};
const eq = (actual, expected, description) => ok(actual === expected, `${description} (got ${JSON.stringify(actual)})`);

const disabled = {
	environment: 'disabled',
	clientToken: '',
	prices: { validate: '', rotshield: '', bundle: '' },
	capabilityMatrix: { status: 'pending', version: '', sourceCommit: '' },
};
const enabledSandbox = {
	environment: 'sandbox',
	clientToken: 'test_abcdefghijklmnop',
	prices: {
		validate: 'pri_01validate123456789',
		rotshield: 'pri_01rotshield12345678',
		bundle: 'pri_01bundle1234567890',
	},
	capabilityMatrix: { status: 'verified', version: 'v1.0.0', sourceCommit: '0123456789abcdef0123456789abcdef01234567' },
};

// Classify the whole configuration population, including secret-shaped extras.
{
	const cases = [
		{ name: 'deliberately disabled', config: disabled, state: 'disabled' },
		{ name: 'complete sandbox', config: enabledSandbox, state: 'enabled' },
		{ name: 'partial price map', config: { ...enabledSandbox, prices: { ...enabledSandbox.prices, bundle: '' } }, state: 'invalid' },
		{ name: 'descriptive placeholder price', config: { ...enabledSandbox, prices: { ...enabledSandbox.prices, validate: 'pri_SANDBOX_validate' } }, state: 'invalid' },
		{ name: 'unverified matrix', config: { ...enabledSandbox, capabilityMatrix: { ...enabledSandbox.capabilityMatrix, status: 'pending' } }, state: 'invalid' },
		{ name: 'sandbox/live token mismatch', config: { ...enabledSandbox, clientToken: 'live_abcdefghijklmnop' }, state: 'invalid' },
		{ name: 'unknown environment', config: { ...enabledSandbox, environment: 'production' }, state: 'invalid' },
		{ name: 'secret-shaped extra', config: { ...enabledSandbox, apiKey: 'forbidden' }, state: 'invalid' },
	];
	const verdicts = cases.map(({ config }) => classifyCheckoutConfig(config).state);
	eq(verdicts.join(','), cases.map(({ state }) => state).join(','), 'classifies disabled/enabled/invalid configurations over a set');
}

// The DOM adapter does not load Paddle while disabled, and enables the button
// only after a complete configuration and successful library initialization.
{
	const makeSurface = () => {
		const listeners = {};
		const button = {
			dataset: { checkoutProduct: 'validate', enabledLabel: 'Buy Mecha Validate — $49.99' },
			disabled: true,
			textContent: 'Checkout not yet available — $49.99',
			setAttribute(name, value) { this[name] = value; },
			addEventListener(name, callback) { listeners[name] = callback; },
		};
		const status = { textContent: '' };
		const documentObject = {
			querySelectorAll() { return [button]; },
			getElementById() { return status; },
		};
		return { button, status, listeners, documentObject };
	};

	let loaderCalls = 0;
	const disabledSurface = makeSurface();
	const disabledResult = await mountCheckout(disabledSurface.documentObject, {}, async () => { loaderCalls++; }, disabled);
	eq(disabledResult.state, 'disabled', 'disabled mount remains disabled');
	eq(loaderCalls, 0, 'disabled mount does not request Paddle.js');
	eq(disabledSurface.button.disabled, true, 'disabled mount cannot accept a click');

	const enabledSurface = makeSurface();
	const paddleCalls = { environment: [], initialize: [], opened: [] };
	const paddle = {
		Environment: { set(value) { paddleCalls.environment.push(value); } },
		Initialize(options) { paddleCalls.initialize.push(options); },
		Checkout: { open(intent) { paddleCalls.opened.push(intent); } },
	};
	const enabledResult = await mountCheckout(enabledSurface.documentObject, {}, async () => { loaderCalls++; return paddle; }, enabledSandbox);
	eq(enabledResult.state, 'enabled', 'complete config enables mount');
	eq(paddleCalls.environment.join(','), 'sandbox', 'sandbox environment is set before initialization');
	eq(paddleCalls.initialize[0].token, enabledSandbox.clientToken, 'Paddle initializes with frontend client token');
	eq(enabledSurface.button.disabled, false, 'button enables after Paddle initialization');
	enabledSurface.listeners.click();
	eq(paddleCalls.opened[0].items[0].priceId, enabledSandbox.prices.validate, 'click opens configured Validate price');
	paddleCalls.initialize[0].eventCallback({ name: 'checkout.completed' });
	eq(enabledSurface.status.textContent, 'Payment received. Paddle will email your receipt; Mecha license delivery follows separately.', 'completion updates accessible status');

	const rejectedSurface = makeSurface();
	const rejected = await mountCheckout(rejectedSurface.documentObject, {}, async () => ({
		Environment: { set() {} },
		Initialize() { throw new Error('Paddle rejected token'); },
		Checkout: { open() {} },
	}), enabledSandbox);
	eq(rejected.state, 'unavailable', 'initialization failure stays unavailable');
	eq(rejectedSurface.button.disabled, true, 'initialization failure never enables button');
}

// Product intent contains only a public price ID and quantity.
{
	const intent = checkoutIntent(enabledSandbox, 'validate');
	eq(intent.items.length, 1, 'checkout intent has one line item');
	eq(intent.items[0].priceId, enabledSandbox.prices.validate, 'checkout intent uses configured public price ID');
	eq(intent.items[0].quantity, 1, 'checkout intent uses quantity one');
	ok(!JSON.stringify(intent).includes(enabledSandbox.clientToken), 'checkout intent does not carry the client token');
}

// Recovery messaging is deterministic and does not claim license delivery from
// a frontend event; the authenticated webhook owns fulfillment.
{
	const cases = [
		['checkout.completed', false, 'Payment received. Paddle will email your receipt; Mecha license delivery follows separately.'],
		['checkout.closed', false, 'Checkout closed. No purchase was completed; you can reopen it.'],
		['checkout.error', false, 'Checkout did not complete. No license was issued by this page; you can reopen it.'],
		['checkout.payment.failed', false, 'Checkout did not complete. No license was issued by this page; you can reopen it.'],
		['checkout.closed', true, 'Payment received. Paddle will email your receipt; Mecha license delivery follows separately.'],
	];
	for (const [name, completed, expected] of cases) {
		eq(checkoutStatusForEvent({ name }, completed), expected, `${name} recovery message`);
	}
}

console.log(`\n# ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : Math.min(fail, 255));

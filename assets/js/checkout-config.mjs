// Public checkout configuration. Keep this deliberately disabled until the
// sandbox product, capability, commerce, and release gates all pass.
export default Object.freeze({
	environment: 'disabled',
	clientToken: '',
	prices: Object.freeze({
		validate: '',
		rotshield: '',
		bundle: '',
	}),
	capabilityMatrix: Object.freeze({
		status: 'pending',
		version: '',
		sourceCommit: '',
	}),
});

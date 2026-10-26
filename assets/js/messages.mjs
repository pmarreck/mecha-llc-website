export function runtimeText(windowObject, english, error = false) {
	const translated=windowObject.mechaMessages?.[english] ?? english;
	return error && translated!==english ? `${translated} (\u2066search: ${english}\u2069)` : translated;
}

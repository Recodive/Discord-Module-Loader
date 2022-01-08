export default class BaseClass {
	disabled = false;
	enable() {
		this.disabled = false;
	}
	disable() {
		this.disabled = true;
	}
}

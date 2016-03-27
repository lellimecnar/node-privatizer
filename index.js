var Reflect = require('harmony-reflect');

module.exports = exports = function(obj, opts) {
	opts = opts || {};
	var prefix = opts.prefix || this.prefix || '_',
		isPrivate = opts.isPrivate || this.isPrivate || function isPrivate(obj, name) {
			return (
				!name.startsWith(prefix) ||
				(
					new Error().stack
						.split(/[\r\n]+\s*/)[5] ||
					''
				).startsWith(`at ${obj.constructor.name}`)
			);
		},
		validate = opts.validate || this.validate || function validate(obj, name, action) {
			if (!isPrivate(obj, name)) {
				throw new ReferenceError(`cannot ${action} private member "${name}"`);
			}
		},
		noop = function(){},
		getFn = opts.get || this.get || noop,
		setFn = opts.set || this.set || noop,
		deleteFn = opts.deleteProperty || this.deleteProperty || noop,
		hasFn = opts.has || this.has || noop,
		keysFn = opts.ownKeys || this.ownKeys || noop;

	return new Proxy(obj, {
		get(target, name, receiver) {
			validate(obj, name, 'access');
			var val = target[name],
				tmpVal = getFn(target, name, receiver);

			if (typeof tmpVal !== 'undefined') {
				val = tmpVal;
			}
			return val;
		},
		set(target, name, val) {
			validate(obj, name, 'set');
			var tmpVal = setFn(target, name, val);

			if (typeof tmpVal !== 'undefined') {
				val = tmpVal;
			}
			target[name] = val;
		},
		deleteProperty(target, name) {
			validate(obj, name, 'delete');
			var delRet = deleteFn(target, name);

			if (
				delRet === true ||
				typeof delRet === 'undefined'
			) {
				delete target[name];
			}

		},
		has(target, name) {
			var tmpVal = hasFn(target, name);
			if (typeof tmpVal === 'boolean') {
				return tmpVal;
			}
			return !isPrivate(obj,name)? false :
					typeof target[name] !== 'undefined';
		},
		ownKeys(target) {
			var tmpKeys = keysFn(target);
			if (Array.isArray(tmpKeys)) {
				return tmpKeys;
			}

			var keys = Object.getOwnPropertyNames(target.constructor.prototype)
					.concat(Object.getOwnPropertyNames(target));

			return keys.filter((key) => {
				return (
					key !== 'constructor' &&
					isPrivate(key)
				);
			});
		}
	});
};

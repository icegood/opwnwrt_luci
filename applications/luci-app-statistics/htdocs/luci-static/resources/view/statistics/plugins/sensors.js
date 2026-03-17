'use strict';
'require baseclass';
'require fs';
'require form';
'require statistics.pluginUtil as pluginUtil';

var sensorTypes = [
	/^\+*[0-9]+(?:\.[0-9]+)?v$/i,											'voltage',
	/^(?:3VSB|ain|in|Vbat|vccp|vdd|vid|vin|volt|voltbatt|vrm)[0-9]*$/i,		'voltage',
	/^(?:composite|cpu_temp|remote_temp|tctl|tccd|temp)[0-9]*$/i,			'temperature',
	/^(?:fan)[0-9]*$/i,														'fanspeed',
	/^(?:pwm)[0-9]*$/i,														'pwm',
	/^(?:humidity)[0-9]*$/i,												'humidity',
	/^(?:curr)[0-9]*$/i,													'current',
	/^(?:power)[0-9]*$/i,													'power',
	/^.*$/i,																'other'
];

return baseclass.extend({ 
	title: _('Sensors Plugin Configuration'),
	description: _('The sensors plugin uses the Linux Sensors framework to gather environmental statistics.'),

	addFormOptions(s) {
		let o;

		pluginUtil.addCommonOptions(s);

		o = s.option(form.DynamicList, 'Sensor', _('Sensor list'));
		o.rmempty = true;
		o.size = 18;
		o.depends('enable', '1');
		o.load = function(section_id) {
			return fs.exec_direct('/usr/sbin/sensors', ['-j'], 'json').then(L.bind(function(output) {
				for (let bus in output) {
					for (let sensor in output[bus]) {
						if (!L.isObject(output[bus][sensor]))
							continue;

						for (let j = 0; j < sensorTypes.length; j += 2) {
							if (sensor.match(sensorTypes[j])) {
								this.value('%s/%s-%s'.format(bus, sensorTypes[j + 1], sensor));
								break;
							}
						}
					}
				}

				return this.super('load', [section_id]);
			}, this));
		};

		o = s.option(form.Flag, 'IgnoreSelected', _('Monitor all except specified'));
		o.depends('enable', '1');
		o = s.option(form.Flag, 'UseLabels', _('Use labels'));
		o.default = false;
		// o.disabled = true;
	},

	configSummary(section) {
		const sensors = L.toArray(section.Sensor);
		const invert = section.IgnoreSelected == '1';

		if (invert && sensors.length)
			return N_(sensors.length, 'Monitoring all but one sensor', 'Monitoring all but %d sensors').format(sensors.length);
		else if (sensors.length)
			return N_(sensors.length, 'Monitoring one sensor', 'Monitoring %d sensors').format(sensors.length);
		else
			return _('Monitoring all sensors');
	}
});

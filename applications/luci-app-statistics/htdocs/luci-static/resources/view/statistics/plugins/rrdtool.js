'use strict';
'require baseclass';
'require form';
'require statistics.pluginUtil as pluginUtil';

return baseclass.extend({
	title: _('RRDTool Plugin Configuration'),
	description: _('The rrdtool plugin stores the collected data in rrd database files, the foundation of the diagrams.<br /><br /><strong>Warning: Setting the wrong values will result in a very high memory consumption in the temporary directory. This can render the device unusable!</strong>'),

	addFormOptions(s) {
		let o;
		let cacheTimeout, cacheFlush;

		const syncCacheFlush = function(section_id, value) {
			const flushUi = cacheFlush.getUIElement(section_id);
			const flushInput = this.map.findElement('id', 'widget.%s'.format(cacheFlush.cbid(section_id)));
			const timeoutValue = value ?? cacheTimeout.formvalue(section_id) ?? cacheTimeout.cfgvalue(section_id);
			const timeoutNum = parseInt(timeoutValue, 10);
			const enabled = !isNaN(timeoutNum) && timeoutNum > 0;

			if (!flushUi || !flushInput)
				return;

			if (enabled) {
				flushUi.setPlaceholder(String(timeoutNum * 10));
				flushUi.setValue(String(timeoutNum * 10));
				flushInput.disabled = false;
			}
			else {
				flushUi.setValue('');
				flushUi.setPlaceholder('0');
				flushInput.disabled = true;
			}
		};

		pluginUtil.addCommonOptions(s, true);

		o = s.option(form.Value, 'DataDir', _('Storage directory'),
			_('Note: as pages are rendered by user \'nobody\', the *.rrd files, the storage directory and all its parent directories need to be world readable.'));
		o.default = '/tmp/rrd';
		o.depends('enable', '1');

		o = s.option(form.Flag, 'backup', _('Backup RRD statistics'),
			     _('Backup and restore RRD statistics to/from non-volatile storage around shutdown, reboot, and/or sysupgrade'));
		o.default = '0';
		o.depends('enable', '1');


		o = s.option(form.Value, 'backup_dir', _('Backup directory'), _('Backup directory'));
		o.default = '/etc/luci_statistics';
		o.depends('backup', '1');

		o = s.option(form.Value, 'StepSize', _('RRD step interval'), _('Seconds'));
		o.placeholder = '30';
		o.datatype = 'uinteger';
		o.depends('enable', '1');

		o = s.option(form.Value, 'HeartBeat', _('RRD heart beat interval'), _('Seconds'));
		o.placeholder = '60';
		o.datatype = 'uinteger';
		o.depends('enable', '1');

		o = s.option(form.Flag, 'RRASingle', _('Only create average RRAs'), _('reduces rrd size'));
		o.default = '1';
		o.rmempty = false;
		o.depends('enable', '1');

		o = s.option(form.Flag, 'RRAMax', _('Show max values instead of averages'),
			_('Max values for a period can be used instead of averages when not using \'only average RRAs\''));
		o.depends('RRASingle', '0');

		o = s.option(form.DynamicList, 'RRATimespans', _('Stored timespans'),
			_('List of time spans to be stored in RRD database. E.g. "1hour 1day 14day". Allowed timespan types: min, h, hour(s), d, day(s), w, week(s), m, month(s), y, year(s)'));
		o.default = '1hour 1day 1week 1month 1year';
		o.depends('enable', '1');
		o.validate = pluginUtil.validateDate;

		o = s.option(form.Value, 'RRARows', _('Rows per RRA'));
		o.default = '288';
		o.datatype = 'min(1)';
		o.depends('enable', '1');

		o = s.option(form.Value, 'XFF', _('RRD XFiles Factor'));
		o.placeholder = '0.1';
		o.depends('enable', '1');
		o.validate = function(section_id, value) {
			if (value == '')
				return true;

			if (value.match(/^[0-9]+(?:\.[0-9]+)?$/) && +value >= 0 && +value < 1)
				return true;

			return _('Expecting decimal value lower than one');
		};

		o = s.option(form.Value, 'CacheTimeout', _('Cache collected data for'), _('Seconds'));
		cacheTimeout = o;
		o.depends('enable', '1');
		o.datatype = 'uinteger';
		o.placeholder = '0';
		o.onchange = function(ev, section_id, value) {
			syncCacheFlush.call(this, section_id, value);
		};

		o = s.option(form.Value, 'CacheFlush', _('Flush cache after'), _('Seconds'));
		cacheFlush = o;
		o.depends('enable', '1');
		o.datatype = 'uinteger';
	},

	configSummary(section) {
		if (section.DataDir)
			return _('Writing *.rrd files to %s').format(section.DataDir);
	}
});

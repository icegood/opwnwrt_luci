/* Licensed to the public under the Apache License 2.0. */

'use strict';
'require baseclass';

return baseclass.extend({
    title: _('Sensors'),

    rrdargs(graph, host, plugin, plugin_instance, dtype) {
        const rv = [];
        const types = graph.dataTypes(host, plugin, plugin_instance);

        const palette = [
            'ff0000', 'f58231', 'ffe119', '3cb44b',
            '46f0f0', '0082c8', '911eb4', 'aa6e28'
        ];

        const typeConfig = {
            temperature: { vlabel: '\xb0C', numfmt: '%4.1lf\xb0C' },
            humidity:    { vlabel: '%RH',   numfmt: '%4.1lf %%RH' },
            voltage:     { vlabel: 'V',     numfmt: '%4.2lf V'    },
            current:     { vlabel: 'A',     numfmt: '%4.1lf A'    },
            power:       { vlabel: 'W',     numfmt: '%4.1lf W'    },
            fanspeed:    { vlabel: 'rpm',   numfmt: '%4.0lf rpm'  },
            pwm:         { vlabel: '%',     numfmt: '%4.1lf %%'   },
        };

        for (const [ dtype, cfg ] of Object.entries(typeConfig)) {
            if (types.indexOf(dtype) === -1)
                continue;

            const instances = graph.dataInstances(host, plugin, plugin_instance, dtype);
            const options = {};

            instances.forEach(function(di, idx) {
                /* unique key per instance: dtype_<sanitised_di>_value */
                const key = dtype + '_' + di.replace(/\W/g, '_') + '_value';
                options[key] = {
                    rrd:     graph.mkrrdpath(host, plugin, plugin_instance, dtype, di),
                    color:   palette[idx % palette.length],
                    title:   di || dtype,
                    noarea:  true,
                    overlay: true,
                };
            });

            rv.push({
                title: '%H: %pi - ' + dtype,
                vlabel: cfg.vlabel,
                number_format: cfg.numfmt,
                detail: true,
                data: {
                    types:     [ dtype ],
                    instances: { [dtype]: instances },
                    options
                },
            });
        }

        return rv;
    },

    hasInstanceDetails: true
});

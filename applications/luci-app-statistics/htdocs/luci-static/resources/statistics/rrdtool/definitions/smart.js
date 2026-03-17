/* Licensed to the public under the Apache License 2.0. */

'use strict';
'require baseclass';
'require uci';
'require statistics.pluginUtil as pluginUtil';

return baseclass.extend({
    title: _('S.M.A.R.T.'),

    getAttrsByDisk: function(disk) {
        var attrs = [], res = [];

        uci.sections('luci_statistics', 'statistics_smart_attrs', function(s) {
            if (s.disk === disk && Array.isArray(s.attr_ids)) {
                attrs.push(...s.attr_ids);
            }
        });

        for (let attr of attrs) {
            let groups = [];
            
            if (attr.startsWith("smart_attribute")) {
                groups = [
                    { name: "Status", vals: ["current", "worst", "threshold"] },
                    { name: "Values", vals: ["pretty", "raw"] }
                ];
            } else {
                groups = [{ name: "Value", vals: ["value"] }];
            }

            let attr_cut = attr.replace(/^(smart_attribute-|nvme_)/, '');

            for (let group of groups) {
                let options = {};
                let sources = {};
                sources[attr_cut] = group.vals;

                for (let src of group.vals) {
                    options[`${attr_cut}__` + src] = {
                        title: src,
                        flip: src == "worst",
                        type_orig: attr,
                        noarea:  true,
                        overlay: true
                    };
                }

                res.push({
                    // Title distinguishes between "Status" and "Values"
                    title: "%H: S.M.A.R.T. on %pi: " + attr_cut + " (" + group.name + ")",
                    vlabel: attr_cut,
                    number_format: "%5.1lf",
                    detail: true,
                    data: {
                        types: [ attr_cut ],
                        sources: sources,
                        options: options,
                        noarea:  true,
                        overlay: true
                    }
                });
            }
        }
        return res;
    },

    rrdargs: async function(graph, host, plugin, plugin_instance) {
        var allowed_disks = await pluginUtil.selectedDisks(
                uci.get("luci_statistics", "collectd_smart", "Disks"),
                uci.get("luci_statistics", "collectd_smart", "IgnoreSelected"));
        
        if (!allowed_disks.includes(plugin_instance)) {
            return [];
        }
        return this.getAttrsByDisk(plugin_instance);
    },

    hasInstanceDetails: true
});
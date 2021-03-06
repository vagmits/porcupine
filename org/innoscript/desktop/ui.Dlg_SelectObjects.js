function selectObjectsDialog() {}

selectObjectsDialog.showFolders = function(evt, w) {
	var dialog = w.getParentByType(QuiX.ui.Dialog);
	var main_box = dialog.body.getWidgetById('vbox_main');
	var btn_search = dialog.body.getWidgetById('btn_search');

	if (w.value == 'off') {
		main_box.height = 0;
	}
	else {
		if (btn_search.value == 'on') {
			btn_search.toggle();
		}
		main_box.widgets[0].show();
		main_box.widgets[1].hide();
		main_box.height = '-1';
	}
	main_box.parent.redraw(true);
}

selectObjectsDialog.showSearch = function(evt, w) {
	var dialog = w.getParentByType(QuiX.ui.Dialog);
	var main_box = dialog.body.getWidgetById('vbox_main');
	var btn_folders = dialog.body.getWidgetById('btn_folders');

	if (w.value == 'off') {
		main_box.height = 0;
	}
	else {
		if (btn_folders.value == 'on') {
			btn_folders.toggle();
		}
		main_box.widgets[0].hide();
		main_box.widgets[1].show();			
		main_box.height = 120;
	}
	main_box.parent.redraw(true);
}

selectObjectsDialog.search = function(evt, w) {
	var oDialog = w.getParentByType(QuiX.ui.Dialog),
		cc = oDialog.attributes.CC,
		oForm = w.parent,
		oTree = oDialog.getWidgetById('tree'),
		sName = oForm.getWidgetById('displayName').getValue(),
		sDesc = oForm.getWidgetById('description').getValue(),
		isDeep = oForm.getWidgetById('deep').getValue(),
		sID = (oTree.getSelection() || oTree.roots[0]).getId(),
		sFrom;

    var vars = {SCOPE : sID};
	
	if (isDeep) {
		sFrom = "deep($SCOPE)";
	}
	else {
		sFrom = "$SCOPE";
	}

	var sCommand =
        "select id as value, __image__ as img, displayName as caption " +
		"from " + sFrom;
    
	var conditions = [];
	if (cc != '*') {
        conditions.push(selectObjectsDialog.getConditions(cc));
	}
	if (sName != '') {
        conditions.push("$NAME in displayName");
        vars.NAME = sName;
    }
	if (sDesc != '') {
        conditions.push("$DESC in description");
        vars.DESC = sDesc;
    }

	if (conditions.length > 0) {
		sCommand += ' where ' + conditions.join(' and ');
	}

	var rpc = new QuiX.rpc.JSONRPCRequest(QuiX.root);
	rpc.oncomplete = selectObjectsDialog.refreshList_oncomplete;
	rpc.callback_info = w;
	rpc.callmethod('executeOqlCommand', sCommand, vars);
}

selectObjectsDialog.refreshList = function(tree) {
	var oDialog = tree.getParentByType(QuiX.ui.Dialog),
		rpc = new QuiX.rpc.JSONRPCRequest(QuiX.root),
		cc = oDialog.attributes.CC,
		sOql = "select id as value, __image__ as img, displayName as caption " +
               "from $SCOPE";

	if (cc != '*') {
        sOql += " where " + selectObjectsDialog.getConditions(cc);
	}

	rpc.oncomplete = selectObjectsDialog.refreshList_oncomplete;
	rpc.callback_info = tree;
	rpc.callmethod('executeOqlCommand', sOql, {SCOPE: (tree.getSelection() || oTree.roots[0]).getId()});
}

selectObjectsDialog.getConditions = function(s) {
	var lst = s.split('|');
	for (var i=0; i<lst.length; i++) {
		lst[i] = "instanceof('" + lst[i] + "')";
	}
	return "(" + lst.join(' or ') + ")";
}

selectObjectsDialog.refreshList_oncomplete = function(req) {
	var oDialog = req.callback_info.getParentByType(QuiX.ui.Dialog);
	var oSelect = oDialog.getWidgetById("selection");
	var oItems = req.response;
	oSelect.clear();
	for (var i=0; i<oItems.length; i++) {
		oSelect.addOption(oItems[i]);
	}
}

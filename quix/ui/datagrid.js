/************************
Data Grid
************************/

QuiX.ui.DataGrid = function(/*params*/) {
    var params = arguments[0] || {};
    params.multiple = true;
    params.cellborder = params.cellborder || 1;
    params.cellpadding = params.cellpadding || 2;

    QuiX.ui.ListView.call(this, params);
    
    this.name = params.name;
    this.hasSelector = !(params.hasselector == false ||
                         params.hasselector == 'false');
    this.editUndef = !(params.editundef == false ||
                       params.editundef == 'false');
}

QuiX.constructors['datagrid'] = QuiX.ui.DataGrid;
QuiX.ui.DataGrid.prototype = new QuiX.ui.ListView;
QuiX.ui.DataGrid.prototype.__class__ = QuiX.ui.DataGrid;

QuiX.ui.DataGrid.prototype.customEvents =
    QuiX.ui.ListView.prototype.customEvents.concat(['onchange']);

QuiX.ui.DataGrid.__editWidget = null;

QuiX.ui.DataGrid.prototype.addHeader = function(params) {
    var oHeader = QuiX.ui.ListView.prototype.addHeader.apply(this, arguments);
    this.widgets[1].attachEvent('onclick', QuiX.ui.DataGrid._onclick);
    this.widgets[1].attachEvent('onkeydown', QuiX.ui.DataGrid._onkeydown);
    return oHeader;
}

QuiX.ui.DataGrid.prototype.addColumn = function(params) {
    var oCol = QuiX.ui.ListView.prototype.addColumn.apply(this, arguments);
    oCol.editable = !(params.editable == 'false' || params.editable == false);
    return oCol;
}

QuiX.ui.DataGrid.prototype.getValue = function(params) {
    return this.dataSet;
}

QuiX.ui.DataGrid._removeEditWidget = function() {
    if (QuiX.ui.DataGrid.__editwidget) {
        var w = QuiX.ui.DataGrid.__editwidget;
        //w.blur();
        QuiX.ui.DataGrid.__editwidget = null;
        w.destroy();
    }
}

QuiX.ui.DataGrid.prototype.redraw = function(bForceAll /*, memo*/) {
    var memo = arguments[1] || {};
    QuiX.ui.DataGrid._removeEditWidget();
    QuiX.ui.ListView.prototype.redraw.apply(this, [bForceAll, memo]);
}

QuiX.ui.DataGrid.prototype.disable = function() {
    QuiX.ui.DataGrid._removeEditWidget();
    QuiX.ui.ListView.prototype.disable.apply(this, arguments);
}

QuiX.ui.DataGrid.prototype.refresh = function() {
    QuiX.ui.DataGrid._removeEditWidget();
    QuiX.ui.ListView.prototype.refresh.apply(this, arguments);
}

QuiX.ui.DataGrid.prototype.edit = function(cell /*, focus*/) {
    var editValue,
        focus = (arguments.length == 2)? arguments[1]:true,
        w2 = null,
        w2_type,
        idx = cell.cellIndex,
        ridx = QuiX.getParentNode(cell).rowIndex,
        editItem = this.dataSet[ridx];

    QuiX.ui.DataGrid._removeEditWidget();

    if (this.columns[idx].typeProvider) {
        this.columns[idx].typeProvider(this.columns[idx], editItem);
    }

    if ((idx > (this.hasSelector? 0:-1)) &&
            (idx < this.columns.length - (this.hasSelector? 1:0)) &&
            this.columns[idx].editable) {
        editValue = editItem[this.columns[idx].name];
        if (typeof editValue == 'undefined' && !this.editUndef)
            return null;
        var left = cell.offsetLeft;
        if (QuiX.dir == 'rtl' && QuiX.utils.BrowserInfo.family != 'op') {
            left -= this.widgets[1].div.scrollWidth -
                    this.widgets[1].div.clientWidth;
        }
        
        switch (this.columns[idx].columnType) {
            case 'optionlist':
                w2 = new QuiX.ui.Combo({
                    onchange : QuiX.ui.DataGrid._update
                });

                var options = this.columns[idx].options;
                for (var i=0; i<options.length; i++) {
                    if (editValue == options[i].value) {
                        options[i].selected = true;
                    }
                    else {
                        options[i].selected = false;
                    }
                    w2.addOption(options[i]);
                }
                break;
            case 'color':
                w2 = new QuiX.ui.ColorPicker({
                    value : editValue,
                    onchange : QuiX.ui.DataGrid._update,
                    onkeyup: QuiX.ui.DataGrid._update
                });
                break;
            case 'number':
                w2 = new QuiX.ui.Spin({
                    value : editValue,
                    editable : true,
                    min: this.columns[idx].min,
                    max: this.columns[idx].max,
                    step: this.columns[idx].step,
                    onchange: QuiX.ui.DataGrid._update,
                    onkeyup: QuiX.ui.DataGrid._update
                });
                break;
            case 'bool':
                w2_type = 'checkbox';
            default:
                w2 = new QuiX.ui.Field({
                    value : editValue,
                    type : w2_type
                });
                if (w2_type == 'checkbox') {
                    w2.attachEvent('onchange', QuiX.ui.DataGrid._update);
                }
                else {
                    w2.attachEvent('onkeyup', QuiX.ui.DataGrid._update);
                }
        }
        // fit into cell
        w2.top = cell.offsetTop;
        w2.left = left;
        w2.width = cell.clientWidth;
        w2.height = cell.clientHeight;
        // do not perform rtl xform
        w2._xformed = true;
        this.widgets[1].appendChild(w2);
        w2.redraw();
        if (focus && w2.focus) {
            w2.focus();
        }

        QuiX.ui.DataGrid.__editwidget = w2;
        this.attributes.__rowindex = ridx;
        this.attributes.__cellindex = idx;
    }
    return w2;
}

QuiX.ui.DataGrid._onclick = function(evt, w) {
    var target = QuiX.getTarget(evt);
    while (target && target.tagName != 'TD') {
        target = QuiX.getParentNode(target);
    }
    if (target) {
        w.parent.edit(target);
    }
}

QuiX.ui.DataGrid._onkeydown = function(evt, w) {
    if (evt.keyCode == 9) {
        var dg = w.parent, 
            r = dg.attributes.__rowindex,
            c = dg.attributes.__cellindex,
            rows = dg.list.rows,
            current_cell = rows[r].cells[c];

        if (evt.shiftKey) {
            do {
                current_cell = current_cell.previousSibling;
                if (!current_cell) {
                    if (r > 0) {
                        current_cell = rows[r-1].cells[dg.columns.length-2];
                    }
                    else {
                        current_cell = rows[rows.length-1].cells[dg.columns.length-2];
                    }
                }
            } while (!dg.columns[current_cell.cellIndex].editable)
        }
        else {
            do {
                current_cell = current_cell.nextSibling;
                if (!current_cell) {
                    if (r < rows.length - 1) {
                        current_cell = rows[r + 1].cells[0];
                    }
                    else {
                        current_cell = rows[0].cells[0];
                    }
                }
            } while (!dg.columns[current_cell.cellIndex].editable)
        }
        dg.edit(current_cell, false);

        window.setTimeout(
            function() {
                QuiX.ui.DataGrid.__editwidget.focus();
            }, 0);

        QuiX.cancelDefault(evt);
        QuiX.stopPropag(evt);
    }
}

QuiX.ui.DataGrid._update = function(evt, w) {
    if (w) {
        QuiX.stopPropag(evt);
    }
    w = w || evt;
    var dg = w.parent.parent;

    if (QuiX.ui.DataGrid.__editwidget) {
        var r = dg.attributes.__rowindex,
            c = dg.attributes.__cellindex,
            cell = dg.list.firstChild.rows[r].cells[c],
            value = QuiX.ui.DataGrid.__editwidget.getValue();

        dg.dataSet[r][dg.columns[c].name] = value;
        dg._renderCell(cell, c, value, dg.dataSet[r]);
        dg.trigger('onchange', dg, dg.dataSet[r]);
    }
}

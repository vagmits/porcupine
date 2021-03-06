// list view

QuiX.ui.ListView = function(/*params*/) {
    var params = arguments[0] || {};
    params.bgcolor = params.bgcolor || 'white';
    this._overflow = params.overflow || 'auto';
    params.overflow = 'hidden';

    this._dragable = (params.dragable == 'true' || params.dragable == true);
    delete params.dragable;

    QuiX.ui.Widget.call(this, params);

    this.div.className = 'listview';
    this.cellPadding = parseInt(params.cellpadding) || 4;
    this.cellBorder = parseInt(params.cellborder) || 0;
    this.multiple = (params.multiple == true || params.multiple == "true");
    this.nullText = params.nulltext || ' ';
    this.dateFormat = params.dateformat || 'ddd dd/mmm/yyyy time';
    this.trueImg = params.trueimg || QuiX.theme.listview.trueImg;
    this.sortfunc = QuiX.getEventListener(params.sortfunc);
    this.altRows = (params.altrows ||
                    QuiX.theme.listview.altrows).split(',');
    this.selectedClass = (typeof params.selectedclass != 'undefined')?
                         params.selectedclass:QuiX.theme.listview.selected;
    this.rowHeight = parseInt(params.rowheight) ||
                     QuiX.theme.listview.rowheight;
    this.hasSelector = false;
    this.selection = [];
    this.columns = [];
    this.dataSet = [];

    this._orderBy = null;
    this._sortOrder = null;
    this._sortimg = null;
}

QuiX.constructors['listview'] = QuiX.ui.ListView;
QuiX.ui.ListView.prototype = new QuiX.ui.Widget;
QuiX.ui.ListView.prototype.__class__ = QuiX.ui.ListView;
QuiX.ui.ListView.prototype.customEvents =
    QuiX.ui.Widget.prototype.customEvents.concat(['onselect', 'onrowprerender',
                                                  'onrendercomplete']);

QuiX.ui.ListView.cellThreshold = 2000;

QuiX.ui.ListView._calcListHeight = function(memo) {
    var listview = this.parent;
    var lho = (listview.header.isHidden())?
              0:parseInt(listview.header.getHeight(true, memo));
    return listview.getHeight(false, memo) - lho;
}

QuiX.ui.ListView._calcListTop = function(memo) {
    return (this.parent.header.isHidden())?
            0:this.parent.header._calcHeight(true, memo);
}

QuiX.ui.ListView._calcResizerOffset = function(w) {
    var listview = this.parent.parent;
    var oHeader = listview.header;
    var webkit = (QuiX.utils.BrowserInfo.family == 'saf');
    var left = listview.hasSelector? (webkit? 6 : 10) : 0;
    var offset = (webkit)? -2:2 * listview.cellPadding;
    var offset2 = (webkit)? 0:listview.cellBorder;
    var column_width;

    for (var i=listview._deadCells; i<listview.columns.length; i++) {
        column_width = parseInt(listview.columns[i].style.width);
        left += column_width + offset;

        if (listview.list.rows.length > 0)
            listview.list.rows[0].cells[i].style.width =
                column_width - offset2 + 'px';

        if (oHeader.widgets[i - listview._deadCells] == this)
            break;
    }

    left += parseInt(listview.header.div.firstChild.style.paddingRight);
    
    // opera horizontal scrollbar patch
    if (QuiX.dir == 'rtl' && QuiX.utils.BrowserInfo.family == 'op')
        left -= (listview.header.div.scrollWidth -
                 listview.header.div.clientWidth)

    left += (2*i);
    return left - 1;
}

QuiX.ui.ListView.prototype._registerHandler = function(eventType, handler,
                                                       isCustom) {
    var wrapper;
    if (handler)
        switch (eventType) {
            case "onclick":
            case "ondblclick":
                //if it not wrapped wrap it...
                if(handler && handler.toString().lastIndexOf(
                        'return handler(evt || event, self)') == -1)
                    wrapper = function(evt, w) {
                        return QuiX.ui.ListView._onclick(evt, w, handler);
                    };
                break;
        }
    wrapper = wrapper || handler;
    QuiX.ui.Widget.prototype._registerHandler.apply(this,
        [eventType, wrapper, isCustom]);
}

QuiX.ui.ListView.prototype.addHeader = function(params) {
    var family = QuiX.utils.BrowserInfo.family;
    var displayVerticalScroll = QuiX.dir == 'rtl' &&
                                (family == 'moz' || family == 'saf');

    params.width = '100%';
    params.height = (!params.height || params.height < QuiX.theme.listview.headerheight)?
                    QuiX.theme.listview.headerheight : parseInt(params.height);
    params.overflow = 'hidden';

    this.header = new QuiX.ui.Widget(params);
    this.appendChild(this.header);
    this.header.div.className = 'listheader';
    this.header.div.innerHTML =
        '<table cellspacing="0" width="100%" height="100%"><tr>' +
        '<td class="column filler" dir="' + QuiX.dir + '"></td>' +
        '<td width="' + QuiX._scrollbarSize + '">&nbsp;</td>' +
        '</tr></table>';

    var oTable = this.header.div.firstChild;

    if (displayVerticalScroll) {
        oTable.style.paddingRight = QuiX._scrollbarSize + 'px';
    }
    else {
        oTable.style.paddingRight = '0px';
    }
    var oRow = oTable.rows[0];

    // opera horizontal scrollbar patch
    if (QuiX.dir == 'rtl' && family == 'op') {
        oTable.style.cssFloat = 'left';
    }

    this.columns = oRow.cells;
    oRow.ondblclick = QuiX.stopPropag;

    if (this.hasSelector) {
        var selector = this._getSelector();
        oRow.insertBefore(selector, oRow.lastChild.previousSibling);
        this._deadCells = 1;
    }
    else {
        this._deadCells = 0;
    }

    var overflow = this._overflow;
    if (displayVerticalScroll) {
        overflow = this._overflow + ' scroll';
    }

    var list = new QuiX.ui.Widget({
        top : QuiX.ui.ListView._calcListTop,
        width : '100%',
        height : QuiX.ui.ListView._calcListHeight,
        dragable : this._dragable,
        overflow : overflow,
        onmousedown : QuiX.ui.ListView._onmousedown,
        onscroll : QuiX.ui.ListView._onscroll
    });
    list._startDrag = QuiX.ui.ListView._startdrag;
    this.appendChild(list);

    list.div.className = 'list';
    oTable = ce('TABLE');
    oTable.cellSpacing = 0;
    oTable.style.width = '100%';

    // opera horizontal scrollbar patch
    if (QuiX.dir == 'rtl' && family == 'op') {
        oTable.style.cssFloat = 'left';
        // vertical scrollbar patch
        oTable.style.paddingBottom = QuiX._scrollbarSize + 'px';
        list.attachEvent('onresize', function() {
            window.setTimeout(
                function() {
                    if (oTable.rows.length > 0)
                        oTable.rows[0].cells[0].scrollIntoView();
                }, 10);
        });
    }

    var tbody = ce('TBODY');
    oTable.appendChild(tbody);
    list.div.appendChild(oTable);
    this.list = list.div.firstChild;
    return this.header;
}

QuiX.ui.ListView.prototype.redraw = function(bForceAll /*, memo*/) {
    var memo = arguments[1] || {},
        columns = this.columns,
        header_width = this._calcWidth(false, memo),
        webkit = (QuiX.utils.BrowserInfo.family == 'saf'),
        wdth,
        offset = (webkit)? this.cellBorder:(2 * this.cellPadding) + this.cellBorder + 2;

    // resize proportional cells
    for (var i = this._deadCells; i<columns.length; i++) {
        if (columns[i].proportion) {
            wdth = (Math.round(header_width * columns[i].proportion) -
                    offset) + 'px';
            columns[i].style.width = wdth;
            if (this.list.firstChild.rows.length > 0) {
                this.list.rows[0].cells[i].style.width = wdth;
            }
        }
    }

    // opera horizontal scrollbar patch
    if (QuiX.dir == 'rtl' && QuiX.utils.BrowserInfo.family == 'op') {
        for (i=0; i<this.header.widgets.length; i++)
            this.header.widgets[i].div.style.left = '0px';
    }
    this.list.style.display = 'none';
    QuiX.ui.Widget.prototype.redraw.apply(this, [bForceAll, memo]);
    this.list.style.display = '';
}

QuiX.ui.ListView.prototype._getSelector = function() {
    var s = ce('TD');
    s.dir = QuiX.dir;
    s.className = 'column';
    if (QuiX.utils.BrowserInfo.family == 'saf') {
        s.style.width = (8 + 2 * this.cellPadding) + 'px';
    }
    else
        s.style.width = '8px';
    s.innerHTML = '&nbsp;';
    return s;
}

QuiX.ui.ListView.prototype._selrow = function(r) {
    r.className += ' ' + this.selectedClass;
    r.isSelected = true;
}

QuiX.ui.ListView.prototype._unselrow = function(r) {
    r.className = r.className.replace(' ' + this.selectedClass, '');
    r.isSelected = false;
}

QuiX.ui.ListView.prototype._selectline = function(evt, row) {
    if (row.isSelected && (QuiX.getMouseButton(evt) == 2 || evt.ctrlKey)) {
        return false;
    }
    var fire = this.multiple || !row.isSelected;
    if (!row.isSelected) {
        if (!this.multiple || !evt.shiftKey) this.clearSelection();
        this._selrow(row);
        this.selection.push(row.rowIndex);
    }
    else if (this.multiple && evt.shiftKey) {
        this._unselrow(row);
        this.selection.removeItem(row.rowIndex);
    }
    else {
        this.clearSelection();
        this._selrow(row);
        this.selection.push(row.rowIndex);
    }
    if (fire) {
        this.trigger('onselect', evt, this, this.dataSet[row.rowIndex]);
    }
    return true;
}

QuiX.ui.ListView.prototype.select = function(i) {
    var tr = this.list.rows[i];
    if (!tr.isSelected) {
        this._selrow(this.list.rows[i]);
        if (!this.multiple)
            this.selection = [i];
        else
            this.selection.push(i);
    }
}

QuiX.ui.ListView.prototype.clearSelection = function() {
    var selRow;
    for (var i=0; i<this.selection.length; i++) {
        selRow = this.list.rows[this.selection[i]];
        this._unselrow(selRow);
    }
    this.selection = [];
}

QuiX.ui.ListView.prototype.removeSelected = function() {
    this.selection.sort(function(a,b){
        return(a>b?-1:1)
    });
    for (var i=0; i<this.selection.length; i++) {
        this.dataSet.splice(this.selection[i], 1);
        this.list.deleteRow(this.selection[i]);
    }
    this.selection = [];
    this.refresh();
}

QuiX.ui.ListView.prototype.getSelection = function() {
    var sel = [];
    for (var i=0; i<this.selection.length; i++) {
        sel.push(this.dataSet[this.selection[i]]);
    }
    if (sel.length==0) {
        return null;
    }
    else if (sel.length==1) {
        return sel[0];
    }
    else {
        return sel;
    }
}

QuiX.ui.ListView.prototype.addColumn = function(params) {
    var oCol = ce('TD');
    oCol.className = 'column';
    oCol.dir = QuiX.dir;
    oCol.cssClass = params.cssclass || '';
    oCol.style.padding = '0px ' + this.cellPadding + 'px';

    if (params.width) {
        if (params.width.slice(params.width.length-1) == '%') {
            oCol.proportion = parseInt(params.width) / 100;
        }
        else {
            var offset = (QuiX.utils.BrowserInfo.family == 'saf')?
                         0:2 * this.cellPadding + 2 * this.cellBorder;
            oCol.style.width = (params.width - offset) + 'px';
        }
    }

    oCol.setCaption = QuiX.ui.ListView._setCaption;
    oCol.getCaption = QuiX.ui.ListView._getCaption;

    oCol.name = params.name;
    var sCaption = params.caption || ' ';
    oCol.setCaption(sCaption);

    oCol.columnType = params.type || 'str';
    if (params.xform) {
        oCol.xform = params.xform;
        oCol._xform = QuiX.getEventListener(oCol.xform);
    }

    if (params.typeprovider) {
        oCol.typeProvider = QuiX.getEventListener(params.typeprovider);
    }

    oCol.sortable = !(params.sortable == 'false' || params.sortable == false);
    if (oCol.sortable) {
        oCol.style.cursor = 'pointer';
        oCol.onclick = QuiX.ui.ListView._column_onclick;
    }

    var oHeaderRow = this.header.div.firstChild.rows[0];
    oHeaderRow.insertBefore(oCol, oHeaderRow.lastChild.previousSibling);

    if (oCol.columnType == 'bool') {
        oCol.trueImg = params.trueimg || this.trueImg;
    }
    else if (oCol.columnType == 'date') {
        oCol.format = params.format || this.dateFormat;
    }

    oCol.columnAlign = params.align || '';

    var resizer = new QuiX.ui.Widget({
        width : 6,
        height : this.header._calcHeight(),
        left : QuiX.ui.ListView._calcResizerOffset,
        overflow : 'hidden'
    });
    this.header.appendChild(resizer);

    oCol.isResizable =
        !(params.resizable == 'false' || params.resizable == false);

    if (oCol.isResizable) {
        var iColumn = oHeaderRow.cells.length - 2;
        var self = this;
        resizer.div.className = 'resizer';
        resizer.attachEvent('onmousedown', function(evt) {
            self._moveResizer(evt, iColumn - 1 - self._deadCells);
            QuiX.cancelDefault(evt);
        });
    }
    return oCol;
}

QuiX.ui.ListView.prototype._moveResizer = function(evt, iResizer) {
    var self = this;
    QuiX.cancelDefault(evt);
    QuiX.startX = QuiX.getEventCoordinates(evt)[0];

    this.attachEvent('onmouseup', function(evt){
            self._endMoveResizer(evt, iResizer);
        });
    this.attachEvent('onmousemove', function(evt){
            self._resizerMoving(evt, iResizer);
        });
}

QuiX.ui.ListView.prototype._resizerMoving = function(evt, iResizer) {
    var nw;
    var iColumn = iResizer + this._deadCells;
    var offsetX = QuiX.getEventCoordinates(evt)[0] - QuiX.startX;
    if (QuiX.dir == 'rtl') {
        offsetX = -offsetX;
    }

    nw = parseInt(this.columns[iColumn].style.width) + offsetX;
    nw = (nw < 2 * this.cellPadding)? 2 * this.cellPadding:nw;
    if (nw > 2 * this.cellPadding) {
        this.columns[iColumn].style.width = nw + 'px';
        this.header.redraw();
        // sync scroll offsets
        QuiX.ui.ListView._onscroll(null, this.widgets[1]);
        QuiX.startX = evt.clientX;
    }
}

QuiX.ui.ListView.prototype._endMoveResizer = function(evt, iResizer) {
    var iColumn = iResizer + this._deadCells;
    if (this.columns[iColumn].proportion) {
        this.columns[iColumn].proportion = null;
    }
    this.detachEvent('onmouseup');
    this.detachEvent('onmousemove');
}

QuiX.ui.ListView.prototype.getColumnByName = function(colName) {
    for (var i=0; i<this.columns.length; i++) {
        if (this.columns[i].name == colName) {
            return this.columns[i];
        }
    }
    return null;
}

QuiX.ui.ListView.prototype.sort = function(colName, order) {
    var column = this.getColumnByName(colName);
    if (this._sortimg) {
        QuiX.removeNode(this._sortimg);
        this._sortimg = null;
    }
    if (this.sortfunc) {
        this.sortfunc(this, colName, order);
    }
    else {
        // default sort behaviour
        this.dataSet.sortByAttribute(colName);
        if (order.toUpperCase() == 'DESC') {
            this.dataSet.reverse();
        }
        this.refresh();
    }
    if (column) {
        this._sortimg = QuiX.getImage(
            order.toUpperCase() == 'ASC'?
            '$THEME_URL$images/asc8.gif':'$THEME_URL$images/desc8.gif');
        this._sortimg.align = 'absmiddle';
        this._sortimg.style.marginLeft = '2px';
        column.appendChild(this._sortimg);
    }
    this._orderBy = colName;
    this._sortOrder = order.toUpperCase();
}

QuiX.ui.ListView.prototype._isSorted = function() {
    var field = this._orderBy,
        order = this._sortOrder;

    for (var i=0; i<this.dataSet.length - 1; i++) {
        if (order == 'ASC') {
            if (this.dataSet[i][field] > this.dataSet[i+1][field]) {
                return false;
            }
        }
        else {
            if (this.dataSet[i][field] < this.dataSet[i+1][field]) {
                return false;
            }
        }
    }
    return true;
}

QuiX.ui.ListView.prototype.update = function(objList) {
    var obj, rowIndex, row, j;
    for (var i=0; i<objList.length; i++) {
        obj = objList[i];
        rowIndex = this.dataSet.indexOf(obj);
        if (rowIndex > - 1) {
            row = this.list.rows[rowIndex];
            for (j=0 + this._deadCells; j<this.columns.length-2; j++) {
                value = obj[this.columns[j].name];
                this._renderCell(row.cells[j], j, value, obj);
            }
        }
    }
}

QuiX.ui.ListView.prototype.refresh = function() {
    var tbody = this.list.tBodies[0];
    //alert(QuiX.utils.BrowserInfo.browser);
    if (QuiX.utils.BrowserInfo.family == 'ie' && QuiX.utils.BrowserInfo.version < 9) {
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
    }
    else {
        tbody.innerHTML = '';
    }
    this.selection = [];

    if (this._sortimg && !this._isSorted()) {
        QuiX.removeNode(this._sortimg);
        this._sortimg = null;
        this._orderBy = null;
        this._sortOrder = null;
    }

    if (this.dataSet.length * this.columns.length >
            QuiX.ui.ListView.cellThreshold) {
        var self = this;
        if (this._timeout) {
            window.clearTimeout(this._timeout);
        }
        this._timeout = window.setTimeout(
            function() {
                self._refresh(0, 30);
                self.redraw();
            }, 0);
    }
    else {
        this._refresh(0, this.dataSet.length);
        this.redraw();
    }
}

QuiX.ui.ListView.prototype._refresh = function(start, step) {
    var oRow, selector, oFiller,
        value, columnWidth,
        rowHeight, offset, cell;

    var tbody = this.list.tBodies[0];
    var webkit = (QuiX.utils.BrowserInfo.family == 'saf');

    rowHeight = this.rowHeight + 'px';

    var cellPadding = '0px ' + (this.cellPadding + 1) + 'px';
    var cellBorder = this.cellBorder + 'px';

    // create rows
    for (var i=start; i<start+step && i<this.dataSet.length; i++) {
        oRow = ce("TR");
        oRow.isSelected = false;
        oRow.className = this.altRows[i%2];

        if (this.hasSelector) {
            selector = this._getSelector();
            oRow.appendChild(selector);
        }
        for (var j=0 + this._deadCells; j<this.columns.length-2; j++) {
            cell = document.createElement('td');
            cell.className = 'cell';
            cell.style.height = rowHeight;
            cell.dir = QuiX.dir;

            columnWidth = this.columns[j].style.width;
            if (i == 0 && columnWidth) {
                offset = webkit? 0:this.cellBorder;
                if (this.columns[j].proportion) {
                    cell.style.width =
                         (Math.round(this._calcWidth() * this.columns[j].proportion)
                         - 2 * this.cellPadding - 2 * this.cellBorder) + 'px';
                }
                else {
                    cell.style.width = (parseInt(columnWidth) - offset) + 'px';
                }
            }
            
            cell.style.borderWidth = cellBorder;
            cell.style.padding = cellPadding;
            if (this.columns[j].cssClass) {
                cell.className += ' ' + this.columns[j].cssClass;
            }
            oRow.appendChild(cell);
            value = this.dataSet[i][this.columns[j].name];
            this._renderCell(cell, j, value, this.dataSet[i]);
        }
        oFiller = ce('TD');
        oFiller.innerHTML = '&nbsp;';
        oFiller.className = 'cell';
        oFiller.style.borderWidth = cellBorder;
        oFiller.style.borderRight = 'none';
        
        oRow.appendChild(oFiller);
        this.trigger('onrowprerender', oRow, this.dataSet[i]);
        tbody.appendChild(oRow);
    }
    if (i < this.dataSet.length) {
        var self = this;
        this._timeout = window.setTimeout(
            function() {
                if (self.div)
                    self._refresh(i, step);
            }, 300);
    }
    else {
        this.trigger('onrendercomplete');
    }
}

QuiX.ui.ListView.prototype._renderCell = function(cell, cellIndex, value,
                                                  obj) {
    var elem, column, column_type;

    if (typeof value == 'undefined') {
        QuiX.setInnerText(cell, this.nullText);
        return;
    }

    if (cellIndex != null) {
        column = this.columns[cellIndex];
        cell.align = column.columnAlign;
        if (column.typeProvider) {
            column.typeProvider(column, obj);
        }
        column_type = column.columnType;

        cell.innerHTML = '';
        cell.style.textOverflow = 'ellipsis';
        switch (column_type) {
            case 'optionlist':
                for (var i=0; i<column.options.length; i++) {
                    if (value == column.options[i].value) {
                        cell.appendChild(ce('SPAN'));
                        QuiX.setInnerText(cell.firstChild,
                                          column.options[i].caption);
                        break;
                    }
                }
                return;
            case 'img':
                if (value) {
                    cell.style.backgroundImage = "url('" + value + "')";
                    cell.style.backgroundPosition = '50% 50%';
                    cell.style.backgroundRepeat = 'no-repeat';
                }
                return;
            case 'color':
                cell.innerHTML = '<div style="width:100%;height:100%">&nbsp;</div>';
                try {
                    cell.firstChild.style.backgroundColor = value;
                } catch(e) {}
                return;
            case 'bool':
                if (value) {
                    while (cell.childNodes.length > 0) {
                        QuiX.removeNode(cell.childNodes[0]);
                    }
                    elem = QuiX.getImage(column.trueImg || this.trueImg);
                    elem.align = 'absmiddle';
                    cell.appendChild(elem);
                }
                else {
                    cell.innerHTML = '&nbsp;'
                }
                return;
            case 'number':
                cell.align = column.columnAlign || 'right';
                break;
            case 'date':
                cell.innerHTML = '<span>' + 
                    value.format(column.format) + '</span>';
                return;
            default:
                if (typeof column_type == 'function') {
                    cell.appendChild(column_type(column, obj, value))
                    return;
                }
        }
        if (column._xform)
            value = column._xform(obj, value);
    }
    
    // auto-detect value type
    if (value instanceof Date) {
        cell.innerHTML = '<span>' + 
            value.format(this.dateFormat) + '</span>';
    }
    else if (typeof value == 'boolean') {
        if (value) {
            elem = QuiX.getImage(this.trueImg)
            elem.align = 'absmiddle';
            cell.appendChild(elem);
        }
        else {
            cell.innerHTML = '&nbsp;';
        }
    }
    else {
        cell.innerHTML = '<span></span>';
        QuiX.setInnerText(cell.firstChild,
                          (value == '' && value != 0)?' ':value);
    }
}

QuiX.ui.ListView.prototype._getRow = function(evt) {
    var target = (QuiX.getTarget(evt));
    while (target && target.tagName != 'TR')
        target = QuiX.getParentNode(target);
    return target;	
}

QuiX.ui.ListView._onclick = function(evt, w, f) {
    if (!evt) return;
    var row = w._getRow(evt);
    if (row) {
        f(evt, w, w.dataSet[row.rowIndex]);
    }
    //else
    //    QuiX.cancelDefault(evt);
}

QuiX.ui.ListView._onmousedown = function(evt, w) {
    var lv = w.parent,
        el = QuiX.getTarget(evt);

    if (lv._isDisabled) {
        return;
    }
    var row = lv._getRow(evt);
    if (row) {
        lv._selectline(evt, row);
    }
    if (QuiX.utils.BrowserInfo.family != 'ie' && el.tagName != 'INPUT') {
        QuiX.cancelDefault(evt);
    }
}

QuiX.ui.ListView._onscroll = function(evt, w) {
    var offset = 0;
    if (QuiX.dir == 'rtl') {
        var family = QuiX.utils.BrowserInfo.family;
        if (family == 'saf')
            offset = QuiX._scrollbarSize;
        else if (family == 'op') {
            if (w.div.scrollHeight == w.div.offsetHeight)
                offset = QuiX._scrollbarSize;
        }
    }
    w.parent.header.div.scrollLeft = w.div.scrollLeft + offset;
}

QuiX.ui.ListView._setCaption = function(s) {
    this.innerHTML = '<span style="white-space:nowrap"></span>';
    QuiX.setInnerText(this.firstChild, s);
}

QuiX.ui.ListView._getCaption = function() {
    return this.firstChild.innerHTML;
}

QuiX.ui.ListView._column_onclick = function(evt) {
    var sortOrder, orderBy;
    evt = evt || event;
    var lv = QuiX.getTargetWidget(evt).parent;
    if (lv._orderBy == this.name) {
        sortOrder = (lv._sortOrder=='ASC')? 'DESC':'ASC';
    }
    else {
        sortOrder = 'ASC';
    }

    orderBy = this.name;
    lv.sort(orderBy, sortOrder);
}

QuiX.ui.ListView._startdrag = function(x, y, el) {
    if (el.tagName == 'DIV') {
        return;
    }
    var desktop = QuiX.getDesktop(el);
    var dragable = new QuiX.ui.Widget({
        width : this._calcWidth(true),
        height : 1,
        border : 1,
        style : 'border:1px solid transparent'
    });
    with (dragable) {
        div.className = this.div.className;
        setPosition('absolute');
        left = x + 2;
        top = y + 2;
        setOpacity(.5);
    }
    // fill with selected rows
    var src_row, row;
    var srcTable = this.div.firstChild;
    var table = srcTable.cloneNode(false);
    table.appendChild(ce('TBODY'));
    dragable.div.appendChild(table);
    
    for (var i=0; i<this.parent.selection.length; i++) {
        src_row = srcTable.rows[this.parent.selection[i]];
        dragable.height += src_row.offsetHeight;
        row = src_row.cloneNode(true);
        if (i == 0) {
            for (var j=0; j<row.cells.length; j++) {
                row.cells[j].style.width =
                    srcTable.rows[0].cells[j].style.width;
            }	
        }
        table.firstChild.appendChild(row);
    }
    desktop.appendChild(dragable);
    dragable.div.style.zIndex = QuiX.maxz;
    dragable.redraw(true);

    QuiX.tmpWidget = dragable;
    QuiX.dragable = this.parent;

    desktop.attachEvent('onmousemove', QuiX.ui.Widget._drag);
}

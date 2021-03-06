/************************
Box layout
************************/

// box

QuiX.ui.Box = function(/*params*/) {
    var params = arguments[0] || {};
    params.overflow = (typeof params.overflow != 'undefined')?
                      params.overflow:'hidden';

    QuiX.ui.Widget.call(this, params);

    this.orientation = params.orientation || 'h';
    this.div.className = this.orientation + (QuiX.css.boxFlex? 'flex':'') + 'box';

    this.spacing = parseInt((typeof params.spacing == 'undefined')? 2:params.spacing);
    this.childrenAlign = params.childrenalign || '';
}

QuiX.constructors['box'] = QuiX.ui.Box;
QuiX.ui.Box.prototype = new QuiX.ui.Widget;
QuiX.ui.Box.prototype.__class__ = QuiX.ui.Box;

QuiX.ui.Box._destroy = function() {
    var oBox = this.parent,
        length_var = (oBox.orientation == 'h')? 'width':'height',
        idx = oBox.widgets.indexOf(this);

    if (this[length_var] == QuiX.ui.Box._getAvailableLength && oBox.widgets.length == 2) {
        if (idx == 0) {
            oBox.widgets[1][length_var] = '@100%';
        }
        else {
            oBox.widgets[idx-1][length_var] = '@100%';
        }
    }

    this.__class__.prototype.destroy.apply(this, arguments);
}

QuiX.ui.Box._getAvailableLength = function(memo) {
    var box = this.parent,
        length_var = (box.orientation == 'h')? 'width':'height',
        min_size = (box.orientation == 'h')? 'minw':'minh';

    if (box[length_var] == 'auto' && !box[min_size]) {
        return null;
    }

    var length_func = (box.orientation == 'h')? 'getWidth':'getHeight',
        l = box[length_func](false, memo);

    if (typeof memo[box._uniqueid + 'flex'] == 'undefined') {
        var tl = 0,
            totflex = 0,
            vw = 0,
            w;

        for (var i=0; i<box.widgets.length; i++) {
            w = box.widgets[i];
            if (w.div.style.display == 'none') {
                continue;
            }
            else if (w[length_var] &&
                     w[length_var] == QuiX.ui.Box._getAvailableLength) {
                totflex += w._flex;
            }
            else {
                tl += w[length_func](true, memo);
            }
            vw += 1;
        }

        memo[box._uniqueid + 'flex'] = [tl, vw, totflex];
    }

    var attrs = memo[box._uniqueid + 'flex'],
        diff = (box.widgets[0].div.style.display == 'none')? 0:1,
        calc_percentage = this._flex / attrs[2],
        fixed_space = attrs[0] + (attrs[1] - diff) * box.spacing;

    if (box[min_size]) {
        var min_func = (min_size == 'minw')? '_calcMinWidth':'_calcMinHeight',
            min = box[min_func](memo);
        if (fixed_space < min) {
            l = min;
        }
        else {
            return 0;
        }
    }

    return (l - fixed_space) * calc_percentage;
}

QuiX.ui.Box._getWidgetPos = function(memo) {
    var box = this.parent,
        w1 = (box.orientation == 'h')?
            box.getHeight(false, memo):box.getWidth(false, memo),
        w2 = (box.orientation == 'h')?
            this.getHeight(true, memo):this.getWidth(true, memo);

    switch (box.childrenAlign) {
        case 'center':
            return (w1 - w2) / 2;
        case 'right':
        case 'bottom':
            return (w1 - w2);
        default:
            return 0;
    }
}

QuiX.ui.Box._calcWidgetMinSize = function() {
    var w,
        tl = 0,
        box = this.parent,
        min_var = (box.orientation == 'h')? '_calcMinHeight':'_calcMinWidth';

    for (var i=0; i<box.widgets.length; i++) {
        w = box.widgets[i];
        if (w.isHidden()) {
            continue;
        }
        var min = w[min_var]();
        tl = Math.max(tl, min);
    }
    return tl;
}

QuiX.ui.Box.prototype.appendChild = function(w) {
    if (!QuiX.css.boxFlex) {
        w.destroy = QuiX.ui.Box._destroy;
    }
    w._i = this.widgets.length;
    this._setChildVars(w);
    w.setPosition('relative');
    QuiX.ui.Widget.prototype.appendChild.apply(this, arguments);
    w.div.style.zIndex = '';
}

QuiX.ui.Box.prototype._calcAuto = null;

QuiX.ui.Box.prototype._setChildVars = function(w /*, ffloat*/) {
    var center_var = (this.orientation == 'h')? 'top':'left',
        length_var = (this.orientation == 'h')? 'width':'height',
        width_var = (this.orientation == 'h')? 'height':'width',
        ffloat = arguments[1] || false,
        margin;

    if (this.orientation == 'h') {
        margin = 'margin' + ((QuiX.dir == 'rtl')?'Right':'Left');
        if (!ffloat && document.all && QuiX.utils.BrowserInfo.version < 8) {
            // ie7 inline-block hack
            if (w.div.style.display == 'none') {
                w._statedisplay = 'inline';
            }
            else {
                w.setDisplay('inline');
            }
            w.div.style.zoom = 1;
        }
    }
    else {
        margin = 'marginTop';
    }

    if (w._i > 0) {
        w.div.style[margin] = this.spacing + 'px';
    }
    else {
        w.div.style[margin] = '0px';
    }
    w[this.orientation == 'h'? 'left':'top'] = 0;

    if (w[center_var] == 0 && this.childrenAlign && !QuiX.css.boxFlex) {
        // box align not supported
        // use js
        w[center_var] = QuiX.ui.Box._getWidgetPos;
    }

    if (typeof(w[length_var]) == 'undefined' ||
            w[length_var] == '' || w[length_var] == '-1') {
        w[length_var] = '@100%';
    }

    if (typeof(w[length_var]) == 'string'
            && w[length_var].indexOf('@') == 0
            && w[length_var].match('%$')) {
        var flex = parseInt(w[length_var].slice(1));

        if (QuiX.css.boxFlex) {
            w.div.style[QuiX.css.boxFlex] = flex;
            w.div.style[length_var] = '0px';
        }
        else {
            // flex box not supported
            // use js
            w._flex = flex;
            w[length_var] = QuiX.ui.Box._getAvailableLength;
        }
    }
    else if (QuiX.css.boxFlex) {
        var index = null;
        if (w.div.style[QuiX.css.boxFlex] && QuiX.utils.BrowserInfo.family == 'saf') {
            // bug in webkit - workaround in order to re-calculate box
            index = this.widgets.indexOf(w);
            w.detach();
        }
        w.div.style[QuiX.css.boxFlex] = '';
        if (index != null) {
            QuiX.ui.Widget.prototype.appendChild.apply(this, [w, index]);
        }
    }

    if (w[width_var] == '-1') {
        w[width_var] = QuiX.ui.Box._calcWidgetMinSize;
    }
    else {
        w[width_var] = (typeof w[width_var] == 'undefined')? '100%':w[width_var];
    }
}

QuiX.ui.Box.prototype.redraw = function(/*bForceAll , memo*/) {
    var bForceAll = arguments[0] || false,
        memo = arguments[1] || {};

    if (!memo[this._uniqueid + 'r']) {
        if (bForceAll || (typeof this._rds == 'undefined')) {
            if (QuiX.css.boxFlex) {
                switch (this.childrenAlign) {
                    case 'right':
                    case 'bottom':
                        this.div.style[QuiX.css.boxAlign] = 'end';
                        break;
                    case 'center':
                        this.div.style[QuiX.css.boxAlign] = 'center';
                        break;
                    default:
                        this.div.style[QuiX.css.boxAlign] = '';
                }
            }
            for (var i=0; i<this.widgets.length; i++) {
                this.widgets[i]._i = i;
                this._setChildVars(this.widgets[i]);
            }
        }

        if (this.div.style.display != 'none') {
            if (QuiX.css.boxFlex) {
                var w;
                this._setCommonProps(memo);

                for (var i=0; i<this.widgets.length; i++) {
                    w = this.widgets[i];
                    if (w.div.style[QuiX.css.boxFlex] == '') {
                        w.redraw(bForceAll, memo);
                    }
                    else if (QuiX.utils.BrowserInfo.family == 'saf') {
                        var l = (this.orientation == 'h')? 'width':'height';
                        if (!(typeof w[l] == 'string' && w[l].charAt(0) == '@')) {
                            this._setChildVars(w);
                        }
                    }
                }

                if (this.orientation == 'h' && this.height == 'auto') {
                    var widgets = [];

                    this.div.style.height = '';
                    delete memo[this._uniqueid + 'h'];
                    delete memo[this._uniqueid + 'ch'];

                    for (var i=0; i<this.widgets.length; i++) {
                        w = this.widgets[i];
                        if (w.top || (isNaN(w.height) && w.height != 'auto')) {
                            if (w.top) {
                                delete memo[w._uniqueid + 't'];
                                this.widgets[i].div.style.top = '0px';
                            }
                            if (isNaN(w.height) && w.height != 'auto') {
                                w.div.style.height = '0px';
                            }
                            widgets.push(w);
                        }
                        else {
                            w.redraw(memo);
                        }
                    }
                    for (var i=0; i<widgets.length; i++) {
                        widgets[i].redraw(memo);
                    }
                }
                else if (this.orientation == 'v' && this.width == 'auto') {
                    var widgets = [];

                    this.div.style.width = '';
                    delete memo[this._uniqueid + 'w'];
                    delete memo[this._uniqueid + 'cw'];

                    for (var i=0; i<this.widgets.length; i++) {
                        w = this.widgets[i];
                        if (w.left || (isNaN(w.width) && w.width != 'auto')) {
                            if (w.left) {
                                delete memo[w._uniqueid + 'l'];
                                w.div.style.left = '0px';
                            }
                            if (isNaN(w.width) && w.width != 'auto') {
                                w.div.style.width = '0px';
                            }
                            widgets.push(w);
                        }
                        else {
                            w.redraw(memo);
                        }
                    }
                    for (var i=0; i<widgets.length; i++) {
                        widgets[i].redraw(memo);
                    }
                }
            }
            else if (this.width == 'auto' || this.height == 'auto') {
                var w;
                for (var i=0; i<this.widgets.length; i++) {
                    w = this.widgets[i];
                    if (this.orientation == 'h' && this.height == 'auto'
                            && (isNaN(w.height) || isNaN(w.top))
                            && (!(w.height == 'auto' && w._calcAuto))) {
                        if (isNaN(w.height)) {
                            w.div.style.height = '';
                        }
                        if (isNaN(w.top)) {
                            w.div.style.top = '';
                        }
                    }
                    else {
                        w.redraw(false, memo);
                    }
                }
            }
        }

        QuiX.ui.Widget.prototype.redraw.apply(this, [bForceAll, memo]);
    }
}

// horizontal box

QuiX.ui.HBox = function(/*params*/) {
    var params = arguments[0] || {};
    params.orientation = 'h';

    QuiX.ui.Box.call(this, params);
}
QuiX.constructors['hbox'] = QuiX.ui.HBox;
QuiX.ui.HBox.prototype = new QuiX.ui.Box;
QuiX.ui.HBox.prototype.__class__ = QuiX.ui.HBox;

// vertical box

QuiX.ui.VBox = function(/*params*/) {
    var params = arguments[0] || {};
    params.orientation = 'v';

    QuiX.ui.Box.call(this, params);
}
QuiX.constructors['vbox'] = QuiX.ui.VBox;
QuiX.ui.VBox.prototype = new QuiX.ui.Box;
QuiX.ui.VBox.prototype.__class__ = QuiX.ui.VBox;

// flow box

QuiX.ui.FlowBox = function(/*params*/) {
    var params = arguments[0] || {};
    params.spacing = params.spacing || 8;
    params.overflow = params.overflow || 'auto';

    QuiX.ui.HBox.call(this, params);
    this.div.className = 'flowbox';

    this.select = (params.select == true || params.select == 'true');
    this.multiple = (params.multiple == true || params.multiple == 'true');
    this._filter = null;
    this._appliedFilter = null;
    if (this.select) {
        if (this.multiple) {
            this._selection = [];
        }
        else {
            this._selection = null;
        }
    }
}

QuiX.constructors['flowbox'] = QuiX.ui.FlowBox;
QuiX.ui.FlowBox.prototype = new QuiX.ui.HBox;
QuiX.ui.FlowBox.prototype.__class__ = QuiX.ui.FlowBox;

QuiX.ui.FlowBox._destroy = function() {
    var fb = this.parent;
    if (this.parent.multiple) {
        if (fb._selection.hasItem(this)) {
            fb._selection.removeItem(this);
        }
    }
    else {
        if (fb._selection == this) {
            fb._selection = null;
        }
    }
    QuiX.ui.Box._destroy.apply(this, arguments);
}

QuiX.ui.FlowBox.prototype.clearSelection = function() {
    var selection = [];
    if (this.multiple) {
        selection = this._selection;
    }
    else if (this._selection) {
        selection = [this._selection];
    }
    for (var i=0; i<selection.length; i++) {
        selection[i].removeClass('selected');
    }
    if (this.multiple) {
        this._selection = [];
    }
    else {
        this._selection = null;
    }
}

QuiX.ui.FlowBox._selectItem = function(evt, w) {
    var fb = w.parent;

    if (!fb.multiple) {
        fb.clearSelection();
        fb._selection = w;
        w.addClass('selected');
    }
    else {
        if (evt.shiftKey) {
            var start,
                end = fb.widgets.indexOf(w);

            if (fb._selection.length == 0) {
                // first widget
                start = 0;
            }
            else {
                start = fb.widgets.indexOf(fb._selection[0]);
            }

            fb.clearSelection();
            for (var i=start; i!=end + ((start<end)? 1:-1); (start<end)? i++:i--) {
                if (!fb.widgets[i].isHidden()) {
                    fb.widgets[i].addClass('selected');
                    fb._selection.push(fb.widgets[i]);
                }
            }
        }
        else if (evt.ctrlKey) {
            if (fb._selection.hasItem(w)) {
                w.removeClass('selected');
                fb._selection.removeItem(w);
            }
            else {
                w.addClass('selected');
                fb._selection.push(w);
            }
        }
        else {
            if (fb._selection.hasItem(w) && evt.type == 'mousedown') {
                // the widget is already selected
                w.attachEvent('onmouseup', QuiX.ui.FlowBox._selectItem);
            }
            else {
                fb.clearSelection();
                w.addClass('selected');
                fb._selection = [w];
                w.detachEvent('onmouseup', QuiX.ui.FlowBox._selectItem);
            }
        }
    }
}

QuiX.ui.FlowBox.prototype.appendChild = function(w) {
    var show = false;

    QuiX.ui.HBox.prototype.appendChild.apply(this, arguments);

    w.destroy = QuiX.ui.FlowBox._destroy;

    if (this.select) {
        w.attachEvent('onmousedown', QuiX.ui.FlowBox._selectItem);
    }

    if (!w.isHidden()) {
        w.hide();
        show = (this._filter)?
               QuiX.contains(w, this._filter):true;
    }

    if (show) {
        w.show();
        if (this._filter) {
            QuiX.highlight(w.div, this._filter);
        }
    }
}

QuiX.ui.FlowBox.prototype._setChildVars = function(w) {
    QuiX.ui.HBox.prototype._setChildVars.call(this, w, true);
    w.div.style['margin' +
        ((QuiX.dir == 'rtl')?'Right':'Left')] = '0px';
    w.div.style['margin' +
        ((QuiX.dir == 'rtl')?'Left':'Right')] = this.spacing + 'px';
    w.div.style.marginBottom = this.spacing + 'px';
}

QuiX.ui.FlowBox.prototype.setFilter = function(filter) {
    var words = filter.split(' ');
    var re_filter = '';

    for (var i=0; i<words.length; i++) {
        if (words[i] != '') {
            re_filter += words[i] + '|';
        }
    }
    if (re_filter != '') {
        re_filter = re_filter.slice(0, re_filter.length - 1);
        this._filter = '(' + re_filter + ')';
    }
    else {
        this._filter = null;
    }
}

QuiX.ui.FlowBox.prototype.redraw = function(bForceAll /*, memo*/) {
    var memo = arguments[1] || {};

    QuiX.ui.HBox.prototype.redraw.apply(this, [bForceAll, memo]);

    if (this._appliedFilter != this._filter) {
        if (this._filter != null) {
            QuiX.highlight(this.div, this._filter);
        }
        else {
            QuiX.removeHighlight(this.div);
        }
        this._appliedFilter = this._filter;
    }
}

QuiX.ui.FlowBox.prototype.getSelection = function() {
    if (this.select) {
        return this._selection;
    }
    else {
        return null;
    }
}

QuiX.ui.FlowBox.prototype._startDrag = function(x, y, el) {
    if (el == this.div) {
        return;
    }
    if (this._selection) {
        var selected,
            dragable,
            d,
            desktop = QuiX.getDesktop(el);

        if (this.multiple) {
            selected = this._selection;
        }
        else {
            selected = [this._selection];
        }

        dragable = new QuiX.ui.Widget({
            width : 'auto',
            height : 'auto',
            border : 1,
            style : 'border:1px solid transparent'
        });
        with (dragable) {
            left = x + 2;
            top = y + 2;
        }

        for (var i=0; i<selected.length && i<3; i++) {
            d = QuiX.getDraggable(selected[i]);
            d.setBorderWidth(0);
            d.left = d.top = i * 8;
            d.setOpacity(.5);
            dragable.appendChild(d);
        }

        if (selected.length > 1) {
            dragable.appendChild(
                new QuiX.ui.Label({
                    width: 'auto',
                    height: 24,
                    top: 'center',
                    left: 'center',
                    padding: '4,4,4,4',
                    bgcolor: '#EDEDED',
                    color: '#666',
                    caption: selected.length + ' items'
                })
            );
        }

        desktop.appendChild(dragable);
        dragable.div.style.zIndex = QuiX.maxz;
        dragable.redraw(true);

        QuiX.tmpWidget = dragable;
        QuiX.dragable = this;

        desktop.attachEvent('onmousemove', QuiX.ui.Widget._drag);
    }
}

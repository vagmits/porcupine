/************************
Tab Pane
************************/

QuiX.ui.TabPane = function(/*params*/) {
    var params = arguments[0] || {};
    this.base = QuiX.ui.Widget;
    params.overflow = 'hidden';
    this.base(params);
    this.div.className = 'tabpane';
    this.headerSize = parseInt(params.headersize) || 24;
    this.tabs = [];
    this.editable = (params.editable == true || params.editable == 'true');
    this.activeTab = params.active || 0;
}

QuiX.constructors['tabpane'] = QuiX.ui.TabPane;
QuiX.ui.TabPane.prototype = new QuiX.ui.Widget;

QuiX.ui.TabPane._destroyTab = function() {
    var oTab = this.parent;
    for (var idx=0; idx < oTab.tabs.length; idx++) {
         if (oTab.tabs[idx] == this)
            break;
    }
    if (idx > 0) {
        oTab.activateTab(idx - 1);
    }
    else {
        if (oTab.tabs.length > 1) {
            oTab.activateTab(1);
        }
        oTab.activeTab = 0;
    }
    oTab.tabs.splice(idx, 1);
    this.tabButton.destroy();
    QuiX.ui.Widget.prototype.destroy.apply(this, arguments);
}

QuiX.ui.TabPane._tabClick = function(evt, tabButton) {
    tabButton.parent.activateTab(tabButton.container);
}

QuiX.ui.TabPane._tabOver = function(evt, tabButton) {
    if (QuiX.dragging && !tabButton._dragtimer) {
        tabButton._dragtimer = window.setTimeout(
            function() {
                tabButton._dragTimer = null;
                tabButton.parent.activateTab(tabButton.container);
            }, 1000);
    }
}

QuiX.ui.TabPane._tabOut = function(evt, tabButton) {
    if (tabButton._dragtimer) {
        window.clearTimeout(tabButton._dragtimer);
        tabButton._dragtimer = null;
    }
}

QuiX.ui.TabPane._calcPageHeight = function(memo) {
    return this.parent.getHeight(false, memo) - this.parent.headerSize;
}

QuiX.ui.TabPane.prototype.addTab = function(params) {
    var oTab = QuiX.theme.tabpane.tabbutton.get(params.img, params.caption,
        params.bgcolor, params.color);
    oTab.height = this.headerSize + 2;
    oTab.attachEvent('onclick', QuiX.ui.TabPane._tabClick);
    oTab.attachEvent('onmouseover', QuiX.ui.TabPane._tabOver);
    oTab.attachEvent('onmouseout', QuiX.ui.TabPane._tabOut);

    if (this.editable) {
        var btn;
        oTab.addPaddingOffset('Right', 30);
        btn = new QuiX.ui.SpriteButton({
            width: 10,
            height: 11,
            top: parseInt(this.headerSize / 2) - 9,
            left: 'this.parent.div.offsetWidth - 28',
            img: QuiX.getThemeUrl() + 'images/tab_close.png',
            onclick: function(evt, btn) {
                btn.parent.container.destroy();
            }
        });
        oTab.appendChild(btn);
    }

    this.appendChild(oTab);
    oTab.redraw();
    oTab.div.style.float = (QuiX.dir == 'rtl')? 'right':'left';
    oTab.setPosition('relative');
    oTab.div.style.zIndex = '';
    oTab.div.className = 'tab inactive';

    params.top = this.headerSize;
    params.height = QuiX.ui.TabPane._calcPageHeight;
    params.width = '100%';
    params.border = params.border || QuiX.theme.tabpane.border;
    params.padding = params.padding || QuiX.theme.tabpane.padding;
    params.overflow = params.overflow || 'auto';

    var w = new QuiX.ui.Widget(params);
    this.appendChild(w);
    w.redraw();

    w.div.className = 'tabpage';
    w.tabButton = oTab;
    w.destroy = QuiX.ui.TabPane._destroyTab;
    w.onactivate = params.onactivate;

    oTab.container = w;

    this.tabs.push(w);

    if (this.tabs.length - 1 >= this.activeTab) {
        this.activateTab(this.activeTab);
    }
    if (this.activeTab == this.tabs.length - 1) {
        oTab.top = -2;
    }

    return w;
}

QuiX.ui.TabPane.prototype.activateTab = function(tab) {
    var activeTabButton,
        iActive = this.activeTab,
        iTab;

    if (typeof tab == 'number') {
        iTab = tab;
    }
    else {
        iTab = this.tabs.indexOf(tab);
    }

    var oTab = this.tabs[iTab];
    oTab.div.style.zIndex = ++this.maxz;
    oTab.show();
    oTab.redraw();

    oTab.tabButton.div.style.zIndex = ++this.maxz;
    oTab.tabButton.top = -2;
    oTab.tabButton.div.className = 'tab active';
    oTab.tabButton.detachEvent('onclick', QuiX.ui.TabPane._tabClick);
    oTab.tabButton.redraw();

    if (iActive != iTab) {
        activeTabButton = this.tabs[iActive].tabButton;
        activeTabButton.top = 0;
        activeTabButton.attachEvent('onclick', QuiX.ui.TabPane._tabClick);
        activeTabButton.div.className = 'tab inactive';
        activeTabButton.redraw();
        this.tabs[iActive].hide();
    }

    this.activeTab = iTab;
    if ((this.tabs.length == 1 || iActive != iTab) && oTab.onactivate) {
        QuiX.getEventListener(oTab.onactivate)(this, iTab);
    }
}

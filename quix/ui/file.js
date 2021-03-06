// file uploader

QuiX.ui.File = function(/*params*/) {
    var params = arguments[0] || {};

    params.onunload = QuiX.ui.File.onunload;
    params.height = params.height || 24;
    this.name = params.name;
    this.href = params.href;
    this.readonly = (params.readonly == 'true' || params.readonly == true);
    this.postUrl = params.posturl;
    if (!this.postUrl) {
        var postUrl = document.location.href;
        if (window.location.protocol.indexOf('https') != -1) {
            postUrl = "http" + postUrl.substr(5);
        }
        postUrl = postUrl.split('?')[0] + '?cmd=http_upload';
        this.postUrl = postUrl;
    }

    if (params.filename) {
        this.file = {
            name : params.filename,
            size : params.size
        }
    }

    QuiX.ui.HBox.call(this, params);

    var f = new QuiX.ui.Link({
            caption : this._getCaption(),
            href : this.href || 'javascript:void(0)',
            target : '',
            bgcolor : 'white',
            border : 1
        });
    this.appendChild(f);
    f.div.className = 'field';

    params.multiple = false;
    params.btnlpadding = params.btnlpadding || 3;
    params.btntpadding = params.btntpadding || params.height - 22;

    var self = this;
    this.attachEvent('onload', function() {
        var btn;
        if (params.placeholder) {
            btn = self.getDesktop().getWidgetById(params.placeholder, false, 1);
        }
        else {
            params.caption = '...';
            params.img = null;
            btn = new QuiX.ui.Widget({
                width : 24,
                border : 1,
                overflow: 'visible'
            });
            btn.div.className = 'btnupload';
            self.appendChild(btn);
        }
        btn.attachEvent('onmousedown', QuiX.stopPropag);
        btn.div.innerHTML = '<span id="' + btn._uniqueid + '"></span>';
        self.uploader = QuiX.ui.File._getUploader(self, btn._uniqueid, params);
        self.redraw();
    });
}

QuiX.constructors['file'] = QuiX.ui.File;
QuiX.ui.File.prototype = new QuiX.ui.HBox;
QuiX.ui.File.prototype.__class__ = QuiX.ui.File;
QuiX.ui.File.prototype.customEvents =
    QuiX.ui.HBox.prototype.customEvents.concat(['oncomplete']);

QuiX.ui.File.onunload = function(obj) {
    obj.uploader.destroy();
}

QuiX.ui.File._getUploader = function(obj, placeholder_id, params) {
    var action = params.multiple? SWFUpload.BUTTON_ACTION.SELECT_FILES:
                                  SWFUpload.BUTTON_ACTION.SELECT_FILE;
    var uploader = new SWFUpload({
        upload_url : obj.postUrl,
        flash_url : QuiX.baseUrl + 'swfupload/swfupload.swf',
        post_params : {_state : document.cookie},
        use_query_string : false,
        debug: false,

        button_placeholder_id : placeholder_id,
        button_text : params.caption,
        button_text_left_padding : params.btnlpadding,
        button_text_top_padding : params.btntpadding,
        button_width : '100%',
        button_height : '100%',
        button_window_mode : 'transparent',
        button_action : action,
        button_image_url: params.img || (QuiX.baseUrl + 'images/transp.gif'),
        button_disabled : (params.readonly == 'true' || params.readonly == true),

        file_size_limit : params.maxfilesize || 0,
        file_types : params.filetypes || '*',

        //events
        upload_error_handler : function() {
            uploader.cancelUpload(null, false);
            obj.uploadError.apply(obj, arguments);
        },
        file_queue_error_handler : function() {
            obj.queueError.apply(obj, arguments);
        },
        file_dialog_complete_handler : function(){
            obj.beginupload.apply(obj, arguments);
        },
        file_queued_handler : function() {
            obj.fileSelected.apply(obj, arguments);
        },
        upload_progress_handler : function() {
            obj.updateProgress.apply(obj, arguments);
        },
        upload_success_handler : function() {
            obj.uploadSuccess.apply(obj, arguments);
        },
        upload_complete_handler : function(file) {
            if(SWFUpload.FILE_STATUS.ERROR != file.filestatus) {
                obj.uploadComplete.apply(obj, arguments);
            }
            else {
                // ERROR
                try {
                    if (obj.attributes.pbars) {
                       obj.attributes.pbars[0].getParentByType(QuiX.ui.Dialog).close();
                    }
                    else if (obj.attributes.pbar) {
                        obj.attributes.pbar.getParentByType(QuiX.ui.Dialog).close();
                    }
                } catch(e) {}
            }
        }
    });
    return uploader;
}

QuiX.ui.File.prototype.openDocument = function() {
    window.location.href = this.href;
}

QuiX.ui.File.prototype.setFileTypes = function(filetypes, description) {
    this.uploader.setFileTypes(filetypes, description);
}

QuiX.ui.File.prototype.fileSelected = function(file) {
    this.file = file;
}

QuiX.ui.File.prototype.beginupload = function(nfiles, queued, tqueued) {
    if (queued > 0) {
        var self = this,
        	caption = this.getDesktop().attributes.CANCEL || 'Cancel';
        this.getDesktop().parseFromString(
            '<dialog xmlns="http://www.innoscript.org/quix" title="' +
                    this.file.name.xmlEncode() + '" ' +
                    'width="240" height="90" left="center" top="center">' +
                '<wbody>' +
                    '<progressbar width="90%" height="20" left="center" ' +
                            'top="center" maxvalue="' + this.file.size + '">' +
                        '<label align="center" width="100%" height="100%" ' +
                        'caption="0%"/>' +
                    '</progressbar>' +
                '</wbody>' +
                '<dlgbutton width="70" height="22" caption="' + caption + '"/>' +
            '</dialog>',
            function(dlg) {
                self.attributes.pbar =
                    dlg.getWidgetsByType(QuiX.ui.ProgressBar)[0];
                dlg.buttons[0].attachEvent('onclick',
                    function (evt, w) {
                        self.uploader.cancelUpload(null, false);
                        dlg.close();
                    }
                );
                self.uploader.startUpload();
            }
        );
    }
}

QuiX.ui.File.prototype.updateProgress =
function(file, bytes_complete, total_bytes) {
    var pbar = this.attributes.pbar;
    pbar.setValue(bytes_complete);
    pbar.widgets[1].setCaption(
        parseInt((bytes_complete / pbar.maxvalue) * 100) + '%');
}

QuiX.ui.File.prototype.uploadSuccess = function(file, server_data, response) {
    this.file.tmp_file = server_data;
}

QuiX.ui.File.prototype.uploadComplete = function(file) {
    this.widgets[0].setCaption(file.name);
    this.attributes.pbar.getParentByType(QuiX.ui.Dialog).close();
    this.trigger('oncomplete');
}

QuiX.ui.File.prototype._getCaption = function() {
    var caption = '';
    if (this.file)
        caption = this.file.name;
    return caption;
}

QuiX.ui.File.prototype.getValue = function() {
    if (this.file)
        return {
            filename: this.file.name,
            tempfile: this.file.tmp_file || null
        }
    else
        return {filename:null, tempfile:null}
}

QuiX.ui.File.prototype.uploadError =  function(f, code, message) {
    this.onerror(new QuiX.Exception(code, message));
}

QuiX.ui.File.prototype.queueError = function(f, code, message) {
    this.onerror(new QuiX.Exception(code, message));
}

QuiX.ui.File.prototype.onerror = function(e) {
    QuiX.displayError(e);
}

// multiple file uploader

QuiX.ui.MultiFile = function(/*params*/) {
    var params = arguments[0] || {};
    params.onunload = QuiX.ui.File.onunload;

    this.name = params.name;
    this.method = params.method;
    this.readonly = (params.readonly == 'true' || params.readonly == true);
    this.postUrl = params.posturl;
    if (!this.postUrl) {
        var postUrl = document.location.href;
        if (window.location.protocol.indexOf('https') != -1) {
            postUrl = "http" + postUrl.substr(5);
        }
        postUrl = postUrl.split('?')[0] + '?cmd=http_upload';
        this.postUrl = postUrl;
    }

    QuiX.ui.Widget.call(this, params);

    this.selectlist = new QuiX.ui.SelectList({
        width : '100%',
        height : 'this.parent.getHeight(false, memo) - 24',
        multiple : true,
        ondblclick : this.downloadFile
    });
    this.appendChild(this.selectlist);

    this.removeButton = new QuiX.ui.FlatButton({
        width : 24,
        height : 24,
        img : '$THEME_URL$images/remove16.gif',
        top : 'this.parent.getHeight(false, memo) - 24',
        left : 'this.parent.getWidth(false, memo) - 24',
        onclick : this.removeSelectedFiles,
        disabled : this.readonly
    });
    this.appendChild(this.removeButton);

    if (params.placeholder) {
        var self = this;
        this.attachEvent('onload',
            function() {
                self.addButton = self.getDesktop().getWidgetById(params.placeholder, false, 1);
                self.addButton.attachEvent('onmousedown', QuiX.stopPropag);
            });
    }
    else {
        this.addButton = new QuiX.ui.Widget({
            width : 24,
            height : 24,
            top : 'this.parent.getHeight(false, memo) - 24',
            left : 'this.parent.getWidth(false, memo) - 48',
            padding : '3,3,3,3',
            border : 1,
            disabled : this.readonly
        });
        this.appendChild(this.addButton);
        this.addButton.div.className = 'btnupload';
        this.addButton.attachEvent('onmousedown', QuiX.stopPropag);
    }

    params.multiple = true;
    params.img = params.img || QuiX.getThemeUrl() + 'images/add16.gif';

    var self = this;
    this.attachEvent('onload', function() {
            self.addButton.div.innerHTML =
                '<span id="' + self.addButton._uniqueid + '"></span>';
            self.uploader = QuiX.ui.File._getUploader(
                self, self.addButton._uniqueid, params);
    });
    this.files = [];
    this.upload_queue = [];
    this.total_bytes = 0;
}

QuiX.constructors['multifile'] = QuiX.ui.MultiFile;
QuiX.ui.MultiFile.prototype = new QuiX.ui.Widget;
QuiX.ui.MultiFile.prototype.__class__ = QuiX.ui.MultiFile;
QuiX.ui.MultiFile.prototype.customEvents =
    QuiX.ui.Widget.prototype.customEvents.concat(['oncomplete', 'onbeforeupload',
                                                  'onerror', 'oncancel']);

QuiX.ui.MultiFile.prototype.reset = function() {
    this.files = [];
    this.selectlist.clear();
}

QuiX.ui.MultiFile.prototype.fileSelected = function(f) {
    this.upload_queue.push(f);
    this.total_bytes += f.size;
}

QuiX.ui.MultiFile.prototype.setFileTypes = QuiX.ui.File.prototype.setFileTypes;

QuiX.ui.MultiFile.prototype.beginupload = function(nfiles, queued, tqueued) {
    if (queued > 0) {
        var self = this;
        var proceed = self.trigger('onbeforeupload'),
        	caption = this.getDesktop().attributes.CANCEL || 'Cancel';
        if (!proceed) {
            var f;
            while (self.upload_queue.length > 0) {
                f = self.upload_queue.shift();
                self.uploader.cancelUpload(f.id, false);
            }
            self.total_bytes = 0;
            return;
        }
        this.getDesktop().parseFromString(
            '<dialog xmlns="http://www.innoscript.org/quix" title="Uploading file(s)" ' +
                    'width="240" height="140" left="center" top="center">' +
                '<wbody>' +
                    '<progressbar width="90%" height="24" left="center" ' +
                            'top="20" maxvalue="' + this.total_bytes + '">' +
                        '<label align="center" width="100%" height="100%"/>' +
                    '</progressbar>' +
                    '<progressbar width="90%" height="24" left="center" ' +
                            'top="50" maxvalue="100">' +
                        '<label align="center" width="100%" height="100%" ' +
                        'caption="0%"/>' +
                    '</progressbar>' +
                '</wbody>' +
                '<dlgbutton width="70" height="22" caption="' + caption + '"/>' +
            '</dialog>',
            function (dlg) {
                self.attributes.pbars =
                    dlg.getWidgetsByType(QuiX.ui.ProgressBar);
                self.attributes.bytesSent = 0;
                dlg.buttons[0].attachEvent('onclick',
                    function (evt, w) {
                        var f;
                        while (self.upload_queue.length > 0) {
                            f = self.upload_queue.shift();
                            self.uploader.cancelUpload(f.id, false);
                        }
                        self.total_bytes = 0;
                        self.trigger('oncancel');
                        dlg.close();
                    }
                );
                self.uploader.startUpload();
            }
        );
    }
}

QuiX.ui.MultiFile.prototype.removeSelectedFiles = function(evt, btn) {
    var mf = btn.parent;
    mf.selectlist.removeSelected();
    mf.files = [];
    var opts = mf.selectlist.options;
    for (var i=0; i<opts.length; i++) {
        mf.files.push(opts[i].attributes.fileinfo);
    }
}

QuiX.ui.MultiFile.prototype.getValue = function() {
    return this.files;
}

QuiX.ui.MultiFile.prototype.addFile = function(params) {
    var fileinfo = {
        id : params.id || '',
        filename : params.name || params.filename,
        temp_file : params.tmpfile || ''
    }
    this.files.push(fileinfo);

    var opt = this.selectlist.addOption({
        caption : fileinfo.filename,
        value : fileinfo.id,
        img : params.img || '$THEME_URL$images/document.gif'
    });
    opt.attributes.fileinfo = fileinfo;
}

QuiX.ui.MultiFile.prototype.downloadFile = function(evt, w) {
    if (w.selection.length == 1 && w.selection[0].value)
        window.location.href = QuiX.root + w.selection[0].value +
                               '?cmd=' + w.parent.method;
}

QuiX.ui.MultiFile.prototype.updateProgress = function(file, bytes_complete, total_bytes) {
    var pbar1 = this.attributes.pbars[0];
    var pbar2 = this.attributes.pbars[1];
    pbar1.setValue(this.attributes.bytesSent + bytes_complete);
    pbar1.widgets[1].setCaption(file.name);
    var p = (bytes_complete / total_bytes) * 100;
    pbar2.setValue(p);
    pbar2.widgets[1].setCaption(parseInt(p) + '%');
}

QuiX.ui.MultiFile.prototype.uploadSuccess = function(file, server_data, response) {
    this.upload_queue[0].tmpfile = server_data;
    this.upload_queue[0].img = '$THEME_URL$images/file_temporary.gif';
    this.upload_queue[0].id = '';
}

QuiX.ui.MultiFile.prototype.uploadComplete = function(file) {
    if (this.upload_queue.length > 0) {
        var current_file = this.upload_queue.shift();
        this.addFile(current_file);
        this.attributes.bytesSent += current_file.size;

        if (this.upload_queue.length > 0) {
            this.uploader.startUpload();
        }
        else {
            this.attributes.pbars[0].getParentByType(QuiX.ui.Dialog).close();
            this.trigger('oncomplete');
            this.total_bytes = 0;
        }
    }
}

QuiX.ui.MultiFile.prototype.uploadError =  function(f, code, message) {
    this.onerror(new QuiX.Exception(code, message));
}

QuiX.ui.MultiFile.prototype.queueError = function(f, code, message) {
    this.onerror(new QuiX.Exception(code, message));
}

QuiX.ui.MultiFile.prototype.onerror = function(e) {
    var f;
    while (this.upload_queue.length > 0) {
        f = this.upload_queue.shift();
        this.uploader.cancelUpload(f.id, false);
    }
    this.total_bytes = 0;
    this.reset();
    this.trigger('onerror', e.code, e.message);
    QuiX.displayError(e);
}

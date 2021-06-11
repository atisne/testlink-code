/*
TestLink Open Source Project - http://testlink.sourceforge.net/
@filesource: tl_ckeditor_config.js
Configure CKEditor
See: http://docs.cksource.com/ for more information

List of all config parameters that can be set here can be found on:
http://docs.cksource.com/Main_Page
*/

CKEDITOR.editorConfig = function( config )
{
	// choose your prefered ckedtior skin
	// available skins for version 4.x: moono-lisa => default
	// For skins present on version 3.x => http://ckeditor.com/addons/skins/all
	config.skin = 'moonocolor';

	// set css of ckeditor content to testlink.css
	config.contentsCss = fRoot + '/gui/themes/default/css/testlink.css';

	// do not check "Replace actual contents" checkbox as default
	config.templates_replaceContent = false;

	// default Toolbar
	config.toolbar_Testlink =
	[
		['Source','Templates','SpellChecker','Find','Undo','Redo','-',
		 'NumberedList','BulletedList','-',
		 'JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-',
		 'Outdent','Indent','-',
		 'Table','HorizontalRule',],
		 '/',
		 ['Format','Bold','Italic','Underline','Strike','-',
		  'Subscript','Superscript','-','TextColor','BGColor','RemoveFormat','-',
		  'Link','Image','Anchor','SpecialChar']
	];

	// mini Toolbar
	config.toolbar_TestlinkMini =
	[
		['NumberedList','BulletedList','-',
		 'JustifyLeft','JustifyCenter','JustifyRight','-',
		 'Bold','Italic','TextColor','-',
		 'Link','Image','Table']
	];

	// Toolbar with all available features - can be used as template for custom toolbars
	// '-' creates toolbar seperator
	// '/' creates a new toolbar "line"
	// [...] defines sub-toolbars
	config.toolbar_Full =
	[
	 	['Source','-','Save','NewPage','Preview','-','Templates'],
	    ['Cut','Copy','Paste','PasteText','PasteFromWord','-','Print', 'SpellChecker', 'Scayt'],
	    ['Undo','Redo','-','Find','Replace','-','SelectAll','RemoveFormat'],
	    ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'],
	    '/',
	    ['Bold','Italic','Underline','Strike','-','Subscript','Superscript'],
	    ['NumberedList','BulletedList','-','Outdent','Indent','Blockquote','CreateDiv'],
	    ['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],
	    ['BidiLtr', 'BidiRtl' ],
	    ['Link','Unlink','Anchor'],
	    ['Image','Flash','Table','HorizontalRule','Smiley','SpecialChar','PageBreak'],
	    '/',
	    ['Styles','Format','Font','FontSize'],
	    ['TextColor','BGColor'],
	    ['Maximize','ShowBlocks','-','About']
	];

	/* Configuration of File Browser
	   You can use theses definitions if you buy ckfinder
	   more informations on http://ckfinder.com/
	   download ckfinder and put into third party folder
	*/
	//config.filebrowserBrowseUrl = '/third_party/ckfinder/ckfinder.html';
	//config.filebrowserImageBrowseUrl = '/third_party/ckfinder/ckfinder.html?Type=Images';
	//config.filebrowserFlashBrowseUrl = '/third_party/ckfinder/ckfinder.html?Type=Flash';
	// uncomment these lines only if you want to allow quick upload
	//config.filebrowserUploadUrl = '/third_party/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Files';
	//config.filebrowserImageUploadUrl = '/third_party/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Images';
	//config.filebrowserFlashUploadUrl = '/third_party/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Flash';

  /* elFinder file browser
     https://github.com/Studio-42/elFinder/
  */
  config.filebrowserImageUploadUrl = '/third_party/elFinder/php/connector.minimal.php';

};

// https://github.com/Studio-42/elFinder/wiki/Integration-with-CKEditor-4-(jQuery-UI-dialog-mode)
// Only the server upload feature is operational (server browsing is not available).

// Setup upload tab in CKEditor dialog
CKEDITOR.on('dialogDefinition', function (event) {
  var editor = event.editor,
      dialogDefinition = event.data.definition,
      tabCount = dialogDefinition.contents.length,
      browseButton, uploadButton, submitButton, inputId,
      elfNode,
      elfDirHashMap = { // Dialog name / elFinder holder hash Map
        image : '',
        flash : '',
        files : '',
        link  : '',
        fb    : 'l1_Lw' // Fall back target : `/`
      },
      customData = {},
      convAbsUrl = function(url) {
        if (url.match(/^http/i)) {
          return url;
        }
        if (url.substr(0,2) === '//') {
          return window.location.protocol + url;
        }
        var root = window.location.protocol + '//' + window.location.host,
            reg  = /[^\/]+\/\.\.\//,
            ret;
        if (url.substr(0, 1) === '/') {
          ret = root + url;
        } else {
          ret = root + window.location.pathname.replace(/\/[^\/]+$/, '/') + url;
        }
        ret = ret.replace('/./', '/');
        while(reg.test(ret)) {
          ret = ret.replace(reg, '');
        }
        return ret;
      },
      /**
       * Return formated file size
       *
       * @param  Number  file size
       * @return String
       */
      formatSize = function(s) {
        var n = 1, u = 'b';

        if (s == 'unknown') {
          return 'unknown';
        }

        if (s > 1073741824) {
          n = 1073741824;
          u = 'GB';
        } else if (s > 1048576) {
          n = 1048576;
          u = 'MB';
        } else if (s > 1024) {
          n = 1024;
          u = 'KB';
        }
        s = s/n;
        return (s > 0 ? n >= 1048576 ? s.toFixed(2) : Math.round(s) : 0) +' '+u;
      },
      imgShowMaxSize = 400, // Max image size(px) to show
      // Set image size to show
      setShowImgSize = function(url, callback) {
        $('<img/>').attr('src', url).on('load', function() {
          var w = this.naturalWidth,
              h = this.naturalHeight,
              s = imgShowMaxSize;
          if (w > s || h > s) {
            if (w > h) {
              h = Math.floor(h * (s / w));
              w = s;
            } else {
              w = Math.floor(w * (s / h));
              h = s;
            }
          }
          callback({width: w, height: h});
        });
      },
      setDialogValue = function(file) {
        var url = convAbsUrl(file.url),
            dialog = CKEDITOR.dialog.getCurrent(),
            dialogName = dialog._.name,
            tabName = dialog._.currentTabId,
            urlObj;
        if (dialogName == 'image') {
          urlObj = 'txtUrl';
        } else if (dialogName == 'flash') {
          urlObj = 'src';
        } else if (dialogName == 'files' || dialogName == 'link') {
          urlObj = 'url';
        } else if (dialogName == 'image2') {
          urlObj = 'src';
        } else {
          return;
        }
        if (tabName == 'Upload') {
          tabName = 'info';
          dialog.selectPage(tabName);
        }
        dialog.setValueOf(tabName, urlObj, url);
        if (dialogName == 'image' && tabName == 'info') {
          setShowImgSize(url, function(size) {
            dialog.setValueOf('info', 'txtWidth', size.width);
            dialog.setValueOf('info', 'txtHeight', size.height);
            dialog.preview.$.style.width = size.width+'px';
            dialog.preview.$.style.height = size.height+'px';
            dialog.setValueOf('Link', 'txtUrl', url);
            dialog.setValueOf('Link', 'cmbTarget', '_blank');
          });
        } else if (dialogName == 'image2' && tabName == 'info') {
          dialog.setValueOf(tabName, 'alt', file.name + ' (' + formatSize(file.size) + ')');
          setShowImgSize(url, function(size) {
            setTimeout(function() {
              dialog.setValueOf('info', 'width', size.width);
              dialog.setValueOf('info', 'height', size.height);
            }, 100);
          });
        } else if (dialogName == 'files' || dialogName == 'link') {
          try {
            dialog.setValueOf('info', 'linkDisplayText', file.name);
          } catch(e) {}
        }
      };

  for (var i = 0; i < tabCount; i++) {
    try {
      // Disable the browse server feature
      // browseButton = dialogDefinition.contents[i].get('browse');
      browseButton = null;
      uploadButton = dialogDefinition.contents[i].get('upload');
      submitButton = dialogDefinition.contents[i].get('uploadButton');
    } catch(e) {
      browseButton = uploadButton = null;
    }

    if (browseButton !== null) {
      browseButton.hidden = false;
      browseButton.onClick = function (dialog, i) {
        dialogName = CKEDITOR.dialog.getCurrent()._.name;
        if (dialogName === 'image2') {
          dialogName = 'image';
        }
        if (elfNode) {
          if (elfDirHashMap[dialogName] && elfDirHashMap[dialogName] != elfInstance.cwd().hash) {
            elfInstance.request({
              data     : {cmd  : 'open', target : elfDirHashMap[dialogName]},
              notify : {type : 'open', cnt : 1, hideCnt : true},
              syncOnFail : true
            });
          }
          elfNode.dialog('open');
        }
      }
    }

    if (uploadButton !== null && submitButton !== null) {
      uploadButton.hidden = false;
      submitButton.hidden = false;
      uploadButton.onChange = function() {
        inputId = this.domId;
      }
      // upload a file to elFinder connector
      submitButton.onClick = function(e) {
        dialogName = CKEDITOR.dialog.getCurrent()._.name;
        if (dialogName === 'image2') {
          dialogName = 'image';
        }
        var target = elfDirHashMap[dialogName]? elfDirHashMap[dialogName] : elfDirHashMap['fb'],
            name = $('#'+inputId),
            input = name.find('iframe').contents().find('form').find('input:file'),
            error = function(err) {
              //alert(elfInstance.i18n(err).replace('<br>', '\n'));
              alert(err);
            };

        if (input.val()) {
          var fd = new FormData();
          fd.append('cmd', 'upload');
          fd.append('target', target);
          fd.append('overwrite', 0); // Instruction to save alias when same name file exists
          $.each(customData, function(key, val) {
            fd.append(key, val);
          });
          fd.append('upload[]', input[0].files[0]);
          $.ajax({
            url: editor.config.filebrowserImageUploadUrl,
            type: "POST",
            data: fd,
            processData: false,
            contentType: false,
            dataType: 'json'
          })
            .done(function( data ) {
              if (data.added && data.added[0]) {
                //elfInstance.exec('reload');
                setDialogValue(data.added[0]);
              } else {
                error(data.error || data.warning || 'errUploadFile');
              }
            })
            .fail(function() {
              error('errUploadFile');
            })
            .always(function() {
              input.val('');
            });
        }
        return false;
      }
    }
  }
});

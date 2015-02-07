/* do not replace, heavily modified */
(function(jQuery, undefined) {
    jQuery.fn.extend({
        customScroll: function(opt) {
            var box = jQuery( '<div><div></div></div>' )
                .css({
                   position: 'absolute',
                   left: -1000,
                   width: 300,
                   overflow: 'scroll'
                })
                .appendTo( 'body' );
            var barWidth = box.width() - box.find('div').width();
            box.remove();

            return this.each(function() {
                var that = jQuery(this);
                var he = that.outerHeight();
                var wi = that.outerWidth();

                that.css({
                   overflow: 'visible',
                   height: 'auto',
                   margin: 0,
                   float: ''
                }).addClass('scrollable');

                var contentHeight = that.outerHeight() || opt.contentHeight;
                var ratio = Math.min(1, he / contentHeight);

                if (ratio >= 1) {
                    return;
                }

                var scroller = jQuery('<div class="scroll-view">')
                               .addClass('scroll-wrapper')
                               .addClass('phancy-scroller')
                               .css({
                                   overflow: 'hidden',
                                   position: 'relative',
                                   height: he,
                                   width: wi,
                                   marginTop: that.css('margin-top'),
                                   marginBottom: that.css('margin-bottom'),
                                   marginLeft: that.css('margin-left'),
                                   marginRight: that.css('margin-right')
                               });

               var scrollarea = jQuery('<div class="scroll-canvas">')
                        .addClass('scroll-wrapper')
                        .css({
                            overflow: 'scroll',
                            position: 'relative',
                            height: he + barWidth,
                            width: wi + barWidth 
                        })
                        .appendTo( scroller );

               that.after(scroller) 
                   .appendTo(scrollarea);

                var scrollbar = jQuery('<div>')
                        .addClass('phancy-scrollbar')
                        .css({ height: he })
                        .appendTo( scroller );
                var scrollbarbutton = jQuery('<div>')
                        .addClass('phancy-scrollbarbutton')
                        .css({ height: he * ratio })
                        .appendTo( scrollbar );

                scroller.scroll(function() {
                    scroller.scrollLeft(0).scrollTop(0);
                });

                scrollarea.scroll(function() {
                    scrollbarbutton.css({
                        top: scrollarea.scrollTop() * ratio,
                        height: he * ratio
                    });
                });

                (function() {
                    var dragging = false,
                        pageY = null,
                        pageX = null,
                        top = null,
                        timer = null;

                    // scroll by clicking on scrollbar itself (page up and down).
                    scrollbar.on( 'mousedown', function(e) {
                        if (e.which !== 1 || jQuery(e.targe ).hasClass('scrollbarbutton')) {
                            return;
                        }
                        top = parseInt(scrollbarbutton.css('top'),10) + (he * ratio * (e.pageY > scrollbarbutton.offset().top ? 1 : -1));
                        clearTimeout(timer);
                        timer = setTimeout(function() {
                            top = Math.min(Math.max(0, e.pageY - scrollbar.offset().top) - he * ratio / 2, he - (he * ratio));
                            scrollbarbutton.css({top: top});
                            scrollarea.scrollTop(Math.round(top/ratio));
                        }, 300);
                        scrollbarbutton.css({top: top });
                        scrollarea.scrollTop(Math.round(top/ratio));
                        return false;
                    });

                    scrollbar.on('mouseup', function() {
                        clearTimeout(timer);
                    });

                    // scroll by clicking on scrollbar button (dragging).
                    scrollbarbutton.on('mousedown', function( e ) {
                        if (e.which !== 1) {
                            return;
                        }
                        dragging = true;
                        pageY = e.pageY;
                        pageX = e.pageX;
                        top = parseInt(scrollbarbutton.css('top'), 10);
                        jQuery(document).on('mousemove', function(e) {
                            if (dragging) {
                                if (Math.abs( e.pageX - pageX) < 50) {
                                    var newtop = Math.min(Math.max(0, top + e.pageY - pageY), he - he * ratio);
                                    scrollbarbutton.css('top', newtop);
                                    scrollarea.scrollTop(Math.round( newtop / ratio));
                                }
                                else {
                                    scrollarea.scrollTop(Math.round(top / ratio));
                                    scrollbarbutton.css({ top: top });
                                }
                                return false;
                            }
                            else {
                                jQuery(document).unbind('mousemove');
                            }
                        });
                        return false;
                    });

                    jQuery(document).on('mouseup', function() {
                        if (dragging) {
                            dragging = false;
                            jQuery(document).unbind('mousemove');
                            return false;
                        }
                    });
                })();
            });
        }
    });
})(jQuery);

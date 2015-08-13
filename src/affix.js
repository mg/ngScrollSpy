mod.directive('affix', function(ScrollSpy) {
    var affixCloneFn= function(elem) {
    if (!elem.data('$ngScrollSpy.clone')) {
      var clone = elem.clone();
      elem.data('$ngScrollSpy.clone', clone);
    }
    return elem.data('$ngScrollSpy.clone');
  };

  var affixFn= function(shouldAffixFn, wasAffixed, affixClass, affixOptions, elem) {
    var shouldAffix= shouldAffixFn(elem[0].getBoundingClientRect());
    if(shouldAffix !== wasAffixed) {
      if(shouldAffix) {
        if(affixOptions.clone) {
          // insert cloned element into DOM to serve as a placeholder,
          // because the original element (elem) will be pulled out of the flow by getting affixed
          elem.after(affixCloneFn(elem));
        }
        elem.addClass(affixClass);
      } else {
        if(affixOptions.clone) {
          // remove clone from DOM again
          affixCloneFn(elem).detach();
        }
        elem.removeClass(affixClass);
      }
    }
  };

  var scrollHandler;
  var linkFn= function(affixTo, affixClass, affixOptions, elem) {
    var isAffixed= false,
      wasAffixed= false,
      affixedPos,
      trigger= false;

    affixOptions = angular.extend({offset: 0, clone: false}, affixOptions);

    if(affixTo === 'top') {
      scrollHandler= ScrollSpy.onYScroll(function(pos) {
        wasAffixed= isAffixed;
        affixFn(function(rect) {
          if(isAffixed) {
            isAffixed= (affixedPos <= pos + affixOptions.offset);
            return isAffixed;
          } else if(rect.top <= affixOptions.offset) {
            if(rect.top < affixOptions.offset) affixedPos= pos + rect.top;
            else affixedPos= pos;
            return (isAffixed= true);
          }
          return false;
        }, wasAffixed, affixClass, affixOptions, elem);
      });
    } else if(affixTo === 'bottom') {
      trigger= true; // need to trigger scroll event
      scrollHandler= ScrollSpy.onYScroll(function(pos, delta, data) {
        wasAffixed= isAffixed;
        affixFn(function(rect) {
          if(isAffixed) {
            // we are still affixed if we have not scrolled passed
            isAffixed= (affixedPos >= pos);
            return isAffixed;
          } else if(rect.bottom >= data.height) {
            // lets affix
            // first event when at top is a special case,
            // calculate affixed pos differently
            if(ScrollSpy.isForced && pos === 0)
              affixedPos= pos + rect.bottom - data.height - rect.height;
            else
              affixedPos= pos + rect.bottom - data.height;
            return (isAffixed= true);
          }
          // not affixed
          return false;
        }, wasAffixed, affixClass, affixOptions, elem);
      });
    } else if(affixTo === 'left') {
      scrollHandler= ScrollSpy.onXScroll(function(pos) {
        wasAffixed= isAffixed;
        affixFn(function(rect) {
          if(isAffixed) {
            isAffixed= (affixedPos <= pos);
            return isAffixed;
          } else if(rect.left <= 0) {
            if(rect.left < 0) affixedPos= pos + rect.left;
            else affixedPos= pos;
            return (isAffixed= true);
          }
          return false;
        }, wasAffixed, affixClass, affixOptions, elem);
      });
    } else if(affixTo === 'right') {
      trigger= true; // need to trigger scroll event
      scrollHandler= ScrollSpy.onXScroll(function(pos, delta, data) {
        wasAffixed= isAffixed;
        affixFn(function(rect) {
          if(isAffixed) {
            // we are still affixed if we have not scrolled passed
            isAffixed= (affixedPos >= pos);
            return isAffixed;
          } else if(rect.right >= data.width) {
            // lets affix
            // first event when at left is a special case,
            // calculate affixed pos differently
            if(ScrollSpy.isForced && pos === 0)
              affixedPos= pos + rect.right - data.width - rect.width;
            else
              affixedPos= pos + rect.right - data.width;
            return (isAffixed= true);
          }
          // not affixed
          return false;
        }, wasAffixed, affixClass, affixOptions, elem);
      });
    }
    if(trigger) {
      ScrollSpy.trigger();
    }
  };

  return {
    restrict: 'A',
    scope: {
    	affix: '@',
      affixClass: '@',
      affixOptions: '@'
    },
    link: function(scope, elem, attrs, controller) {
      // call linking function, supply default values if needed
      scope.affix= scope.affix || 'top';
      scope.affixClass= scope.affixClass || 'affix';
      scope.affixOptions = scope.affixOptions ? scope.$eval(scope.affixOptions) : {};
      linkFn(scope.affix, scope.affixClass, scope.affixOptions, elem);
      scope.$on('destroy', function() {
        ScrollSpy.removeHandler(scrollHandler);
      });
    }
  };
});
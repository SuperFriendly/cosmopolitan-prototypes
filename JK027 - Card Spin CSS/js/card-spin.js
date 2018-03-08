function cardSpinInit(element) {
  var EASEBOTH = new Ease(BezierEasing(.28, 0, .2, 1))

  var timeline = { cursor: 0 }

  element.image = element.querySelector("img")
  element.tween = new TweenLite(timeline, 3, { 
    cursor: 1,
    ease: EASEBOTH,
    onComplete: function() {
      element.tween.reverse()
    },
    onReverseComplete: function() {
      element.tween.restart()
    },
    onUpdate: function(timeline) {
      var x = linearMap(timeline.cursor, 0, 1, 1, -1)
      element.style.transform = 'scaleX(' + x + ') translate3d(0,0,0)'
    },
    onUpdateParams: [timeline]
  })
}

function cardSpinInitAll() {
  var elements = document.querySelectorAll("[data-card-spin]")
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i]
    cardSpinInit(element)
  }
}

cardSpinInitAll()
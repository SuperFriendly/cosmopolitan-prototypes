PIXI.utils.skipHello()

function cardSpinInit(element) {
  var EASEBOTH = new Ease(BezierEasing(.28, 0, .2, 1))

  element.image = element.querySelector("img")

  element.app = new PIXI.Application({ width: 1, height: 1, transparent: true });
  element.pixiContainer = new PIXI.Container()
  element.pixiImage = PIXI.Sprite.fromImage(element.image.src)
  element.pixiImage.anchor.x = 0.5
  element.pixelRatio = 1
  element.image.style.display = "none"
  element.time = 0

  element.pixiContainer.addChild(element.pixiImage)
  element.app.stage.addChild(element.pixiContainer)
  element.appendChild(element.app.view)
  
  element.tween = false
  element.tween = new TweenLite(element.pixiContainer.scale, 3, { 
    x: -1,
    ease: EASEBOTH,
    onComplete: function() {
      element.tween.reverse()
    },
    onReverseComplete: function() {
      element.tween.restart()
    }
  })

  window.addEventListener("resize", cardSpinWindowResized.bind(element))
  cardSpinUpdateSizeAndPosition(element)
}

function cardSpinWindowResized() {
  var element = this

  if (element.windowDebounce) {
    return
  }

  element.windowDebounce = true
  requestAnimationFrame(function () {
    element.windowDebounce = false
    cardSpinDebouncedWindowResized(element)
  })
}

function cardSpinDebouncedWindowResized(element) {    
  cardSpinUpdateSizeAndPosition(element)
}

function cardSpinUpdateSizeAndPosition(element) {
  var elementWidth = element.offsetWidth
  var elementHeight = element.offsetHeight

  element.app.renderer.resize(elementWidth, elementHeight)

  element.image.style.display = "inline-block"

  var imageWidth = element.image.offsetWidth
  var imageHeight = element.image.offsetHeight

  element.image.style.display = "none"

  var scale

  if(elementWidth > imageWidth) {
    scale = imageWidth / elementWidth
  }
  else {
    scale = elementWidth / imageWidth
  }

  element.pixiImage.width = imageWidth * scale
  element.pixiImage.height = imageHeight * scale

  var x = -(element.pixiImage.width - elementWidth) / 2
  var y = -(element.pixiImage.height - elementHeight) / 2

  element.pixiImage.position.x = x
  element.pixiImage.position.y = y

  element.pixiContainer.position.x = element.pixiImage.width / 2
}

function cardSpinInitAll() {
  var elements = document.querySelectorAll("[data-card-spin]")
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i]
    cardSpinInit(element)
  }
}

cardSpinInitAll()
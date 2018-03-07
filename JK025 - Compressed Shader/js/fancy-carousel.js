/*
 * Fancy Carousel
 * 
 * The Fancy Carousel uses WebGL to create an atmospheric gallery custom for the Cosmopolitan.
 * It falls back to simple canvas fade in / fade out for browsers without WebGL.
 *
 * To use add data-fancy-carousel to any element. The element must have a containing div with a data-fancy-carousel-images element on it.
 * Optionals:
 * data-fancy-carousel-zoomblur="true"                  :: Enables Zoom Blur
 * data-fancy-carousel-ripple="true"                    :: Enable Ripple
 * data-fancy-carousel-counter-selector=".counter"      :: Pass a selector string for an element to add current and total items to it.
 * data-fancy-carousel-next-prev-nav-selector=".nav"    :: Pass a selector string for an element to add prev/next arrows.
 *
 */

// shaders
PIXI.utils.skipHello()

var rippleShader = "precision mediump float;varying vec2 vTextureCoord;varying vec4 vColor;uniform sampler2D uSampler;uniform float iTime;uniform vec2 iResolution;void main(void){    vec2 uv = vTextureCoord.xy;    float adjustedTime = iTime * 0.005;        uv.x += (sin((uv.y + (adjustedTime * 0.02)) * 25.0) * 0.0019) + (sin((uv.y + (adjustedTime * 0.1)) * 15.0) * 0.002);    uv.y += (cos((uv.y + (adjustedTime * 0.04)) * 15.0) * 0.0069) + (cos((uv.y + (adjustedTime * 0.1)) * 10.0) * 0.002);        vec4 fg = texture2D(uSampler, uv);    gl_FragColor = fg;}"

var zoomBlurShader = "varying vec2 vTextureCoord;uniform sampler2D uSampler;uniform vec4 filterArea;uniform vec2 uCenter;uniform float uStrength;uniform float uInnerRadius;uniform float uRadius;const float MAX_KERNEL_SIZE = 32.0;float random(vec3 scale, float seed) {    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);}void main() {        float minGradient = uInnerRadius * 0.3;    float innerRadius = (uInnerRadius + minGradient * 0.5) / filterArea.x;        float gradient = uRadius * 0.3;    float radius = (uRadius - gradient * 0.5) / filterArea.x;        float countLimit = MAX_KERNEL_SIZE;        vec2 dir = vec2(uCenter.xy / filterArea.xy - vTextureCoord);    float dist = length(vec2(dir.x, dir.y * filterArea.y / filterArea.x));        float strength = uStrength;        float delta = 0.0;    float gap;    if (dist < innerRadius) {        delta = innerRadius - dist;        gap = minGradient;    } else if (radius >= 0.0 && dist > radius) {    delta = dist - radius;    gap = gradient;}if (delta > 0.0) {    float normalCount = gap / filterArea.x;    delta = (normalCount - delta) / normalCount;    countLimit *= delta;    strength *= delta;    if (countLimit < 1.0)    {        gl_FragColor = texture2D(uSampler, vTextureCoord);        return;    }}float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);float total = 0.0;vec4 color = vec4(0.0);dir *= strength;for (float t = 0.0; t < MAX_KERNEL_SIZE; t++) {    float percent = (t + offset) / MAX_KERNEL_SIZE;    float weight = 4.0 * (percent - percent * percent);    vec2 p = vTextureCoord + dir * percent;    vec4 sample = texture2D(uSampler, p);        color += sample * weight;    total += weight;        if (t > countLimit){        break;    }}color /= total;color.rgb /= color.a + 0.00001;gl_FragColor = color;}"

console.log(zoomBlurShader);
//

function fancyCarouselInit(element) {
    element.imageElements = element.querySelectorAll("[data-fancy-carousel-images] picture")
    element.totalItems = element.imageElements.length
    element.app = new PIXI.Application({ width: 1, height: 1 });
    element.isWebGL = (element.app.renderer instanceof PIXI.WebGLRenderer)
    element.pixelRatio = 1
    element.shouldMatchMedia = true
    element.currentIndex = 0
    element.tweens = {}
    element.time = 0

    fancyCarouselInitCounter(element)
    fancyCarouselInitNextPrev(element)
    fancyCarouselUpdateSizeAndPosition(element)

    if (element.totalItems == 0) {
        element.shouldMatchMedia = false
        element.imageElements = element.querySelectorAll("[data-fancy-carousel-images] img")
        element.totalItems = element.imageElements.length
    }

    if (element.totalItems == 0) {
        console.warn("Initializing a carousel with no items in it. Exiting.")
        return
    }


    if (element.totalItems == 1) {
        element.classList.add("js-fancy-carousel-is-single-item")
        if (element.counterElement) {
            element.counterElement.classList.add("js-fancy-carousel-is-single-item")
        }

        if (element.nextPrevElement) {
            element.nextPrevElement.classList.add("js-fancy-carousel-is-single-item")
        }
    }
    else {
        element.addEventListener("click", fancyCarouselNextItemClick.bind(element), false)
    }

    element.pixiImageContainer = new PIXI.Container();
    element.app.stage.addChild(element.pixiImageContainer)
    element.appendChild(element.app.view)
    window.addEventListener("resize", fancyCarouselWindowResized.bind(element))

    if (element.isWebGL) {
        element.rippleFilter = new PIXI.Filter(null, rippleShader)

        element.alphaFilter = new PIXI.filters.AlphaFilter(0)

        element.zoomBlurFilter = new PIXI.Filter(null, zoomBlurShader)
        element.zoomBlurFilter.uniforms.uStrength = 0.5;
        element.zoomBlurFilter.uniforms.uRadius = -1;

        element.pixiImageContainer.filters = [element.alphaFilter]

        if (element.dataset.fancyCarouselZoomblur && !fancyCarouselIsMobileOrTablet()) {
            element.pixiImageContainer.filters = [element.zoomBlurFilter, element.alphaFilter]
        }

        element.app.ticker.add(function (delta) {
            element.rippleFilter.uniforms.iTime = element.time;

            element.zoomBlurFilter.uniforms.uInnerRadius = element.radius - (Math.sin(element.time * 0.02) * 25)
            element.time += delta
        })
    }

    Promise.resolve()
        .then(function () {
            return fancyCarouselLoadImage(element)
        })
        .then(function () {
            return fancyCarouselUpdateContainer(element)
        })
        .then(function () {
            return fancyCarouselTween(element, { out: false })
        })
        .catch(function (err) {
            console.error(err)
        })

    if (element.totalItems > 1) {
        fancyCarouselStartTimer(element)
    }
}

function fancyCarouselUpdateContainer(element) {
    element.hasImageLoaded = true

    element.pixiImageContainer.removeChildren()
    element.pixiImageContainer.addChild(element.pixiBgImage)
    element.pixiImageContainer.addChild(element.pixiImage)
    
    if (element.isWebGL && element.dataset.fancyCarouselRipple) {
        element.pixiImage.filters = [element.rippleFilter]
    }

    fancyCarouselUpdateSizeAndPosition(element)

    return Promise.resolve()
}

function fancyCarouselIsMobileOrTablet() {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;    
}

function fancyCarouselInitCounter(element) {
    var counterElement = document.querySelector(element.dataset.fancyCarouselCounterSelector)
    if(!counterElement) {
        return
    }

    var counter = document.createElement("div")
    counter.classList.add('js-fancy-carousel-counter')
    
    var current = document.createElement("span")
    current.classList.add('js-fancy-carousel-counter-current')
    counter.appendChild(current)

    var total = document.createElement("span")
    total.classList.add('js-fancy-carousel-counter-total')
    counter.appendChild(total)

    counterElement.appendChild(counter)

    element.currentElement = current
    element.totalElement = total
    element.counterElement = counterElement

    fancyCarouselUpdateCounter(element)
    fancyCarouselUpdateTotalItems(element)
}

function fancyCarouselClearTimer(element) {
    if(element.timer) {
        clearTimeout(element.timer)
    }

    element.timer = null
}

function fancyCarouselStartTimer(element) {
    fancyCarouselClearTimer(element)
    element.timer = setTimeout(fancyCarouselTimerCompleted.bind(element), 5000)
}

function fancyCarouselTimerCompleted() {
    var element = this

    fancyCarouselClearTimer(element.timer)
    fancyCarouselNextItem(element)
    fancyCarouselStartTimer(element)
}

function fancyCarouselInitNextPrev(element) {
    var nextPrevElement = document.querySelector(element.dataset.fancyCarouselNextPrevNavSelector)
    if(!nextPrevElement) {
        return
    }

    var prevButton = document.createElement("div")
    prevButton.classList.add("js-fancy-carousel-nav-prev")
    prevButton.classList.add("js-fancy-carousel-nav-button")
    prevButton.addEventListener("click", fancyCarouselPrevItemClick.bind(element))

    var nextButton = document.createElement("div")
    nextButton.classList.add("js-fancy-carousel-nav-next")
    nextButton.classList.add("js-fancy-carousel-nav-button")
    nextButton.addEventListener("click", fancyCarouselNextItemClick.bind(element))

    nextPrevElement.appendChild(prevButton)
    nextPrevElement.appendChild(nextButton)

    element.nextPrevElement = nextPrevElement
}

function fancyCarouselUpdateCounter(element) {
    if(!element.currentElement) {
        return
    }

    var num = element.currentIndex + 1;
    var paddedNum = "000000000" + num;    
    element.currentElement.innerText = paddedNum.substr(paddedNum.length - 2)
}

function fancyCarouselUpdateTotalItems(element) {
    if(!element.totalElement) {
        return
    }

    var num = element.totalItems;
    var paddedNum = "000000000" + num;
    element.totalElement.innerText = paddedNum.substr(paddedNum.length - 2)    
}

function fancyCarouselGetImagePath(element) {
    element.pixelRatio = 1

    if(!element.shouldMatchMedia) {
        return element.imageElements[element.currentIndex].src
    }

    var sources = element.imageElements[element.currentIndex].querySelectorAll("source")
    for(var i=0;i<sources.length;i++) {
        var mediaQuery = sources[i].getAttribute('media')
        var parts = mediaQuery.split('min-resolution:')

        if(parts[1]) {
            var regex = /([0-9.])/g
            pr = parseFloat( parts[1].match(regex).join('') )
        }
                
        if(window.matchMedia(mediaQuery).matches) {
            element.pixelRatio = pr
            return sources[i].getAttribute('srcset')
        }
    }

    // if we don't match
    return element.imageElements[element.currentIndex].querySelector('img').src
}

function fancyCarouselLoadImage(element) {
    return new Promise(function(resolve, reject) {
        var src = fancyCarouselGetImagePath(element)

        // we're attempting to load the same image, so we'll skip all this
        // however we won't error out just in case we need to animate back in or something.
        if (element.lastImagePath == src) {
            resolve()
            return
        }

        element.lastImagePath = src

        var loader = new PIXI.loaders.Loader()
        var options = {
            loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
            xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB           
        }

        loader.add('image', src, options)

        loader.load(function(loader, resources) {
            element.pixiImage = new PIXI.Sprite(resources.image.texture)
            element.pixiBgImage = new PIXI.Sprite(resources.image.texture)

            resolve()
        })
    })
}

function fancyCarouselWindowResized() {
    var element = this

    if (element.windowDebounce) {
        return
    }

    element.windowDebounce = true
    requestAnimationFrame(function() {
        element.windowDebounce = false
        fancyCarouselDebouncedWindowResized(element)
    })
}

function fancyCarouselDebouncedWindowResized(element) {    
    Promise.resolve()
    .then(function() { return fancyCarouselLoadImage(element) })
    .then(function() { fancyCarouselUpdateContainer(element) })
}

function fancyCarouselUpdateSizeAndPosition(element) {
    var elementWidth = element.offsetWidth
    var elementHeight = element.offsetHeight

    element.app.renderer.resize(elementWidth, elementHeight)

    if(!element.hasImageLoaded) {
        return
    }
    
    var imageWidth = element.pixiImage.texture.orig.width / element.pixelRatio
    var imageHeight = element.pixiImage.texture.orig.height / element.pixelRatio

    var scaleX = elementWidth / imageWidth
    var scaleY = elementHeight / imageHeight
    
    var scale = Math.max(scaleX, scaleY)    
    
    element.width = imageWidth * scale
    element.height = imageHeight * scale
    
    element.pixiImage.width = element.width
    element.pixiImage.height = element.height
    element.pixiBgImage.width = element.width
    element.pixiBgImage.height = element.height
    
    var x = -(element.width - elementWidth) / 2
    var y = -(element.height - elementHeight) / 2
    
    element.pixiImage.position.x = x
    element.pixiImage.position.y = y
    element.pixiBgImage.position.x = x
    element.pixiBgImage.position.y = y
    
    element.radius = Math.max(elementWidth, elementHeight) / 2

    if(element.isWebGL) {
        element.rippleFilter.uniforms.iResolution = [element.width, element.height]
        element.zoomBlurFilter.uniforms.uCenter = [(element.width / 2) + x, (element.height / 2) + y];
        element.zoomBlurFilter.uniforms.uInnerRadius = element.radius;        
    }
}

function fancyCarouselNextItemClick(element) {
    var element = this

    fancyCarouselClearTimer(element)
    fancyCarouselNextItem(element)
}

function fancyCarouselPrevItemClick(element) {
    var element = this

    fancyCarouselClearTimer(element)
    fancyCarouselPrevItem(element)
}

function fancyCarouselNextItem(element) {
    fancyCarouselGoToItem(element, element.currentIndex + 1)    
}

function fancyCarouselPrevItem(element) {
    fancyCarouselGoToItem(element, element.currentIndex - 1)
}

function fancyCarouselGoToItem(element, atIndex) {
    if(atIndex < 0) {
        atIndex = element.totalItems-1
    }

    if(atIndex >= element.totalItems) {
        atIndex = 0
    }

    element.currentIndex = atIndex

    Promise.resolve()
    .then(function() {
        return fancyCarouselTween(element, { out: true })
    })
    .then(function() {
        return fancyCarouselLoadImage(element)
    })
    .then(function() {
        return fancyCarouselUpdateContainer(element)
    })
    .then(function() {
        return fancyCarouselTween(element, { out: false })
    })
    .catch(function(err) {
        
    })
}

function fancyCarouselTween(element, params) {
    return new Promise(function(resolve, reject) {
        isIn = params.out == false

        for (var key in element.tweens) {
            element.tweens[key].kill()
        }

        if (element.isWebGL) {
            element.tweens["alpha"] = new TweenLite(element.alphaFilter, 1, {
                alpha: isIn ? 1 : 0,
                delay: 0.125,
                onComplete: function () {
                    fancyCarouselUpdateCounter(element)
                    resolve()
                }
            })

            element.tweens["zoomBlur"] = new TweenLite(element.zoomBlurFilter.uniforms, 1, {
                uStrength: isIn ? 0.5 : 1
            })
        }
        else {
            element.tweens["alpha"] = new TweenLite(element.pixiImageContainer, 1, { alpha: isIn ? 1 : 0 })
        }    
    })
}

function fancyCarouselInitAll() {
    var fancyCarouselElements = document.querySelectorAll("[data-fancy-carousel]")
    for (var i = 0; i < fancyCarouselElements.length; i++) {
        var element = fancyCarouselElements[i]
        fancyCarouselInit(element)    
    }    
}

fancyCarouselInitAll()


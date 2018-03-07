// shaders
PIXI.utils.skipHello()

var rippleShader = `
precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;
uniform float iTime;
uniform vec2 iResolution;

void main(void)
{
    vec2 uv = vTextureCoord.xy;
    float adjustedTime = iTime * 0.005;
    
    uv.x += (sin((uv.y + (adjustedTime * 0.02)) * 25.0) * 0.0019) + (sin((uv.y + (adjustedTime * 0.1)) * 15.0) * 0.002);
    uv.y += (cos((uv.y + (adjustedTime * 0.04)) * 15.0) * 0.0069) + (cos((uv.y + (adjustedTime * 0.1)) * 10.0) * 0.002);
    
    vec4 fg = texture2D(uSampler, uv);
    gl_FragColor = fg;
}
`;

var zoomBlurShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterArea;

uniform vec2 uCenter;
uniform float uStrength;
uniform float uInnerRadius;
uniform float uRadius;

const float MAX_KERNEL_SIZE = 32.0;

float random(vec3 scale, float seed) {
    // use the fragment position for a different seed per-pixel
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

void main() {
    
    float minGradient = uInnerRadius * 0.3;
    float innerRadius = (uInnerRadius + minGradient * 0.5) / filterArea.x;
    
    float gradient = uRadius * 0.3;
    float radius = (uRadius - gradient * 0.5) / filterArea.x;
    
    float countLimit = MAX_KERNEL_SIZE;
    
    vec2 dir = vec2(uCenter.xy / filterArea.xy - vTextureCoord);
    float dist = length(vec2(dir.x, dir.y * filterArea.y / filterArea.x));
    
    float strength = uStrength;
    
    float delta = 0.0;
    float gap;
    if (dist < innerRadius) {
        delta = innerRadius - dist;
        gap = minGradient;
    } else if (radius >= 0.0 && dist > radius) { // radius < 0 means it's infinity
    delta = dist - radius;
    gap = gradient;
}

if (delta > 0.0) {
    float normalCount = gap / filterArea.x;
    delta = (normalCount - delta) / normalCount;
    countLimit *= delta;
    strength *= delta;
    if (countLimit < 1.0)
    {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
        return;
    }
}

// randomize the lookup values to hide the fixed number of samples
float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

float total = 0.0;
vec4 color = vec4(0.0);

dir *= strength;

for (float t = 0.0; t < MAX_KERNEL_SIZE; t++) {
    float percent = (t + offset) / MAX_KERNEL_SIZE;
    float weight = 4.0 * (percent - percent * percent);
    vec2 p = vTextureCoord + dir * percent;
    vec4 sample = texture2D(uSampler, p);
    
    // switch to pre-multiplied alpha to correctly blur transparent images
    // sample.rgb *= sample.a;
    
    color += sample * weight;
    total += weight;
    
    if (t > countLimit){
        break;
    }
}

color /= total;
// switch back from pre-multiplied alpha
color.rgb /= color.a + 0.00001;

gl_FragColor = color;
}
`;
//

var element = document.querySelector("[data-canvas]")
var width
var height
var isIn = true
var image
var bgImage
var container
var rippleFilter
var zoomBlurFilter
var alphaFilter
var radius
var app = new PIXI.Application({ width: 1, height: 1 });
var isWebGL = (app.renderer instanceof PIXI.WebGLRenderer)
var tweens = {}
var time = 0
var hasImageLoaded = false
var currentIndex = 0
var imageElements = []
var shouldMatchMedia = true
var lastImagePath
var windowDebounce
var pixelRatio = 1
var timer

function updateContainer() {
    hasImageLoaded = true

    container.removeChildren()
    container.addChild(bgImage)
    container.addChild(image)
    
    if (isWebGL && element.dataset.ripple) {
        image.filters = [rippleFilter]
    }

    updateSizeAndPosition()

    return Promise.resolve()
}

function isMobileOrTablet() {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;    
}

function init() {
    imageElements = element.querySelectorAll("[data-images] picture")
    totalItems = imageElements.length
    initCounter()
    initNextPrev()
    updateSizeAndPosition()

    if(totalItems === 0) {
        shouldMatchMedia = false
        imageElements = element.querySelectorAll("img")
        totalItems = imageElements.length
    }

    if(totalItems == 0) {
        console.warn("Initializing a carousel with no items in it. Exiting.")
        return
    }

    
    if(totalItems == 1) {
        element.classList.add("js-carousel-is-single-item")
        if(element.counterElement) {
            element.counterElement.classList.add("js-carousel-is-single-item")
        }

        if(element.nextPrevElement) {
            element.nextPrevElement.classList.add("js-carousel-is-single-item")
        }
    }
    else {
        element.addEventListener("click", nextItemClick, false)
    }

    container = new PIXI.Container();
    app.stage.addChild(container)
    element.appendChild(app.view)

    if (isWebGL) {
        rippleFilter = new PIXI.Filter(null, rippleShader)

        alphaFilter = new PIXI.filters.AlphaFilter(0)

        zoomBlurFilter = new PIXI.Filter(null, zoomBlurShader)
        zoomBlurFilter.uniforms.uStrength = 0.5;
        zoomBlurFilter.uniforms.uRadius = -1;

        container.filters = [alphaFilter]

        if (element.dataset.zoomblur && !isMobileOrTablet()) {
            container.filters = [zoomBlurFilter, alphaFilter]
        }

        app.ticker.add(function (delta) {
            rippleFilter.uniforms.iTime = time;

            zoomBlurFilter.uniforms.uInnerRadius = radius - (Math.sin(time * 0.02) * 25)
            time += delta
        })
    }

    Promise.resolve()
    .then(function() {
        return loadImage()
    })
    .then(function() {
        return updateContainer()
    })
    .then(function() {
        return tween({ out: false })
    })
    .catch(function(err) {
        console.error(err)
    })

    if(totalItems > 1) {
        startTimer()
    }
}

function initCounter() {
    var counterElement = document.querySelector(element.dataset.counterSelector)
    if(!counterElement) {
        return
    }

    var counter = document.createElement("div")
    counter.classList.add('js-carousel-counter')
    
    var current = document.createElement("span")
    current.classList.add('js-carousel-counter-current')
    counter.appendChild(current)

    var total = document.createElement("span")
    total.classList.add('js-carousel-counter-total')
    counter.appendChild(total)

    counterElement.appendChild(counter)

    element.currentElement = current
    element.totalElement = total
    element.counterElement = counterElement

    updateCounter()
    updateTotalItems()
}

function clearTimer() {
    if(timer) {
        clearTimeout(timer)
    }

    timer = null
}

function startTimer() {
    clearTimer(timer)
    timer = setTimeout(timerCompleted, 5000)
}

function timerCompleted() {
    clearTimer(timer)
    nextItem()
    startTimer()
}

function initNextPrev() {
    var nextPrevElement = document.querySelector(element.dataset.nextPrevNavSelector)
    if(!nextPrevElement) {
        return
    }

    var prevButton = document.createElement("div")
    prevButton.classList.add("js-carousel-nav-prev")
    prevButton.classList.add("js-carousel-nav-button")
    prevButton.addEventListener("click", prevItemClick)

    var nextButton = document.createElement("div")
    nextButton.classList.add("js-carousel-nav-next")
    nextButton.classList.add("js-carousel-nav-button")
    nextButton.addEventListener("click", nextItemClick)

    nextPrevElement.appendChild(prevButton)
    nextPrevElement.appendChild(nextButton)

    element.nextPrevElement = nextPrevElement
}

function updateCounter() {
    if(!element.currentElement) {
        return
    }

    var num = currentIndex + 1;
    var paddedNum = "000000000" + num;    
    element.currentElement.innerText = paddedNum.substr(paddedNum.length - 2)
}

function updateTotalItems() {
    if(!element.totalElement) {
        return
    }

    var num = totalItems;
    var paddedNum = "000000000" + num;
    element.totalElement.innerText = paddedNum.substr(paddedNum.length - 2)    
}

function getImagePath() {
    pixelRatio = 1

    if(!shouldMatchMedia) {
        return imageElements[currentIndex].src
    }

    var sources = imageElements[currentIndex].querySelectorAll("source")
    for(var i=0;i<sources.length;i++) {
        var mediaQuery = sources[i].getAttribute('media')
        var parts = mediaQuery.split('min-resolution:')

        if(parts[1]) {
            var regex = /([0-9.])/g
            pr = parseFloat( parts[1].match(regex).join('') )
        }
                
        if(window.matchMedia(mediaQuery).matches) {
            pixelRatio = pr
            return sources[i].getAttribute('srcset')
        }
    }

    // if we don't match
    return imageElements[currentIndex].querySelector('img').src
}

function loadImage() {
    return new Promise(function(resolve, reject) {
        var src = getImagePath()

        // we're attempting to load the same image, so we'll skip all this
        // however we won't error out just in case we need to animate back in or something.
        if (lastImagePath == src) {
            resolve()
            return
        }

        lastImagePath = src

        var loader = new PIXI.loaders.Loader()
        var options = {
            loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
            xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB           
        }

        loader.add('image', src, options)

        loader.load(function(loader, resources) {
            image = new PIXI.Sprite(resources.image.texture)
            bgImage = new PIXI.Sprite(resources.image.texture)

            resolve()
        })
    })
}

function windowResized() {
    if (windowDebounce) {
        return
    }

    windowDebounce = true
    requestAnimationFrame(function() {
        windowDebounce = false
        debouncedWindowResize()
    })
}

function debouncedWindowResize() {    
    Promise.resolve()
    .then(function() { return loadImage() })
    .then(function() { updateContainer() })
}

function updateSizeAndPosition() {
    var elementWidth = element.offsetWidth
    var elementHeight = element.offsetHeight
    app.renderer.resize(elementWidth, elementHeight)

    if(!hasImageLoaded) {
        return
    }
    
    var imageWidth = image.texture.orig.width / pixelRatio
    var imageHeight = image.texture.orig.height / pixelRatio

    var scaleX = elementWidth / imageWidth
    var scaleY = elementHeight / imageHeight
    
    var scale = Math.max(scaleX, scaleY)    
    
    width = imageWidth * scale
    height = imageHeight * scale
    
    image.width = width
    image.height = height
    bgImage.width = width
    bgImage.height = height
    
    var x = -(width - elementWidth) / 2
    var y = -(height - elementHeight) / 2
    
    image.position.x = x
    image.position.y = y
    bgImage.position.x = x
    bgImage.position.y = y
    
    radius = Math.max(elementWidth, elementHeight) / 2

    if(isWebGL) {
        rippleFilter.uniforms.iResolution = [width, height]
        zoomBlurFilter.uniforms.uCenter = [(width  / 2 ) + x, (height / 2) + y];
        zoomBlurFilter.uniforms.uInnerRadius = radius;        
    }
}

function nextItemClick() {
    clearTimer()
    nextItem()
}

function prevItemClick() {
    clearTimer()
    prevItem()
}

function nextItem() {
    goToItem(currentIndex + 1)    
}

function prevItem() {
    goToItem(currentIndex - 1)
}

function goToItem(atIndex) {
    if(atIndex < 0) {
        atIndex = totalItems-1
    }

    if(atIndex >= totalItems) {
        atIndex = 0
    }

    currentIndex = atIndex

    Promise.resolve()
    .then(function() {
        return tween({ out: true })
    })
    .then(function() {
        return loadImage()
    })
    .then(function() {
        return updateContainer()
    })
    .then(function() {
        return tween({ out: false })
    })
    .catch(function(err) {
        
    })
}

function tween(params) {
    return new Promise(function(resolve, reject) {
        isIn = params.out == false

        for (var key in tweens) {
            tweens[key].kill()
        }

        if (isWebGL) {
            tweens["alpha"] = new TweenLite(alphaFilter, 1, {
                alpha: isIn ? 1 : 0,
                delay: 0.125,
                onComplete: function () {
                    updateCounter()
                    resolve()
                }
            })

            tweens["zoomBlur"] = new TweenLite(zoomBlurFilter.uniforms, 1, {
                uStrength: isIn ? 0.5 : 1
            })
        }
        else {
            tweens["alpha"] = new TweenLite(container, 1, { alpha: isIn ? 1 : 0 })
        }    
    })
}

window.addEventListener("resize", () => { windowResized() })
init()
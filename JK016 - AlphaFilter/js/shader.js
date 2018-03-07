var element = document.querySelector("[data-canvas]")

var width = element.offsetWidth
var height = element.offsetHeight

var rippleEffect = `
precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;
uniform float iTime;
uniform vec2 iResolution;

void main(void)
{
   vec2 uv = vTextureCoord.xy;
   float adjustedTime = iTime * 0.003;
   
   uv.x += (sin((uv.y + (adjustedTime * 0.02)) * 25.0) * 0.0019) + (sin((uv.y + (adjustedTime * 0.1)) * 15.0) * 0.002);
   uv.y += (cos((uv.y + (adjustedTime * 0.04)) * 25.0) * 0.0069) + (cos((uv.y + (adjustedTime * 0.1)) * 10.0) * 0.002);

   vec4 fg = texture2D(uSampler, uv);
   gl_FragColor = fg;
}
`;

PIXI.utils.skipHello()


var app = new PIXI.Application({ width: width, height: height });

element.appendChild(app.view)

var image = PIXI.Sprite.fromImage(document.querySelector("img").src)
var bgImage = PIXI.Sprite.fromImage(document.querySelector("img").src)


let container = new PIXI.Container();

image.width = width
image.height = height
bgImage.width = width
bgImage.height = height
container.addChild(bgImage)
container.addChild(image)
app.stage.addChild(container)

var rippleFilter = new PIXI.Filter(null, rippleEffect)
rippleFilter.uniforms.iResolution = [width, height]

var alphaFilter = new PIXI.filters.AlphaFilter(1)
alphaFilter.isIn = true;

image.filters = [rippleFilter]
container.filters = [alphaFilter]

var tween;

var time = 0
app.ticker.add(function(delta) {
  rippleFilter.uniforms.iTime = time;
  time += delta
})

window.addEventListener("keyup", function() {
  alphaFilter.isIn = !alphaFilter.isIn;
  if(tween) {
    tween.kill()
  }

  tween = new TweenLite(alphaFilter, 1, { alpha: alphaFilter.isIn ? 1 : 0 })  
})
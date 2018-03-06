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
   
   uv.x += (sin((uv.y + (iTime * 0.02)) * 25.0) * 0.0019) + (sin((uv.y + (iTime * 0.1)) * 15.0) * 0.002);
   uv.y += (cos((uv.y + (iTime * 0.04)) * 25.0) * 0.0069) + (cos((uv.y + (iTime * 0.1)) * 10.0) * 0.002);

   vec4 fg = texture2D(uSampler, uv);
   gl_FragColor = fg;
}
`;

PIXI.utils.skipHello()


var app = new PIXI.Application({ width: width, height: height });

element.appendChild(app.view)

var image = PIXI.Sprite.fromImage(document.querySelector("img").src)
var bgImage = PIXI.Sprite.fromImage(document.querySelector("img").src)

image.width = width
image.height = height
bgImage.width = width
bgImage.height = height
app.stage.addChild(bgImage)
app.stage.addChild(image)
var filter = new PIXI.Filter(null, rippleEffect)
image.filters = [filter]

app.ticker.add(function(delta) {
  filter.uniforms.iResolution = [width, height]
  filter.uniforms.iTime += delta * 0.004;
})
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;

  uv.y += (cos((uv.y + (iTime * 0.04)) * 45.0) * 0.0519) +
		(cos((uv.y + (iTime * 0.1)) * 10.0) * 0.002);

	uv.x += (sin((uv.y + (iTime * 0.07)) * 15.0) * 0.0029) +
		(sin((uv.y + (iTime * 0.1)) * 15.0) * 0.002);
		

	vec4 texColor = texture(iChannel0,uv);
	fragColor = texColor;
}
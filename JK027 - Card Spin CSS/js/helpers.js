function linearMap(value, inputMin, inputMax, outputMin, outputMax, clamp) {
  if (Math.abs(inputMin - inputMax) < Number.EPSILON) {
    return outputMin;
  }

  var outVal = ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);

  if (clamp) {
    if (outputMax < outputMin) {
      if (outVal < outputMax) outVal = outputMax;
      else if (outVal > outputMin) outVal = outputMin;
    }
    else {
      if (outVal > outputMax) outVal = outputMax;
      else if (outVal < outputMin) outVal = outputMin;
    }
  }

  return outVal;
}
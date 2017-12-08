var datePickers = document.querySelectorAll("[data-date-picker]")

function datePickerVisibilityClassString() {
	return "u-is-vishidden"
}

function datePickerBuildCalendar() {
	var element = document.createElement("div")
	element.innerHTML = "This is a test."
	element.classList.add("js-date-picker-calendar")

	return element
}

function handleDatePickerInputClick(evt) {
	evt.preventDefault()

	var datePicker = this
	var calendar = this.querySelector(".js-date-picker-calendar")

	datePickerToggleCalendar(calendar)

	return false
}

function datePickerToggleCalendar(calendar) {
	calendar.classList.toggle( datePickerVisibilityClassString() )

	// todo: reset if we need
}

// init

for (var i = 0; i < datePickers.length; i++) {
	var datePicker = datePickers[i]

	var endElement = datePicker.querySelector(".end-date")
	var startElement = datePicker.querySelector(".start-date")

	var input = startElement.querySelector("input").cloneNode(true)
	input.setAttribute("type", "text")
	input.classList.add("js-date-picker-text-input")

	var calendar = datePickerBuildCalendar()

	endElement.classList.add( datePickerVisibilityClassString() )
	startElement.classList.add( datePickerVisibilityClassString() )
	calendar.classList.add( datePickerVisibilityClassString() )

	input.addEventListener("click", handleDatePickerInputClick.bind(datePicker), false)

	datePicker.appendChild(input)
	datePicker.appendChild(calendar)
}
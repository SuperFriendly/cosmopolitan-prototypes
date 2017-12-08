var datePickers = document.querySelectorAll("[data-date-picker]")

function datePickerVisibilityClassString() {
	return "u-is-vishidden"
}

function datePickerGetDateConstraints(datePicker) {
	var minDate = datePicker.dataset.minDate
	var maxDate = datePicker.dataset.maxDate

	if(!minDate) {
		minDate = startElement.querySelector("input").getAttribute("min")
		datePicker.dataset.minDate = minDate
	}

	if(!maxDate) {
		maxDate = endElement.querySelector("input").getAttribute("max")
		datePicker.dataset.maxDate = maxDate
	}

	return {
		min: new Date(minDate),
		max: new Date(maxDate)
	}
}

function datePickerBuildCalendar(datePicker) {
	var rootElement = document.createElement("div")
	rootElement.classList.add("js-date-picker-calendar")

	var constraints = datePickerGetDateConstraints(datePicker)

	var yearsBetween = constraints.max.getFullYear() - constraints.min.getFullYear()
	var monthsBetween = constraints.max.getMonth() - constraints.min.getMonth()

	var totalMonthsToDisplay = monthsBetween + (yearsBetween * 12)
	// console.log("Total Months to display :: ", totalMonthsToDisplay)

	var headerElement = document.createElement("div")
	headerElement.classList.add("js-date-picker-header")

	var dayLabels = ["S", "M", "T", "W", "Th", "F", "S"]
	for(var i=0;i<dayLabels.length;i++) {
		var headerDayElement = document.createElement("span")
		headerDayElement.classList.add("js-date-picker-header-day")
		headerDayElement.innerText = dayLabels[i]

		headerElement.appendChild(headerDayElement)
	}
	rootElement.appendChild(headerElement)

	var currentMonth = new Date(constraints.min.getTime())
	currentMonth.setDate(1)
	currentMonth.setHours(0)
	currentMonth.setMinutes(0)
	currentMonth.setSeconds(0)
	currentMonth.setMilliseconds(0)

	var today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setSeconds(0)
	today.setMilliseconds(0)

	for(var i=0;i<totalMonthsToDisplay;i++) {
		// console.log("Currently :: ", currentMonth.format("m/d/yy"))

		// the containing month element
		var monthElement = document.createElement("div")
		monthElement.classList.add("js-date-picker-month-container")

		// add a header to the top
		var headerElement = document.createElement("div")
		headerElement.classList.add("js-date-picker-month-header")
		headerElement.innerHTML = currentMonth.format("mmmm")
		monthElement.appendChild(headerElement)

		// add a container to store the calendar
		var dayContainerElement = document.createElement("div")
		dayContainerElement.classList.add("js-date-picker-day-container")
		monthElement.appendChild(dayContainerElement)

		// figure out the day the calendar should start
		var currentDate = new Date(currentMonth.getTime())
		var monthStartDay = currentMonth.getDay()
		currentDate.setDate(currentDate.getDate() - monthStartDay)

		// figure out the end of the month
		var monthEndDay = new Date(currentMonth.getTime())
		monthEndDay.setMonth(monthEndDay.getMonth() + 1)
		monthEndDay.setDate(monthEndDay.getDate() - 1)

		// each calendar has 6 rows, one for each week.
		for(var j=0;j<6;j++) {

			// each week has 7 days.
			for(var k=0;k<7;k++) {
				var dayElement = document.createElement("span")
				dayElement.classList.add("js-date-picker-day")

				dayElement.setAttribute("aria-label", currentDate.format("mmmm d, yyyy"))
				dayElement.dataset.date = currentDate.format("yyyy-mm-dd")

				if(currentDate.getTime() < currentMonth.getTime()) {
					dayElement.classList.add("js-date-picker-prev-month-day")
					dayElement.classList.add("js-date-picker-is-disabled-date")
				}

				if(currentDate.getTime() === monthEndDay.getTime()) {
					dayElement.classList.add("js-date-picker-is-last-day-of-month")
				}

				if(currentDate.getTime() > monthEndDay.getTime()) {
					dayElement.classList.add("js-date-picker-next-month-day")
					dayElement.classList.add("js-date-picker-is-disabled-date")
				}

				if(currentDate.getTime() === today.getTime()) {
					dayElement.classList.add("js-date-picker-is-today")
				}

				if(currentDate.getTime() < constraints.min.getTime() || currentDate.getTime() >= constraints.max.getTime()) {
					dayElement.classList.add("js-date-picker-is-disabled-date")
				}

				dayElement.innerText = currentDate.format("d")

				dayContainerElement.appendChild(dayElement)
				currentDate.setDate(currentDate.getDate() + 1)
			}

		}

		rootElement.appendChild(monthElement)
		currentMonth.setMonth(currentMonth.getMonth() + 1)
	}



	// console.log(constraints.min.format("m/d/yy"))

	return rootElement
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

	var calendar = datePickerBuildCalendar(datePicker)

	endElement.classList.add( datePickerVisibilityClassString() )
	startElement.classList.add( datePickerVisibilityClassString() )
	calendar.classList.add( datePickerVisibilityClassString() )

	input.addEventListener("click", handleDatePickerInputClick.bind(datePicker), false)

	datePicker.appendChild(input)
	datePicker.appendChild(calendar)
}
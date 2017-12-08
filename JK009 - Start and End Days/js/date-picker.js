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
	var calendarElement = document.createElement("div")
	calendarElement.dateElements = []
	calendarElement.classList.add("js-date-picker-calendar")

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
	calendarElement.appendChild(headerElement)

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
				dayElement.date = new Date(currentDate.getTime())

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

				var dayButton = document.createElement("span")
				dayButton.classList.add("js-date-picker-day-button")
				dayButton.innerText = currentDate.format("d")

				dayElement.addEventListener("mouseover", handleDatePickerDayHover.bind(datePicker), false)
				dayElement.addEventListener("click", handleDatePickerDayClick.bind(datePicker), false)

				dayElement.appendChild(dayButton)

				dayContainerElement.appendChild(dayElement)
				currentDate.setDate(currentDate.getDate() + 1)
				calendarElement.dateElements.push(dayElement)
			}

		}

		calendarElement.appendChild(monthElement)
		currentMonth.setMonth(currentMonth.getMonth() + 1)
	}

	// console.log(constraints.min.format("m/d/yy"))

	return calendarElement
}

function handleDatePickerInputClick(evt) {
	evt.preventDefault()

	var datePicker = this
	datePickerToggleCalendar(datePicker)

	return false
}

function handleDatePickerWindowResize(evt) {
	var datePicker = this
	datePickerCalendarDecideDOMPosition(datePicker)
}

function datePickerToggleCalendar(datePicker) {
	datePicker.calendar.classList.toggle( datePickerVisibilityClassString() )
	// todo: reset if we need
}

function datePickerCalendarDecideDOMPosition(datePicker) {
	var vw = window.innerWidth

	var breakpoint = datePicker.dataset.datePickerLargeScreenWidth
	var parentNode = vw >= breakpoint ? datePicker : document.body

	if(datePicker.calendar.parentNode != parentNode) {
		if(datePicker.calendar.parentNode) {
			datePicker.calendar.parentNode.removeChild(datePicker.calendar)
		}

		parentNode.appendChild(datePicker.calendar)
	}
}

function datePickerReset(datePicker) {
	datePickerClearStartDay(datePicker)
	datePickerClearEndDay(datePicker)
}

function datePickerClearStartDay(datePicker) {
	if(datePicker.startDayElement) {
		datePicker.startDayElement.classList.remove("js-date-picker-is-selected-start-day")
		datePicker.startDayElement.classList.remove("js-date-picker-is-selected-day")
		datePicker.startDayElement = null	
	}

	var startElement = datePicker.querySelector(".start-date input")
	startElement.value = ""
}

function datePickerClearEndDay(datePicker) {
	if(datePicker.endDayElement) {
		datePicker.endDayElement.classList.remove("js-date-picker-is-selected-end-day")
		datePicker.endDayElement.classList.remove("js-date-picker-is-selected-day")
		datePicker.endDayElement = null	
	}

	var endElement = datePicker.querySelector(".end-date input")
	endElement.value = ""	
}

function datePickerSetStartDay(datePicker, dayElement) {
	datePickerClearStartDay(datePicker)
	datePicker.startDayElement = dayElement
	datePicker.startDayElement.classList.add("js-date-picker-is-selected-start-day")
	datePicker.startDayElement.classList.add("js-date-picker-is-selected-day")

	var startElement = datePicker.querySelector(".start-date input")
	startElement.value = datePicker.startDayElement.date.format("yyyy-mm-dd")
}

function datePickerSetEndDay(datePicker, dayElement) {
	if(!datePicker.startDayElement) {
		console.warn("Trying to set an end date without a start date. Ignorning.")
		return
	}

	datePickerClearEndDay(datePicker)
	datePicker.endDayElement = dayElement
	datePicker.endDayElement.classList.add("js-date-picker-is-selected-end-day")
	datePicker.endDayElement.classList.add("js-date-picker-is-selected-day")

	var endElement = datePicker.querySelector(".end-date input")
	endElement.value = datePicker.endDayElement.date.format("yyyy-mm-dd")

	datePickerUpdateSelectedRange(datePicker, datePicker.startDayElement, datePicker.endDayElement)
}

function handleDatePickerDayHover(evt) {
	evt.preventDefault()

	var datePicker = this
	var dayElement = evt.currentTarget
	var date = dayElement.date

	// need a start day for a range
	if(!datePicker.startDayElement) {
		return
	}

	datePickerUpdateSelectedRange(datePicker, datePicker.startDayElement, dayElement)
}

function datePickerUpdateSelectedRange(datePicker, startDayElement, endDayElement) {
	// console.log("Updating range from" , startDayElement.date, " to ", endDayElement.date)

	var currentSelected = datePicker.querySelectorAll(".js-date-picker-is-day-within-range")
	for(var i=0;i<currentSelected.length;i++) {
		currentSelected[i].classList.remove("js-date-picker-is-day-within-range")
	}

	var startIndex = datePicker.calendar.dateElements.indexOf(startDayElement)
	var endIndex = datePicker.calendar.dateElements.indexOf(endDayElement)

	for(var i=startIndex;i<=endIndex;i++) {
		datePicker.calendar.dateElements[i].classList.add("js-date-picker-is-day-within-range")
	}
}

function handleDatePickerDayClick(evt) {
	evt.preventDefault()

	var datePicker = this
	var dayElement = evt.currentTarget
	var date = dayElement.date

	if( (datePicker.startDayElement && datePicker.endDayElement)) {
		datePickerReset(datePicker)
	}

	if(datePicker.startDayElement) {

		if(date.getTime() < datePicker.startDayElement.date.getTime()) {
			console.log("YAY")

			datePickerReset(datePicker)
		}
	}

	if(!datePicker.startDayElement) {
		datePickerSetStartDay(datePicker, dayElement)
	}
	else if(!datePicker.endDayElement) {
		datePickerSetEndDay(datePicker, dayElement)
	}

	return false
}


// init

for (var i = 0; i < datePickers.length; i++) {
	var datePicker = datePickers[i]

	var endElement = datePicker.querySelector(".end-date")
	var startElement = datePicker.querySelector(".start-date")

	var input = startElement.querySelector("input").cloneNode(true)
	input.setAttribute("type", "text")
	input.classList.add("js-date-picker-text-input")

	datePicker.calendar = datePickerBuildCalendar(datePicker)

	endElement.classList.add( datePickerVisibilityClassString() )
	startElement.classList.add( datePickerVisibilityClassString() )
	datePicker.calendar.classList.add( datePickerVisibilityClassString() )

	input.addEventListener("click", handleDatePickerInputClick.bind(datePicker), false)

	datePicker.appendChild(input)

	window.addEventListener("resize", handleDatePickerWindowResize.bind(datePicker), false)
	datePickerCalendarDecideDOMPosition(datePicker)
}
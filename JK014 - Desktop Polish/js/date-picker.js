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

	datePicker.totalMonths = monthsBetween + (yearsBetween * 12)
	// console.log("Total Months to display :: ", datePicker.totalMonths)

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

	var footerElement = document.createElement("div")
	footerElement.classList.add("js-date-picker-footer")

	var doneButton = document.createElement("div")
	doneButton.classList.add("js-date-picker-done-button")
	doneButton.innerText = "Done"
	doneButton.addEventListener("click", datePickerHandleDoneButtonClick.bind(datePicker), false)

	footerElement.appendChild(doneButton)
	calendarElement.appendChild(footerElement)

	var calendarScrollViewportElement = document.createElement("div")
	calendarScrollViewportElement.classList.add("js-date-picker-calendar-scroll-viewport")

	var calendarContainerElement = document.createElement("div")
	calendarContainerElement.classList.add("js-date-picker-calendar-container-element")
	calendarScrollViewportElement.appendChild(calendarContainerElement)

	calendarElement.appendChild(calendarScrollViewportElement)

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

	// for desktop, copy the M T W Th F thing
	var daysElement = headerElement.cloneNode(true)

	for(var i=0;i<datePicker.totalMonths;i++) {
		// console.log("Currently :: ", currentMonth.format("m/d/yy"))

		// the containing month element
		var monthElement = document.createElement("div")
		monthElement.classList.add("js-date-picker-month-container")

		// add a header to the top
		var headerElement = document.createElement("div")
		headerElement.classList.add("js-date-picker-month-header")
		headerElement.innerHTML = currentMonth.format("mmmm")
		monthElement.appendChild(headerElement)
		monthElement.appendChild(daysElement.cloneNode(true))

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

				if(!dayElement.classList.contains("js-date-picker-is-disabled-date")) {
					dayElement.addEventListener("mouseover", handleDatePickerDayHover.bind(datePicker), false)
					dayElement.addEventListener("click", handleDatePickerDayClick.bind(datePicker), false)
				}

				dayElement.appendChild(dayButton)

				dayContainerElement.appendChild(dayElement)
				currentDate.setDate(currentDate.getDate() + 1)
				calendarElement.dateElements.push(dayElement)
			}

		}

		calendarContainerElement.appendChild(monthElement)
		currentMonth.setMonth(currentMonth.getMonth() + 1)
	}

	// console.log(constraints.min.format("m/d/yy"))

	return calendarElement
}

function datePickerBuildNextPrevNav(datePicker) {
	datePicker.currentMonthDisplayed = 0

	var nextButton = document.createElement("div")
	nextButton.classList.add("js-date-picker-nav-button")
	nextButton.classList.add("js-date-picker-next-button")
	nextButton.addEventListener("click", handleDatePickerNextButtonClick.bind(datePicker), false)

	var prevButton = document.createElement("div")
	prevButton.classList.add("js-date-picker-nav-button")
	prevButton.classList.add("js-date-picker-prev-button")
	prevButton.addEventListener("click", handleDatePickerPrevButtonClick.bind(datePicker), false)

	datePicker.calendar.appendChild(nextButton)
	datePicker.calendar.appendChild(prevButton)

	datePicker.nextButton = nextButton
	datePicker.prevButton = prevButton

	datePickerUpdateNavButtonStates(datePicker)
}

function handleDatePickerPrevButtonClick(evt) {
	evt.preventDefault()

	var datePicker = this
	datePickerUpdateVisibleMonths(datePicker, datePicker.currentMonthDisplayed - 1)

	return false
}

function handleDatePickerNextButtonClick(evt) {
	evt.preventDefault()

	var datePicker = this
	datePickerUpdateVisibleMonths(datePicker, datePicker.currentMonthDisplayed + 1)

	return false
}

function datePickerUpdateVisibleMonths(datePicker, index) {
	if(index < 0 || index >= datePicker.totalMonths - 1) {
		return
	}

	if(!datePicker.computedMonthDimensions) {
		return
	}

	datePicker.currentMonthDisplayed = index
	var x = (datePicker.computedMonthDimensions.width * index)
	datePicker.calendar.querySelector(".js-date-picker-calendar-container-element").style.transform = "translate3d(-" + x + "px,0,0)"

	datePickerUpdateNavButtonStates(datePicker)
}

function datePickerUpdateNavButtonStates(datePicker) {
	if(datePicker.currentMonthDisplayed == 0) {
		datePicker.prevButton.classList.add("js-date-picker-nav-button-disabled")
	}	
	else {
		datePicker.prevButton.classList.remove("js-date-picker-nav-button-disabled")		
	}

	if(datePicker.currentMonthDisplayed == datePicker.totalMonths - 2) {
		datePicker.nextButton.classList.add("js-date-picker-nav-button-disabled")
	}
	else {
		datePicker.nextButton.classList.remove("js-date-picker-nav-button-disabled")		
	}
}

function handleDatePickerInputClick(evt) {
	evt.preventDefault()

	var datePicker = this
	datePickerToggleCalendar(datePicker)

	return false
}

function handleDatePickerWindowResize(evt) {
	var datePicker = this
	datePickerCalendarDecideMode(datePicker)
}

function datePickerOpenCalendar(datePicker) {
	datePicker.calendar.classList.remove( datePickerVisibilityClassString() )
	datePicker.calendar.offsetWidth; // recalc
	datePicker.calendar.classList.add("js-date-picker-in")

	datePicker.lastStartDayElement = datePicker.startDayElement
	datePicker.lastEndDayElement = datePicker.endDayElement
}

function datePickerCloseCalendar(datePicker) {
	datePicker.calendar.classList.remove("js-date-picker-in")

	// one desktop we keep it around a beat just to acknowledge result. even w/ no animation this is nice.
	var timeoutDuration = datePicker.mode === "mobile" ? 500 : 100
	setTimeout(function() {
		datePicker.calendar.classList.add( datePickerVisibilityClassString() )	
	}, timeoutDuration)

	datePicker.lastStartDayElement = null
	datePicker.lastEndDayElement = null
}

function datePickerToggleCalendar(datePicker) {
	if(datePicker.calendar.classList.contains(datePickerVisibilityClassString())) {
		datePickerOpenCalendar(datePicker)
	}
	else {
		datePickerCloseCalendar(datePicker)
	}
}

function datePickerCalendarDecideMode(datePicker) {
	var vw = window.innerWidth

	var breakpoint = datePicker.dataset.datePickerLargeScreenWidth

	var lastMode = datePicker.mode
	datePicker.mode = vw >= breakpoint ? "desktop" : "mobile"

	if(datePicker.mode != lastMode) {
		datePickerUpdateMode(datePicker)
	}
}

function datePickerHandleDoneButtonClick(evt) {
	evt.preventDefault()

	var datePicker = this

	if(datePicker.startDayElement && datePicker.endDayElement) {
		datePickerUpdateValues(datePicker)
	}
	// we started to pick a range and stopped. reset to our last selection.
	else if(datePicker.startDayElement) {
		if(datePicker.lastStartDayElement && datePicker.lastEndDayElement) {
			datePickerSetStartDay(datePicker, datePicker.lastStartDayElement)
			datePickerSetEndDay(datePicker, datePicker.lastEndDayElement)
		}
		else {
			datePickerReset(datePicker)
		}
	}

	datePickerCloseCalendar(datePicker)

	return false
}

function datePickerUpdateMode(datePicker) {
	datePickerDecideDOMPosition(datePicker)
	datePickerCalculateMonthWidth(datePicker)
	datePickerDecideScrollPosition(datePicker)
}

function datePickerDecideDOMPosition(datePicker) {
	var parentNode = datePicker.mode == "desktop" ? datePicker : document.body

	if(datePicker.calendar.parentNode != parentNode) {
		if(datePicker.calendar.parentNode) {
			datePicker.calendar.parentNode.removeChild(datePicker.calendar)
		}

		parentNode.appendChild(datePicker.calendar)
	}	
}

function datePickerCalculateMonthWidth(datePicker) {
	if(datePicker.mode != "desktop") {
		return
	}

	if(!datePicker.computedMonthDimensions) {
		datePicker.calendar.style.display = "block"
		requestAnimationFrame(function() {
			datePicker.computedMonthDimensions = datePicker.calendar.querySelector(".js-date-picker-month-container").getBoundingClientRect()
			datePicker.calendar.style.display = ""
		})	
	}	
}

function datePickerDecideScrollPosition(datePicker) {
	if(datePicker.mode == "mobile") {
		datePickerUpdateVisibleMonths(datePicker, 0)
	}
	else {
		datePickerUpdateVisibleMonths(datePicker, datePicker.currentMonthDisplayed)		
	}	
}

function datePickerReset(datePicker) {
	datePickerClearSelectedRange(datePicker)
	datePickerClearStartDay(datePicker)
	datePickerClearEndDay(datePicker)
}

function datePickerClearStartDay(datePicker) {
	if(datePicker.startDayElement) {
		datePicker.startDayElement.classList.remove("js-date-picker-is-selected-start-day")
		datePicker.startDayElement.classList.remove("js-date-picker-is-selected-day")
		datePicker.startDayElement = null	
	}

}

function datePickerClearEndDay(datePicker) {
	if(datePicker.endDayElement) {
		datePicker.endDayElement.classList.remove("js-date-picker-is-selected-end-day")
		datePicker.endDayElement.classList.remove("js-date-picker-is-selected-day")
		datePicker.endDayElement = null	
	}
}

function datePickerSetStartDay(datePicker, dayElement) {
	datePickerClearStartDay(datePicker)
	datePicker.startDayElement = dayElement
	datePicker.startDayElement.classList.add("js-date-picker-is-selected-start-day")
	datePicker.startDayElement.classList.add("js-date-picker-is-selected-day")
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

	datePickerUpdateSelectedRange(datePicker, datePicker.startDayElement, datePicker.endDayElement)
	datePickerUpdateValues(datePicker)

	if(datePicker.mode == "desktop") {
		datePickerCloseCalendar(datePicker)
	}
}

function datePickerClearValues(datePicker) {
	var startElement = datePicker.querySelector(".start-date input")
	startElement.value = ""

	var endElement = datePicker.querySelector(".end-date input")
	endElement.value = ""		
}

function datePickerUpdateValues(datePicker) {
	var endElement = datePicker.querySelector(".end-date input")
	endElement.value = datePicker.endDayElement.date.format("yyyy-mm-dd")

	var startElement = datePicker.querySelector(".start-date input")
	startElement.value = datePicker.startDayElement.date.format("yyyy-mm-dd")

	var value = datePicker.startDayElement.date.format("ddd, mmm d") + " - " + datePicker.endDayElement.date.format("ddd, mmm d")

	if(datePicker.startDayElement == datePicker.endDayElement) {
		value = datePicker.startDayElement.date.format("ddd, mmm d")
	}

	datePicker.querySelector(".js-date-picker-text-input").value = value
}

function handleDatePickerDayHover(evt) {
	evt.preventDefault()

	var datePicker = this
	var dayElement = evt.currentTarget
	var date = dayElement.date

	// need a start day for a range
	if(!datePicker.startDayElement) {
		return;
	}

	// don't update if we have an end day
	if(datePicker.endDayElement) {
		return;
	}

	datePickerUpdateSelectedRange(datePicker, datePicker.startDayElement, dayElement)
}

function datePickerClearSelectedRange(datePicker) {
	var currentSelected = datePicker.calendar.querySelectorAll(".js-date-picker-is-day-within-range")

	for(var i=0;i<currentSelected.length;i++) {
		currentSelected[i].classList.remove("js-date-picker-is-day-within-range")
	}	
}

function datePickerUpdateSelectedRange(datePicker, startDayElement, endDayElement) {
	// console.log("Updating range from" , startDayElement.date, " to ", endDayElement.date)

	datePickerClearSelectedRange(datePicker)

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
	input.setAttribute("readonly", "readonly")
	input.classList.add("js-date-picker-text-input")

	datePicker.calendar = datePickerBuildCalendar(datePicker)
	datePickerBuildNextPrevNav(datePicker)

	endElement.classList.add( datePickerVisibilityClassString() )
	startElement.classList.add( datePickerVisibilityClassString() )
	datePicker.calendar.classList.add( datePickerVisibilityClassString() )

	input.addEventListener("click", handleDatePickerInputClick.bind(datePicker), false)

	datePicker.appendChild(input)

	window.addEventListener("resize", handleDatePickerWindowResize.bind(datePicker), false)
	datePickerCalendarDecideMode(datePicker)
}
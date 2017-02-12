Sample Running Timer Segment
=======================

This segment speaks the current time and location periodically, speaks the elapsed time from the first launch when the device enters in the given location, and is additionally triggered by changes in activities, as defined in the launch rules.

Features
-------------
- Launch by voice trigger.
- Launch by launch rules.
- Launch by worker.
- Use internet access.
- Speak the current time and location periodically.
- Speak the elapsed time from the first launch.
- Use Segment configuration.
- Use local storage.

Use API
-------------
- startSegment [da]
- stopSegment [da]
- cancelSegment [da]
- getString [da]
- getXhr [da]
- requestStartSegment [da]
- stopWorker [da]
- getSegmentConfig [da]
- setSegmentConfig [da]
- getInstance [da.SpeechSynthesis]
- speak [da.SpeechSynthesis]
- getCurrentPosition [da.Geolocation]
- getItem [da.Storage]
- setItem [da.Storage]
- clear [da.Storage]
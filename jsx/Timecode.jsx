var Timecode =  function(args) {
    this.framerate = this.get(args, "framerate", "29.97");
    this.int_framerate = this.getIntFramerate();
    this.drop_frame = this.get(args, "drop_frame", false);
    this.hours = false;
    this.minutes = false;
    this.seconds = false;
    this.frames = false;
    this.frame_count = false;
    this.set(this.get(args, "timecode", 0));
};
Timecode.prototype = {
    _calculate :  function(sign, timecodes) {
        // all timecodes are calculated in place
        var timecode, i, frame_count;
        for (i = 0; i < timecodes.length; i += 1) {
            timecode = timecodes[i];
            // if a string or number is given, convert it to a timecode
            if ((typeof timecode === "string") || (typeof timecode === "number")) {
                timecode = Timecode.init({
                    framerate: this.framerate,
                    timecode: timecode,
                    drop_frame: this.drop_frame
                });
            }
            // make sure this is a valid timecode
            if (timecode.frame_count) {
                if (timecode.framerate != this.framerate) {
                    throw new Error("Timecode framerates must match to do calculations.");
                }
                if (sign === "-") {
                    frame_count = timecode.frame_count * -1;
                }
                else if (sign === "+") {
                    frame_count = timecode.frame_count;
                }
                else {
                    throw new Error("Expected sign to be + or -.");
                }
                this.frame_count = this.frame_count + frame_count;
                this.frameNumberToTimecode();
            }
        }
    },
    get : function(dict, name, default_value) {
        if (dict.hasOwnProperty(name)) {
            return dict[name];
        }
        else {
            return default_value;
        }
    },
    getIntFramerate : function() {
        if (this.framerate === "ms") {
            return 1000;
        }
        else {
            return Math.round(this.framerate * 1);
        }
    },
    set : function(timecode) {
        if (typeof timecode === "string") {
            this.partsFromString(timecode);
            this.timecodeToFrameNumber();
            this.frameNumberToTimecode();
        }
        else if (typeof timecode === "number") {
            this.frame_count = timecode;
            this.frameNumberToTimecode();
        }
        else {
            // throw an error
        }
    },
    partsFromString : function(timecode) {
        // Parses timecode strings non-drop 'hh:mm:ss:ff', drop 'hh:mm:ss;ff', or milliseconds 'hh:mm:ss:fff'
        if (timecode.length === 11) {
            this.frames = timecode.slice(9, 11) * 1;
        }
        else if ((timecode.length === 12) && (this.framerate === "ms")) {
            this.frames = timecode.slice(9, 12) * 1;
        }
        else {
            throw new Error("Timecode string parsing error. " + timecode);
        }
        this.hours = timecode.slice(0, 2) * 1;
        this.minutes = timecode.slice(3, 5) * 1;
        this.seconds = timecode.slice(6, 8) * 1;
    },
    frameNumberToTimecode : function() {
        // Converts frame_count to timecode
        var frame_count = this.frame_count;
        if (this.drop_frame) {
            var parts = this.frameNumberToDropFrameTimecode(frame_count);
            this.hours = parts[0];
            this.minutes = parts[1];
            this.seconds = parts[2];
            this.frames = parts[3];
        }
        else {
            this.hours = frame_count / (3600 * this.int_framerate);
            if (this.hours > 23) {
                this.hours = this.hours % 24;
                frame_count = frame_count - (23 * 3600 * this.int_framerate);
            }
            this.minutes = (frame_count % (3600 * this.int_framerate)) / (60 * this.int_framerate);
            this.seconds = ((frame_count % (3600 * this.int_framerate)) % (60 * this.int_framerate)) / this.int_framerate;
            this.frames = ((frame_count % (3600 * this.int_framerate)) % (60 * this.int_framerate)) % this.int_framerate;
            
            if (frame_count < 0 ) {
                this.hours = Math.abs(Math.ceil(this.hours));
                this.minutes = Math.abs(Math.ceil(this.minutes));
                this.seconds = Math.abs(Math.ceil(this.seconds));
                this.frames = Math.abs(Math.ceil(this.frames));
            } else {
                this.hours = Math.floor(this.hours);
                this.minutes = Math.floor(this.minutes);
                this.seconds = Math.floor(this.seconds);
                this.frames =Math.floor(this.frames);
            }
        }
    },
    timecodeToFrameNumber : function() {
        // converts the current timecode to frame_count.
        if (this.drop_frame) {
            this.frame_count = this.dropFrameTimecodeToFrameNumber([this.hours, this.minutes, this.seconds, this.frames]);
        }
        else {
            this.frame_count = (((this.hours * 3600) + (this.minutes * 60) + this.seconds) * this.int_framerate) + this.frames;
        }
        return this.frame_count;
    },
    add : function(arguments) {
        /*
        // This takes one or more Timecode objects as arguments
        // If this has been initialized, add to this, otherwise just add timecodes given.
        var timecodes = [];
        if (this.frame_count) {
            timecodes.push(this);
        }
        */
        this._calculate("+", arguments);
    },
    subtract : function(arguments) {
        this._calculate("-", arguments);
    },
    toString : function() {
        var zeroPad, delim;
        zeroPad = function(number) {
            var pad = (number < 10) ? "0" : "";
            return pad + Math.floor(number);
        };
        delim = (this.drop_frame) ? ";" : ":";
        var sign = (this.frame_count < 0 ) ? "-" : "";
        return sign+zeroPad(this.hours) + ":" + zeroPad(this.minutes) + ":" + zeroPad(this.seconds) + delim + zeroPad(this.frames);
    },
    frameNumberToDropFrameTimecode : function(frame_number) {
        var d, m,
            framerate = this.framerate * 1,
            drop_frames = Math.round(framerate * 0.066666),
            frames_per_hour = Math.round(framerate * 60 * 60),
            frames_per_24_hours = frames_per_hour * 24,
            frames_per_10_minutes = Math.round(framerate * 60 * 10),
            frames_per_minute = Math.round(framerate * 60);
        // Roll over clock if greater than 24 hours
        frame_number = frame_number % frames_per_24_hours;
        // If time is negative, count back from 24 hours
        if (frame_number < 0) {
            frame_number = frames_per_24_hours + frame_number;
        }
        d = Math.floor(frame_number / frames_per_10_minutes);
        m = frame_number % frames_per_10_minutes;
        if (m > drop_frames) {
            frame_number = frame_number + (drop_frames * 9 * d) + drop_frames * Math.floor((m - drop_frames) / frames_per_minute);
        }
        else {
            frame_number = frame_number + drop_frames * 9 * d;
        }
        return [
            Math.floor(Math.floor(Math.floor(frame_number / this.int_framerate) / 60) / 60),
            Math.floor(Math.floor(frame_number / this.int_framerate) / 60) % 60,
            Math.floor(frame_number / this.int_framerate) % 60,
            frame_number % this.int_framerate,
        ]
    },
    dropFrameTimecodeToFrameNumber : function(timecode_as_list) {
        var hours = timecode_as_list[0],
            minutes = timecode_as_list[1],
            seconds = timecode_as_list[2],
            frames = timecode_as_list[3],
            drop_frames = Math.round(this.framerate * 0.066666),
            hour_frames = this.int_framerate * 60 * 60,
            minute_frames = this.int_framerate * 60,
            total_minutes = (hours * 60) + minutes,
            frame_count = ((hour_frames * hours) + (minute_frames * minutes) + (this.int_framerate * seconds) + frames) - (drop_frames * (total_minutes - Math.floor(total_minutes / 10)));
        return frame_count;
    }
};

// static methods dealing with timecodes
Timecode.addTimecodes = function(timecodeOne, timecodeTwo) {
    $.writeln(typeof(timecodeOne));
    if (!(timecodeOne instanceof Timecode && timecodeOne instanceof Timecode)) {
        timecodeOne = new Timecode({framerate: "25", timecode: timecodeOne});
        timecodeTwo = new Timecode({framerate: "25", timecode: timecodeTwo});
    }
    if (timecodeOne.int_framerate != timecodeTwo.int_framerate) {
       throw new Error("Timecode framerates must match to do calculations."); 
    }
   return new this({framerate: "25", timecode: (timecodeOne.frame_count + timecodeTwo.frame_count)});
}

Timecode.subtractTimecodes = function(firstTimecode, secondTimecode) {
   if (!(firstTimecode instanceof Timecode && secondTimecode instanceof Timecode)) {
        firstTimecode = new Timecode({framerate: "25", timecode: firstTimecode});
        secondTimecode = new Timecode({framerate: "25", timecode: secondTimecode});
    }
    if (firstTimecode.int_framerate != secondTimecode.int_framerate) {
       throw new Error("Timecode framerates must match to do calculations."); 
    }
   return new this({framerate: "25", timecode: (firstTimecode.frame_count - secondTimecode.frame_count)});
}

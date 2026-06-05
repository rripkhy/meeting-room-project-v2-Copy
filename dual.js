const START_HOUR = 7;
const END_HOUR = 18;

const DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY"
];

function getDayName(dateStr){

    const date =
        parseDate(dateStr);

    if(!date)
        return "";

    return date
        .toLocaleDateString(
            "en-US",
            {
                weekday:"long"
            }
        )
        .toUpperCase();
}

function parseDate(dateStr){

    const date =
        new Date(dateStr);

    if(isNaN(date)){
        return null;
    }

    return date;
}

function timeToMinutes(time){

    const [h,m] =
        time.split(":").map(Number);

    return h * 60 + m;
}

function createHourLines(){

    let html = "";

    for(let h=START_HOUR; h<=END_HOUR; h++){

        const left =
            ((h-START_HOUR) /
            (END_HOUR-START_HOUR))
            *100;

        html += `
            <div
                class="hour-line"
                style="left:${left}%">
            </div>
        `;
    }

    return html;
}

function getWeekDates(){

    const today = new Date();

    // reset jam
    today.setHours(0,0,0,0);

    const monday =
        new Date(today);

    const day =
        today.getDay();

    const diff =
        day === 0
        ? -6
        : 1 - day;

    monday.setDate(
        today.getDate() + diff
    );

    const dates=[];

    for(let i=0;i<5;i++){

        const d =
            new Date(monday);

        d.setDate(
            monday.getDate()+i
        );

        dates.push(
            d.toLocaleDateString(
                "en-GB",
                {
                    day:"2-digit",
                    month:"short"
                }
            )
        );
    }

    return dates;
}

function getRoomStats(room,data){

    const bookings =
    data.filter(x => {

        const start =
            String(x.start || "")
            .trim();

        const end =
            String(x.end || "")
            .trim();

        return (
            x.room === room &&
            start !== "" &&
            end !== ""
        );

    });

    const total =
        bookings.length;

    const totalHours =
        bookings.reduce((sum,b)=>{

            const start =
                timeToMinutes(
                    b.start
                );

            const end =
                timeToMinutes(
                    b.end
                );

            return sum +
                ((end-start)/60);

        },0);

    const utilization =
        Math.round(
            (totalHours / 50) * 100
        );

    return {
        total,
        utilization
    };
}

function buildMeetingBlocks(dayMeetings){

    let html = "";

    dayMeetings.forEach(meeting=>{

    const startText =
        String(
            meeting.start || ""
        ).trim();

    const endText =
        String(
            meeting.end || ""
        ).trim();

    if(
        startText === "" ||
        endText === ""
    ){
        return;
    }

    const start =
        timeToMinutes(
            startText
        );

    const end =
        timeToMinutes(
            endText
        );

        if(
    isNaN(start) ||
    isNaN(end) ||
    end <= start
){
    return;
}

        const dayStart =
            START_HOUR * 60;

        const totalMinutes =
            (END_HOUR - START_HOUR)
            * 60;

        const left =
            ((start-dayStart)
            / totalMinutes) * 100;

        let width =
            ((end-start)
            / totalMinutes) * 100;

        /* minimum width agar meeting pendek tetap terbaca */

        width = Math.max(width,5);
        

        if(left + width > 100){
            width = 100 - left;
        }
        width -= 1;

        html += `

        <div
            class="meeting-block"
            style="
                left:${left}%;
                width:${width}%;
            ">

            <div class="meeting-title">
                ${meeting.title}
            </div>

            <div class="meeting-time">
                ${meeting.start}
                -
                ${meeting.end}
            </div>

            <div class="meeting-participant">
                👥 ${meeting.participants}
            </div>

        </div>

        `;
    });

    return html;
}

function renderRoom(room,data,targetId){

    const roomData =
        data.filter(
            x => x.room === room
        );

    const stats =
        getRoomStats(
            room,
            roomData
        );

    const weekDates =
        getWeekDates();

    let html = `

    <div class="room-header">

        <div>

            <div class="room-label">
                MEETING ROOM
            </div>

            <div class="room-name">
                ${room}
            </div>

        </div>

            <div class="booking-count">
                ${stats.total} bookings this week
            </div>

        </div>

    </div>

    <div class="timeline-header">

        <div class="timeline-spacer"></div>

        <div class="timeline-hours">

            <span>07:00</span>
            <span>08:00</span>
            <span>09:00</span>
            <span>10:00</span>
            <span>11:00</span>
            <span>12:00</span>
            <span>13:00</span>
            <span>14:00</span>
            <span>15:00</span>
            <span>16:00</span>
            <span>17:00</span>
        </div>

    </div>

    `;

    DAYS.forEach((day,index)=>{

       const currentDate =
    weekDates[index];

const dayMeetings =
    roomData.filter(x=>{

        const meetingDate =
            parseDate(x.date);

        return (
            meetingDate.toLocaleDateString(
                "en-GB",
                {
                    day:"2-digit",
                    month:"short"
                }
            )
            === currentDate
        );
    });

        html += `

        <div class="day-row">

            <div class="day-label">

                <div class="day-name">
                    ${day.substring(0,3)}
                </div>

                <div class="day-date">
                    ${weekDates[index]}
                </div>

            </div>

            <div class="timeline">

                ${createHourLines()}

                ${buildMeetingBlocks(
                    dayMeetings
                )}

            </div>

        </div>

        `;
    });

    document
        .getElementById(targetId)
        .innerHTML = html;
}

async function loadWeeklyRooms(
    room1,
    room2
){

    currentRoom1 = room1;
    currentRoom2 = room2;

    try{

        const data =
            await fetchWeeklySchedule();

        renderRoom(
            room1,
            data,
            room1.toLowerCase()
        );

        renderRoom(
            room2,
            data,
            room2.toLowerCase()
        );

    }
    catch(error){

        console.error(error);

    }
}

setInterval(() => {

    if(
        currentRoom1 &&
        currentRoom2
    ){

        loadWeeklyRooms(
            currentRoom1,
            currentRoom2
        );

    }

}, 30000);

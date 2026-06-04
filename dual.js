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

    if(!dateStr) return "";

    const parts =
        dateStr.split(/[\/\-]/);

    if(parts.length !== 3)
        return "";

    const month =
        Number(parts[0]);

    const day =
        Number(parts[1]);

    const year =
        Number(parts[2]);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return date
        .toLocaleDateString(
            "en-US",
            {
                weekday:"long"
            }
        )
        .toUpperCase();
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

    const today =
        new Date();

    const monday =
        new Date(today);

    monday.setDate(
        today.getDate()
        -
        (
            today.getDay()===0
            ?6
            :today.getDay()-1
        )
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
        data.filter(
            x => x.room === room
        );

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

        const start =
            timeToMinutes(
                meeting.start
            );

        const end =
            timeToMinutes(
                meeting.end
            );

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

        width = Math.max(width,17);

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

function getDatesFromSheet(roomData){

    const uniqueDates =
        [...new Set(
            roomData
                .map(x => x.date)
        )];

    uniqueDates.sort((a,b)=>{

        const [m1,d1,y1] =
            a.split(/[\/\-]/);

        const [m2,d2,y2] =
            b.split(/[\/\-]/);

        return (
            new Date(y1,m1-1,d1)
            -
            new Date(y2,m2-1,d2)
        );

    });

    return uniqueDates.slice(0,5);
}

function formatDisplayDate(dateStr){

    const [month,day,year] =
        dateStr.split(/[\/\-]/);

    const date =
        new Date(
            year,
            month-1,
            day
        );

    return {
        dayName:
            date.toLocaleDateString(
                "en-US",
                {
                    weekday:"short"
                }
            )
            .toUpperCase(),

        dateText:
            date.toLocaleDateString(
                "en-GB",
                {
                    day:"2-digit",
                    month:"short"
                }
            )
    };
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
    getDatesFromSheet(
        roomData
    );

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

        <div class="utilization">

            <div class="util-badge">
                ${stats.utilization}% utilization
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

    weekDates.forEach((date,index)=>{

        const dayMeetings =
                roomData.filter(
                    x =>
                    x.date === date
                );

        html += `

        <div class="day-row">

            <div class="day-label">

                <div class="day-name">
                    ${formatDisplayDate(date).dayName}
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
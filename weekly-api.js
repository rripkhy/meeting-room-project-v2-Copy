const SHEET_ID =
"1b-pSFQ2HehQnjOF_e1QFZKKxgLWNaivNf9iRJrWnFVk";

function getCurrentMonday(){

    const today =
        new Date();

    const monday =
        new Date(today);

    monday.setHours(
        0,0,0,0
    );

    monday.setDate(
        today.getDate()
        -
        (
            today.getDay() === 0
            ? 6
            : today.getDay()-1
        )
    );

    return monday;
}

function getCurrentFriday(){

    const monday =
        getCurrentMonday();

    const friday =
        new Date(monday);

    friday.setDate(
        monday.getDate()+4
    );

    friday.setHours(
        23,59,59,999
    );

    return friday;
}

async function fetchWeeklySchedule(){

    const url =
`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

    const response =
        await fetch(url);

    const text =
        await response.text();

    const start =
        text.indexOf("{");

    const end =
        text.lastIndexOf("}");

    const gviz =
        JSON.parse(
            text.slice(
                start,
                end + 1
            )
        );

    const table =
        gviz.table;

    const results = [];

    table.rows.forEach(row => {

        const c = row.c;

        if(!c) return;

        results.push({

            room:
                String(
                    c[0]?.v || ""
                ).toUpperCase(),

            date:
                String(
                    c[1]?.f || ""
                ).trim(),

            start:
                c[2]?.f || c[2]?.v,

            end:
                c[3]?.f || c[3]?.v,

            title:
                c[4]?.v || "",

            participants:
                c[5]?.v || 0

        });

    });

    const monday =
    getCurrentMonday();

const friday =
    getCurrentFriday();

const filtered =
    results.filter(item => {

        const [month,day,year] =
            item.date.split(/[\/\-]/);

        const d =
            new Date(
                Number(year),
                Number(month)-1,
                Number(day)
            );

        return (
            d >= monday &&
            d <= friday
        );

    });

return filtered;
}
const SHEET_ID =
"1b-pSFQ2HehQnjOF_e1QFZKKxgLWNaivNf9iRJrWnFVk";

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
                c[1]?.f || c[1]?.v,

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

    return results;
}

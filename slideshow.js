const pages = [
    "index.html",
    "dual-gebang.html",
    "dual-arbei.html"
];

let current =
window.location.pathname
.split("/")
.pop();

if(
    current === ""
){
    current = "index.html";
}

const index =
pages.indexOf(current);

setTimeout(()=>{

    const next =
    (index + 1)
    %
    pages.length;

    window.location.href =
    pages[next];

},30000);

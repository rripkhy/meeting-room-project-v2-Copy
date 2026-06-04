const pages = [
    "index.html",
    "dual-gebang.html",
    "dual-arbei.html"
];

const current =
window.location.pathname
.split("/")
.pop();

const index =
pages.indexOf(current);

setTimeout(()=>{

    const next =
    (index+1)
    %
    pages.length;

    window.location.href =
    pages[next];

},5000);

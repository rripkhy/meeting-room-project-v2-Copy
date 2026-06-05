console.log("SLIDESHOW VERSION 5 DETIK");
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

setTimeout(() => {

    console.log("PINDAH HALAMAN");

    const next =
    (index + 1)
    %
    pages.length;

    window.location.href =
    pages[next];

}, 5000);

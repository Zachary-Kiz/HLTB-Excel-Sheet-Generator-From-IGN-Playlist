const puppeteer = require("puppeteer");
const hltb = require('howlongtobeat');
const readline = require('readline');
const hltbService = new hltb.HowLongToBeatService();
var XLSX = require('xlsx');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


async function getHLTB() {
    //hltbService.search('Horizon Zero Dawn').then(result => console.log(result));
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto("https://www.ign.com/playlist/Krobius/library/paused");
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    const names = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".tile-title"), name => name.innerHTML)
    })
    let results = [];
    let check = [];
    let cantFind = [];
    for (let i = 0; i < names.length; i++) {
        let fixedName = names[i].replace(':','');
        await hltbService.search(fixedName).then(function(result) { 
            try {
                if (result[0].similarity === 1) {
                    results.push({
                        "name" : result[0].name,
                        "main" : result[0].gameplayMain,
                        "mainExtra" : result[0].gameplayMainExtra,
                        "complete" : result[0].gameplayCompletionist
                    });
                } else {
                    check.push(result);
                }
            } catch {
                cantFind.push(names[i]);
                console.log("Error");
                console.log(names[i]);
            }
        })
    }
    await browser.close();
    return Promise.resolve([results, check, cantFind]);
}

async function doubleCheck(check, results) {
    for (let i = 0; i < check.length; i++) {
        let gameList = check[i];
        for (let j = 0; j < gameList.length; j++ ) {
            console.log('%d.',j+1);
            console.log(gameList[j].name);
        }
        console.log('Enter the number associated with the correct game. Enter N if none are correct');
        rl.question('', (answer) => {
            if (answer === 'N') {
                console.log('Hello')
            }
        })
    }
}

async function main() {
    rl.question('', (answer) => {
        if (answer === 'N') {
            console.log('Hello')
        }
    })
    let promiseReturn = await getHLTB();
    let results = promiseReturn[0];
    let check = promiseReturn[1];
    let cantFind = promiseReturn[2];
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,worksheet,"Gamer");
    XLSX.writeFile(workbook,"Gamer.xlsx", {compression:true} );
}

main();


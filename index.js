import excel from "exceljs"
import puppeteer from "puppeteer"
// const puppeteer = require("puppeteer");
const url = "https://www.hogapage.de/jobs/suche";
const company = "Kellner";
const town = "deutchlan";
async function sessionStart() {

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--start-fullscreen','--window-size=1280,800']
    });

    const page = await browser.newPage();

    await page.setViewport({
        width: 1400,
        height: 700,
        deviceScaleFactor: 2,
    });
    try {
        await openWebsite(url, page);
        console.log("website oppened and cookies accepted");
        console.log('now entering company and town');
        await setJobTitles(company, town, page);
        console.log('found jobs now finding job articles and email');
        await gettingJobsArticle(page);
        // browser.close();
    }
    catch (e) {
        console.log("website can't be opening", e);
    }
}

async function openWebsite(url, page) {
    await page.goto(url);
    try {
        const acceptBtn = await page.waitForSelector('#cmpwelcomebtnyes > a');
        await acceptBtn.click();
    }
    catch (e) {
        console.log("accept button not found");
    }
}

async function setJobTitles(company, town, page) {
    try {
        await page.type('#id_q', company);
        await page.type('#id_where', town);
        await page.keyboard.press('Enter');
    }
    catch (e) {
        console.log("input fields not found");
    }
}



  

// async function gettingJobsArticle(page) {
//     page.waitForSelector('article').then(async () => {
//         const loadmore=await page.$('a.hp_search-list-load-more')
//        await loadmore.click()
//         const jobArticles = await page.$$('article');
         
          
//           if (!loadmore) {
//             console.log(jobArticles)
              
//               await openingJobArticlesOneByOne(jobArticles, page);
            
//           }
      

//     })
   
// }
async function gettingJobsArticle(page) {
    try {
        await page.waitForSelector('article');
        while (true) {
          const loadmore = await page.waitForSelector('a.hp_search-list-load-more',{timeout:40000});
          if (!loadmore) break;
          await loadmore.click();
          await page.waitForSelector('article:last-of-type');
        }
        const jobArticles = await page.$$('article',);
        await openingJobArticlesOneByOne(jobArticles, page);
        
    } catch (error) {
        console.log(error)
        
    }
  }
  

let emailArray = [];
async function openingJobArticlesOneByOne(jobArticles, page) {
    try {

    if (!page.isClosed()) {
        
        for (const iterator of jobArticles) {
            await iterator.click();
            // phone_click
            const ise = await page.waitForSelector('a[data-tracking-type="phone_click"], a[data-tracking-type="email_click"],a[data-tracking-type="web_click"]');
            if (ise) {
                
                
                
                const elementText = await page.evaluate(
                    (element) => element.textContent,
                    ise
                    )
                  
                    const ComName = await page.waitForSelector('div.hp_headline-larger');
                    const Comps = await page.evaluate(
                        (element) => element.textContent,
                        ComName
                        )
                        
                       
                       emailArray.push({email:elementText,id:Comps});
               }
               else {
                        console.log('Email or phone element not found');
                    }
                
            }
        
            const workbook=new excel.Workbook()
            const worksheet=workbook.addWorksheet('Emails')
            worksheet.columns=[
                {header:'companyNames',key:"id",width:40},
                {header:'Emails',key:'email',width:80}
            ]
            emailArray.forEach((x)=>{
                worksheet.addRow(x)

            })
            worksheet.getRow(1).eachCell((cell)=>{
                cell.font={bold:true}

            })
                
            const data=await workbook.xlsx.writeFile('users.xlsx')
            if (data) {
              
                
            }

    }
            
        } catch (error) {
            if (error.message.includes('Execution context was destroyed')) {
                console.log({ message: "Page navigation occurred, reloading page." });
                await page.reload();
                // Wait for the page to reload before continuing
                await page.waitForNavigation({ waitUntil: "networkidle0" });
            } else {
                console.log({ message: "Email not found." });
               
            }
          
        }
    }

sessionStart();

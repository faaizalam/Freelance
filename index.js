import excel from "exceljs"
import puppeteer from "puppeteer"
// const puppeteer = require("puppeteer");
const url = "https://www.hogapage.de/jobs/suche";
const company = "Kellner";
const town = "deutchlan";
let ArticlesLimit = 2000;
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



  

let CountArtical=0
async function gettingJobsArticle(page) {
    try {
        await page.waitForSelector('article');
        // const checkl= await page.$$('artical')
        // console.log(jobArticles)
        
        while (true) {
            
            const loadmore = await page.waitForSelector('a.hp_search-list-load-more',{timeout:80000});
            if (!loadmore) break;
            try {
                await loadmore.click();
                
                
                const jobArticles = await page.$$('article');
                CountArtical=jobArticles.length
                // console.log(loadedArticles)
                if (CountArtical>=ArticlesLimit) {
                    break
                    
                }
                
                
            } catch (e) {
                console.log(e.message)
                
            }
        }
        
        const jobArticles = await page.$$('article');
        await openingJobArticlesOneByOne(jobArticles, page);
        
    } catch (error) {
        console.log(error)
        
    }
  }
  



let emailArray = [];
async function openingJobArticlesOneByOne(jobArticles, page) {
    try {
        // if (!page.isClosed()) {
            let op =0
            for (const iterator of jobArticles) {
            
           try {
            await page.waitForTimeout(2000)
               await iterator.click()
            
           } catch (error) {
            console.log(error.message)
            
           }
                
            
                

            
     try {
       
         
         
         
         // const iseone = await page.waitForSelector('a[data-tracking-type="email_click"]');
         try {
             const ise = await page.waitForSelector('a[data-tracking-type="email_click"]',{ timeout: 60000 });
            
             if (ise) {
                 const elementText = await page.evaluate(
                     (element) => element.textContent,
                     ise
                     )
                     console.log(elementText)
                     
                     // hp_headline-larger
                     // email_click
                     const ComName = await page.waitForSelector('div.hp_headline-larger');
                     const Comps = await page.evaluate(
                         (element) => element.textContent,
                         ComName
                         )
                         // console.log(elementText,"here",Comps)
                         
                         emailArray.push({email:elementText,id:Comps});
                       }
                       
         } catch (error) {
            console.log("email is no present in current Atrical now moving to next")
            
         }
                 
     } catch (error) {
        console.log(error.message)
        
     }
    }
                
            
        
            const workbook=new excel.Workbook()
            const worksheet=workbook.addWorksheet('Emails')
            worksheet.columns=[
                {header:'companyNames',key:"id",width:120},
                {header:'Emails',key:'email',width:80}
            ]
            emailArray.forEach((x)=>{
                worksheet.addRow(x)

            })
            worksheet.getRow(1).eachCell((cell)=>{
                cell.font={bold:true}

            })
                
            const data=await workbook.xlsx.writeFile('users.xlsx')
          

    // }
            
        } catch (error) {
            if (error.message.includes('Execution context was destroyed')) {
                console.log({ message: "Page navigation occurred, reloading page." });
                await page.reload();
                // Wait for the page to reload before continuing
                await page.waitForNavigation({ waitUntil: "networkidle0" });
            } else {
                console.log({ message: "Email not found." });
                return
               
            }
          
        }
    }


  



sessionStart();

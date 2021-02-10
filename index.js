/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */

// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// Change this to get detailed logging from the stomp library
global.DEBUG = false

const url = "ws://localhost:8011/stomp";
const client = Stomp.client(url);
client.debug = function(msg) {
  if (global.DEBUG) {
    console.info(msg);
  }
}

function sortTable() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("currency-pair");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[6];
      y = rows[i + 1].getElementsByTagName("TD")[6];
      //check if the two rows should switch place:
      if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

// createNewTdAndAddToTable:: this function used to create new td and append it 
// to given row
function createNewTdAndAddToTable(row, value) {
  const txtValue = document.createTextNode(value);
  const td = document.createElement("td");
  td.appendChild(txtValue);
  row.appendChild(td);
}

function connectCallback() {
  // currencyMapper :: this mapper is used to hold unique currency list of last 30 records of each
  const currencyMapper = {}
  // subscribe :: this method is used to subscribe the the given topic
  client.subscribe('/fx/prices',(inp) => {
    const currency = JSON.parse(inp.body)
    /* if:else ::: this conditional block is used to check if current already
    * exists then push record into the mapper's currency, if does'nt exists then
    * add the currency as new
    */
    if(currencyMapper[currency.name]) {
      currencyMapper[currency.name].push(currency)
      if(currencyMapper[currency.name].length > 30) {
        currencyMapper[currency.name] = currencyMapper[currency.name].slice(currencyMapper[currency.name].length - 30, currencyMapper[currency.name].length);
      }
    } else {
      currencyMapper[currency.name] = [currency]
    }

  
    const currencyTable = document.getElementById('currency-pair')

    const row = document.getElementById(currency.name)
    const sparklineArr = []
    // the following block of code is to make records for last 30 records
    // to draw sprkline
    currencyMapper[currency.name].forEach((currencyPair) => {
      sparklineArr.push(currencyPair.bestBid+ currencyPair.bestAsk/2)
    })

    const sparks = document.createElement('span')
    Sparkline.draw(sparks, sparklineArr)


    /*
    * if:else ::: Following conditional block is to check if row already exists for the given 
    * currency if exists then update values and if not exists then append new currency
    */
    if(row) {
      row.cells[1].innerHTML= currency.bestBid;
      row.cells[2].innerHTML= currency.bestAsk;
      row.cells[5].innerHTML= currency.lastChangeAsk;
      row.cells[6].innerHTML= currency.lastChangeBid;
      row.cells[7].innerHTML = ''
      row.cells[7].appendChild(sparks)
    } else {
      
      const newRow = currencyTable.insertRow();
      newRow.id = currency.name;
      createNewTdAndAddToTable(newRow, currency.name);
      createNewTdAndAddToTable(newRow, currency.bestBid);
      createNewTdAndAddToTable(newRow, currency.bestAsk);
      createNewTdAndAddToTable(newRow, currency.openBid);
      createNewTdAndAddToTable(newRow, currency.openAsk);
      createNewTdAndAddToTable(newRow, currency.lastChangeAsk);
      createNewTdAndAddToTable(newRow, currency.lastChangeBid);
      const sparklineTd = document.createElement("td");
      sparklineTd.appendChild(sparks);
      newRow.appendChild(sparklineTd);
    }

    // after adding or updating currency data in table sort the table
    sortTable();
  },{id: 'currency'});
}

client.connect({}, connectCallback, function(error) {
  alert(error.headers.message);
})
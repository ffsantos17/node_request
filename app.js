var http = require('http');
var mysql = require('mysql');
const uuid = require('uuid');
const cheerio = require('cheerio');

var conn = mysql.createConnection({
host: 'server125.web-hosting.com', // Replace with your host name
user: 'viarkpsn_user_tickets_info_api', // Replace with your database username
password: 'UserP4sswordAP1', // Replace with your database password
database: 'viarkpsn_tickets_info' // // Replace with your database Name
});

var teste;

conn.connect(function(err) {
if (err) {
    console.log(err);
    return;
}
run();
}); 

async function run() {
    const uuidRequest = uuid.v4();

    try {
        await deletarDados(uuidRequest, 'tickets_request');
        await inserirLog(uuidRequest, 'Iniciando request List tickets');
        
        var list = await obterList(uuidRequest);
        await inserirLog(uuidRequest, 'retorno request list tickets = ' + list.result.length);

        const chunkSize = 10;  // Tamanho do bloco
        let index = 0;

        while (index < list.result.length) {
            const end = Math.min(index + chunkSize, list.result.length);

            for (let i = index; i < end; i++) {
                await delay(3000);
                await inserirLog(uuidRequest, `Processando item ${i} de ${list.result.length}: ${list.result[i].url}`);

                var link = await gerarLink(list.result[i].url, uuidRequest);
                await inserirLog(uuidRequest, `Status do link para item ${i}: ${link.result.status}`);

                if (link.result.status == 200) {
                    list.result[i].linkCompanhia = link.result.data;
                } else {
                    list.result[i].linkCompanhia = "Erro ao obter link";
                }

                await inserirLog(uuidRequest, `Iniciando insert para item ${i}`);
                await inserirItem(list.result[i], uuidRequest);
            }

            index += chunkSize;
        }

        await deletarDados(uuidRequest, 'tickets');
        await copiarDados(uuidRequest);
        await inserirLogRotina(uuidRequest, 'Rotina executada');

    } catch (error) {
        await inserirLogRotina(uuidRequest, error);
        console.log(error);
    }
};

async function obterList(uuid){
    try {
    inserirLog(uuid, 'Iniciando request List tickets');
    
    const response = await fetch('https://www.tripmilhas.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/webmodule.web.js/buildAllTickets.ajax?gridAppId=5e43d86b-777f-41bc-b3b8-2c1b67b2e73c&viewMode=site', {
        method: 'POST',
        headers: {
          'x-xsrf-token': '1721135343|SMDcF0arYspM',
          'authorization': 'wixcode-pub.07d592d33b1cbddc092e60e3e20fd72f65cecdb7.eyJpbnN0YW5jZUlkIjoiNTUxMjUyYzktYmQ0MS00MjBlLTkyNWMtOGI3NzI2ZjFhZTczIiwiaHRtbFNpdGVJZCI6ImY3NjljZGNkLTY5M2ItNDgxOC1iM2I0LTA4ZWNiMmFhZmUwZiIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTcyMTEzNTM3NzQzOCwiYWlkIjoiMDc1MmZlNGQtOGVlMS00MWIyLWEyNzEtNzQwMjIwYmYxNWVhIiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6IjU0ZDBmNGMzLTRjZWQtNGQ0OS1hYWM3LTNjYTI0YTE2YjJhNyIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IlNob3dXaXhXaGlsZUxvYWRpbmcsQWRzRnJlZSxIYXNEb21haW4iLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNzM3YTNiYzEtZjE3OS00YThkLWIxNzAtODQxNmUwZDZiODA3IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOm51bGwsInNlc3Npb25JZCI6bnVsbCwic2Vzc2lvbkNyZWF0aW9uVGltZSI6bnVsbH0=',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'x-wix-app-instance': 'wixcode-pub.07d592d33b1cbddc092e60e3e20fd72f65cecdb7.eyJpbnN0YW5jZUlkIjoiNTUxMjUyYzktYmQ0MS00MjBlLTkyNWMtOGI3NzI2ZjFhZTczIiwiaHRtbFNpdGVJZCI6ImY3NjljZGNkLTY5M2ItNDgxOC1iM2I0LTA4ZWNiMmFhZmUwZiIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTcyMTEzNTM3NzQzOCwiYWlkIjoiMDc1MmZlNGQtOGVlMS00MWIyLWEyNzEtNzQwMjIwYmYxNWVhIiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6IjU0ZDBmNGMzLTRjZWQtNGQ0OS1hYWM3LTNjYTI0YTE2YjJhNyIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IlNob3dXaXhXaGlsZUxvYWRpbmcsQWRzRnJlZSxIYXNEb21haW4iLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNzM3YTNiYzEtZjE3OS00YThkLWIxNzAtODQxNmUwZDZiODA3IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOm51bGwsInNlc3Npb25JZCI6bnVsbCwic2Vzc2lvbkNyZWF0aW9uVGltZSI6bnVsbH0=',
          'Referer': 'https://www.tripmilhas.com/_partials/wix-thunderbolt/dist/clientWorker.93269a31.bundle.min.js',
          'commonConfig': '%7B%22brand%22%3A%22wix%22%2C%22host%22%3A%22VIEWER%22%2C%22BSI%22%3A%22%22%2C%22siteRevision%22%3A%223053%22%7D, %7B%22brand%22%3A%22wix%22%2C%22host%22%3A%22VIEWER%22%2C%22bsi%22%3A%22%22%2C%22siteRevision%22%3A%223053%22%2C%22BSI%22%3A%22%22%7D',
          'x-wix-brand': 'wix',
          'x-wix-site-revision': '3053',
          'X-Wix-Client-Artifact-Id': 'wix-thunderbolt'
        },
        body: JSON.stringify([])
      });
    const json = await response.json()
    inserirLog(uuid, json.result.length);
    return json;
  } catch (error) {
    inserirLog(uuid, error);
    return 'erro';
  }
}

async function gerarLink(link, uuid){
    try {
    inserirLog(uuid, 'Iniciando request gerarLink: '+link);
      const response = await fetch(link, {
          method: 'GET',
          headers: {},
        });
    
    inserirLog(uuid, 'obteve response status: '+response.status);
      //const json = await response.json()
      const html = await response.text();
      const $ = cheerio.load(html);
      // Encontre o script com o ID especificado e extraia o conteúdo
      const scriptContent = $('#wix-viewer-model').html();
      // Parse o conteúdo JSON
      const jsonData = JSON.parse(scriptContent);
      const dados = jsonData.siteFeaturesConfigs.elementorySupportWixCodeSdk;
      // Exiba o resultado
      await inserirLog(uuid, 'dados do gerarLink: '+dados.gridAppId);
      var link = await obterLink(dados.gridAppId, dados.viewMode, uuid);
      return link;
      //console.log(html);
    } catch (error) {
        await inserirLog(uuid, error);
        return error;
    }


    async function obterLink(gridAppId,viewMode, uuid){
        await inserirLog(uuid, 'Iniciando obterLink');
        const response = await fetch('https://www.tripmilhas.com/_api/wix-code-public-dispatcher-ng/routers/custom/pages?gridAppId='+gridAppId+'&viewMode='+viewMode+'&instance=wixcode-pub.e57fa037da1cf94a3401ff2518d52d83ef823117.eyJpbnN0YW5jZUlkIjoiNTUxMjUyYzktYmQ0MS00MjBlLTkyNWMtOGI3NzI2ZjFhZTczIiwiaHRtbFNpdGVJZCI6ImY3NjljZGNkLTY5M2ItNDgxOC1iM2I0LTA4ZWNiMmFhZmUwZiIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTcyMTE0MDEwNjYyMCwiYWlkIjoiNWY4NTU1NmEtNGEwNS00NjJlLWFmZTctZjJiYjk0NDRlZDhkIiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6IjU0ZDBmNGMzLTRjZWQtNGQ0OS1hYWM3LTNjYTI0YTE2YjJhNyIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IkFkc0ZyZWUsSGFzRG9tYWluLFNob3dXaXhXaGlsZUxvYWRpbmciLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNzM3YTNiYzEtZjE3OS00YThkLWIxNzAtODQxNmUwZDZiODA3IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOm51bGwsInNlc3Npb25JZCI6bnVsbCwic2Vzc2lvbkNyZWF0aW9uVGltZSI6bnVsbH0%3D', {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
              'authorization': 'wixcode-pub.e57fa037da1cf94a3401ff2518d52d83ef823117.eyJpbnN0YW5jZUlkIjoiNTUxMjUyYzktYmQ0MS00MjBlLTkyNWMtOGI3NzI2ZjFhZTczIiwiaHRtbFNpdGVJZCI6ImY3NjljZGNkLTY5M2ItNDgxOC1iM2I0LTA4ZWNiMmFhZmUwZiIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTcyMTE0MDEwNjYyMCwiYWlkIjoiNWY4NTU1NmEtNGEwNS00NjJlLWFmZTctZjJiYjk0NDRlZDhkIiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6IjU0ZDBmNGMzLTRjZWQtNGQ0OS1hYWM3LTNjYTI0YTE2YjJhNyIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IkFkc0ZyZWUsSGFzRG9tYWluLFNob3dXaXhXaGlsZUxvYWRpbmciLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNzM3YTNiYzEtZjE3OS00YThkLWIxNzAtODQxNmUwZDZiODA3IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOm51bGwsInNlc3Npb25JZCI6bnVsbCwic2Vzc2lvbkNyZWF0aW9uVGltZSI6bnVsbH0=',
              'commonconfig': '{"brand":"wix","host":"VIEWER","bsi":"","consentPolicy":{"essential":true,"functional":false,"analytics":false,"advertising":false,"dataToThirdParty":true},"consentPolicyHeader":{"consent-policy":"%7B%22func%22%3A0%2C%22anl%22%3A0%2C%22adv%22%3A0%2C%22dt3%22%3A1%2C%22ess%22%3A1%7D"},"siteRevision":"3053"}',
              'content-type': 'application/json',
              'cookie': 'svSession=440ca074d35d56d5e6134385b5b8e6abc0eb9edd3e78d5a8516b763f0e0d46a36cc427b061b5d9c12614d7cae1ab63b11e60994d53964e647acf431e4f798bcde68358ca5924392ae90779ee3068add5cf90c5dae6785826f542e8c81b55fd533b6114d360bcea61fc56531b9c09de1d5dc2936344ca28c7dbb2d03be0883aa401bee692cda5c1a5e414e094842d4e26; XSRF-TOKEN=1721139845|vr05LmP-3Rjv; hs=817735573',
              'origin': 'https://www.tripmilhas.com',
              'priority': 'u=1, i',
              'referer': 'https://www.tripmilhas.com/router/short-url/b5185c7f-954d-421c-917a-bd56c8e08a27',
              'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              'x-xsrf-token': '1721139845|vr05LmP-3Rjv'
            },
            body: JSON.stringify({
              'routerPrefix': '/router',
              'config': {
                'siteMapFunctionName': 'router_SiteMap',
                'routerFunctionName': 'router_Router'
              },
              'pageRoles': {
                '1a454536-87cb-41cf-aeb7-57dc7cd7c446': {
                  'id': 'o654b',
                  'title': 'Alerta Telegram'
                },
                '974b956e-94c6-47de-b80f-8bde56278dcb': {
                  'id': 'gaajw',
                  'title': 'redirect-url'
                },
                'e91882f8-804c-4b91-9bf3-d9d63ec5c314': {
                  'id': 'lofs7',
                  'title': 'Alerta WhatsApp'
                },
                'd6507c77-f085-4078-aa06-78296f46ca6d': {
                  'id': 'zx69o',
                  'title': 'Resultados'
                }
              },
              'requestInfo': {
                'env': 'browser',
                'formFactor': 'desktop'
              },
              'routerSuffix': '/short-url/b5185c7f-954d-421c-917a-bd56c8e08a27',
              'fullUrl': 'https://www.tripmilhas.com/router/short-url/b5185c7f-954d-421c-917a-bd56c8e08a27'
            })
          });
          const json = await response.json()
          await inserirLog(uuid, 'Retorno ObterLink : '+json.result.status);
          return json;
    };
}

// var obj = {
//   from: 'RBR - Rio Branco - Placid...',
//   to: 'CXJ - Caxias do Sul - Hug...',
//   outDate: '2024-10-02',
//   outDateFormatted: '02/10/2024',
//   cabin: 'Econômica',
//   miles: 65000,
//   milesFormatted: '65.000',
//   lastSeen: '2024-07-16T14:00:00.000Z',
//   lastSeenFormatted: '1h atrás',
//   url: 'https://tripmilhas.com/router/short-url/a4ee61a4-061c-4464-9183-a032f961f981',
//   linkCompanhia: 'https://www.smiles.com.br/mfe/emissao-passagem/?adults=1&cabin=ALL&children=0&departureDate=1729350000000&infants=0&isElegible=false&isFlexibleDateChecked=false&returnDate=&searchType=congenere&segments=1&tripType=2&originAirport=REC&originCity=&originCountry=&originAirportIsAny=false&destinationAirport=LIM&destinCity=&destinCountry=&destinAirportIsAny=false&novo-resultado-voos=true'
// };
// inserirItem(obj);


var server = http.createServer(function(req, res) {
    
res.writeHead(200, {'Content-Type': 'text/plain'});

res.end(teste);
                

    
});
// server.listen();

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
};

async function inserirItem(obj, uuid){
    conn.query(
        'INSERT INTO tickets_request SET ?', obj, (err, res) => {
        if(err){
            inserirLog(uuid, err.sqlMessage);
            return
        }
        inserirLog(uuid, 'log insert: '+res.affectedRows);
    });
};

async function inserirLog(uuid, log){
console.log(log);
    // conn.query(
    //     'INSERT INTO log_request(date, request_uuid, log) VALUES (NOW(),?,?)', [uuid, log], (err, res) => {
    //     console.log(`inserindo`);
    // });
};

async function inserirLogRotina(uuid, log){

    conn.query(
        'INSERT INTO log_cron(date, uuid, log) VALUES (NOW(),?,?)', [uuid, log], (err, res) => {
        console.log(`inserindo`);
    });
};

async function copiarDados(uuid){
    conn.query(
        'INSERT INTO tickets SELECT * FROM tickets_request;', (err, res) => {
        if(err){
            inserirLog(uuid, err.sqlMessage);
            return
        }
        inserirLog(uuid, 'linhas copiadas: '+res.affectedRows);
    });
}


async function deletarDados(uuid, table){
    var query = table == 'tickets_request' ? 'DELETE FROM tickets_request' : 'DELETE FROM tickets';
    conn.query(
        query, (err, res) => {
        if(err){
            inserirLog(uuid, err.sqlMessage);
            return
        }
        inserirLog(uuid, 'linhas deletadas: '+res.affectedRows);
        
    });
}

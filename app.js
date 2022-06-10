const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { Client } = require("@notionhq/client");

let config, databaseID, userID, page_ID, bearerToken, ISPT_ID, SCOPES, TOKEN_PATH, userToken

fs.readFile('config.json', (err, content) => {
    if (err) return console.log('Error loading client config:', err)
    config = JSON.parse(content)
    databaseID = config.notion.databaseID
    userID = config.notion.userID
    page_ID = config.notion.page_ID
    bearerToken = config.notion.bearerToken
    ISPT_ID = config.google.ISPT_ID
    SCOPES = config.google.SCOPES
    TOKEN_PATH = config.google.TOKEN_PATH
    userToken = config.token.userToken

    const notion = new Client({
        auth: bearerToken,
    })

    const date = new Date()
    const dateISO = date.toISOString()

    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        authorize(JSON.parse(content), listEvents);
    });

    function authorize(credentials, callback) {
        const oAuth2Client = new google.auth.OAuth2(
            credentials.web.client_id, credentials.web.client_secret, credentials.web.redirect_uris[1]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }

    function getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }

    function listEvents(auth) {
        const calendar = google.calendar({version: 'v3', auth});
        calendar.events.list({
            calendarId: ISPT_ID,
            timeMin: dateISO,
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const events = res.data.items;
            if (events.length) {
                console.log('Upcoming 10 events:');
                events.map((event, i) => {
                    const start = event.start.dateTime || event.start.date;
                    if(event.description !== undefined){
                        getPages()
                        // notionInteraction(
                        //     event.summary.split("Cours : ")[1],
                        //     "COURS",
                        //     event.description.split("Enseignant : ")[1],
                        //     start,
                        //     "ISTP"
                        // )
                    }
                });
            } else {
                console.log('No upcoming events found.');
            }
        });
    }

    async function notionInteraction(title, description, prof, time, tag) {
        try {
            let response
            response = await notion.pages.create({
                parent: { database_id: databaseID },
                properties: {
                    title: {
                        title:[
                            {
                                "text": {
                                    "content": title
                                }
                            }
                        ]
                    },
                    Enseignant: {
                        rich_text: [
                            {
                                text: {
                                    content: prof,
                                },
                            },
                        ],
                    },
                    Date:{
                        "date": {
                            "start": time
                        }
                    },
                    'Tags': {
                        multi_select: [
                            {
                                name: tag
                            }
                        ]
                    },
                },
                children: [
                    {
                        "type": "callout",
                        "callout": {
                            "rich_text": [{
                                "type": "text",
                                "text": {
                                    "content": "Cours ISTP",
                                },
                            }],
                            "icon": {
                                "emoji": "📝"
                            },
                            "color": "gray_background"
                        }
                    }
                ],
            })
            console.log("Success")
            console.log(response)

        } catch (error) {
            console.error(error.body)
        }
    }

    async function getPages(){
        let view
        view = await notion.databases.query({
            database_id: databaseID,
        })
        console.log("wiew")
        console.log(view.results)
    }
});